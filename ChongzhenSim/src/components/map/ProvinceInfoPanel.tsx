import React from 'react'
import { useProvinceStore } from '@/store/provinceStore'
import type { Province } from '@/core/types'

const ProvinceInfoPanel: React.FC = () => {
  const { provinces, selectedProvinceId, selectProvince } = useProvinceStore()
  const province = provinces.find((p: Province) => p.id === selectedProvinceId) ?? null
  const isVisible = !!province

  return (
    <div 
      className={`
        flex-shrink-0 h-full overflow-hidden
        transition-all duration-300 ease-out
        ${isVisible ? 'w-[270px] opacity-100' : 'w-0 opacity-0'}
      `}
      style={{
        background: 'oklch(from var(--color-palace-bg) l c h / 0.97)',
        borderRight: isVisible ? '1px solid oklch(from var(--color-palace-gold) l c h / 0.3)' : 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {province && (
        <>
          {/* 标题区域 */}
          <div 
            className="flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, oklch(from var(--color-palace-red) l c h / 0.3) 0%, transparent 100%)',
              borderBottom: '1px solid oklch(from var(--color-palace-red) l c h / 0.5)',
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div className="palace-title text-lg" style={{ letterSpacing: '0.1em' }}>
                {province.name}
              </div>
              <div className="text-xs text-palace-gold mt-1">布政使司</div>
            </div>
            <button 
              onClick={() => selectProvince(null)} 
              className="map-control-btn"
              style={{ width: 26, height: 26, padding: 0 }}
            >
              ×
            </button>
          </div>

          {/* 基础信息网格 */}
          <div className="grid grid-cols-2 gap-2 p-3 flex-shrink-0">
            {[
              { label: '人丁', value: `${province.population ?? 0} 万口` },
              { label: '税率', value: `${((province.taxRate ?? 0) * 100).toFixed(0)}%` },
              { label: '粮仓', value: `${province.granaryStock ?? 0} 万石` },
              { label: '驻军', value: `${province.militaryForce ?? 0} 千人` },
            ].map(item => (
              <div key={item.label} className="stat-card">
                <div className="stat-card-label">{item.label}</div>
                <div className="text-palace-gold font-medium">{item.value}</div>
              </div>
            ))}
          </div>

          {/* 详细状态 */}
          <div className="flex-1 overflow-y-auto palace-scrollbar px-3">
            <StatusBar 
              label="民乱" 
              value={province.civilUnrest ?? 0} 
              max={100}
              color={(province.civilUnrest ?? 0) > 70 ? '#cf1322' : (province.civilUnrest ?? 0) > 40 ? '#d46b08' : '#52c41a'} 
            />
            <StatusBar 
              label="贪腐" 
              value={province.corruptionLevel ?? 0} 
              max={100} 
              color="#d46b08" 
            />

            {/* 天灾等级 */}
            <div className="mb-3">
              <div className="flex justify-between mb-1">
                <span className="text-xs text-palace-text-muted">天灾</span>
                <span className="text-xs text-palace-gold">{province.disasterLevel ?? 0} / 5 级</span>
              </div>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(i => (
                  <div 
                    key={i} 
                    className="flex-1 h-2 rounded-sm border border-palace-border"
                    style={{
                      background: i <= (province.disasterLevel ?? 0) ? '#d46b08' : 'transparent',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* 税收信息 */}
            <div className="flex justify-between items-center py-2 border-t border-palace-border mb-3">
              <span className="text-xs text-palace-text-muted">本回合税收</span>
              <span className="text-sm text-success font-medium">+{(province.taxRevenue ?? 0).toFixed(1)} 万两</span>
            </div>

            {/* 警告信息 */}
            {(province.civilUnrest ?? 0) > 70 && (
              <div className="alert-box alert-box-danger mb-2">
                ⚠ 民心动荡，恐生民变
              </div>
            )}
            {(province.disasterLevel ?? 0) >= 3 && (
              <div className="alert-box alert-box-warning mb-2">
                ⚠ 天灾肆虐，需速赈灾
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-col gap-2 p-3 border-t border-palace-border flex-shrink-0">
            <button className="palace-button-outline btn-glow text-sm">
              调整税率
            </button>
            <button className="palace-button-outline btn-glow text-sm">
              下达诏书
            </button>
          </div>
        </>
      )}
    </div>
  )
}

const StatusBar: React.FC<{ label: string; value: number; max: number; color: string }> = ({ label, value, max, color }) => (
  <div className="mb-3">
    <div className="flex justify-between mb-1">
      <span className="text-xs text-palace-text-muted">{label}</span>
      <span className="text-xs" style={{ color }}>{value} / {max}</span>
    </div>
    <div className="palace-progress progress-glow h-1.5">
      <div 
        className="palace-progress-bar transition-all duration-500"
        style={{ width: `${(value/max)*100}%`, background: color }}
      />
    </div>
  </div>
)

export default ProvinceInfoPanel
