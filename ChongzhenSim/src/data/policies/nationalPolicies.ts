import type { GameEffect } from '@/core/types'

export type PolicyCategory =
  | 'internal'    // 内政
  | 'military'    // 军事
  | 'politics'    // 政治
  | 'technology'  // 科技
  | 'diplomacy'   // 外交
  | 'welfare'     // 民生
  | 'wildcard'    // 脑洞向

export type PolicyStatus =
  | 'locked'       // 条件未满足，不可研究
  | 'available'    // 可以研究
  | 'researching'  // 研究中（倒计时中）
  | 'completed'    // 已完成

export interface NationalPolicy {
  id: string
  name: string
  category: PolicyCategory
  description: string
  flavorText: string          // 历史典故/背景小字
  status: PolicyStatus
  cost: number                // 研究费用（万两）
  researchTurns: number       // 需要几个回合完成
  remainingTurns?: number     // 当前剩余回合数（researching时使用）
  effects: GameEffect[]
  requirements: {
    prerequisitePolicies: string[]           // 前置国策id列表
    prestigeMin?: number                     // 最低威望
    factionSupport?: { id: string; min: number }  // 需要某势力支持度
  }
  isHistorical: boolean       // true=有史实依据，false=脑洞向
  unlocksEvents?: string[]    // 完成后解锁的剧本事件id
}

export const POLICY_CATEGORIES: Record<PolicyCategory, { label: string; icon: string; color: string }> = {
  internal:   { label: '内政', icon: '⚖', color: '#C9A84C' },
  military:   { label: '军事', icon: '⚔', color: '#cf1322' },
  politics:   { label: '政治', icon: '👑', color: '#722ed1' },
  technology: { label: '科技', icon: '📜', color: '#1d39c4' },
  diplomacy:  { label: '外交', icon: '🤝', color: '#08979c' },
  welfare:    { label: '民生', icon: '🌾', color: '#389e0d' },
  wildcard:   { label: '破局', icon: '✦', color: '#eb2f96' },
}

