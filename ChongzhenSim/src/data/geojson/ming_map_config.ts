export interface MingProvince {
  id: string;
  mingName: string;
  modernProvinces: string[];
  capital: string;
  capitalCoords: [number, number];
  region: 'north' | 'south' | 'east' | 'west' | 'central' | 'border';
  isMilitary: boolean;
  labelOffset?: [number, number];
}

export const MING_PROVINCES: MingProvince[] = [
  {
    id: 'beijing_zhili',
    mingName: '北直隶',
    modernProvinces: ['北京市', '天津市', '河北省'],
    capital: '京师',
    capitalCoords: [116.4, 39.9],
    region: 'north',
    isMilitary: false,
  },
  {
    id: 'nanjing_zhili',
    mingName: '南直隶',
    modernProvinces: ['上海市', '江苏省', '安徽省'],
    capital: '南京',
    capitalCoords: [118.8, 32.0],
    region: 'east',
    isMilitary: false,
  },
  {
    id: 'shandong',
    mingName: '山东',
    modernProvinces: ['山东省'],
    capital: '济南',
    capitalCoords: [117.0, 36.7],
    region: 'east',
    isMilitary: false,
  },
  {
    id: 'shanxi',
    mingName: '山西',
    modernProvinces: ['山西省'],
    capital: '太原',
    capitalCoords: [112.5, 37.9],
    region: 'north',
    isMilitary: false,
  },
  {
    id: 'henan',
    mingName: '河南',
    modernProvinces: ['河南省'],
    capital: '开封',
    capitalCoords: [114.3, 34.8],
    region: 'central',
    isMilitary: false,
  },
  {
    id: 'shaanxi',
    mingName: '陕西',
    modernProvinces: ['陕西省', '宁夏回族自治区'],
    capital: '西安',
    capitalCoords: [108.9, 34.3],
    region: 'west',
    isMilitary: false,
  },
  {
    id: 'sichuan',
    mingName: '四川',
    modernProvinces: ['四川省', '重庆市'],
    capital: '成都',
    capitalCoords: [104.1, 30.7],
    region: 'west',
    isMilitary: false,
  },
  {
    id: 'huguang',
    mingName: '湖广',
    modernProvinces: ['湖北省', '湖南省'],
    capital: '武昌',
    capitalCoords: [114.3, 30.5],
    region: 'central',
    isMilitary: false,
  },
  {
    id: 'jiangxi',
    mingName: '江西',
    modernProvinces: ['江西省'],
    capital: '南昌',
    capitalCoords: [115.9, 28.7],
    region: 'east',
    isMilitary: false,
  },
  {
    id: 'zhejiang',
    mingName: '浙江',
    modernProvinces: ['浙江省'],
    capital: '杭州',
    capitalCoords: [120.2, 30.3],
    region: 'east',
    isMilitary: false,
  },
  {
    id: 'fujian',
    mingName: '福建',
    modernProvinces: ['福建省'],
    capital: '福州',
    capitalCoords: [119.3, 26.1],
    region: 'south',
    isMilitary: false,
  },
  {
    id: 'guangdong',
    mingName: '广东',
    modernProvinces: ['广东省', '海南省'],
    capital: '广州',
    capitalCoords: [113.3, 23.1],
    region: 'south',
    isMilitary: false,
  },
  {
    id: 'guangxi',
    mingName: '广西',
    modernProvinces: ['广西壮族自治区'],
    capital: '桂林',
    capitalCoords: [110.3, 25.3],
    region: 'south',
    isMilitary: false,
  },
  {
    id: 'yunnan',
    mingName: '云南',
    modernProvinces: ['云南省'],
    capital: '昆明',
    capitalCoords: [102.7, 25.0],
    region: 'west',
    isMilitary: false,
  },
  {
    id: 'guizhou',
    mingName: '贵州',
    modernProvinces: ['贵州省'],
    capital: '贵阳',
    capitalCoords: [106.7, 26.6],
    region: 'west',
    isMilitary: false,
  },
  {
    id: 'liaodong',
    mingName: '辽东',
    modernProvinces: ['辽宁省'],
    capital: '辽阳',
    capitalCoords: [123.2, 41.3],
    region: 'border',
    isMilitary: true,
  },
];

export const MODERN_TO_MING_MAP: Record<string, string> = {
  '北京市': 'beijing_zhili',
  '天津市': 'beijing_zhili',
  '河北省': 'beijing_zhili',
  '上海市': 'nanjing_zhili',
  '江苏省': 'nanjing_zhili',
  '安徽省': 'nanjing_zhili',
  '山东省': 'shandong',
  '山西省': 'shanxi',
  '河南省': 'henan',
  '陕西省': 'shaanxi',
  '宁夏回族自治区': 'shaanxi',
  '四川省': 'sichuan',
  '重庆市': 'sichuan',
  '湖北省': 'huguang',
  '湖南省': 'huguang',
  '江西省': 'jiangxi',
  '浙江省': 'zhejiang',
  '福建省': 'fujian',
  '广东省': 'guangdong',
  '海南省': 'guangdong',
  '广西壮族自治区': 'guangxi',
  '云南省': 'yunnan',
  '贵州省': 'guizhou',
  '辽宁省': 'liaodong',
};

export const MING_PROVINCE_BY_ID: Record<string, MingProvince> = MING_PROVINCES.reduce((acc, province) => {
  acc[province.id] = province;
  return acc;
}, {} as Record<string, MingProvince>);
