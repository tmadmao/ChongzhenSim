// 历史人物：开局在任 + 登场时间表 + 退出机制

export type CharacterStatus = 'active' | 'pending' | 'dead' | 'exiled' | 'betrayed'

export interface HistoricalCharacter {
  id: string
  name: string
  faction: string          // 所属势力 id
  loyalty: number          // 忠诚度 0-100
  ambition: number         // 野心 0-100
  competence: number       // 能力 0-100
  corruption: number       // 贪腐 0-100
  status: CharacterStatus
  // 登场条件（pending → active）
  joinConditions?: {
    year?: number                 // 特定年份自动登场
    season?: string               // 特定季节
    prestigeMin?: number          // 皇帝威望达标
    factionSupportMin?: { factionId: string; value: number }
    unrestMin?: number            // 民变强度达标
  }
  // 退出方式
  exitMethods: {
    canBeExecuted: boolean        // 可被赐死
    canBeImprisoned: boolean      // 可被下狱
    canBetrayed: boolean          // 忠诚<30且有兵权时叛变
    naturalDeath: boolean         // 年龄>=65自然死亡
    exitOnFactionDestroy: boolean // 势力灭亡时自动隐退
  }
  exitConsequences: {
    executed?: string[]           // 赐死后果
    betrayed?: string[]           // 叛变后果
  }
}

export const HISTORICAL_CHARACTERS: HistoricalCharacter[] = [
  // ── 开局在任 ──
  {
    id: 'wei_zhongxian',
    name: '魏忠贤',
    faction: 'eunuch_party',
    loyalty: 20,
    ambition: 85,
    competence: 70,
    corruption: 90,
    status: 'active',
    exitMethods: {
      canBeExecuted: true,
      canBeImprisoned: true,
      canBetrayed: false,
      naturalDeath: false,
      exitOnFactionDestroy: true,
    },
    exitConsequences: {
      executed: ['阉党支持度-60', '皇帝威望+15', '东林党好感+20'],
      betrayed: [],
    },
  },
  {
    id: 'wang_chengen',
    name: '王承恩',
    faction: 'emperor_loyalist',
    loyalty: 80,
    ambition: 20,
    competence: 60,
    corruption: 5,
    status: 'active',
    exitMethods: {
      canBeExecuted: false,
      canBeImprisoned: false,
      canBetrayed: false,
      naturalDeath: true,
      exitOnFactionDestroy: false,
    },
    exitConsequences: {},
  },
  // ── 即将登场（1628-1629）──
  {
    id: 'yuan_chonghuan',
    name: '袁崇焕',
    faction: 'guanning_army',
    loyalty: 65,
    ambition: 50,
    competence: 90,
    corruption: 10,
    status: 'pending',
    joinConditions: {
      year: 1628,
      season: 'spring',
      prestigeMin: 50,
    },
    exitMethods: {
      canBeExecuted: true,
      canBeImprisoned: true,
      canBetrayed: false,
      naturalDeath: false,
      exitOnFactionDestroy: true,
    },
    exitConsequences: {
      executed: ['关宁军忠诚度-40', '边患+20', '东林党仇恨+30'],
    },
  },
  {
    id: 'sun_chengzong',
    name: '孙承宗',
    faction: 'donglin',
    loyalty: 75,
    ambition: 30,
    competence: 85,
    corruption: 5,
    status: 'pending',
    joinConditions: {
      year: 1628,
      season: 'summer',
      factionSupportMin: { factionId: 'donglin', value: 40 },
    },
    exitMethods: {
      canBeExecuted: true,
      canBeImprisoned: true,
      canBetrayed: false,
      naturalDeath: true,
      exitOnFactionDestroy: false,
    },
    exitConsequences: {
      executed: ['辽东防线-15', '东林党仇恨+25'],
    },
  },
  {
    id: 'hong_chengchou',
    name: '洪承畴',
    faction: 'military_generals',
    loyalty: 55,
    ambition: 60,
    competence: 88,
    corruption: 20,
    status: 'pending',
    joinConditions: { year: 1629 },
    exitMethods: {
      canBeExecuted: true,
      canBeImprisoned: false,
      canBetrayed: true,
      naturalDeath: false,
      exitOnFactionDestroy: false,
    },
    exitConsequences: {
      betrayed: ['投降后金', '辽东军情泄露', '边患+25'],
    },
  },
  {
    id: 'lu_xiangsheng',
    name: '卢象升',
    faction: 'military_generals',
    loyalty: 70,
    ambition: 30,
    competence: 85,
    corruption: 5,
    status: 'pending',
    joinConditions: {
      year: 1629,
      unrestMin: 40,
    },
    exitMethods: {
      canBeExecuted: false,
      canBeImprisoned: false,
      canBetrayed: false,
      naturalDeath: false,
      exitOnFactionDestroy: false,
    },
    exitConsequences: {
      executed: [],
    },
  },
  {
    id: 'yang_sichang',
    name: '杨嗣昌',
    faction: 'civil_officials',
    loyalty: 60,
    ambition: 55,
    competence: 75,
    corruption: 30,
    status: 'pending',
    joinConditions: { year: 1629 },
    exitMethods: {
      canBeExecuted: true,
      canBeImprisoned: true,
      canBetrayed: false,
      naturalDeath: true,
      exitOnFactionDestroy: false,
    },
    exitConsequences: {},
  },
]

// 人物通用退出规则（供 characterSystem 直接使用）
export const CHARACTER_EXIT_RULES = {
  executedPrestigePenalty: [-10, -30],   // 赐死威望扣减范围
  imprisonedLoyaltyClear: true,           // 下狱后忠诚归零
  betrayalLoyaltyThreshold: 30,           // 忠诚低于此值+有兵权→叛变
  naturalDeathAgeThreshold: 65,           // 年龄>=65每季度10%死亡概率
  factionDestroyForceExit: true,          // 势力灭亡强制隐退
}
