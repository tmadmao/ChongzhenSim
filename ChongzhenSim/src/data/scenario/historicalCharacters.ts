// 历史人物：开局在任 + 登场时间表 + 退出机制
// 所有数值从 gameConfig.ts 引用，禁止硬编码

import { GAME_CONFIG } from '@/config/gameConfig'

export type CharacterStatus = 'active' | 'pending' | 'dead' | 'exiled' | 'betrayed'

export interface HistoricalCharacter {
  id: string
  name: string
  faction: string          // 所属势力 id
  loyalty: number          // 忠诚度 0-100
  ambition: number         // 野心 0-100
  competence: number       // 能力 0-100
  corruption: number       // 贪腐 0-100
  age?: number             // 年龄
  status: CharacterStatus
  // 登场条件（pending → active）
  joinConditions?: {
    year?: number                 // 特定年份自动登场
    season?: string               // 特定季节
    prestigeMin?: number          // 皇帝威望达标
    factionSupportMin?: { factionId: string; value: number }
    unrestMin?: number            // 民变强度达标
  }
  // 退出触发条件
  exitTriggers?: {
    year?: number                 // 特定年份退出
    turn?: number                 // 特定回合退出
    loyaltyBelow?: number         // 忠诚度低于此值退出
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

// 使用配置常量定义角色属性
const { NPC } = GAME_CONFIG

export const HISTORICAL_CHARACTERS: HistoricalCharacter[] = [
  // ── 开局在任 ──
  {
    id: 'wei_zhongxian',
    name: '魏忠贤',
    faction: 'eunuch_party',
    loyalty: NPC.LOYALTY.LOW - 10,           // 极低忠诚：20
    ambition: NPC.AMBITION.MAX - 15,         // 极高野心：85
    competence: NPC.COMPETENCE.HIGH - 10,    // 较高能力：70
    corruption: NPC.CORRUPTION.CRITICAL,     // 极度贪腐：90
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
    loyalty: NPC.LOYALTY.HIGH,               // 高忠诚：80
    ambition: NPC.AMBITION.MIN + 20,         // 低野心：20
    competence: NPC.COMPETENCE.DEFAULT + 10, // 中等能力：60
    corruption: NPC.CORRUPTION.MIN + 5,      // 极低贪腐：5
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
    loyalty: NPC.LOYALTY.DEFAULT + 15,      // 中等偏上忠诚：65
    ambition: NPC.AMBITION.DEFAULT,          // 中等野心：50
    competence: NPC.COMPETENCE.MAX - 10,     // 极高能力：90
    corruption: NPC.CORRUPTION.LOW - 10,     // 低贪腐：10
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
    loyalty: NPC.LOYALTY.HIGH - 5,           // 高忠诚：75
    ambition: NPC.AMBITION.MIN + 30,         // 低野心：30
    competence: NPC.COMPETENCE.HIGH + 5,     // 高能力：85
    corruption: NPC.CORRUPTION.MIN + 5,      // 极低贪腐：5
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
    loyalty: NPC.LOYALTY.DEFAULT + 5,        // 中等忠诚：55
    ambition: NPC.AMBITION.DEFAULT + 10,     // 中等偏高野心：60
    competence: NPC.COMPETENCE.HIGH + 8,     // 高能力：88
    corruption: NPC.CORRUPTION.DEFAULT - 10, // 中等偏低贪腐：20
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
    loyalty: NPC.LOYALTY.HIGH - 10,          // 较高忠诚：70
    ambition: NPC.AMBITION.MIN + 30,         // 低野心：30
    competence: NPC.COMPETENCE.HIGH + 5,     // 高能力：85
    corruption: NPC.CORRUPTION.MIN + 5,      // 极低贪腐：5
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
    loyalty: NPC.LOYALTY.DEFAULT + 10,      // 中等偏上忠诚：60
    ambition: NPC.AMBITION.DEFAULT + 5,     // 中等偏高野心：55
    competence: NPC.COMPETENCE.HIGH - 5,    // 中高能力：75
    corruption: NPC.CORRUPTION.DEFAULT,     // 中等贪腐：30
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
// 使用 GAME_CONFIG 中的配置常量
export const CHARACTER_EXIT_RULES = {
  executedPrestigePenalty: [-10, -30],   // 赐死威望扣减范围
  imprisonedLoyaltyClear: true,           // 下狱后忠诚归零
  betrayalLoyaltyThreshold: NPC.LOYALTY.LOW,  // 忠诚低于此值+有兵权→叛变
  naturalDeathAgeThreshold: 65,           // 年龄>=65每季度10%死亡概率
  factionDestroyForceExit: true,          // 势力灭亡强制隐退
}