export const NATIONAL_POLICIES: NationalPolicy[] = [

  // ══════════════════════════════════
  // 内政类（12项）
  // ══════════════════════════════════
  {
    id: 'light_tax',
    name: '轻徭薄赋',
    category: 'internal',
    description: '降低赋税压力，提振民间经济与民心',
    flavorText: '洪武年间定制，轻税养民，国本在于民力',
    status: 'available',
    cost: 0,
    researchTurns: 1,
    effects: [
      { type: 'nation', target: 'all', field: 'peopleMorale', delta: 10, description: '民心+10' },
      { type: 'treasury', target: 'treasury', field: 'gold', delta: -30, description: '每季度财政-30万两' },
    ],
    requirements: { prerequisitePolicies: [] },
    isHistorical: true,
  },
  {
    id: 'tax_reform',
    name: '税制改革',
    category: 'internal',
    description: '稳定财政收入，打击地方偷税漏税',
    flavorText: '一条鞭法遗制，改革税收征收方式，减少中间损耗',
    status: 'locked',
    cost: 100,
    researchTurns: 2,
    effects: [
      { type: 'treasury', target: 'treasury', field: 'gold', delta: 80, description: '财政+80万两/季度' },
    ],
    requirements: { prerequisitePolicies: ['light_tax'] },
    isHistorical: true,
  },
  {
    id: 'canal_repair',
    name: '漕运整顿',
    category: 'internal',
    description: '修复京杭大运河，保障京师粮运畅通',
    flavorText: '京师仰给江南，漕运为命脉，整顿迫在眉睫',
    status: 'available',
    cost: 150,
    researchTurns: 2,
    effects: [
      { type: 'treasury', target: 'treasury', field: 'grain', delta: 100, description: '粮食+100万石/季度' },
    ],
    requirements: { prerequisitePolicies: [] },
    isHistorical: true,
  },
  {
    id: 'salt_tax',
    name: '盐铁官营优化',
    category: 'internal',
    description: '平衡官私盐利，稳定盐税收入',
    flavorText: '盐税为国家重要财源，私盐泛滥已严重侵蚀国库',
    status: 'available',
    cost: 80,
    researchTurns: 1,
    effects: [
      { type: 'treasury', target: 'treasury', field: 'gold', delta: 60, description: '盐税+60万两/季度' },
    ],
    requirements: { prerequisitePolicies: [] },
    isHistorical: true,
  },
  {
    id: 'open_trade',
    name: '市舶司复开',
    category: 'internal',
    description: '重开广州、泉州市舶司，增加海关税收',
    flavorText: '隆庆开关后海贸兴旺，重开市舶司可大增国库',
    status: 'available',
    cost: 50,
    researchTurns: 1,
    effects: [
      { type: 'treasury', target: 'treasury', field: 'gold', delta: 50, description: '海税+50万两/季度' },
      { type: 'minister', target: 'donglin', field: 'support', delta: -10, description: '东林党反对' },
    ],
    requirements: { prerequisitePolicies: [] },
    isHistorical: true,
  },
  {
    id: 'abolish_mine_tax',
    name: '矿税监裁撤',
    category: 'internal',
    description: '废除万历朝矿监税使制度，缓和官民矛盾',
    flavorText: '矿监祸害地方已久，裁撤可收拢民心，但断了内帑来源',
    status: 'available',
    cost: 0,
    researchTurns: 1,
    effects: [
      { type: 'nation', target: 'all', field: 'peopleMorale', delta: 8, description: '民心+8' },
    ],
    requirements: { prerequisitePolicies: [] },
    isHistorical: true,
  },
  {
    id: 'reduce_royal_stipend',
    name: '宗室禄米削减',
    category: 'internal',
    description: '限制藩王俸禄，缓解财政压力',
    flavorText: '宗室人口激增，禄米开支已占财政四成，非改不可',
    status: 'available',
    cost: 0,
    researchTurns: 1,
    effects: [
      { type: 'treasury', target: 'treasury', field: 'gold', delta: 40, description: '节省宗室开支+40' },
      { type: 'minister', target: 'royal_clan', field: 'support', delta: -20, description: '宗室强烈不满' },
    ],
    requirements: { prerequisitePolicies: [] },
    isHistorical: true,
  },
  {
    id: 'post_reform',
    name: '驿站裁撤优化',
    category: 'internal',
    description: '精简冗余驿站，节省开支同时保障军情传递',
    flavorText: '驿站每年耗银数十万，但此策需谨慎，裁员过急恐生民变',
    status: 'available',
    cost: 0,
    researchTurns: 1,
    effects: [
      { type: 'treasury', target: 'treasury', field: 'gold', delta: 20, description: '节省驿站费用+20' },
      { type: 'nation', target: 'all', field: 'peopleMorale', delta: -3, description: '驿卒失业，民心微降' },
    ],
    requirements: { prerequisitePolicies: [] },
    isHistorical: true,
    unlocksEvents: ['post_worker_unrest'],
  },
  {
    id: 'tea_horse',
    name: '茶马互市规范化',
    category: 'internal',
    description: '稳定与蒙古、藏地的茶马贸易，增加边境收入',
    flavorText: '以茶易马，羁縻边境，历朝之良策',
    status: 'available',
    cost: 30,
    researchTurns: 1,
    effects: [
      { type: 'nation', target: 'all', field: 'borderThreat', delta: -5, description: '北方边患-5' },
      { type: 'treasury', target: 'treasury', field: 'gold', delta: 15, description: '茶马贸易收益+15' },
    ],
    requirements: { prerequisitePolicies: [] },
    isHistorical: true,
  },
  {
    id: 'kaizhong_reform',
    name: '开中法改良',
    category: 'internal',
    description: '优化盐引制度，鼓励商人输粮边疆换取盐引',
    flavorText: '开中法可以商代官，输粮于边，一举两得',
    status: 'available',
    cost: 50,
    researchTurns: 2,
    effects: [
      { type: 'treasury', target: 'treasury', field: 'grain', delta: 80, description: '边境粮仓充足' },
    ],
    requirements: { prerequisitePolicies: [] },
    isHistorical: true,
  },
  {
    id: 'reserve_granary',
    name: '预备仓扩建',
    category: 'internal',
    description: '在各省建立备荒粮仓，应对天灾饥荒',
    flavorText: '积粮备荒，仓廪充实则民心安',
    status: 'available',
    cost: 120,
    researchTurns: 2,
    effects: [
      { type: 'nation', target: 'all', field: 'peopleMorale', delta: 5, description: '民心稳定+5' },
      { type: 'treasury', target: 'treasury', field: 'grain', delta: 50, description: '备荒粮仓+50万石' },
    ],
    requirements: { prerequisitePolicies: [] },
    isHistorical: true,
  },
  {
    id: 'paper_money',
    name: '钞法试行',
    category: 'internal',
    description: '尝试发行宝钞，短期内大幅充实国库',
    flavorText: '洪武宝钞贬值殷鉴，此策饮鸩止渴，需慎之又慎',
    status: 'available',
    cost: 0,
    researchTurns: 3,
    effects: [
      { type: 'treasury', target: 'treasury', field: 'gold', delta: 100, description: '短期国库+100万两' },
      { type: 'nation', target: 'all', field: 'peopleMorale', delta: -15, description: '通货膨胀，民心-15' },
    ],
    requirements: { prerequisitePolicies: [] },
    isHistorical: false,
  },

  // ══════════════════════════════════
  // 军事类（10项）
  // ══════════════════════════════════
  {
    id: 'border_defense',
    name: '守边固防',
    category: 'military',
    description: '加强九边防线建设，提升边防驻守效益',
    flavorText: '辽东、蓟镇、宣府，九边为大明屏障',
    status: 'available',
    cost: 100,
    researchTurns: 1,
    effects: [
      { type: 'nation', target: 'all', field: 'borderThreat', delta: -10, description: '边患-10' },
      { type: 'nation', target: 'all', field: 'militaryPower', delta: 8, description: '军力+8' },
    ],
    requirements: { prerequisitePolicies: [] },
    isHistorical: true,
  },
  {
    id: 'firearm_innovation',
    name: '火器革新',
    category: 'military',
    description: '引进西洋火炮技术，强化火器部队战力',
    flavorText: '徐光启奏请引进红夷大炮，此乃克制后金骑兵之利器',
    status: 'available',
    cost: 150,
    researchTurns: 2,
    effects: [
      { type: 'nation', target: 'all', field: 'militaryPower', delta: 15, description: '军力+15' },
    ],
    requirements: { prerequisitePolicies: [] },
    isHistorical: true,
  },
  {
    id: 'capital_garrison',
    name: '京营整训',
    category: 'military',
    description: '整顿京师三大营，恢复禁军战斗力',
    flavorText: '京营兵马久疏操练，号称十万实不满两万可战之士',
    status: 'available',
    cost: 200,
    researchTurns: 2,
    effects: [
      { type: 'nation', target: 'all', field: 'militaryPower', delta: 20, description: '军力+20' },
      { type: 'nation', target: 'emperor', field: 'prestige', delta: 5, description: '威望+5' },
    ],
    requirements: { prerequisitePolicies: [] },
    isHistorical: true,
  },
  {
    id: 'recruit_system',
    name: '边军募兵制',
    category: 'military',
    description: '逐步替代世兵制，以募兵提升兵员素质',
    flavorText: '世兵制积弊已久，募兵制可得精兵，但耗费更多军饷',
    status: 'locked',
    cost: 180,
    researchTurns: 3,
    effects: [
      { type: 'nation', target: 'all', field: 'militaryPower', delta: 18, description: '军力+18' },
    ],
    requirements: { prerequisitePolicies: ['border_defense'] },
    isHistorical: true,
  },
  {
    id: 'cart_army',
    name: '车营重建',
    category: 'military',
    description: '复刻戚继光车营战术，以车阵对抗后金骑兵',
    flavorText: '戚继光著《练兵实纪》，车营乃克制骑兵之法宝',
    status: 'locked',
    cost: 200,
    researchTurns: 2,
    effects: [
      { type: 'nation', target: 'all', field: 'militaryPower', delta: 20, description: '军力+20' },
      { type: 'nation', target: 'all', field: 'borderThreat', delta: -8, description: '边患-8' },
    ],
    requirements: { prerequisitePolicies: ['firearm_innovation'] },
    isHistorical: true,
  },
  {
    id: 'navy_expand',
    name: '水师扩建',
    category: 'military',
    description: '打造福建水师，抵御倭寇与海上威胁',
    flavorText: '东南沿海倭患未息，水师强则海疆安',
    status: 'available',
    cost: 160,
    researchTurns: 2,
    effects: [
      { type: 'province', target: 'fujian', field: 'militaryForce', delta: 20, description: '福建军力+20' },
      { type: 'province', target: 'zhejiang', field: 'civilUnrest', delta: -8, description: '浙江倭患减轻' },
    ],
    requirements: { prerequisitePolicies: [] },
    isHistorical: true,
  },
  {
    id: 'fortress_line',
    name: '堡垒防线修筑',
    category: 'military',
    description: '在辽东修筑西式棱堡防线，迟滞后金攻势',
    flavorText: '孙承宗督修宁远、锦州防线，以堡垒群消耗后金攻势',
    status: 'available',
    cost: 300,
    researchTurns: 3,
    effects: [
      { type: 'nation', target: 'all', field: 'borderThreat', delta: -20, description: '边患大幅降低' },
    ],
    requirements: { prerequisitePolicies: [] },
    isHistorical: true,
  },
  {
    id: 'military_integration',
    name: '兵备道整合',
    category: 'military',
    description: '统一地方军务指挥，消除权责混乱',
    flavorText: '地方督抚与兵备道职权交叉，整合后可提升指挥效率',
    status: 'available',
    cost: 80,
    researchTurns: 1,
    effects: [
      { type: 'nation', target: 'all', field: 'militaryPower', delta: 8, description: '军力+8' },
    ],
    requirements: { prerequisitePolicies: [] },
    isHistorical: true,
  },
  {
    id: 'military_farm',
    name: '军屯恢复',
    category: 'military',
    description: '鼓励士兵屯田自给，降低军粮消耗',
    flavorText: '太祖定屯田制，养兵不费国家一粒粮，今日可复其制',
    status: 'available',
    cost: 50,
    researchTurns: 2,
    effects: [
      { type: 'treasury', target: 'treasury', field: 'grain', delta: 60, description: '军粮自给+60万石' },
    ],
    requirements: { prerequisitePolicies: [] },
    isHistorical: true,
  },
  {
    id: 'weapon_factory',
    name: '火器工坊集中',
    category: 'military',
    description: '在京师与蓟辽建立大型火器制造局',
    flavorText: '统一制造标准，可大幅提升火器质量与产量',
    status: 'locked',
    cost: 200,
    researchTurns: 2,
    effects: [
      { type: 'nation', target: 'all', field: 'militaryPower', delta: 12, description: '军力+12' },
    ],
    requirements: { prerequisitePolicies: ['firearm_innovation'] },
    isHistorical: true,
  },

  // ══════════════════════════════════
  // 政治类（10项）
  // ══════════════════════════════════
  {
    id: 'faction_balance',
    name: '派系制衡',
    category: 'politics',
    description: '平衡各派势力，降低党争烈度',
    flavorText: '帝王之术，在于制衡，使诸臣相互牵制而不能专权',
    status: 'available',
    cost: 0,
    researchTurns: 1,
    effects: [
      { type: 'nation', target: 'all', field: 'factionConflict', delta: -15, description: '党争-15' },
    ],
    requirements: { prerequisitePolicies: [] },
    isHistorical: true,
  },
  {
    id: 'secret_memorial',
    name: '密折监察',
    category: 'politics',
    description: '建立密折制度，直接掌握各地实情',
    flavorText: '密折绕开内阁，直达天听，可防止官员相互包庇',
    status: 'locked',
    cost: 50,
    researchTurns: 1,
    effects: [
      { type: 'nation', target: 'all', field: 'factionConflict', delta: -10, description: '党争-10' },
      { type: 'nation', target: 'emperor', field: 'prestige', delta: 5, description: '皇权巩固' },
    ],
    requirements: { prerequisitePolicies: ['faction_balance'] },
    isHistorical: true,
  },
  {
    id: 'limit_cabinet',
    name: '内阁票拟权限制',
    category: 'politics',
    description: '收回部分内阁票拟权，强化皇帝直接决策',
    flavorText: '内阁渐成宰相，票拟权若不加约束，皇权将受蒙蔽',
    status: 'available',
    cost: 0,
    researchTurns: 1,
    effects: [
      { type: 'nation', target: 'emperor', field: 'prestige', delta: 10, description: '威望+10' },
      { type: 'minister', target: 'civil_officials', field: 'support', delta: -15, description: '文官集团不满' },
    ],
    requirements: { prerequisitePolicies: [] },
    isHistorical: true,
  },
  {
    id: 'censor_reform',
    name: '言官整顿',
    category: 'politics',
    description: '约束言官风闻言事，减少无谓弹劾',
    flavorText: '言官以清议自矜，然多空谈误国，需整顿方向',
    status: 'available',
    cost: 0,
    researchTurns: 1,
    effects: [
      { type: 'nation', target: 'all', field: 'factionConflict', delta: -8, description: '党争-8' },
    ],
    requirements: { prerequisitePolicies: [] },
    isHistorical: true,
  },
  {
    id: 'kaochen_law',
    name: '考成法重启',
    category: 'politics',
    description: '严格考核官员政绩，淘汰尸位素餐者',
    flavorText: '张居正考成法行之有效，复其制可整肃吏治',
    status: 'locked',
    cost: 80,
    researchTurns: 2,
    effects: [
      { type: 'nation', target: 'all', field: 'factionConflict', delta: -12, description: '吏治改善' },
      { type: 'treasury', target: 'treasury', field: 'gold', delta: 30, description: '行政效率提升+30' },
    ],
    requirements: { prerequisitePolicies: ['secret_memorial'] },
    isHistorical: true,
  },
  {
    id: 'limit_eunuch',
    name: '宦官干政限制',
    category: 'politics',
    description: '限制司礼监批红权，回归外朝理政',
    flavorText: '宦官专权乃明朝痼疾，非以铁腕不能根除',
    status: 'available',
    cost: 0,
    researchTurns: 1,
    effects: [
      { type: 'nation', target: 'emperor', field: 'prestige', delta: 8, description: '威望+8' },
      { type: 'minister', target: 'eunuch_party', field: 'support', delta: -20, description: '宦官势力受压制' },
    ],
    requirements: { prerequisitePolicies: [] },
    isHistorical: true,
  },
  {
    id: 'limit_royal',
    name: '藩王就国约束',
    category: 'politics',
    description: '禁止藩王干预地方政务，削弱宗室势力',
    flavorText: '藩王兼并土地，鱼肉百姓，非约束不能安地方',
    status: 'available',
    cost: 0,
    researchTurns: 1,
    effects: [
      { type: 'minister', target: 'royal_clan', field: 'support', delta: -15, description: '宗室不满' },
      { type: 'treasury', target: 'treasury', field: 'gold', delta: 20, description: '地方财政改善' },
    ],
    requirements: { prerequisitePolicies: [] },
    isHistorical: true,
  },
  {
    id: 'governor_system',
    name: '督抚制度完善',
    category: 'politics',
    description: '明确总督、巡抚的地方最高军政权力',
    flavorText: '督抚制度尚不完备，地方军政常生龃龉',
    status: 'available',
    cost: 50,
    researchTurns: 1,
    effects: [
      { type: 'nation', target: 'all', field: 'militaryPower', delta: 5, description: '地方军政效率提升' },
    ],
    requirements: { prerequisitePolicies: [] },
    isHistorical: true,
  },
  {
    id: 'limit_dongchang',
    name: '东厂职能收缩',
    category: 'politics',
    description: '将东厂权力限定于侦缉谋反，禁止滥权',
    flavorText: '东厂爪牙遍布，令官民噤若寒蝉，收缩职能可得民心',
    status: 'available',
    cost: 0,
    researchTurns: 1,
    effects: [
      { type: 'nation', target: 'all', field: 'peopleMorale', delta: 5, description: '民心+5' },
    ],
    requirements: { prerequisitePolicies: [] },
    isHistorical: true,
  },
  {
    id: 'south_study',
    name: '南书房雏形',
    category: 'politics',
    description: '设立皇帝机要秘书班子，绕开内阁直接施政',
    flavorText: '此为后世军机处之前身，可大幅提升皇帝决策效率',
    status: 'locked',
    cost: 30,
    researchTurns: 1,
    effects: [
      { type: 'nation', target: 'emperor', field: 'prestige', delta: 5, description: '皇权巩固' },
      { type: 'nation', target: 'emperor', field: 'politicsLevel', delta: 1, description: '政治能力+1' },
    ],
    requirements: { prerequisitePolicies: ['limit_cabinet'] },
    isHistorical: false,
  },

  // ══════════════════════════════════
  // 科技类（8项）
  // ══════════════════════════════════
  {
    id: 'agri_improve',
    name: '农耕改良',
    category: 'technology',
    description: '推广高产作物与先进农具，提升粮食产量',
    flavorText: '番薯、玉米已传入中土，推广可大幅缓解饥荒',
    status: 'available',
    cost: 80,
    researchTurns: 2,
    effects: [
      { type: 'treasury', target: 'treasury', field: 'grain', delta: 80, description: '粮食+80万石' },
      { type: 'nation', target: 'all', field: 'peopleMorale', delta: 5, description: '民心+5' },
    ],
    requirements: { prerequisitePolicies: [] },
    isHistorical: true,
  },
  {
    id: 'construction',
    name: '工程建设',
    category: 'technology',
    description: '大力推进城墙、道路、水利等基础设施建设',
    flavorText: '工事兴则国力强，基建乃百年之计',
    status: 'available',
    cost: 100,
    researchTurns: 1,
    effects: [
      { type: 'nation', target: 'all', field: 'militaryPower', delta: 5, description: '防御工事改善' },
    ],
    requirements: { prerequisitePolicies: [] },
    isHistorical: true,
  },
  {
    id: 'calendar_reform',
    name: '历法修订',
    category: 'technology',
    description: '引入西洋历法，修正大统历积累的误差',
    flavorText: '徐光启、李之藻等人力主修历，此乃开眼看世界之举',
    status: 'available',
    cost: 50,
    researchTurns: 1,
    effects: [
      { type: 'nation', target: 'emperor', field: 'scholarLevel', delta: 1, description: '学识+1' },
    ],
    requirements: { prerequisitePolicies: [] },
    isHistorical: true,
  },
  {
    id: 'firearm_theory',
    name: '火器理论研究',
    category: 'technology',
    description: '翻译西方火器著作，系统提升造炮水平',
    flavorText: '《西法神机》《火攻挈要》等著作，乃引进西学之基础',
    status: 'locked',
    cost: 100,
    researchTurns: 2,
    effects: [
      { type: 'nation', target: 'all', field: 'militaryPower', delta: 10, description: '军力+10' },
    ],
    requirements: { prerequisitePolicies: ['firearm_innovation'] },
    isHistorical: true,
  },
  {
    id: 'hydraulics',
    name: '水利工程推广',
    category: 'technology',
    description: '治理黄河、淮河水患，保障农业生产',
    flavorText: '黄河决口频繁，水患乃民变之根源，非治不可',
    status: 'available',
    cost: 200,
    researchTurns: 3,
    effects: [
      { type: 'nation', target: 'all', field: 'peopleMorale', delta: 10, description: '民心+10' },
      { type: 'treasury', target: 'treasury', field: 'grain', delta: 50, description: '农业产出+50' },
    ],
    requirements: { prerequisitePolicies: [] },
    isHistorical: true,
  },
  {
    id: 'shipbuilding',
    name: '造船技术引进',
    category: 'technology',
    description: '学习西方造船技术，建造大型远洋海船',
    flavorText: '郑和宝船之制已失传，重学造船可图海上霸业',
    status: 'locked',
    cost: 150,
    researchTurns: 2,
    effects: [
      { type: 'nation', target: 'all', field: 'militaryPower', delta: 8, description: '海军+8' },
    ],
    requirements: { prerequisitePolicies: ['navy_expand'] },
    isHistorical: true,
  },
  {
    id: 'medicine',
    name: '医学典籍整理',
    category: 'technology',
    description: '官方推广《本草纲目》，建立防疫体系',
    flavorText: '李时珍著《本草纲目》，推广可救无数生灵',
    status: 'available',
    cost: 60,
    researchTurns: 1,
    effects: [
      { type: 'nation', target: 'all', field: 'peopleMorale', delta: 5, description: '防疫能力提升' },
    ],
    requirements: { prerequisitePolicies: [] },
    isHistorical: true,
  },
  {
    id: 'math_academy',
    name: '算学馆设立',
    category: 'technology',
    description: '培养数学人才，服务历法修订与工程建设',
    flavorText: '西学中用，算学为百工之基',
    status: 'locked',
    cost: 40,
    researchTurns: 1,
    effects: [
      { type: 'nation', target: 'emperor', field: 'scholarLevel', delta: 1, description: '学识+1' },
    ],
    requirements: { prerequisitePolicies: ['calendar_reform'] },
    isHistorical: true,
  },

  // ══════════════════════════════════
  // 外交类（6项）
  // ══════════════════════════════════
  {
    id: 'ally_mongol',
    name: '联蒙制满',
    category: 'diplomacy',
    description: '与蒙古察哈尔、科尔沁等部结盟，共同牵制后金',
    flavorText: '以夷制夷，联蒙可在后金侧翼制造压力',
    status: 'available',
    cost: 100,
    researchTurns: 2,
    effects: [
      { type: 'nation', target: 'all', field: 'borderThreat', delta: -15, description: '北方压力大减' },
    ],
    requirements: { prerequisitePolicies: [] },
    isHistorical: true,
  },
  {
    id: 'joseon_control',
    name: '朝鲜羁縻',
    category: 'diplomacy',
    description: '加强对朝鲜的政治控制，防止其倒向后金',
    flavorText: '朝鲜为大明藩属，壬辰之役已结深厚情谊，需善加维系',
    status: 'available',
    cost: 80,
    researchTurns: 1,
    effects: [
      { type: 'nation', target: 'all', field: 'borderThreat', delta: -8, description: '东线压力减轻' },
    ],
    requirements: { prerequisitePolicies: [] },
    isHistorical: true,
  },
  {
    id: 'macao_trade',
    name: '澳门通商',
    category: 'diplomacy',
    description: '与葡萄牙澳门当局保持贸易，换取西方火器与技术',
    flavorText: '泰西人制炮之术精良，以贸易换技术，是为利国之策',
    status: 'available',
    cost: 30,
    researchTurns: 1,
    effects: [
      { type: 'nation', target: 'all', field: 'militaryPower', delta: 8, description: '获取西洋火器' },
      { type: 'treasury', target: 'treasury', field: 'gold', delta: 20, description: '贸易收益+20' },
    ],
    requirements: { prerequisitePolicies: [] },
    isHistorical: true,
  },
  {
    id: 'japan_trade',
    name: '日本勘合贸易重启',
    category: 'diplomacy',
    description: '恢复与日本的官方贸易往来，减少倭寇动机',
    flavorText: '倭患多因贸易受阻，以官方贸易疏导，可釜底抽薪',
    status: 'available',
    cost: 50,
    researchTurns: 1,
    effects: [
      { type: 'treasury', target: 'treasury', field: 'gold', delta: 30, description: '贸易收益+30' },
      { type: 'province', target: 'zhejiang', field: 'civilUnrest', delta: -10, description: '倭患减少' },
    ],
    requirements: { prerequisitePolicies: [] },
    isHistorical: true,
  },
  {
    id: 'envoy_rome',
    name: '遣使罗马',
    category: 'diplomacy',
    description: '派遣外交使团访问教廷，寻求西方军事援助',
    flavorText: '此举史无前例，或可打开另一扇大门',
    status: 'locked',
    cost: 200,
    researchTurns: 3,
    effects: [
      { type: 'nation', target: 'all', field: 'militaryPower', delta: 15, description: '西方军事援助' },
      { type: 'nation', target: 'emperor', field: 'prestige', delta: 10, description: '威望+10' },
    ],
    requirements: { prerequisitePolicies: ['macao_trade'], prestigeMin: 60 },
    isHistorical: false,
  },
  {
    id: 'southwest_appease',
    name: '西南土司安抚',
    category: 'diplomacy',
    description: '以怀柔政策稳定云贵川土司，减少西南动乱',
    flavorText: '改土归流尚需时日，当务之急是安抚各土司',
    status: 'available',
    cost: 60,
    researchTurns: 1,
    effects: [
      { type: 'province', target: 'yunnan', field: 'civilUnrest', delta: -15, description: '云南稳定' },
      { type: 'province', target: 'guizhou', field: 'civilUnrest', delta: -15, description: '贵州稳定' },
    ],
    requirements: { prerequisitePolicies: [] },
    isHistorical: true,
  },

  // ══════════════════════════════════
  // 民生类（3项）
  // ══════════════════════════════════
  {
    id: 'plague_control',
    name: '疫政推行',
    category: 'welfare',
    description: '设立官方防疫机构，应对明末鼠疫与天花',
    flavorText: '崇祯末年鼠疫横行，死者枕藉，非设专职不能遏制',
    status: 'available',
    cost: 80,
    researchTurns: 1,
    effects: [
      { type: 'nation', target: 'all', field: 'peopleMorale', delta: 8, description: '防疫民心+8' },
    ],
    requirements: { prerequisitePolicies: [] },
    isHistorical: true,
  },
  {
    id: 'refugee_settlement',
    name: '流民安置',
    category: 'welfare',
    description: '在河南、陕西设立流民屯垦区，以工代赈',
    flavorText: '流民不安则民变不止，安置屯垦乃釜底抽薪之策',
    status: 'available',
    cost: 100,
    researchTurns: 2,
    effects: [
      { type: 'province', target: 'shaanxi', field: 'civilUnrest', delta: -20, description: '陕西民乱-20' },
      { type: 'province', target: 'henan', field: 'civilUnrest', delta: -15, description: '河南民乱-15' },
    ],
    requirements: { prerequisitePolicies: [] },
    isHistorical: true,
  },
  {
    id: 'charity_granary',
    name: '义仓普及',
    category: 'welfare',
    description: '鼓励地方士绅建立义仓，形成民间赈济网络',
    flavorText: '官府赈灾力有不逮，民间义仓可作有力补充',
    status: 'available',
    cost: 50,
    researchTurns: 1,
    effects: [
      { type: 'nation', target: 'all', field: 'peopleMorale', delta: 6, description: '民心+6' },
    ],
    requirements: { prerequisitePolicies: [] },
    isHistorical: true,
  },

  // ══════════════════════════════════
  // 脑洞向（1项）
  // ══════════════════════════════════
  {
    id: 'nanyang_colony',
    name: '南洋拓殖计划',
    category: 'wildcard',
    description: '派遣宗室与流民前往吕宋、爪哇建立殖民地，转移国内矛盾',
    flavorText: '若郑和当年留下基业，今日大明或另有一番天地',
    status: 'locked',
    cost: 500,
    researchTurns: 4,
    effects: [
      { type: 'treasury', target: 'treasury', field: 'gold', delta: 200, description: '海外收益+200/季度' },
      { type: 'nation', target: 'all', field: 'peopleMorale', delta: 15, description: '民心+15' },
      { type: 'nation', target: 'all', field: 'factionConflict', delta: -20, description: '党争注意力转移' },
    ],
    requirements: {
      prerequisitePolicies: ['open_trade', 'shipbuilding'],
      prestigeMin: 70,
    },
    isHistorical: false,
  },
]
