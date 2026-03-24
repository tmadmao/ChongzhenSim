// 固定剧本事件：开局必触发 + 1628年必触发 + 事件中断规则

import type { GameEffect } from '@/core/types'

export type EventStatus = 'pending' | 'active' | 'completed' | 'failed' | 'locked'
export type EventPriority = 'urgent' | 'important' | 'normal'

export interface ScriptedEvent {
  id: string
  title: string
  description: string
  priority: EventPriority
  status: EventStatus
  // 触发条件
  triggerConditions: {
    autoTrigger?: boolean             // 自动触发（开局即触发）
    year?: number
    season?: string
    characterPresent?: string         // 需要某人物在任
    factionActive?: string            // 需要某势力存在
    prestigeMin?: number
    peopleMoraleMax?: number          // 民心低于此值
    unrestMin?: number
    factionSupportMin?: { factionId: string; value: number }
  }
  // 选项
  choices: {
    id: string
    text: string
    hint: string                      // 暗示结果
    effects: GameEffect[]
    // 选择此项后锁死的事件
    locksEvents?: string[]
    // 选择此项后开启的事件
    unlocksEvents?: string[]
  }[]
  // 立即效果（不管选哪项都触发）
  immediateEffects?: GameEffect[]
  // 中断条件
  interruptConditions?: {
    characterDead?: string            // 关键人物死亡→强制失败
    factionDestroyed?: string         // 势力灭亡→永久关闭
    turnsWithoutAction?: number       // 超过N季度未处理→自动恶化
  }
  interruptConsequences?: GameEffect[]
  // 自动恶化效果（超时未处理）
  escalationEffects?: GameEffect[]
}

