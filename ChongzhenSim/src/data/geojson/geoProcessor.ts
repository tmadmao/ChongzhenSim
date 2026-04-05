// 现代省份名（中文）→ 明代布政使司 id 的映射
const MODERN_TO_MING: Record<string, string> = {
  '北京市':        'beijing_zhili',
  '天津市':        'beijing_zhili',
  '河北省':        'beijing_zhili',
  '上海市':        'nanjing_zhili',
  '江苏省':        'nanjing_zhili',
  '安徽省':        'nanjing_zhili',
  '山东省':        'shandong',
  '山西省':        'shanxi',
  '河南省':        'henan',
  '陕西省':        'shaanxi',
  '宁夏回族自治区': 'shaanxi',
  '甘肃省':        'shaanxi',
  '四川省':        'sichuan',
  '重庆市':        'sichuan',
  '湖北省':        'huguang',
  '湖南省':        'huguang',
  '江西省':        'jiangxi',
  '浙江省':        'zhejiang',
  '福建省':        'fujian',
  '广东省':        'guangdong',
  '海南省':        'guangdong',
  '广西壮族自治区': 'guangxi',
  '云南省':        'yunnan',
  '贵州省':        'guizhou',
  '辽宁省':        'liaodong',
}

const MING_INFO: Record<string, { name: string; capital: string; region: string }> = {
  beijing_zhili: { name: '北直隶', capital: '京师', region: 'north' },
  nanjing_zhili: { name: '南直隶', capital: '南京', region: 'east' },
  shandong:      { name: '山东',   capital: '济南', region: 'north' },
  shanxi:        { name: '山西',   capital: '太原', region: 'north' },
  henan:         { name: '河南',   capital: '开封', region: 'central' },
  shaanxi:       { name: '陕西',   capital: '西安', region: 'north' },
  sichuan:       { name: '四川',   capital: '成都', region: 'west' },
  huguang:       { name: '湖广',   capital: '武昌', region: 'central' },
  jiangxi:       { name: '江西',   capital: '南昌', region: 'east' },
  zhejiang:      { name: '浙江',   capital: '杭州', region: 'east' },
  fujian:        { name: '福建',   capital: '福州', region: 'east' },
  guangdong:     { name: '广东',   capital: '广州', region: 'south' },
  guangxi:       { name: '广西',   capital: '桂林', region: 'south' },
  yunnan:        { name: '云南',   capital: '昆明', region: 'west' },
  guizhou:       { name: '贵州',   capital: '贵阳', region: 'west' },
  liaodong:      { name: '辽东',   capital: '辽阳', region: 'north' },
}

// GeoJSON类型定义
interface GeoJSONFeature {
  type: string
  id?: string
  properties?: {
    name?: string
    NAME?: string
    NL_NAME_1?: string
    [key: string]: unknown
  }
  geometry?: {
    type: string
    coordinates: unknown
  }
}

interface GeoJSONFeatureCollection {
  type: string
  features: GeoJSONFeature[]
}

export function buildMingGeoJSON(modernGeoJSON: GeoJSONFeatureCollection) {
  const mingMap = new Map<string, GeoJSONFeature>()

  for (const feature of modernGeoJSON.features) {
    // 兼容多种字段名
    const modernName: string =
      feature?.properties?.name ||
      feature?.properties?.NAME ||
      feature?.properties?.NL_NAME_1 ||
      ''

    const mingId = MODERN_TO_MING[modernName]
    if (!mingId) continue

    const info = MING_INFO[mingId]
    if (!info) continue

    if (!mingMap.has(mingId)) {
      mingMap.set(mingId, {
        type: 'Feature',
        id: mingId,
        properties: {
          name: info.name,
          mingId,
          capital: info.capital,
          region: info.region,
        },
        geometry: {
          type: 'MultiPolygon',
          coordinates: [] as number[][][][],
        },
      })
    }

    const mingFeature = mingMap.get(mingId)!
    const geo = feature.geometry
    if (!geo) continue

    if (geo.type === 'Polygon') {
      mingFeature.geometry.coordinates.push(geo.coordinates)
    } else if (geo.type === 'MultiPolygon') {
      mingFeature.geometry.coordinates.push(...geo.coordinates)
    }
  }

  return { type: 'FeatureCollection', features: Array.from(mingMap.values()) }
}

export function getMingNameById(mingId: string): string {
  return MING_INFO[mingId]?.name || mingId
}
