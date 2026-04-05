/**
 * 剧本事件模板
 *
 * 使用说明:
 * 1. 复制此文件中的事件定义
 * 2. 粘贴到 src/data/scenario/scriptedEvents.ts 的 SCRIPTED_EVENTS 数组中
 * 3. 修改事件内容、选项和效果
 * 4. 设置适当的触发条件
 *
 * 参考文档:
 * - 完整文档: docs/scenario-framework.md
 * - 快速参考: docs/scenario-quick-reference.md
 */

// ============================================================================
// 事件状态说明
// ============================================================================

/*
EventStatus:
- pending: 等待触发
- active: 已触发，等待玩家选择
- completed: 已处理完成
- failed: 处理失败（关键人物死亡等）
- locked: 永久锁定（已被玩家选择排除）
- escalated: 升级到更严重的事件
*/

// ============================================================================
// 基础事件模板
// ============================================================================

export const SCRIPTED_EVENT_TEMPLATE = {
  id: 'event_xxx',  // 事件唯一标识（使用下划线命名）
  title: '事件标题（简洁有力）',
  description: `事件描述，包含：
- 背景：描述事件产生的背景
- 现状：描述当前的状况
- 问题：明确指出需要解决的问题
- 影响：说明不处理的后果

示例：
陕西连年干旱，赤地千里，流民四起，饿殍遍野。各地官员纷纷上疏告急，请求朝廷赈灾。若不及时处理，恐生民变。`,
  priority: 'urgent',  // urgent | important | normal
  status: 'pending',  // pending | active | completed | failed | locked | escalated

  // -------------------------------------------------------------------------
  // 触发条件（两种方式，任选其一）
  // -------------------------------------------------------------------------

  // 方式1: 静态触发条件
  triggerConditions: {
    autoTrigger: true,  // 开局自动触发
    // year: 1628,  // 触发年份
    // season: '春',  // 触发季节
    // characterPresent: 'wei_zhongxian',  // 需要某人物在任
    // factionActive: 'donglin',  // 需要某势力存在
    // prestigeMin: 50,  // 威望最小值
    // peopleMoraleMax: 60,  // 民心最大值（低于此触发）
    // unrestMin: 30,  // 动荡最小值
    // factionSupportMin: { factionId: 'donglin', value: 40 },  // 派系支持度最小值
  },

  // 方式2: 动态触发条件函数（推荐用于复杂条件）
  // triggerCondition: (state: GameState) => {
  //   return state.nation.emperor.prestige > 50 &&
  //          state.nation.peopleMorale < 60 &&
  //          state.provinces.shaanxi.civilUnrest > 20
  // },

  // -------------------------------------------------------------------------
  // 事件升级配置（可选）
  // -------------------------------------------------------------------------
  escalation: {
    check: (state: GameState) => {
      // 检查是否应该升级到更严重的事件
      return state.provinces.shaanxi.civilUnrest > 50
    },
    nextEventId: 'escalated_event_id',  // 升级后的事件ID
  },

  // -------------------------------------------------------------------------
  // 选项
  // -------------------------------------------------------------------------
  choices: [
    {
      id: 'choice_1',
      text: '选项文本（简洁有力）',
      hint: '选项提示（暗示主要后果，避免剧透）',
      effects: [
        // OptionEffect 类型
        // 使用直接数值
        { type: 'nation', target: 'emperor', field: 'prestige', value: 20, mode: 'delta', description: '威望+20' },
        { type: 'nation', target: 'all', field: 'peopleMorale', value: 10, mode: 'delta', description: '民心+10' },
        { type: 'treasury', target: 'treasury', field: 'gold', value: -5000, mode: 'delta', description: '花费5000两' },
        // 使用 configKey 引用配置文件中的常量
        // { type: 'treasury', target: 'treasury', field: 'gold', configKey: 'RELIEF_COST_BASE', mode: 'delta', description: '赈灾花费' },
      ],
      unlocksEvents: ['event_a'],  // 解锁后续事件
      locksEvents: ['event_b'],    // 锁定后续事件
    },
    {
      id: 'choice_2',
      text: '选项文本',
      hint: '选项提示',
      effects: [
        // 效果数组...
      ],
    },
    {
      id: 'choice_3',
      text: '选项文本',
      hint: '选项提示',
      effects: [
        // 效果数组...
      ],
    },
  ],

  // -------------------------------------------------------------------------
  // 立即效果（无论选什么都会触发）
  // -------------------------------------------------------------------------
  immediateEffects: [
    { type: 'nation', target: 'emperor', field: 'prestige', value: 5, mode: 'delta', description: '威望+5' },
  ],

  // -------------------------------------------------------------------------
  // 中断条件（可选）
  // -------------------------------------------------------------------------
  interruptConditions: {
    characterDead: 'character_id',  // 关键人物死亡 → 强制失败
    factionDestroyed: 'faction_id',  // 势力灭亡 → 永久关闭
    turnsWithoutAction: 2,  // 超过2季度未处理 → 自动恶化
  },

  // -------------------------------------------------------------------------
  // 中断后的后果
  // -------------------------------------------------------------------------
  interruptConsequences: [
    { type: 'nation', target: 'emperor', field: 'prestige', value: -10, mode: 'delta', description: '威望-10' },
    { type: 'nation', target: 'all', field: 'peopleMorale', value: -20, mode: 'delta', description: '民心-20' },
  ],

  // -------------------------------------------------------------------------
  // 自动恶化效果（超时未处理）
  // -------------------------------------------------------------------------
  escalationEffects: [
    { type: 'province', target: 'shaanxi', field: 'civilUnrest', value: 15, mode: 'delta', description: '陕西局势恶化' },
  ],
}