export const SCRIPTED_EVENTS: ScriptedEvent[] = [
  // ── 开局自动触发（1627冬）──
  {
    id: 'tianqi_death',
    title: '天启驾崩，崇祯即位',
    description: '天启七年八月，熹宗朱由校驾崩，信王朱由检即位，是为崇祯皇帝。新皇登基，人心惶惶，阉党把持朝政，局势危如累卵。',
    priority: 'urgent',
    status: 'pending',
    triggerConditions: { autoTrigger: true },
    choices: [
      {
        id: 'high_profile',
        text: '高调即位，昭告天下革除弊政',
        hint: '威望大涨，但阉党警觉',
        effects: [
          { type: 'nation', target: 'emperor', field: 'prestige', delta: 20, description: '威望+20' },
          { type: 'minister', target: 'eunuch_party', field: 'support', delta: -15, description: '阉党警惕' },
        ],
        unlocksEvents: ['purge_eunuch_party'],
      },
      {
        id: 'low_profile',
        text: '韬光养晦，暗中观察',
        hint: '稳妥但错失先机',
        effects: [
          { type: 'nation', target: 'emperor', field: 'prestige', delta: 5, description: '威望小涨' },
        ],
      },
    ],
    immediateEffects: [],
  },
  {
    id: 'deal_with_wei',
    title: '处置魏忠贤',
    description: '魏忠贤把持朝政多年，党羽遍布朝野。新皇即位，如何处置此人，将决定未来政局走向。',
    priority: 'urgent',
    status: 'pending',
    triggerConditions: {
      autoTrigger: true,
      characterPresent: 'wei_zhongxian',
    },
    choices: [
      {
        id: 'execute',
        text: '立即赐死，清除阉党',
        hint: '阉党覆灭，东林党上台，但朝局震荡',
        effects: [
          { type: 'nation', target: 'emperor', field: 'prestige', delta: 15, description: '威望+15' },
          { type: 'minister', target: 'eunuch_party', field: 'support', delta: -60, description: '阉党瓦解' },
          { type: 'minister', target: 'donglin', field: 'support', delta: 25, description: '东林党得势' },
        ],
        locksEvents: ['eunuch_party_comeback'],
      },
      {
        id: 'exile',
        text: '流放凤阳，留其性命',
        hint: '较为温和，但阉党仍有复辟可能',
        effects: [
          { type: 'nation', target: 'emperor', field: 'prestige', delta: 8, description: '威望小涨' },
          { type: 'minister', target: 'eunuch_party', field: 'support', delta: -30, description: '阉党失势' },
        ],
      },
      {
        id: 'keep',
        text: '暂时留用，以作制衡',
        hint: '党争加剧，但可借助阉党制约文官',
        effects: [
          { type: 'nation', target: 'factionConflict', field: 'factionConflict', delta: 15, description: '党争+15' },
          { type: 'minister', target: 'donglin', field: 'support', delta: -15, description: '东林党愤怒' },
        ],
        unlocksEvents: ['eunuch_party_rebellion'],
      },
    ],
    interruptConditions: {
      characterDead: 'wei_zhongxian',
    },
  },
  {
    id: 'shaanxi_drought',
    title: '陕西初旱',
    description: '陕西连年干旱，流民四起，饿殍遍野。各地官员纷纷上疏告急，请求朝廷赈灾。',
    priority: 'important',
    status: 'pending',
    triggerConditions: { autoTrigger: true },
    choices: [
      {
        id: 'relief',
        text: '拨银赈灾，安抚灾民',
        hint: '花费国库，但可遏制民变',
        effects: [
          { type: 'treasury', target: 'treasury', field: 'gold', delta: -50, description: '赈灾花费-50万两' },
          { type: 'nation', target: 'all', field: 'peopleMorale', delta: 10, description: '民心+10' },
          { type: 'province', target: 'shaanxi', field: 'civilUnrest', delta: -20, description: '陕西民乱-20' },
        ],
        locksEvents: ['shaanxi_uprising_early'],
      },
      {
        id: 'ignore',
        text: '国库空虚，暂缓赈灾',
        hint: '节省开支，但民变风险大增',
        effects: [
          { type: 'nation', target: 'all', field: 'peopleMorale', delta: -10, description: '民心-10' },
          { type: 'province', target: 'shaanxi', field: 'civilUnrest', delta: 20, description: '陕西民乱+20' },
        ],
        unlocksEvents: ['shaanxi_uprising_early', 'bandits_gao_joins'],
      },
    ],
    escalationEffects: [
      { type: 'province', target: 'shaanxi', field: 'civilUnrest', delta: 15, description: '超时未处理，陕西局势恶化' },
    ],
    interruptConditions: { turnsWithoutAction: 2 },
  },

  // ── 1628年必触发事件 ──
  {
    id: 'purge_eunuch_party',
    title: '阉党清算',
    description: '魏忠贤伏诛后，其党羽仍盘踞朝野。如何彻底清算阉党，是稳固皇权的关键一步。',
    priority: 'important',
    status: 'locked',  // 由 deal_with_wei 的 execute 选项解锁
    triggerConditions: {
      year: 1628,
      factionActive: 'eunuch_party',
    },
    choices: [
      {
        id: 'thorough',
        text: '彻底清算，一网打尽',
        hint: '阉党永久灭亡，但朝局震荡',
        effects: [
          { type: 'minister', target: 'eunuch_party', field: 'support', delta: -100, description: '阉党灭亡' },
          { type: 'nation', target: 'emperor', field: 'prestige', delta: -10, description: '震荡损威望' },
        ],
      },
      {
        id: 'partial',
        text: '清除首恶，保留中间派',
        hint: '稳妥，保留部分文官体系',
        effects: [
          { type: 'minister', target: 'eunuch_party', field: 'support', delta: -50, description: '阉党大幅失势' },
          { type: 'nation', target: 'emperor', field: 'prestige', delta: 5, description: '威望小涨' },
        ],
      },
    ],
    interruptConditions: {
      factionDestroyed: 'eunuch_party',
    },
  },
  {
    id: 'yuan_chonghuan_meeting',
    title: '袁崇焕平台召对',
    description: '崇祯元年春，袁崇焕入京觐见。此人曾以"五年平辽"豪言震动朝野，今日召对，是否重用，将决定辽东战略走向。',
    priority: 'important',
    status: 'pending',
    triggerConditions: {
      year: 1628,
      season: 'spring',
      characterPresent: 'yuan_chonghuan',
      prestigeMin: 50,
    },
    choices: [
      {
        id: 'appoint',
        text: '委以重任，督师辽东',
        hint: '关宁军战力大增，但承诺难以兑现',
        effects: [
          { type: 'minister', target: 'guanning_army', field: 'support', delta: 20, description: '关宁军士气大振' },
          { type: 'nation', target: 'all', field: 'borderThreat', delta: -10, description: '边患压力减轻' },
        ],
        unlocksEvents: ['yuan_chonghuan_execution_risk'],
      },
      {
        id: 'reject',
        text: '不予重用，留京闲置',
        hint: '辽东压力持续，错失良将',
        effects: [
          { type: 'nation', target: 'all', field: 'borderThreat', delta: 15, description: '关外压力增大' },
          { type: 'minister', target: 'guanning_army', field: 'support', delta: -10, description: '关宁军失望' },
        ],
      },
    ],
    interruptConditions: {
      characterDead: 'yuan_chonghuan',
    },
  },
]

// 事件通用中断规则
export const EVENT_INTERRUPT_RULES = {
  characterDeathForceFail: true,   // 关键人物死亡→强制失败，扣威望/民心
  factionDestroyLockEvent: true,   // 势力灭亡→事件永久关闭
  autoEscalationTurns: 1,          // 超过N季度未处理→自动恶化
  prestigePenaltyOnFail: [-10, -30], // 事件失败威望惩罚范围
}
