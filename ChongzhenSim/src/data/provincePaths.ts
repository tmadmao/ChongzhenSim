export interface ProvincePath {
  id: string;
  name: string;
  path: string;
  labelX: number;
  labelY: number;
  region: 'north' | 'east' | 'south' | 'west' | 'central' | 'border';
  isCapital?: boolean;
  isBorder?: boolean;
}

export const PROVINCE_PATHS: ProvincePath[] = [
  {
    id: 'zhili_north',
    name: '北直隶',
    path: 'M380 80 L520 80 L540 120 L540 200 L520 240 L380 240 L360 200 L360 120 Z',
    labelX: 450,
    labelY: 160,
    region: 'north',
    isCapital: true
  },
  {
    id: 'zhili_south',
    name: '南直隶',
    path: 'M420 260 L560 260 L580 320 L580 420 L560 480 L420 480 L400 420 L400 320 Z',
    labelX: 490,
    labelY: 370,
    region: 'east'
  },
  {
    id: 'shandong',
    name: '山东',
    path: 'M540 160 L660 160 L680 200 L680 280 L660 320 L540 320 L520 280 L520 200 Z',
    labelX: 600,
    labelY: 240,
    region: 'east'
  },
  {
    id: 'shanxi',
    name: '山西',
    path: 'M260 100 L360 100 L380 160 L380 260 L360 320 L260 320 L240 260 L240 160 Z',
    labelX: 310,
    labelY: 210,
    region: 'north'
  },
  {
    id: 'henan',
    name: '河南',
    path: 'M320 280 L440 280 L460 340 L460 420 L440 480 L320 480 L300 420 L300 340 Z',
    labelX: 380,
    labelY: 380,
    region: 'central'
  },
  {
    id: 'shaanxi',
    name: '陕西',
    path: 'M140 200 L280 200 L300 280 L300 400 L280 480 L140 480 L120 400 L120 280 Z',
    labelX: 210,
    labelY: 340,
    region: 'west'
  },
  {
    id: 'sichuan',
    name: '四川',
    path: 'M100 420 L260 420 L280 500 L280 620 L260 700 L100 700 L80 620 L80 500 Z',
    labelX: 180,
    labelY: 560,
    region: 'west'
  },
  {
    id: 'huguang',
    name: '湖广',
    path: 'M320 500 L460 500 L480 580 L480 700 L460 780 L320 780 L300 700 L300 580 Z',
    labelX: 390,
    labelY: 640,
    region: 'central'
  },
  {
    id: 'jiangxi',
    name: '江西',
    path: 'M500 500 L600 500 L620 560 L620 660 L600 720 L500 720 L480 660 L480 560 Z',
    labelX: 550,
    labelY: 610,
    region: 'east'
  },
  {
    id: 'zhejiang',
    name: '浙江',
    path: 'M600 420 L700 420 L720 480 L720 560 L700 620 L600 620 L580 560 L580 480 Z',
    labelX: 650,
    labelY: 520,
    region: 'east'
  },
  {
    id: 'fujian',
    name: '福建',
    path: 'M600 640 L700 640 L720 700 L720 780 L700 840 L600 840 L580 780 L580 700 Z',
    labelX: 650,
    labelY: 740,
    region: 'south'
  },
  {
    id: 'guangdong',
    name: '广东',
    path: 'M420 720 L580 720 L600 780 L600 860 L580 920 L420 920 L400 860 L400 780 Z',
    labelX: 500,
    labelY: 820,
    region: 'south'
  },
  {
    id: 'guangxi',
    name: '广西',
    path: 'M260 720 L400 720 L420 780 L420 860 L400 920 L260 920 L240 860 L240 780 Z',
    labelX: 330,
    labelY: 820,
    region: 'south'
  },
  {
    id: 'yunnan',
    name: '云南',
    path: 'M80 700 L240 700 L260 760 L260 860 L240 940 L80 940 L60 860 L60 760 Z',
    labelX: 160,
    labelY: 820,
    region: 'west'
  },
  {
    id: 'guizhou',
    name: '贵州',
    path: 'M240 640 L360 640 L380 700 L380 780 L360 840 L240 840 L220 780 L220 700 Z',
    labelX: 300,
    labelY: 740,
    region: 'south'
  },
  {
    id: 'liaodong',
    name: '辽东',
    path: 'M560 40 L680 40 L720 80 L740 140 L720 180 L560 180 L540 140 L540 80 Z',
    labelX: 630,
    labelY: 110,
    region: 'border',
    isBorder: true
  },
  {
    id: 'xuanfu',
    name: '宣府',
    path: 'M300 40 L380 40 L400 80 L400 120 L380 160 L300 160 L280 120 L280 80 Z',
    labelX: 340,
    labelY: 100,
    region: 'border',
    isBorder: true
  },
  {
    id: 'datong',
    name: '大同',
    path: 'M200 60 L280 60 L300 100 L300 140 L280 180 L200 180 L180 140 L180 100 Z',
    labelX: 240,
    labelY: 120,
    region: 'border',
    isBorder: true
  },
  {
    id: 'yansui',
    name: '延绥',
    path: 'M120 140 L200 140 L220 180 L220 240 L200 280 L120 280 L100 240 L100 180 Z',
    labelX: 160,
    labelY: 210,
    region: 'border',
    isBorder: true
  },
  {
    id: 'ningxia',
    name: '宁夏',
    path: 'M60 220 L120 220 L140 260 L140 320 L120 360 L60 360 L40 320 L40 260 Z',
    labelX: 90,
    labelY: 290,
    region: 'border',
    isBorder: true
  },
  {
    id: 'gansu',
    name: '甘肃',
    path: 'M20 300 L100 300 L120 380 L120 500 L100 580 L20 580 L0 500 L0 380 Z',
    labelX: 60,
    labelY: 440,
    region: 'border',
    isBorder: true
  },
  {
    id: 'jizhou',
    name: '蓟州',
    path: 'M460 40 L540 40 L560 80 L560 120 L540 160 L460 160 L440 120 L440 80 Z',
    labelX: 500,
    labelY: 100,
    region: 'border',
    isBorder: true
  }
];

export const MAP_VIEWBOX = {
  width: 800,
  height: 960,
  padding: 20
};

export const STATUS_COLORS = {
  stable: { fill: '#6E9E6E40', stroke: '#6E9E6E' },
  unrest: { fill: '#E67E2240', stroke: '#E67E22' },
  rebellion: { fill: '#C0392B40', stroke: '#C0392B' },
  border: { fill: '#5DADE240', stroke: '#5DADE2' },
  capital: { fill: '#C9A84C40', stroke: '#C9A84C' },
  normal: { fill: '#4A556840', stroke: '#4A5568' }
};
