// 国策树：7大类50项国策
// 所有数值从 gameConfig.ts 引用，禁止硬编码

import type { GameEffect } from '@/core/types'
// import { GAME_CONFIG } from '@/config/gameConfig'  // 保留导入以备将来使用

// 国策效果数值常量
// const { PROVINCE, NATION } = GAME_CONFIG  // 保留以备将来使用
const POLICY_EFFECTS = {
  // 民心变动
  MORALE_SMALL: 5,
  MORALE_MEDIUM: 8,
  MORALE_LARGE: 10,
  MORALE_NEGATIVE_SMALL: -5,
  MORALE_NEGATIVE_MEDIUM: -10,
  MORALE_NEGATIVE_LARGE: -15,
  
  // 财政变动
  GOLD_SMALL: 20,
  GOLD_MEDIUM: 40,
  GOLD_LARGE: 60,
  GOLD_HUGE: 80,
  GOLD_MASSIVE: 100,
  GOLD_NEGATIVE_SMALL: -20,
  GOLD_NEGATIVE_MEDIUM: -30,
  
  // 粮食变动
  GRAIN_SMALL: 50,
  GRAIN_MEDIUM: 80,
  GRAIN_LARGE: 100,
  
  // 军力变动
  MILITARY_SMALL: 8,
  MILITARY_MEDIUM: 15,
  MILITARY_LARGE: 18,
  MILITARY_HUGE: 20,
  
  // 边患变动
  THREAT_SMALL: -5,
  THREAT_MEDIUM: -8,
  THREAT_LARGE: -10,
  THREAT_HUGE: -20,
  
  // 派系支持度变动
  FACTION_SUPPORT_SMALL: -10,
  FACTION_SUPPORT_MEDIUM: -15,
  FACTION_SUPPORT_LARGE: -20,
}

export type PolicyCategory = 'internal' | 'military' | 'politics' | 'technology' | 'diplomacy' | 'welfare' | 'wildcard'
export type PolicyStatus = 'locked' | 'available' | 'researching' | 'completed'

export interface NationalPolicy {
  id: string
  name: string
  category: PolicyCategory
  description: string
  status: PolicyStatus
  cost: number              // 实施费用（万两）
  researchTurns: number     // 研究所需季度数
  progress?: number         // 当前研究进度
  effects: GameEffect[]
  requirements?: {
    prestigeMin?: number
    prerequisitePolicies?: string[]   // 前置国策
    factionSupport?: { factionId: string; value: number }
    techLevel?: number
  }
  isHistorical: boolean     // 是否有历史原型
}

