import React, { useState } from 'react'
import { MapContainer, GeoJSON, ZoomControl } from 'react-leaflet'
import type { Layer } from 'leaflet'

import worldGeoJSON from '@/data/geojson/world_countries.json'
import chinaGeoJSON from '@/data/geojson/china_provinces.json'
import { buildMingGeoJSON } from '@/data/geojson/geoProcessor'
import { FACTIONS, HOUJIN_POLYGON } from '@/data/geojson/factions_config'
import { useProvinceStore } from '@/store/provinceStore'
import { useNavigationStore } from '@/store/navigationStore'
import { NavigationTabs } from '@/components/navigation'
import { OfficialsPanel, PolicyTreePanel, MilitaryPanel, CourtPanel } from '@/components/panels'
import type { Province } from '@/core/types'

type HeatmapMode = 'tax' | 'unrest' | 'military' | 'disaster' | 'corruption'

function interpolateColor(hex1: string, hex2: string, t: number): string {
  const p = (h: string, i: number) => parseInt(h.slice(i, i+2), 16)
  const r = Math.round(p(hex1,1) + (p(hex2,1) - p(hex1,1)) * t)
  const g = Math.round(p(hex1,3) + (p(hex2,3) - p(hex1,3)) * t)
  const b = Math.round(p(hex1,5) + (p(hex2,5) - p(hex1,5)) * t)
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`
}

function getHeatColor(mode: HeatmapMode, value: number): string {
  const v = Math.min(100, Math.max(0, value)) / 100
  switch (mode) {
    case 'tax':        return interpolateColor('#1a2e0a', '#52c41a', v)
    case 'unrest':     return interpolateColor('#1a0808', '#cf1322', v)
    case 'military':   return interpolateColor('#080e1a', '#1d39c4', v)
    case 'disaster':   return interpolateColor('#1a1008', '#d46b08', v)
    case 'corruption': return interpolateColor('#100808', '#8B1A1A', v)
    default:           return '#2a2010'
  }
}

function getModeLabel(mode: HeatmapMode): string {
  return { tax:'税收指数', unrest:'民乱指数', military:'军力指数', disaster:'天灾等级', corruption:'贪腐指数' }[mode]
}

const MapView: React.FC = () => {
  const { provinces, selectedProvinceId, selectProvince } = useProvinceStore()
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>('unrest')
  const [hoveredId, setHoveredId]     = useState<string | null>(null)

  const mingData = buildMingGeoJSON(chinaGeoJSON)

  function getProvinceValue(mingId: string): number {
    const p = provinces.find((p: Province) => p.id === mingId)
    if (!p) return 0
    switch (heatmapMode) {
      case 'tax':        return Math.min(100, (p.taxRevenue || 0) / 10)
      case 'unrest':     return p.civilUnrest ?? 0
      case 'military':   return Math.min(100, (p.militaryForce || 0) / 5)
      case 'disaster':   return (p.disasterLevel ?? 0) * 20
      case 'corruption': return p.corruptionLevel ?? 0
      default:           return 0
    }
  }

  function worldStyle(feature: any) {
    const name: string = feature?.properties?.name || ''
    const faction = FACTIONS.find(f => f.countryNames.includes(name))
    if (faction) {
      return { fillColor: faction.color, fillOpacity: faction.opacity, color: faction.borderColor, weight: 1 }
    }
    return { fillColor: '#0a0d12', fillOpacity: 0.6, color: '#1e2230', weight: 0.5 }
  }

  function worldOnEachFeature(feature: any, layer: Layer) {
    const name: string = feature?.properties?.name || ''
    const faction = FACTIONS.find(f => f.countryNames.includes(name))
    if (!faction) return
    ;(layer as any).bindTooltip(
      `<div><strong style="color:#FFD700;font-size:14px">${faction.name}</strong><br/>
       <span style="color:#999;font-size:11px">${faction.description}</span></div>`,
      { className: 'ming-province-tooltip', sticky: true }
    )
  }

  function mingStyle(feature: any) {
    const mingId: string = feature?.properties?.mingId || ''
    const isSelected = selectedProvinceId === mingId
    const isHovered  = hoveredId === mingId
    const fillColor  = getHeatColor(heatmapMode, getProvinceValue(mingId))
    return {
      fillColor,
      fillOpacity: 0.85,
      color:  isSelected ? '#FFD700' : isHovered ? '#e8c547' : '#C9A84C',
      weight: isSelected ? 2.5 : isHovered ? 2 : 1,
    }
  }

  function mingOnEachFeature(feature: any, layer: Layer) {
    const mingId:  string = feature?.properties?.mingId  || ''
    const mingName:string = feature?.properties?.name    || ''
    const capital: string = feature?.properties?.capital || ''

    ;(layer as any).on({
      mouseover: (e: any) => {
        setHoveredId(mingId)
        e.target.setStyle({ weight: 2, color: '#e8c547', fillOpacity: 0.95 })
        const value = getProvinceValue(mingId)
        ;(layer as any).bindTooltip(
          `<div>
            <strong style="color:#FFD700;font-size:15px">${mingName}</strong>
            <span style="color:#C9A84C;font-size:11px"> 布政使司</span><br/>
            <span style="color:#aaa;font-size:11px">省会：${capital}</span><br/>
            <span style="color:#C9A84C;font-size:12px">${getModeLabel(heatmapMode)}：${value.toFixed(0)}</span>
           </div>`,
          { className: 'ming-province-tooltip', sticky: true }
        ).openTooltip()
      },
      mouseout: (e: any) => {
        setHoveredId(null)
        ;(layer as any).closeTooltip()
        e.target.setStyle(mingStyle(feature))
      },
      click: () => selectProvince(mingId),
    })
  }

  const modes: { key: HeatmapMode; label: string }[] = [
    { key: 'tax', label: '税收' }, { key: 'unrest', label: '民乱' },
    { key: 'military', label: '军力' }, { key: 'disaster', label: '天灾' },
    { key: 'corruption', label: '贪腐' },
  ]

  const legendItems = [
    { color: '#52c41a', border: '#C9A84C', label: '大明（热力着色）' },
    { color: '#4a1a1a', border: '#8B0000', label: '后金' },
    { color: '#1a3a2a', border: '#2d6a4f', label: '朝鲜' },
    { color: '#3a2a1a', border: '#8B6914', label: '日本' },
    { color: '#3a2e1a', border: '#8B7355', label: '蒙古诸部' },
    { color: '#1a3a1a', border: '#4a7a4a', label: '安南' },
  ]

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>

      <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {modes.map(m => (
          <button key={m.key} onClick={() => setHeatmapMode(m.key)} className={`map-control-btn ${heatmapMode === m.key ? 'map-control-btn-active' : ''}`}>
            {m.label}
          </button>
        ))}
      </div>

      <div className="legend-container" style={{
        position: 'absolute', bottom: 20, right: 12, zIndex: 1000,
      }}>
        <div className="legend-title">
          势力图例
        </div>
        {legendItems.map(item => (
          <div key={item.label} className="legend-item">
            <div className="legend-color" style={{ background: item.color, borderColor: item.border }}/>
            <span className="legend-label">{item.label}</span>
          </div>
        ))}
      </div>

      <MapContainer
        center={[35, 108]} zoom={4} minZoom={3} maxZoom={7}
        zoomControl={false}
        style={{ width: '100%', height: '100%', background: '#1a2a3a' }}
        maxBounds={[[-10, 55], [72, 165]]}
        maxBoundsViscosity={0.85}
      >
        <ZoomControl position="bottomleft" />

        <GeoJSON key="world" data={worldGeoJSON as any} style={worldStyle} onEachFeature={worldOnEachFeature} />

        <GeoJSON
          key={`ming-${heatmapMode}-${selectedProvinceId}-${hoveredId}`}
          data={mingData as any} style={mingStyle} onEachFeature={mingOnEachFeature}
        />

        <GeoJSON key="houjin" data={HOUJIN_POLYGON as any}
          style={{ fillColor: '#4a1a1a', fillOpacity: 0.75, color: '#8B0000', weight: 1.5 }}
          onEachFeature={(_f, layer) => {
            ;(layer as any).bindTooltip(
              '<div><strong style="color:#cf1322;font-size:14px">后金</strong><br/><span style="color:#999;font-size:11px">努尔哈赤所建，关外劲敌</span></div>',
              { className: 'ming-province-tooltip', sticky: true }
            )
          }}
        />
      </MapContainer>
    </div>
  )
}

const GameMap: React.FC = () => {
  const { currentView } = useNavigationStore()

  const renderContent = () => {
    switch (currentView) {
      case 'court':
        return <CourtPanel />
      case 'officials':
        return <OfficialsPanel />
      case 'policy':
        return <PolicyTreePanel />
      case 'military':
        return <MilitaryPanel />
      case 'map':
      default:
        return <MapView />
    }
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部导航 */}
      <NavigationTabs />
      
      {/* 内容区域 */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {renderContent()}
      </div>
    </div>
  )
}

export default GameMap
