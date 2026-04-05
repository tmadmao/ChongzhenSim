/**
 * 朝会剧本模板
 *
 * 使用说明:
 * 1. 复制此文件，重命名为 turnXScript.ts (X为回合数)
 * 2. 填充 TURN_X_SCRIPT 中的奏折
 * 3. 填充 TURN_X_META 元数据
 * 4. 在 src/systems/scenarioEngine.ts 中注册此剧本
 *
 * 参考文档:
 * - 完整文档: docs/scenario-framework.md
 * - 快速参考: docs/scenario-quick-reference.md
 */

import type { CourtMemorial, MemorialChoice } from '@/core/types'
import type { GameEffect } from '@/api/schemas'

// ============================================================================
// 奏折定义
// ============================================================================

export const TURN_X_SCRIPT: CourtMemorial[] = [
  // --------------------------------------------------------------------------
  // 奏折 1: [填写奏折主题]
  // --------------------------------------------------------------------------
  {
    id: 'memorial_1',  // 唯一标识
    ministerId: 'minister_id',  // 引用 characters.json 中的ID
    ministerName: '大臣姓名',
    faction: 'donglin',  // donglin | eunuch_party | neutral | conservative
    urgency: 'urgent',  // urgent | important | normal
    subject: '奏折主题（简短有力）',
    content: `奏折详细内容，包含：
- 背景：描述问题产生的背景和历史
- 现状：描述当前的状况
- 问题：明确指出需要解决的问题
- 请求：大臣希望皇帝做什么

示例：
臣[大臣名]奏报：[背景描述]。然[现状描述]。若不及时处理，恐[后果]。恳请陛下[具体请求]。`,
    choices: [
      // 选项 1: 激进方案
      {
        id: 'choice_1_1',
        text: '选项文本（简洁有力）',
        hint: '选项提示（暗示主要后果，避免剧透）',
        effects: [
          // 效果类型: treasury | province | nation | minister
          { type: 'treasury', target: 'treasury', field: 'gold', value: -1000, mode: 'delta' },
          { type: 'nation', target: 'emperor', field: 'prestige', value: 15, mode: 'delta' },
          // 更多效果...
        ],
        unlocksEventIds: ['event_a'],  // 解锁后续事件
        locksEventIds: ['event_b'],    // 锁定后续事件
      },
      // 选项 2: 温和方案
      {
        id: 'choice_1_2',
        text: '选项文本',
        hint: '选项提示',
        effects: [
          // 效果数组...
        ],
      },
      // 选项 3: 保守方案
      {
        id: 'choice_1_3',
        text: '选项文本',
        hint: '选项提示',
        effects: [
          // 效果数组...
        ],
      },
    ],
    immediateEffects: [
      // 无论选什么都会触发的效果
      { type: 'nation', target: 'emperor', field: 'prestige', value: 5, mode: 'delta' },
    ],
  },

  // --------------------------------------------------------------------------
  // 奏折 2: [填写奏折主题]
  // --------------------------------------------------------------------------
  {
    id: 'memorial_2',
    ministerId: 'minister_id_2',
    ministerName: '大臣姓名2',
    faction: 'faction_name',
    urgency: 'important',
    subject: '奏折主题',
    content: '奏折详细内容...',
    choices: [
      {
        id: 'choice_2_1',
        text: '选项文本',
        hint: '选项提示',
        effects: [
          // 效果数组...
        ],
      },
      // 更多选项...
    ],
  },

  // --------------------------------------------------------------------------
  // 奏折 3: [填写奏折主题]
  // --------------------------------------------------------------------------
  {
    id: 'memorial_3',
    ministerId: 'minister_id_3',
    ministerName: '大臣姓名3',
    faction: 'faction_name',
    urgency: 'normal',
    subject: '奏折主题',
    content: '奏折详细内容...',
    choices: [
      {
        id: 'choice_3_1',
        text: '选项文本',
        hint: '选项提示',
        effects: [
          // 效果数组...
        ],
      },
      // 更多选项...
    ],
  },

  // 添加更多奏折...
]

// ============================================================================
// 元数据定义
// ============================================================================

export const TURN_X_META = {
  turn: 1,  // 回合数
  date: '1627年冬',  // 游戏日期
  sessionTitle: '朝会标题（如：崇祯元年初次朝会）',
  openingNarration: `开场旁白（可选）：
- 描述当前的历史背景
- 交代朝会的主要议题
- 营造氛围

示例：
天启七年冬，信王朱由检登基，是为崇祯。朝野震动，阉党把持，外有后金虎视，内有民怨沸腾，大明江山危如累卵。新皇召集群臣，共商国是。`,
  closingNarration: `结局旁白（可选）：
- 总结朝会的结果
- 暗示后续的发展方向
- 营造悬念

示例：
朝会结束，朝野震动。魏忠贤已除，东林党得势，但党争更甚。崇祯帝望着殿外阴云密布的天空，不知大明江山将走向何方。`,
  maxMemorials: 3,  // 本回合最大奏折数量
  mode: 'historical',  // historical | sandbox
}

// ============================================================================
// 效果类型参考
// ============================================================================

/*
GameEffect 类型说明:

1. Treasury (国库)
   { type: 'treasury', target: 'treasury', field: 'gold', value: -1000, mode: 'delta' }
   - field: gold (金银数量)
   - mode: delta (增量) | set (设置绝对值)

2. Province (省份)
   { type: 'province', target: 'shaanxi', field: 'civilUnrest', value: -20, mode: 'delta' }
   - target: 省份ID (shaanxi, beijing, liaodong 等)
   - field: civilUnrest (民乱) | taxRate (税率) | prosperity (繁荣度) | population (人口)

3. Nation (国家)
   { type: 'nation', target: 'emperor', field: 'prestige', value: 20, mode: 'delta' }
   { type: 'nation', target: 'all', field: 'peopleMorale', value: 10, mode: 'delta' }
   - target: emperor (皇帝) | all (全局)
   - field: prestige (威望) | peopleMorale (民心) | factionConflict (党争)

4. Minister (大臣/派系)
   { type: 'minister', target: 'donglin', field: 'support', value: 25, mode: 'delta' }
   { type: 'minister', target: 'wei_zhongxian', field: 'loyalty', value: -30, mode: 'delta' }
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
// 注册剧本
// ============================================================================

/*
在 src/systems/scenarioEngine.ts 中添加:

import { TURN_X_SCRIPT } from '@/data/scenario/turnXScript'

export function loadScriptForTurn(turn: number): CourtMemorial[] {
  switch (turn) {
    case 1: return DAY1_SCRIPT
    case X: return TURN_X_SCRIPT  // 添加你的剧本
    default: return generateDynamicMemorials(turn)
  }
}
*/