// ============================================================================
// 事件类型参考
// ============================================================================

/*
OptionEffect 类型说明:

1. Treasury (国库)
   { type: 'treasury', target: 'treasury', field: 'gold', value: -1000, mode: 'delta', description: '说明文本' }
   { type: 'treasury', target: 'treasury', field: 'gold', configKey: 'RELIEF_COST_BASE', mode: 'delta', description: '赈灾花费' }
   - field: gold (金银数量)
   - mode: delta (增量) | set (设置绝对值)
   - value: 直接数值
   - configKey: 引用 gameConfig.ts 中的常量

2. Province (省份)
   { type: 'province', target: 'shaanxi', field: 'civilUnrest', value: -20, mode: 'delta', description: '陕西民乱-20' }
   - target: 省份ID (shaanxi, beijing, liaodong 等)
   - field: civilUnrest (民乱) | taxRate (税率) | prosperity (繁荣度) | population (人口)

3. Nation (国家)
   { type: 'nation', target: 'emperor', field: 'prestige', value: 20, mode: 'delta', description: '威望+20' }
   { type: 'nation', target: 'all', field: 'peopleMorale', value: 10, mode: 'delta', description: '民心+10' }
   - target: emperor (皇帝) | all (全局)
   - field: prestige (威望) | peopleMorale (民心) | factionConflict (党争)

4. Minister (大臣/派系)
   { type: 'minister', target: 'donglin', field: 'support', value: 25, mode: 'delta', description: '东林党支持度+25' }
   - target: 派系ID (donglin, eunuch_party) 或 大臣ID
   - field: support (支持度) | loyalty (忠诚度) | ability (能力值)
*/

// ============================================================================
// 效果数值参考
// ============================================================================

/*
威望:
- 重大决策: 20
- 重要决策: 15
- 一般决策: 8
- 细微影响: 5

派系支持度:
- 完全倒向: 25
- 明显支持: 15
- 略微支持: 8
- 彻底决裂: -60
- 明显削弱: -30
- 略微不满: -15

民心:
- 重大事件: ±15
- 重要事件: ±10
- 一般事件: ±5

民乱:
- 严重动乱: ±20
- 明显动乱: ±15
- 轻微动乱: ±10

财政:
- 重大支出: -5000
- 一般支出: -3000
- 小额支出: -1000
*/

// ============================================================================
// 使用示例
// ============================================================================

