/// <reference types="geojson" />

export interface FactionConfig {
  id: string
  name: string
  type: 'enemy' | 'vassal' | 'neutral'
  color: string
  borderColor: string
  opacity: number
  countryNames: string[]
  description: string
}

export const FACTIONS: FactionConfig[] = [
  {
    id: 'joseon',
    name: '朝鲜',
    type: 'vassal',
    color: '#1a3a2a',
    borderColor: '#2d6a4f',
    opacity: 0.75,
    countryNames: ['South Korea', 'North Korea'],
    description: '朝鲜王朝，大明藩属，壬辰倭乱后与明关系深厚',
  },
  {
    id: 'japan',
    name: '日本',
    type: 'neutral',
    color: '#3a2a1a',
    borderColor: '#8B6914',
    opacity: 0.7,
    countryNames: ['Japan'],
    description: '德川幕府，倭寇仍时扰东南沿海',
  },
  {
    id: 'mongol',
    name: '蒙古诸部',
    type: 'enemy',
    color: '#3a2e1a',
    borderColor: '#8B7355',
    opacity: 0.65,
    countryNames: ['Mongolia'],
    description: '察哈尔、科尔沁等部，北方边患',
  },
  {
    id: 'vietnam',
    name: '安南',
    type: 'neutral',
    color: '#1a3a1a',
    borderColor: '#4a7a4a',
    opacity: 0.65,
    countryNames: ['Vietnam'],
    description: '安南后黎朝，南方藩属',
  },
  {
    id: 'russia',
    name: '罗斯',
    type: 'neutral',
    color: '#1e1e2a',
    borderColor: '#4a4a6a',
    opacity: 0.45,
    countryNames: ['Russia'],
    description: '沙皇俄国，向西伯利亚扩张中',
  },
]

export const HOUJIN_POLYGON: GeoJSON.Feature = {
  type: 'Feature',
  properties: { name: '后金', factionId: 'houjin' },
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [119.0, 41.5],
      [125.0, 41.0],
      [130.0, 42.5],
      [132.0, 44.5],
      [134.0, 47.5],
      [132.0, 50.5],
      [128.0, 50.5],
      [124.0, 48.0],
      [121.0, 46.0],
      [119.5, 43.5],
      [119.0, 41.5],
    ]]
  }
}