export const NATIONAL_POLICIES: NationalPolicy[] = [
  // ── 内政类 ──
  { id: 'light_tax', name: '轻徭薄赋', category: 'internal', description: '降低税压，提振民间经济', status: 'available', cost: 0, researchTurns: 1, effects: [{ type: 'nation', target: 'all', field: 'peopleMorale', delta: POLICY_EFFECTS.MORALE_LARGE, description: '民心+10' }, { type: 'treasury', target: 'treasury', field: 'gold', delta: POLICY_EFFECTS.GOLD_NEGATIVE_MEDIUM, description: '财政-30/季度' }], isHistorical: true },
  { id: 'tax_reform', name: '税制改革', category: 'internal', description: '稳定财政，打击偷税漏税', status: 'locked', cost: 100, researchTurns: 2, effects: [{ type: 'treasury', target: 'treasury', field: 'gold', delta: POLICY_EFFECTS.GOLD_HUGE, description: '财政+80' }], requirements: { prerequisitePolicies: ['light_tax'] }, isHistorical: true },
  { id: 'canal_repair', name: '漕运整顿', category: 'internal', description: '修复京杭大运河，保障京师粮运', status: 'available', cost: 150, researchTurns: 2, effects: [{ type: 'treasury', target: 'treasury', field: 'grain', delta: POLICY_EFFECTS.GRAIN_LARGE, description: '粮食+100/季度' }], isHistorical: true },
  { id: 'salt_tax', name: '盐铁官营优化', category: 'internal', description: '平衡官私盐利，稳定盐税收入', status: 'available', cost: 80, researchTurns: 1, effects: [{ type: 'treasury', target: 'treasury', field: 'gold', delta: POLICY_EFFECTS.GOLD_LARGE, description: '盐税+60/季度' }], isHistorical: true },
  { id: 'open_trade', name: '市舶司复开', category: 'internal', description: '重开广州、泉州市舶司，增加海关税收', status: 'available', cost: 50, researchTurns: 1, effects: [{ type: 'treasury', target: 'treasury', field: 'gold', delta: POLICY_EFFECTS.GRAIN_SMALL, description: '海税+50/季度' }, { type: 'minister', target: 'donglin', field: 'support', delta: POLICY_EFFECTS.FACTION_SUPPORT_SMALL, description: '东林党反对' }], isHistorical: true },
  { id: 'abolish_mine_tax', name: '矿税监裁撤', category: 'internal', description: '废除矿监税使，缓和官民矛盾', status: 'available', cost: 0, researchTurns: 1, effects: [{ type: 'nation', target: 'all', field: 'peopleMorale', delta: POLICY_EFFECTS.MORALE_MEDIUM, description: '民心+8' }], isHistorical: true },
  { id: 'reduce_royal_stipend', name: '宗室禄米削减', category: 'internal', description: '限制藩王俸禄，缓解财政压力', status: 'available', cost: 0, researchTurns: 1, effects: [{ type: 'treasury', target: 'treasury', field: 'gold', delta: POLICY_EFFECTS.GOLD_MEDIUM, description: '节省宗室开支' }, { type: 'minister', target: 'royal_clan', field: 'support', delta: POLICY_EFFECTS.FACTION_SUPPORT_LARGE, description: '宗室不满' }], isHistorical: true },
  { id: 'post_reform', name: '驿站裁撤优化', category: 'internal', description: '精简驿站，保障军情传递', status: 'available', cost: 0, researchTurns: 1, effects: [{ type: 'treasury', target: 'treasury', field: 'gold', delta: POLICY_EFFECTS.GOLD_SMALL, description: '节省驿站费用' }], isHistorical: true },
  { id: 'tea_horse', name: '茶马互市规范化', category: 'internal', description: '稳定与蒙古、藏地的茶马贸易', status: 'available', cost: 30, researchTurns: 1, effects: [{ type: 'nation', target: 'all', field: 'borderThreat', delta: POLICY_EFFECTS.THREAT_SMALL, description: '北方边患-5' }], isHistorical: true },
  { id: 'kaizhong_reform', name: '开中法改良', category: 'internal', description: '优化盐引制度，鼓励商人输粮边疆', status: 'available', cost: 50, researchTurns: 2, effects: [{ type: 'treasury', target: 'treasury', field: 'grain', delta: POLICY_EFFECTS.GRAIN_MEDIUM, description: '边粮充足' }], isHistorical: true },
  { id: 'reserve_granary', name: '预备仓扩建', category: 'internal', description: '在各省建立备荒粮仓，应对灾荒', status: 'available', cost: 120, researchTurns: 2, effects: [{ type: 'nation', target: 'all', field: 'peopleMorale', delta: POLICY_EFFECTS.MORALE_SMALL, description: '民心稳定' }], isHistorical: true },
  { id: 'paper_money', name: '钞法试行', category: 'internal', description: '尝试发行纸币，缓解通货紧缩', status: 'available', cost: 0, researchTurns: 3, effects: [{ type: 'treasury', target: 'treasury', field: 'gold', delta: POLICY_EFFECTS.GOLD_MASSIVE, description: '短期财政+100' }, { type: 'nation', target: 'all', field: 'peopleMorale', delta: POLICY_EFFECTS.MORALE_NEGATIVE_LARGE, description: '民心不稳' }], isHistorical: false },

  // ── 军事类 ──
  { id: 'border_defense', name: '守边固防', category: 'military', description: '提升边防收益', status: 'available', cost: 100, researchTurns: 1, effects: [{ type: 'nation', target: 'all', field: 'borderThreat', delta: POLICY_EFFECTS.THREAT_LARGE, description: '边患-10' }], isHistorical: true },
  { id: 'firearm_innovation', name: '火器革新', category: 'military', description: '强化火器部队战力', status: 'available', cost: 150, researchTurns: 2, effects: [{ type: 'nation', target: 'all', field: 'militaryPower', delta: POLICY_EFFECTS.MILITARY_MEDIUM, description: '军力+15' }], isHistorical: true },
  { id: 'capital_garrison', name: '京营整训', category: 'military', description: '整顿京师三大营，恢复禁军战斗力', status: 'available', cost: 200, researchTurns: 2, effects: [{ type: 'nation', target: 'all', field: 'militaryPower', delta: POLICY_EFFECTS.MILITARY_HUGE, description: '军力+20' }], isHistorical: true },
  { id: 'recruit_system', name: '边军募兵制', category: 'military', description: '逐步替代世兵制，提升兵员素质', status: 'locked', cost: 180, researchTurns: 3, effects: [{ type: 'nation', target: 'all', field: 'militaryPower', delta: POLICY_EFFECTS.MILITARY_LARGE, description: '军力+18' }], requirements: { prerequisitePolicies: ['border_defense'] }, isHistorical: true },
  { id: 'cart_army', name: '车营重建', category: 'military', description: '复刻戚继光车营战术，对抗骑兵', status: 'locked', cost: 200, researchTurns: 2, effects: [{ type: 'nation', target: 'all', field: 'militaryPower', delta: POLICY_EFFECTS.MILITARY_HUGE, description: '军力+20' }, { type: 'nation', target: 'all', field: 'borderThreat', delta: POLICY_EFFECTS.THREAT_MEDIUM, description: '边患-8' }], requirements: { prerequisitePolicies: ['firearm_innovation'] }, isHistorical: true },
  { id: 'navy_expand', name: '水师扩建', category: 'military', description: '打造福建水师，抵御倭寇', status: 'available', cost: 160, researchTurns: 2, effects: [{ type: 'province', target: 'fujian', field: 'militaryForce', delta: POLICY_EFFECTS.MILITARY_HUGE, description: '福建军力+20' }], isHistorical: true },
  { id: 'fortress_line', name: '堡垒防线修筑', category: 'military', description: '在辽东修筑棱堡防线，迟滞后金攻势', status: 'available', cost: 300, researchTurns: 3, effects: [{ type: 'nation', target: 'all', field: 'borderThreat', delta: POLICY_EFFECTS.THREAT_HUGE, description: '边患大减' }], isHistorical: true },
  { id: 'military_integration', name: '兵备道整合', category: 'military', description: '统一地方军务指挥，避免权责混乱', status: 'available', cost: 80, researchTurns: 1, effects: [{ type: 'nation', target: 'all', field: 'militaryPower', delta: POLICY_EFFECTS.MILITARY_SMALL, description: '军力+8' }], isHistorical: true },
  { id: 'military_farm', name: '军屯恢复', category: 'military', description: '鼓励士兵屯田，自给军粮', status: 'available', cost: 50, researchTurns: 2, effects: [{ type: 'treasury', target: 'treasury', field: 'grain', delta: 60, description: '粮食+60/季度' }], isHistorical: true },
  { id: 'weapon_factory', name: '火器工坊集中', category: 'military', description: '建立大型火器制造局', status: 'locked', cost: 200, researchTurns: 2, effects: [{ type: 'nation', target: 'all', field: 'militaryPower', delta: 12, description: '军力+12' }], requirements: { prerequisitePolicies: ['firearm_innovation'] }, isHistorical: true },

  // ── 政治类 ──
  { id: 'faction_balance', name: '派系制衡', category: 'politics', description: '降低党争，提升行政效率', status: 'available', cost: 0, researchTurns: 1, effects: [{ type: 'nation', target: 'all', field: 'factionConflict', delta: -15, description: '党争-15' }], isHistorical: true },
  { id: 'secret_memorial', name: '密折监察', category: 'politics', description: '遏制贪腐与派系失控', status: 'locked', cost: 50, researchTurns: 1, effects: [{ type: 'nation', target: 'all', field: 'factionConflict', delta: -10, description: '党争-10' }], requirements: { prerequisitePolicies: ['faction_balance'] }, isHistorical: true },
  { id: 'limit_cabinet', name: '内阁票拟权限制', category: 'politics', description: '强化皇权，避免内阁专权', status: 'available', cost: 0, researchTurns: 1, effects: [{ type: 'nation', target: 'emperor', field: 'prestige', delta: 10, description: '威望+10' }, { type: 'minister', target: 'civil_officials', field: 'support', delta: -15, description: '文官不满' }], isHistorical: true },
  { id: 'censor_reform', name: '言官整顿', category: 'politics', description: '约束言官风闻言事', status: 'available', cost: 0, researchTurns: 1, effects: [{ type: 'nation', target: 'all', field: 'factionConflict', delta: -8, description: '党争小减' }], isHistorical: true },
  { id: 'kaochen_law', name: '考成法重启', category: 'politics', description: '严格考核官员政绩，淘汰庸官', status: 'locked', cost: 80, researchTurns: 2, effects: [{ type: 'nation', target: 'all', field: 'factionConflict', delta: -12, description: '吏治改善' }, { type: 'treasury', target: 'treasury', field: 'gold', delta: 30, description: '行政效率提升' }], requirements: { prerequisitePolicies: ['secret_memorial'] }, isHistorical: true },
  { id: 'limit_eunuch', name: '宦官干政限制', category: 'politics', description: '限制司礼监批红权', status: 'available', cost: 0, researchTurns: 1, effects: [{ type: 'nation', target: 'emperor', field: 'prestige', delta: 8, description: '威望+8' }, { type: 'minister', target: 'eunuch_party', field: 'support', delta: -20, description: '宦官势力削弱' }], isHistorical: true },
  { id: 'limit_royal', name: '藩王就国约束', category: 'politics', description: '限制藩王干预地方政务', status: 'available', cost: 0, researchTurns: 1, effects: [{ type: 'minister', target: 'royal_clan', field: 'support', delta: -15, description: '宗室不满' }, { type: 'treasury', target: 'treasury', field: 'gold', delta: 20, description: '地方财政改善' }], isHistorical: true },
  { id: 'governor_system', name: '督抚制度完善', category: 'politics', description: '确立总督、巡抚的地方最高军政地位', status: 'available', cost: 50, researchTurns: 1, effects: [{ type: 'nation', target: 'all', field: 'militaryPower', delta: 5, description: '地方治理改善' }], isHistorical: true },
  { id: 'limit_dongchang', name: '东厂职能收缩', category: 'politics', description: '将东厂权力限定于侦缉谋反', status: 'available', cost: 0, researchTurns: 1, effects: [{ type: 'nation', target: 'all', field: 'peopleMorale', delta: 5, description: '民心小涨' }], isHistorical: true },
  { id: 'south_study', name: '南书房雏形', category: 'politics', description: '设立皇帝机要秘书班子，绕开内阁', status: 'locked', cost: 30, researchTurns: 1, effects: [{ type: 'nation', target: 'emperor', field: 'prestige', delta: 5, description: '皇权巩固' }], requirements: { prerequisitePolicies: ['limit_cabinet'] }, isHistorical: false },

  // ── 科技类 ──
  { id: 'agri_improve', name: '农耕改良', category: 'technology', description: '提升粮食储备', status: 'available', cost: 80, researchTurns: 2, effects: [{ type: 'treasury', target: 'treasury', field: 'grain', delta: 80, description: '粮食+80' }], isHistorical: true },
  { id: 'construction', name: '工程建设', category: 'technology', description: '增强长期工程效率', status: 'available', cost: 100, researchTurns: 1, effects: [{ type: 'nation', target: 'all', field: 'militaryPower', delta: 5, description: '基础设施改善' }], isHistorical: true },
  { id: 'calendar_reform', name: '历法修订', category: 'technology', description: '引入西法，修正大统历误差', status: 'available', cost: 50, researchTurns: 1, effects: [{ type: 'nation', target: 'emperor', field: 'scholarLevel', delta: 1, description: '学识+1' }], isHistorical: true },
  { id: 'firearm_theory', name: '火器理论研究', category: 'technology', description: '翻译西方火器著作，提升造炮水平', status: 'locked', cost: 100, researchTurns: 2, effects: [{ type: 'nation', target: 'all', field: 'militaryPower', delta: 10, description: '军力+10' }], requirements: { prerequisitePolicies: ['firearm_innovation'] }, isHistorical: true },
  { id: 'hydraulics', name: '水利工程推广', category: 'technology', description: '治理黄河、淮河水患', status: 'available', cost: 200, researchTurns: 3, effects: [{ type: 'nation', target: 'all', field: 'peopleMorale', delta: 10, description: '民心+10' }, { type: 'treasury', target: 'treasury', field: 'grain', delta: 50, description: '农业产出+50' }], isHistorical: true },
  { id: 'shipbuilding', name: '造船技术引进', category: 'technology', description: '学习西方造船术，建造大型海船', status: 'locked', cost: 150, researchTurns: 2, effects: [{ type: 'nation', target: 'all', field: 'militaryPower', delta: 8, description: '海军+8' }], requirements: { prerequisitePolicies: ['navy_expand'] }, isHistorical: true },
  { id: 'medicine', name: '医学典籍整理', category: 'technology', description: '推广防疫知识', status: 'available', cost: 60, researchTurns: 1, effects: [{ type: 'nation', target: 'all', field: 'peopleMorale', delta: 5, description: '防疫改善' }], isHistorical: true },
  { id: 'math_academy', name: '算学馆设立', category: 'technology', description: '培养数学人才，服务历法与工程', status: 'locked', cost: 40, researchTurns: 1, effects: [{ type: 'nation', target: 'emperor', field: 'scholarLevel', delta: 1, description: '学识+1' }], requirements: { prerequisitePolicies: ['calendar_reform'] }, isHistorical: true },

  // ── 外交类 ──
  { id: 'ally_mongol', name: '联蒙制满', category: 'diplomacy', description: '与蒙古各部结盟，共同牵制后金', status: 'available', cost: 100, researchTurns: 2, effects: [{ type: 'nation', target: 'all', field: 'borderThreat', delta: -15, description: '北方压力减轻' }], isHistorical: true },
  { id: 'joseon_control', name: '朝鲜羁縻', category: 'diplomacy', description: '加强对朝鲜的控制，防止倒向后金', status: 'available', cost: 80, researchTurns: 1, effects: [{ type: 'nation', target: 'all', field: 'borderThreat', delta: -8, description: '东线压力减轻' }], isHistorical: true },
  { id: 'macao_trade', name: '澳门通商', category: 'diplomacy', description: '与葡萄牙保持贸易，获取西方火器与技术', status: 'available', cost: 30, researchTurns: 1, effects: [{ type: 'nation', target: 'all', field: 'militaryPower', delta: 8, description: '获取西洋火器' }, { type: 'treasury', target: 'treasury', field: 'gold', delta: 20, description: '贸易收益' }], isHistorical: true },
  { id: 'japan_trade', name: '日本勘合贸易重启', category: 'diplomacy', description: '恢复与日本的官方贸易，减少倭寇', status: 'available', cost: 50, researchTurns: 1, effects: [{ type: 'treasury', target: 'treasury', field: 'gold', delta: 30, description: '贸易收益+30' }, { type: 'province', target: 'zhejiang', field: 'civilUnrest', delta: -10, description: '倭患减少' }], isHistorical: true },
  { id: 'envoy_rome', name: '遣使罗马', category: 'diplomacy', description: '派遣使团访问教廷，争取西方军事援助', status: 'locked', cost: 200, researchTurns: 3, effects: [{ type: 'nation', target: 'all', field: 'militaryPower', delta: 15, description: '西方军事援助' }], requirements: { prerequisitePolicies: ['macao_trade'] }, isHistorical: false },
  { id: 'southwest_appease', name: '西南土司安抚', category: 'diplomacy', description: '以怀柔政策稳定云贵川土司', status: 'available', cost: 60, researchTurns: 1, effects: [{ type: 'province', target: 'yunnan', field: 'civilUnrest', delta: -15, description: '云南稳定' }, { type: 'province', target: 'guizhou', field: 'civilUnrest', delta: -15, description: '贵州稳定' }], isHistorical: true },

  // ── 民生类 ──
  { id: 'plague_control', name: '疫政推行', category: 'welfare', description: '设立防疫机构，应对明末鼠疫', status: 'available', cost: 80, researchTurns: 1, effects: [{ type: 'nation', target: 'all', field: 'peopleMorale', delta: 8, description: '民心+8' }], isHistorical: true },
  { id: 'refugee_settlement', name: '流民安置', category: 'welfare', description: '在河南、陕西设立流民屯垦区', status: 'available', cost: 100, researchTurns: 2, effects: [{ type: 'province', target: 'shaanxi', field: 'civilUnrest', delta: -20, description: '陕西民乱-20' }, { type: 'province', target: 'henan', field: 'civilUnrest', delta: -15, description: '河南民乱-15' }], isHistorical: true },
  { id: 'charity_granary', name: '义仓普及', category: 'welfare', description: '鼓励地方士绅建立义仓，赈济灾民', status: 'available', cost: 50, researchTurns: 1, effects: [{ type: 'nation', target: 'all', field: 'peopleMorale', delta: 6, description: '民心+6' }], isHistorical: true },

  // ── 脑洞向 ──
  { id: 'nanyang_colony', name: '南洋拓殖计划', category: 'wildcard', description: '派遣宗室、勋贵率领流民与军队，前往吕宋、爪哇建立殖民地，转移国内矛盾，获取海外资源', status: 'locked', cost: 500, researchTurns: 4, effects: [{ type: 'treasury', target: 'treasury', field: 'gold', delta: 200, description: '海外收益+200' }, { type: 'nation', target: 'all', field: 'peopleMorale', delta: 15, description: '民心+15' }, { type: 'nation', target: 'all', field: 'factionConflict', delta: -20, description: '党争注意力转移' }], requirements: { prerequisitePolicies: ['open_trade', 'shipbuilding'], prestigeMin: 70 }, isHistorical: false },
]