export const EXAMPLE_EVENTS: ScriptedEvent[] = [
  // -------------------------------------------------------------------------
  // 示例1: 自动触发的事件
  // -------------------------------------------------------------------------
  {
    id: 'example_auto_trigger',
    title: '示例：自动触发事件',
    description: '这是一个开局自动触发的事件示例。',
    priority: 'urgent',
    status: 'pending',
    triggerConditions: {
      autoTrigger: true,
    },
    choices: [
      {
        id: 'choice_a',
        text: '选项A',
        hint: '威望大涨，但花费国库',
        effects: [
          { type: 'nation', target: 'emperor', field: 'prestige', value: 20, mode: 'delta', description: '威望+20' },
          { type: 'treasury', target: 'treasury', field: 'gold', value: -5000, mode: 'delta', description: '花费5000两' },
        ],
      },
      {
        id: 'choice_b',
        text: '选项B',
        hint: '威望小涨，节省开支',
        effects: [
          { type: 'nation', target: 'emperor', field: 'prestige', value: 5, mode: 'delta', description: '威望+5' },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 示例2: 条件触发的事件
  // -------------------------------------------------------------------------
  {
    id: 'example_conditional',
    title: '示例：条件触发事件',
    description: '这是一个根据游戏状态触发的事件示例。',
    priority: 'important',
    status: 'pending',
    triggerCondition: (state: GameState) => {
      // 民心低于60且威望高于50时触发
      return state.nation.peopleMorale < 60 && state.nation.emperor.prestige > 50
    },
    choices: [
      {
        id: 'choice_a',
        text: '安抚民心',
        hint: '花费国库，提升民心',
        effects: [
          { type: 'nation', target: 'all', field: 'peopleMorale', value: 15, mode: 'delta', description: '民心+15' },
          { type: 'treasury', target: 'treasury', field: 'gold', value: -3000, mode: 'delta', description: '花费3000两' },
        ],
      },
      {
        id: 'choice_b',
        text: '暂不理会',
        hint: '节省开支，但民心下降',
        effects: [
          { type: 'nation', target: 'all', field: 'peopleMorale', value: -10, mode: 'delta', description: '民心-10' },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 示例3: 可升级的事件
  // -------------------------------------------------------------------------
  {
    id: 'example_escalatable',
    title: '示例：可升级事件',
    description: '这是一个可以升级到更严重事件的事件示例。',
    priority: 'important',
    status: 'pending',
    triggerConditions: {
      year: 1628,
      season: '春',
    },
    escalation: {
      check: (state: GameState) => {
        // 民乱超过50时升级
        return state.provinces.shaanxi.civilUnrest > 50
      },
      nextEventId: 'example_escalated',
    },
    escalationEffects: [
      { type: 'province', target: 'shaanxi', field: 'civilUnrest', value: 15, mode: 'delta', description: '陕西局势恶化' },
    ],
    choices: [
      {
        id: 'choice_a',
        text: '立即处理',
        hint: '花费国库，稳定局势',
        effects: [
          { type: 'province', target: 'shaanxi', field: 'civilUnrest', value: -30, mode: 'delta', description: '陕西民乱-30' },
          { type: 'treasury', target: 'treasury', field: 'gold', value: -5000, mode: 'delta', description: '花费5000两' },
        ],
      },
      {
        id: 'choice_b',
        text: '暂缓处理',
        hint: '节省开支，但局势恶化',
        effects: [
          { type: 'province', target: 'shaanxi', field: 'civilUnrest', value: 15, mode: 'delta', description: '陕西民乱+15' },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 示例4: 有分支的事件链
  // -------------------------------------------------------------------------
  {
    id: 'example_branch',
    title: '示例：分支事件',
    description: '这是一个有分支路径的事件示例。',
    priority: 'urgent',
    status: 'locked',  // 初始状态为 locked，需要解锁
    choices: [
      {
        id: 'choice_a',
        text: '选择路线A',
        hint: '解锁事件A，锁定事件B',
        effects: [
          { type: 'nation', target: 'emperor', field: 'prestige', value: 10, mode: 'delta', description: '威望+10' },
        ],
        unlocksEvents: ['example_event_a'],
        locksEvents: ['example_event_b'],
      },
      {
        id: 'choice_b',
        text: '选择路线B',
        hint: '解锁事件B，锁定事件A',
        effects: [
          { type: 'nation', target: 'emperor', field: 'prestige', value: 10, mode: 'delta', description: '威望+10' },
        ],
        unlocksEvents: ['example_event_b'],
        locksEvents: ['example_event_a'],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 示例5: 可被中断的事件
  // -------------------------------------------------------------------------
  {
    id: 'example_interruptible',
    title: '示例：可中断事件',
    description: '这是一个可被外部因素中断的事件示例。',
    priority: 'important',
    status: 'pending',
    triggerConditions: {
      characterPresent: 'important_character',
    },
    interruptConditions: {
      characterDead: 'important_character',  // 关键人物死亡时中断
      turnsWithoutAction: 2,  // 超过2季度未处理时中断
    },
    interruptConsequences: [
      { type: 'nation', target: 'emperor', field: 'prestige', value: -10, mode: 'delta', description: '威望-10' },
    ],
    choices: [
      {
        id: 'choice_a',
        text: '立即处理',
        hint: '稳定局势',
        effects: [
          { type: 'nation', target: 'all', field: 'peopleMorale', value: 10, mode: 'delta', description: '民心+10' },
        ],
      },
    ],
  },
]

// ============================================================================
// 添加事件到 scriptedEvents.ts
// ============================================================================

/*
1. 打开 src/data/scenario/scriptedEvents.ts
2. 找到 SCRIPTED_EVENTS 数组
3. 将你的事件添加到数组中

示例:

import { ScriptedEvent } from './types'

export const SCRIPTED_EVENTS: ScriptedEvent[] = [
  // 现有事件...
  {
    id: 'your_event_id',
    title: '你的事件标题',
    description: '事件描述...',
    // ... 其他字段
  },
  // 更多事件...
]
*/
