# 崇祯帝国 - 剧本框架文档

## 目录

1. [系统概述](#系统概述)
2. [快速开始](#快速开始)
3. [朝会系统 (CourtSystem)](#朝会系统-courtsystem)
4. [剧本事件系统 (ScriptedEventSystem)](#剧本事件系统-scriptedeventsystem)
5. [效果系统](#效果系统)
6. [分支与结局](#分支与结局)
7. [最佳实践](#最佳实践)
8. [完整示例](#完整示例)

---

## 系统概述

崇祯帝国使用两种互补的剧本系统：

### 1. 朝会系统 (CourtSystem)
- **用途**：处理朝会场景，包括大臣上奏、皇帝决策
- **特点**：戏剧性流程（太监宣旨 → 大臣依次发言 → 皇帝决策 → 结果展示）
- **文件位置**：`src/data/scenario/day1Script.ts`
- **使用场景**：定期朝会、重大政策讨论、人事任免

### 2. 剧本事件系统 (ScriptedEventSystem)
- **用途**：处理游戏中的固定事件、随机事件
- **特点**：触发条件灵活，支持事件升级、中断、连锁
- **文件位置**：`src/data/scenario/scriptedEvents.ts`
- **使用场景**：历史事件、自然灾害、突发事件、政策后果

---

## 快速开始

### 第一步：创建剧本文件

#### 朝会剧本
在 `src/data/scenario/` 下创建 `turnXScript.ts`：
```typescript
import type { CourtMemorial, MemorialChoice } from '@/core/types'
import type { GameEffect } from '@/api/schemas'

export const TURN_X_SCRIPT: CourtMemorial[] = [
  // 奏折 1
  {
    id: 'memorial_1',
    ministerId: 'minister_id',
    ministerName: '大臣姓名',
    faction: '派系',
    urgency: 'urgent',  // 'urgent' | 'important' | 'normal'
    subject: '奏折主题',
    content: '奏折详细内容，描述问题背景、现状、请求...',
    choices: [
      // 选项 1
      {
        id: 'choice_1',
        text: '选项文本',
        hint: '选项提示（暗示结果）',
        effects: [
          { type: 'treasury', target: 'treasury', field: 'gold', value: -1000, mode: 'delta' }
        ],
        unlocksEventIds: ['event_2'],  // 解锁后续事件
        locksEventIds: ['event_3'],    // 锁定后续事件
      },
      // 更多选项...
    ],
    immediateEffects: [  // 无论选什么都会触发的效果
      { type: 'nation', target: 'emperor', field: 'prestige', value: 5, mode: 'delta' }
    ],
  },
  // 更多奏折...
]

export const TURN_X_META = {
  turn: 1,
  date: '1627年冬',
  sessionTitle: '崇祯元年初次朝会',
  openingNarration: '天启七年冬，信王朱由检登基...',
  closingNarration: '朝会结束，朝野震动...',
  maxMemorials: 3,
  mode: 'historical',  // 'historical' | 'sandbox'
}
```

#### 剧本事件
在 `src/data/scenario/scriptedEvents.ts` 的 `SCRIPTED_EVENTS` 数组中添加：
```typescript
{
  id: 'event_id',
  title: '事件标题',
  description: '事件描述，说明背景和现状...',
  priority: 'urgent',  // 'urgent' | 'important' | 'normal'
  status: 'pending',
  triggerConditions: {
    autoTrigger: true,  // 开局自动触发
    // 或使用动态条件
    year: 1628,
    season: '春',
    characterPresent: 'character_id',
  },
  choices: [
    {
      id: 'choice_1',
      text: '选项文本',
      hint: '选项提示',
      effects: [
        { type: 'nation', target: 'emperor', field: 'prestige', value: 20, mode: 'delta' }
      ],
      unlocksEvents: ['event_2'],
      locksEvents: ['event_3'],
    },
  ],
  immediateEffects: [],  // 无论选什么都会触发
  interruptConditions: {
    characterDead: 'character_id',
    turnsWithoutAction: 2,
  },
  interruptConsequences: [],  // 中断后的后果
  escalationEffects: [],  // 超时未处理自动恶化
}
```

### 第二步：注册剧本

朝会剧本需要修改 `src/systems/scenarioEngine.ts`，在 `loadScriptForTurn` 函数中添加：
```typescript
export function loadScriptForTurn(turn: number): CourtMemorial[] {
  switch (turn) {
    case 1: return DAY1_SCRIPT
    case 2: return DAY2_SCRIPT  // 添加你的剧本
    default: return generateDynamicMemorials(turn)
  }
}
```

### 第三步：测试运行

在游戏中触发对应回合，检查：
- [ ] 奏折/事件是否正确加载
- [ ] 选项是否显示正确
- [ ] 选择后效果是否生效
- [ ] 分支/解锁/锁定是否按预期工作

---

## 朝会系统 (CourtSystem)

### 核心概念

朝会是崇祯帝国的核心玩法之一，玩家在朝会中处理大臣上奏的各种事务。

### 奏折结构 (CourtMemorial)

```typescript
interface CourtMemorial {
  id: string                    // 奏折唯一标识
  ministerId: string            // 大臣ID（引用 characters.json）
  ministerName: string          // 大臣显示名称
  faction: string               // 所属派系（东林党/阉党/中立等）
  urgency: 'urgent' | 'important' | 'normal'  // 紧急度
  subject: string               // 奏折主题
  content: string               // 奏折详细内容
  choices: MemorialChoice[]     // 可选选项
  immediateEffects?: GameEffect[]  // 立即效果（无论选什么）
}
```

### 选项结构 (MemorialChoice)

```typescript
interface MemorialChoice {
  id: string                    // 选项唯一标识
  text: string                  // 选项显示文本
  hint: string                  // 选项提示（暗示结果）
  effects: GameEffect[]         // 选择后的效果
  unlocksEventIds?: string[]    // 解锁后续事件ID
  locksEventIds?: string[]      // 锁定后续事件ID
}
```

### 朝会流程

```
┌─────────────────┐
│   朝会入场      │
│   (CourtEntrance)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   开场仪式      │
│   (CourtOpening)│
│  太监宣旨       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   大臣讨论      │
│(CourtDiscussion)│
│  依次发言       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   皇帝决策      │
│ (CourtDecision) │
│  选择选项       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   结果总结      │
│ (CourtSummary)  │
│  显示效果       │
└─────────────────┘
```

### 大臣讨论生成

系统会自动为每个奏折生成大臣讨论对话，基于：
- 奏折的紧急度（urgent 会引发更多讨论）
- 大臣的派系立场（东林党 vs 阉党）
- 大臣的忠诚度和能力值

讨论会显示 1-3 位大臣的发言，玩家可以快速了解不同派系的观点。

### 元数据 (ScriptMeta)

每个朝会剧本需要元数据：

```typescript
interface ScriptMeta {
  turn: number                   // 回合数
  date: string                   // 游戏日期（如 "1627年冬"）
  sessionTitle: string           // 朝会标题
  openingNarration?: string      // 开场旁白
  closingNarration?: string      // 结局旁白
  maxMemorials?: number          // 最大奏折数量（默认3）
  mode?: 'historical' | 'sandbox'  // 游戏模式
}
```

---

## 剧本事件系统 (ScriptedEventSystem)

### 核心概念

剧本事件是游戏中的固定或条件触发的事件，支持复杂的触发逻辑和后果链条。

### 事件结构 (ScriptedEvent)

```typescript
interface ScriptedEvent {
  id: string                              // 事件唯一标识
  title: string                           // 事件标题
  description: string                     // 事件描述
  priority: 'urgent' | 'important' | 'normal'  // 优先级
  status: 'pending' | 'active' | 'completed' | 'failed' | 'locked' | 'escalated'
  
  // 触发条件（两种方式，任选其一）
  triggerConditions?: {
    autoTrigger?: boolean                 // 自动触发（开局即触发）
    year?: number                         // 触发年份
    season?: string                       // 触发季节
    characterPresent?: string             // 需要某人物在任
    factionActive?: string                // 需要某势力存在
    prestigeMin?: number                  // 威望最小值
    peopleMoraleMax?: number              // 民心最大值（低于此触发）
    unrestMin?: number                    // 动荡最小值
    factionSupportMin?: { factionId: string; value: number }  // 派系支持度最小值
  }
  triggerCondition?: (state: GameState) => boolean  // 动态触发条件函数
  
  // 事件升级配置
  escalation?: {
    check: (state: GameState) => boolean  // 检查是否应该升级
    nextEventId: string                    // 升级后的事件ID
  }
  
  // 选项
  choices: {
    id: string
    text: string
    hint: string
    effects: OptionEffect[]                // 选项效果
    unlocksEvents?: string[]               // 解锁后续事件
    locksEvents?: string[]                 // 锁定后续事件
  }[]
  
  // 立即效果
  immediateEffects?: OptionEffect[]        // 无论选什么都会触发
  
  // 中断条件
  interruptConditions?: {
    characterDead?: string                 // 关键人物死亡 → 强制失败
    factionDestroyed?: string              // 势力灭亡 → 永久关闭
    turnsWithoutAction?: number            // 超过N季度未处理 → 自动恶化
  }
  interruptConsequences?: OptionEffect[]   // 中断后的后果
  escalationEffects?: OptionEffect[]       // 超时未处理自动恶化
}
```

### 事件状态生命周期

```
pending → active → completed
    ↓         ↓
  failed   locked
    ↓
escalated (升级到更严重的事件)
```

- **pending**: 等待触发
- **active**: 已触发，等待玩家选择
- **completed**: 已处理完成
- **failed**: 处理失败（关键人物死亡等）
- **locked**: 永久锁定（已被玩家选择排除）
- **escalated**: 升级到更严重的事件

### 触发条件示例

#### 静态触发条件
```typescript
triggerConditions: {
  autoTrigger: true,  // 开局自动触发
}

triggerConditions: {
  year: 1628,
  season: '春',
  peopleMoraleMax: 50,  // 民心低于50时触发
  unrestMin: 30,         // 动荡超过30时触发
}

triggerConditions: {
  characterPresent: 'wei_zhongxian',  // 魏忠贤在任时触发
}
```

#### 动态触发条件
```typescript
triggerCondition: (state: GameState) => {
  // 复杂条件逻辑
  return state.nation.emperor.prestige > 50 &&
         state.store.faction.donglin.support > 40 &&
         state.store.faction.eunuch_party.support < 30
}
```

### 事件升级

事件可以升级为更严重的事件：

```typescript
{
  id: 'shaanxi_drought',
  title: '陕西初旱',
  // ...
  escalation: {
    check: (state: GameState) => {
      // 如果陕西动荡超过50，升级为起义
      return state.provinces.shaanxi.civilUnrest > 50
    },
    nextEventId: 'shaanxi_uprising',  // 升级后的事件ID
  },
  escalationEffects: [  // 超时未处理的恶化效果
    { type: 'province', target: 'shaanxi', field: 'civilUnrest', value: 15, mode: 'delta' }
  ],
}
```

### 事件中断

某些事件可以被外部因素中断：

```typescript
{
  id: 'deal_with_wei',
  title: '处置魏忠贤',
  // ...
  interruptConditions: {
    characterDead: 'wei_zhongxian',  // 魏忠贤死后事件失败
  },
  interruptConsequences: [
    { type: 'nation', target: 'emperor', field: 'prestige', value: -10, mode: 'delta' }
  ],
}
```

---

## 效果系统

### GameEffect (朝会效果)

朝会选项的效果使用 `GameEffect` 类型：

```typescript
interface GameEffect {
  type: 'treasury' | 'province' | 'nation' | 'minister'
  target: string          // 目标ID
  field: string           // 影响字段
  value: number           // 数值变化
  mode: 'delta' | 'set'   // delta: 增量, set: 设置绝对值
  description?: string    // 描述文本
}
```

#### 效果类型说明

##### 1. Treasury (国库)
```typescript
{ type: 'treasury', target: 'treasury', field: 'gold', value: -1000, mode: 'delta' }
// 国库减少1000两

{ type: 'treasury', target: 'treasury', field: 'gold', value: 50000, mode: 'set' }
// 国库设置为50000两
```

**可用字段**：
- `gold`: 金银数量

##### 2. Province (省份)
```typescript
{ type: 'province', target: 'shaanxi', field: 'civilUnrest', value: -20, mode: 'delta' }
// 陕西民乱减少20

{ type: 'province', target: 'beijing', field: 'taxRate', value: 15, mode: 'set' }
// 北京税率设置为15%
```

**可用字段**：
- `civilUnrest`: 民乱程度
- `taxRate`: 税率
- `prosperity`: 繁荣度
- `population`: 人口

##### 3. Nation (国家)
```typescript
{ type: 'nation', target: 'emperor', field: 'prestige', value: 20, mode: 'delta' }
// 皇帝威望增加20

{ type: 'nation', target: 'all', field: 'peopleMorale', value: 10, mode: 'delta' }
// 民心增加10

{ type: 'nation', target: 'all', field: 'factionConflict', value: -10, mode: 'delta' }
// 党争减少10
```

**可用字段**：
- `prestige`: 皇帝威望
- `peopleMorale`: 民心
- `factionConflict`: 党争程度

##### 4. Minister (大臣/派系)
```typescript
{ type: 'minister', target: 'donglin', field: 'support', value: 25, mode: 'delta' }
// 东林党支持度增加25

{ type: 'minister', target: 'wei_zhongxian', field: 'loyalty', value: -30, mode: 'delta' }
// 魏忠贤忠诚度减少30
```

**可用字段**：
- `support`: 派系支持度
- `loyalty`: 大臣忠诚度
- `ability`: 大臣能力值

### OptionEffect (剧本事件效果)

剧本事件使用更灵活的 `OptionEffect` 类型：

```typescript
interface OptionEffect {
  type: 'treasury' | 'province' | 'nation' | 'minister'
  target: string
  field: string
  value?: number          // 直接数值
  configKey?: string      // 引用配置文件中的常量
  mode: 'delta' | 'set'
  description?: string
}
```

#### 使用 configKey 引用配置

为了避免硬编码，剧本事件可以引用 `src/config/gameConfig.ts` 中的常量：

```typescript
// gameConfig.ts
export const GAME_CONFIG = {
  RELIEF_COST_BASE: 5000,      // 基础赈灾花费
  TAX_RATE_BASE: 10,           // 基础税率
  ARMY_MAINTENANCE_COST: 3000, // 军队维护费
  // ...
}

// 剧本中引用
{ type: 'treasury', target: 'treasury', field: 'gold', configKey: 'RELIEF_COST_BASE', mode: 'delta', description: '赈灾花费' }
```

### 立即效果 (immediateEffects)

无论玩家选择哪个选项，都会触发的效果：

```typescript
immediateEffects: [
  { type: 'nation', target: 'emperor', field: 'prestige', value: 5, mode: 'delta' },
  // 只要处理了这个奏折/事件，威望就会增加5
]
```

**使用场景**：
- 玩家关注某个问题本身就会带来威望提升
- 处理事件会有基础消耗
- 某些 unavoidable 的后果

---

## 分支与结局

### 解锁/锁定机制

通过选项可以解锁或锁定后续事件：

```typescript
{
  id: 'choice_1',
  text: '赐死魏忠贤',
  hint: '阉党覆灭',
  effects: [...],
  unlocksEvents: ['donglin_rise'],      // 解锁东林党崛起事件
  locksEvents: ['eunuch_comeback'],     // 锁定阉党复辟事件
}
```

### 分支设计模式

#### 1. 互斥分支
```typescript
// 选项A
{ id: 'choice_a', unlocksEvents: ['event_b'], locksEvents: ['event_c'] }
// 选项B
{ id: 'choice_b', unlocksEvents: ['event_c'], locksEvents: ['event_b'] }
```

#### 2. 连锁解锁
```typescript
// 选择A → 解锁B → 再选择B → 解锁C
{ id: 'choice_a', unlocksEvents: ['event_b'] }
// ...
{ id: 'choice_b', unlocksEvents: ['event_c'] }
```

#### 3. 多条件解锁
```typescript
// 需要多个前置事件都解锁
// 在 event_d 的 triggerCondition 中检查
triggerCondition: (state) => {
  return state.unlockedEvents.includes('event_a') &&
         state.unlockedEvents.includes('event_b')
}
```

### 结局系统

#### 1. 基于结局的事件
```typescript
{
  id: 'game_over',
  title: '大明覆灭',
  description: '民不聊生，外敌入侵，大明终将覆灭...',
  priority: 'urgent',
  status: 'pending',
  triggerCondition: (state) => {
    return state.nation.emperor.prestige < 20 ||
           state.nation.peopleMorale < 10 ||
           state.treasury.gold < 1000
  },
  choices: [
    {
      id: 'accept',
      text: '接受命运',
      hint: '游戏结束',
      effects: [],
    },
  ],
}
```

#### 2. 朝会结局旁白
在 `ScriptMeta` 中设置：
```typescript
{
  closingNarration: '朝会结束，朝野震动。魏忠贤已除，东林党得势，但党争更甚...',  // 剧情结局
}
```

#### 3. 多结局标记
可以在效果中添加自定义标记：
```typescript
effects: [
  { type: 'nation', target: 'all', field: 'ending', value: 1, mode: 'set' },
  // 结局1：东林党得势
]
```

### 条件选项

选项可以根据当前状态动态显示或隐藏：

```typescript
// 在 ScriptedEvent 中使用
choices: [
  {
    id: 'choice_1',
    text: '执行计划',
    hint: '需要足够资金',
    effects: [...],
    // 通过 unlock/lock 机制控制可用性
    unlocksEvents: ['next_event'],
  },
  // 在 triggerCondition 中控制整个事件的触发
]

// 或在 CourtMemorial 中通过 immediateEffects 控制后续奏折
immediateEffects: [
  { type: 'nation', target: 'all', field: 'unlockedMemorial', value: 'memorial_3', mode: 'set' },
]
```

---

## 最佳实践

### 1. 剧本结构建议

#### 朝会剧本
- 每回合最多 3-5 个奏折，避免信息过载
- 优先级分布：1个urgent + 1-2个important + 1个normal
- 同一回合的奏折应该有关联性（如都是财政问题）

#### 剧本事件
- 事件ID使用下划线命名：`shaanxi_drought`
- 标题简洁有力：`陕西初旱`
- 描述包含：背景 + 现状 + 问题

### 2. 选项设计原则

#### 选项数量
- 通常 2-3 个选项最佳
- 4个以上会让选择困难
- 至少保证有1个"折中"选项

#### 选项特征
```typescript
// 选项1：激进
{ text: '立即处死', hint: '阉党覆灭，朝局震荡', effects: [...] }

// 选项2：温和
{ text: '流放凤阳', hint: '较为稳妥，但留后患', effects: [...] }

// 选项3：保守
{ text: '暂时留用', hint: '党争加剧，但可制衡', effects: [...] }
```

#### 提示文本
- 暗示主要后果
- 避免剧透（不要说"威望+20"）
- 用"党争加剧"而非"factionConflict+15"

### 3. 效果平衡

#### 效果量级参考
```typescript
// 威望
PRESTIGE_HIGH: 20      // 重大决策
PRESTIGE_MEDIUM: 15    // 重要决策
PRESTIGE_LOW: 8        // 一般决策
PRESTIGE_MINIMAL: 5    // 细微影响

// 派系支持度
FACTION_SUPPORT_HIGH: 25      // 完全倒向
FACTION_SUPPORT_MEDIUM: 15    // 明显支持
FACTION_SUPPORT_LOW: 8        // 略微支持
FACTION_SUPPORT_DESTROY: -60  // 彻底决裂
FACTION_SUPPORT_WEAKEN: -30   // 明显削弱
FACTION_SUPPORT_MINOR: -15    // 略微不满

// 民心
MORALE_BIG: 15   // 重大事件
MORALE_MEDIUM: 10  // 重要事件
MORALE_SMALL: 5    // 一般事件

// 民乱
UNREST_BIG: 20      // 严重动乱
UNREST_MEDIUM: 15   // 明显动乱
UNREST_SMALL: 10    // 轻微动乱

// 财政
GOLD_BIG: 5000      // 重大支出
GOLD_MEDIUM: 3000   // 一般支出
GOLD_SMALL: 1000    // 小额支出
```

#### 效果平衡原则
- **高风险高回报**：激进选项效果大，但副作用也大
- **稳健选择**：温和选项效果适中，副作用可控
- **保守选择**：效果小但安全

示例：
```typescript
// 激进
{ text: '处死', effects: [
  { type: 'nation', target: 'emperor', field: 'prestige', value: 20 },      // 威望大涨
  { type: 'minister', target: 'donglin', field: 'support', value: 25 },     // 东林党得势
  { type: 'nation', target: 'all', field: 'factionConflict', value: 15 },   // 但党争加剧
]}

// 温和
{ text: '流放', effects: [
  { type: 'nation', target: 'emperor', field: 'prestige', value: 8 },       // 威望小涨
  { type: 'minister', target: 'eunuch_party', field: 'support', value: -30 }, // 阉党削弱
  { type: 'minister', target: 'donglin', field: 'support', value: 15 },     // 东林党略增
]}

// 保守
{ text: '留用', effects: [
  { type: 'nation', target: 'emperor', field: 'prestige', value: 5 },       // 威望微增
  { type: 'nation', target: 'all', field: 'factionConflict', value: 15 },   // 党争加剧
  { type: 'minister', target: 'donglin', field: 'support', value: -15 },    // 东林党不满
]}
```

### 4. 分支设计建议

#### 分支深度
- 避免超过3层嵌套（太复杂难以追踪）
- 每个分支都应该有清晰的目的
- 不同分支应该导向不同的结局

#### 事件ID命名
- 使用层级命名：`wei_zhongxian_disposal` → `eunuch_party_rebellion`
- 相关事件用前缀：`shaanxi_drought` → `shaanxi_uprising` → `shaanxi_pacification`

#### 解锁/锁定逻辑
```typescript
// 好的设计：清晰的互斥
unlocksEvents: ['event_a'],  // 选择此选项进入路线A
locksEvents: ['event_b']     // 封闭路线B

// 避免：复杂的交叉解锁
unlocksEvents: ['event_a', 'event_c', 'event_e'],  // 太难追踪
```

### 5. 剧情写作建议

#### 旁白风格
- 使用半文言半白话的风格
- 简洁有力，避免冗长
- 融入历史背景

示例：
```typescript
openingNarration: '天启七年八月，熹宗驾崩，信王朱由检即位，是为崇祯。朝野震动，阉党把持，外有后金虎视，内有民怨沸腾，大明江山危如累卵。'

closingNarration: '朝会结束，魏忠贤已除，东林党得势。然党争更甚，朝局未稳，崇祯帝望着殿外阴云密布的天空，不知大明江山将走向何方。'
```

#### 奏折/事件描述
- 结构：背景 → 现状 → 问题 → 请求
- 客观描述大臣/事件的立场
- 给出足够信息让玩家做决策

示例：
```typescript
content: '魏忠贤把持朝政多年，党羽遍布朝野，号"九千岁"。东林党人屡遭打压，朝纲败坏，民怨沸腾。新皇即位，群臣上疏请旨，恳请陛下定夺：是立即清除阉党，还是暂且留用以作制衡？'
```

### 6. 测试建议

#### 单元测试
- 测试每个选项的效果是否按预期生效
- 测试解锁/锁定逻辑是否正确
- 测试触发条件是否准确

#### 集成测试
- 测试完整的分支流程
- 测试不同选择如何影响后续游戏
- 测试结局是否合理触发

#### 平衡性测试
- 不同选项是否都有吸引力
- 效果数值是否平衡
- 是否有"最优解"导致其他选项无意义

---

## 完整示例

### 示例1：朝会剧本 - 辽东军饷问题

```typescript
// src/data/scenario/turn3Script.ts
import type { CourtMemorial, MemorialChoice } from '@/core/types'
import type { GameEffect } from '@/api/schemas'

export const TURN_3_SCRIPT: CourtMemorial[] = [
  // 奏折1：袁崇焕上奏
  {
    id: 'memorial_liaodong_salary',
    ministerId: 'yuan_chonghuan',
    ministerName: '袁崇焕',
    faction: 'donglin',
    urgency: 'urgent',
    subject: '辽东军饷告急',
    content: '臣袁崇焕奏报：辽东前线连年战事，将士浴血奋战，然军饷拖欠已达半年。锦州、宁远等处将士怨声载道，甚至有逃兵之事。若再不拨发军饷，恐生变故。恳请陛下速拨军饷三万两，以安军心，固边防。',
    choices: [
      {
        id: 'pay_full',
        text: '全额拨发，稳定军心',
        hint: '花费国库，但边疆可保',
        effects: [
          { type: 'treasury', target: 'treasury', field: 'gold', value: -30000, mode: 'delta' },
          { type: 'nation', target: 'emperor', field: 'prestige', value: 10, mode: 'delta' },
          { type: 'province', target: 'liaodong', field: 'civilUnrest', value: -25, mode: 'delta' },
        ],
        unlocksEventIds: ['yuan_loyal'],
        locksEventIds: ['yuan_rebellion'],
      },
      {
        id: 'pay_half',
        text: '拨发一半，暂缓压力',
        hint: '折中方案，但军心难定',
        effects: [
          { type: 'treasury', target: 'treasury', field: 'gold', value: -15000, mode: 'delta' },
          { type: 'province', target: 'liaodong', field: 'civilUnrest', value: -10, mode: 'delta' },
          { type: 'minister', target: 'yuan_chonghuan', field: 'loyalty', value: -15, mode: 'delta' },
        ],
      },
      {
        id: 'delay_payment',
        text: '暂缓拨发，国库吃紧',
        hint: '节省开支，但有哗变风险',
        effects: [
          { type: 'province', target: 'liaodong', field: 'civilUnrest', value: 20, mode: 'delta' },
          { type: 'minister', target: 'yuan_chonghuan', field: 'loyalty', value: -30, mode: 'delta' },
        ],
        unlocksEventIds: ['liaodong_mutiny'],
        locksEventIds: ['yuan_loyal'],
      },
    ],
    immediateEffects: [
      { type: 'nation', target: 'emperor', field: 'prestige', value: 5, mode: 'delta' },
    ],
  },
  
  // 奏折2：户部上奏
  {
    id: 'memorial_tax_increase',
    ministerId: 'hu_bu_shangshu',
    ministerName: '户部尚书',
    faction: 'neutral',
    urgency: 'important',
    subject: '加征商税议',
    content: '户部奏报：国库空虚，入不敷出。江南商贾富甲一方，然商税税率远低于田赋。臣提议加征商税一成，预计可增银三万两，可解辽东军饷之急。然商贾多有怨言，恐伤民心，请陛下定夺。',
    choices: [
      {
        id: 'increase_tax',
        text: '加征商税，充实国库',
        hint: '快速筹钱，但商民不满',
        effects: [
          { type: 'treasury', target: 'treasury', field: 'gold', value: 30000, mode: 'delta' },
          { type: 'nation', target: 'all', field: 'peopleMorale', value: -10, mode: 'delta' },
          { type: 'province', target: 'jiangnan', field: 'prosperity', value: -15, mode: 'delta' },
        ],
      },
      {
        id: 'maintain_tax',
        text: '维持原税，另寻他法',
        hint: '保商民，但财政困难',
        effects: [
          { type: 'nation', target: 'all', field: 'peopleMorale', value: 5, mode: 'delta' },
        ],
      },
    ],
  },
  
  // 奏折3：东林党上奏
  {
    id: 'memorial_donglin_reform',
    ministerId: 'donglin_leader',
    ministerName: '东林党领袖',
    faction: 'donglin',
    urgency: 'normal',
    subject: '科举改革议',
    content: '臣等东林党人奏报：科举制实行已久，然八股取士束缚人才，士子只知章句，不谙实务。臣提议改革科举，增加策论、算学、兵法等实用科目，以选拔真才实学之士。然此议触动既得利益，恐遭保守派反对。',
    choices: [
      {
        id: 'reform_exams',
        text: '推行改革，选拔实务人才',
        hint: '长远有益，但短期阻力大',
        effects: [
          { type: 'nation', target: 'emperor', field: 'prestige', value: 15, mode: 'delta' },
          { type: 'minister', target: 'donglin', field: 'support', value: 20, mode: 'delta' },
          { type: 'minister', target: 'conservative', field: 'support', value: -20, mode: 'delta' },
        ],
        unlocksEventIds: ['exam_reform_success'],
      },
      {
        id: 'maintain_exams',
        text: '维持旧制，避免动荡',
        hint: '稳妥，但改革停滞',
        effects: [
          { type: 'nation', target: 'all', field: 'factionConflict', value: 10, mode: 'delta' },
        ],
      },
    ],
  },
]

export const TURN_3_META = {
  turn: 3,
  date: '1628年春',
  sessionTitle: '辽东军饷与财政危机',
  openingNarration: '崇祯元年春，辽东战事吃紧，军饷告急；国库空虚，入不敷出。内外交困之中，崇祯帝召集群臣，共商对策。',
  closingNarration: '朝会结束，军饷问题暂得缓解，然财政危机未解，党争依旧。崇祯帝望着账簿上日渐减少的银两，心中忧思难平。',
  maxMemorials: 3,
  mode: 'historical',
}
```

### 示例2：剧本事件 - 陕西民变

```typescript
// src/data/scenario/scriptedEvents.ts
{
  id: 'shaanxi_drought',
  title: '陕西初旱',
  description: '陕西连年干旱，赤地千里，流民四起，饿殍遍野。各地官员纷纷上疏告急，请求朝廷赈灾。若不及时处理，恐生民变。',
  priority: 'important',
  status: 'pending',
  triggerConditions: {
    year: 1628,
    season: '春',
    autoTrigger: false,
  },
  triggerCondition: (state: GameState) => {
    // 民心低于60且陕西民乱超过20时触发
    return state.nation.peopleMorale < 60 &&
           state.provinces.shaanxi.civilUnrest > 20
  },
  choices: [
    {
      id: 'relief',
      text: '拨银赈灾，安抚灾民',
      hint: '花费国库，但可遏制民变',
      effects: [
        { type: 'treasury', target: 'treasury', field: 'gold', configKey: 'RELIEF_COST_BASE', mode: 'delta', description: '赈灾花费' },
        { type: 'nation', target: 'all', field: 'peopleMorale', value: 10, mode: 'delta', description: '民心+10' },
        { type: 'province', target: 'shaanxi', field: 'civilUnrest', value: -20, mode: 'delta', description: '陕西民乱-20' },
      ],
      unlocksEvents: ['shaanxi_stabilized'],
      locksEvents: ['shaanxi_uprising', 'bandits_gao_joins'],
    },
    {
      id: 'ignore',
      text: '国库空虚，暂缓赈灾',
      hint: '节省开支，但民变风险大增',
      effects: [
        { type: 'nation', target: 'all', field: 'peopleMorale', value: -10, mode: 'delta', description: '民心-10' },
        { type: 'province', target: 'shaanxi', field: 'civilUnrest', value: 20, mode: 'delta', description: '陕西民乱+20' },
      ],
      unlocksEvents: ['shaanxi_uprising', 'bandits_gao_joins'],
      locksEvents: ['shaanxi_stabilized'],
    },
    {
      id: 'military_suppression',
      text: '派兵镇压，以儆效尤',
      hint: '暂缓局势，但激起更大民怨',
      effects: [
        { type: 'nation', target: 'all', field: 'peopleMorale', value: -20, mode: 'delta', description: '民心-20' },
        { type: 'province', target: 'shaanxi', field: 'civilUnrest', value: -10, mode: 'delta', description: '陕西民乱-10（暂时）' },
        { type: 'treasury', target: 'treasury', field: 'gold', value: -2000, mode: 'delta', description: '军费' },
      ],
      unlocksEvents: ['shaanxi_rebellion_escalated'],
    },
  ],
  immediateEffects: [],
  escalationEffects: [
    { type: 'province', target: 'shaanxi', field: 'civilUnrest', value: 15, mode: 'delta', description: '超时未处理，陕西局势恶化' },
  ],
  interruptConditions: {
    turnsWithoutAction: 2,
  },
  interruptConsequences: [
    { type: 'province', target: 'shaanxi', field: 'civilUnrest', value: 30, mode: 'delta', description: '民变爆发' },
  ],
},
{
  id: 'shaanxi_uprising',
  title: '陕西民变',
  description: '陕西灾荒未除，民变已起。王自用、高迎祥等流贼聚众数万，攻城略地，势如破竹。官兵屡战屡败，局势危急。',
  priority: 'urgent',
  status: 'locked',
  triggerConditions: {},
  choices: [
    {
      id: 'send_army',
      text: '调集大军，全力剿灭',
      hint: '消耗国力，但可平定叛乱',
      effects: [
        { type: 'treasury', target: 'treasury', field: 'gold', value: -50000, mode: 'delta' },
        { type: 'province', target: 'shaanxi', field: 'civilUnrest', value: -30, mode: 'delta' },
      ],
      unlocksEvents: ['shaanxi_pacified'],
      locksEvents: ['shaanxi_spread'],
    },
    {
      id: 'recruit_minister',
      text: '招募良将，以贼制贼',
      hint: '节省开支，但养成后患',
      effects: [
        { type: 'minister', target: 'bandits', field: 'support', value: 30, mode: 'delta' },
        { type: 'province', target: 'shaanxi', field: 'civilUnrest', value: -15, mode: 'delta' },
      ],
      unlocksEvents: ['bandit_leader_join'],
    },
  ],
},
{
  id: 'bandits_gao_joins',
  title: '高迎祥入伙',
  description: '陕西民变愈演愈烈，原本安分守己的农民高迎祥也被迫加入流贼。此人勇猛善战，日后恐成大患。',
  priority: 'important',
  status: 'locked',
  triggerConditions: {},
  choices: [
    {
      id: 'monitor',
      text: '密切关注，暂不动手',
      hint: '等待时机',
      effects: [
        { type: 'minister', target: 'bandits', field: 'support', value: 10, mode: 'delta' },
      ],
    },
    {
      id: 'assassinate',
      text: '派人暗杀，除之后患',
      hint: '冒险但可能成功',
      effects: [
        { type: 'minister', target: 'bandits', field: 'support', value: -20, mode: 'delta' },
        { type: 'nation', target: 'emperor', field: 'prestige', value: -10, mode: 'delta' },
      ],
    },
  ],
},
```

### 示例3：完整分支链 - 魏忠贤事件链

```typescript
// 事件1：处置魏忠贤
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
        { type: 'nation', target: 'emperor', field: 'prestige', value: 15, mode: 'delta' },
        { type: 'minister', target: 'eunuch_party', field: 'support', value: -60, mode: 'delta' },
        { type: 'minister', target: 'donglin', field: 'support', value: 25, mode: 'delta' },
      ],
      unlocksEvents: ['donglin_rise', 'eunuch_party_destroyed'],
      locksEvents: ['eunuch_party_rebellion', 'eunuch_party_comeback'],
    },
    {
      id: 'exile',
      text: '流放凤阳，留其性命',
      hint: '较为温和，但阉党仍有复辟可能',
      effects: [
        { type: 'nation', target: 'emperor', field: 'prestige', value: 8, mode: 'delta' },
        { type: 'minister', target: 'eunuch_party', field: 'support', value: -30, mode: 'delta' },
        { type: 'minister', target: 'donglin', field: 'support', value: 10, mode: 'delta' },
      ],
      unlocksEvents: ['eunuch_party_exiled'],
    },
    {
      id: 'keep',
      text: '暂时留用，以作制衡',
      hint: '党争加剧，但可借助阉党制约文官',
      effects: [
        { type: 'nation', target: 'all', field: 'factionConflict', value: 15, mode: 'delta' },
        { type: 'minister', target: 'donglin', field: 'support', value: -15, mode: 'delta' },
        { type: 'minister', target: 'eunuch_party', field: 'support', value: 10, mode: 'delta' },
      ],
      unlocksEvents: ['eunuch_party_rebellion', 'donglin_opposition'],
      locksEvents: ['donglin_rise', 'eunuch_party_destroyed'],
    },
  ],
  interruptConditions: {
    characterDead: 'wei_zhongxian',
  },
},

// 事件2A：东林党得势（执行魏忠贤后触发）
{
  id: 'donglin_rise',
  title: '东林党得势',
  description: '魏忠贤已除，东林党人纷纷入朝为官。然东林党人虽有清名，却多空谈，少实务，且党同伐异，排斥异己。朝中又现新的党争。',
  priority: 'important',
  status: 'locked',
  triggerConditions: {},
  choices: [
    {
      id: 'support_donglin',
      text: '重用东林党人',
      hint: '名正言顺，但党争加剧',
      effects: [
        { type: 'minister', target: 'donglin', field: 'support', value: 20, mode: 'delta' },
        { type: 'nation', target: 'all', field: 'factionConflict', value: 20, mode: 'delta' },
      ],
      unlocksEvents: ['donglin_monopoly'],
    },
    {
      id: 'balance_factions',
      text: '平衡各派，勿使独大',
      hint: '制衡之术，但需更高明手段',
      effects: [
        { type: 'nation', target: 'all', field: 'factionConflict', value: -10, mode: 'delta' },
        { type: 'nation', target: 'emperor', field: 'prestige', value: 10, mode: 'delta' },
      ],
    },
  ],
},

// 事件2B：阉党复辟（流放魏忠贤后可能触发）
{
  id: 'eunuch_party_comeback',
  title: '阉党复辟',
  description: '魏忠贤虽被流放，但其党羽仍在暗中活动。如今风声渐松，阉党蠢蠢欲动，欲图复辟。',
  priority: 'urgent',
  status: 'locked',
  triggerConditions: {
    characterPresent: 'wei_zhongxian',
  },
  choices: [
    {
      id: 'execute_now',
      text: '立即赐死魏忠贤',
      hint: '斩草除根',
      effects: [
        { type: 'nation', target: 'emperor', field: 'prestige', value: 10, mode: 'delta' },
        { type: 'minister', target: 'eunuch_party', field: 'support', value: -40, mode: 'delta' },
      ],
      unlocksEvents: ['eunuch_party_destroyed'],
      locksEvents: ['eunuch_party_comeback'],
    },
    {
      id: 'strengthen_surveillance',
      text: '加强监视，严密防范',
      hint: '稳妥，但需持续投入',
      effects: [
        { type: 'treasury', target: 'treasury', field: 'gold', value: -2000, mode: 'delta' },
        { type: 'province', target: 'beijing', field: 'civilUnrest', value: 10, mode: 'delta' },
      ],
    },
  ],
},

// 事件2C：阉党叛乱（留用魏忠贤后触发）
{
  id: 'eunuch_party_rebellion',
  title: '阉党叛乱',
  description: '魏忠贤留用后，势力日益膨胀，竟有谋逆之心。如今其党羽控制京师禁军，欲逼宫篡位。',
  priority: 'urgent',
  status: 'locked',
  triggerConditions: {},
  choices: [
    {
      id: 'crush_rebellion',
      text: '调兵勤王，镇压叛乱',
      hint: '血腥镇压，京师受创',
      effects: [
        { type: 'treasury', target: 'treasury', field: 'gold', value: -40000, mode: 'delta' },
        { type: 'province', target: 'beijing', field: 'civilUnrest', value: 30, mode: 'delta' },
        { type: 'minister', target: 'eunuch_party', field: 'support', value: -100, mode: 'delta' },
        { type: 'nation', target: 'emperor', field: 'prestige', value: 20, mode: 'delta' },
      ],
      unlocksEvents: ['eunuch_party_destroyed'],
    },
    {
      id: 'negotiate',
      text: '谈判妥协，缓兵之计',
      hint: '暂时稳住，但埋下祸根',
      effects: [
        { type: 'nation', target: 'emperor', field: 'prestige', value: -20, mode: 'delta' },
        { type: 'minister', target: 'eunuch_party', field: 'support', value: 30, mode: 'delta' },
      ],
      unlocksEvents: ['emperor_puppet'],
    },
  ],
},

// 事件3A：东林党专权（继续支持东林党后触发）
{
  id: 'donglin_monopoly',
  title: '东林党专权',
  description: '东林党把持朝政，排斥异己，凡非东林党人皆不得重用。朝政日渐腐败，民生凋敝，亡国之兆已现。',
  priority: 'urgent',
  status: 'locked',
  triggerConditions: {},
  choices: [
    {
      id: 'purge_donglin',
      text: '清算东林党，引入新人',
      hint: '大换血，但朝局震荡',
      effects: [
        { type: 'nation', target: 'all', field: 'factionConflict', value: 30, mode: 'delta' },
        { type: 'minister', target: 'donglin', field: 'support', value: -50, mode: 'delta' },
      ],
    },
    {
      id: 'continue_support',
      text: '继续支持，维持现状',
      hint: '温水煮青蛙，走向灭亡',
      effects: [
        { type: 'nation', target: 'all', field: 'peopleMorale', value: -20, mode: 'delta' },
        { type: 'treasury', target: 'treasury', field: 'gold', value: -10000, mode: 'delta' },
      ],
      unlocksEvents: ['ming_collapse'],
    },
  ],
},
```

---

## 附录

### A. 文件结构

```
src/data/scenario/
├── day1Script.ts          # 第1天朝会剧本
├── turn2Script.ts         # 第2天朝会剧本
├── turn3Script.ts         # 第3天朝会剧本
├── ...
├── scriptedEvents.ts      # 剧本事件定义
├── historicalCharacters.ts  # 历史人物数据
├── factions.ts            # 派系数据
└── openingState.ts        # 开局初始状态
```

### B. 类型定义

#### CourtMemorial (朝会奏折)
```typescript
interface CourtMemorial {
  id: string
  ministerId: string
  ministerName: string
  faction: string
  urgency: 'urgent' | 'important' | 'normal'
  subject: string
  content: string
  choices: MemorialChoice[]
  immediateEffects?: GameEffect[]
}
```

#### MemorialChoice (朝会选项)
```typescript
interface MemorialChoice {
  id: string
  text: string
  hint: string
  effects: GameEffect[]
  unlocksEventIds?: string[]
  locksEventIds?: string[]
}
```

#### ScriptedEvent (剧本事件)
```typescript
interface ScriptedEvent {
  id: string
  title: string
  description: string
  priority: 'urgent' | 'important' | 'normal'
  status: EventStatus
  triggerConditions?: TriggerConditions
  triggerCondition?: (state: GameState) => boolean
  escalation?: EscalationConfig
  choices: EventChoice[]
  immediateEffects?: OptionEffect[]
  interruptConditions?: InterruptConditions
  interruptConsequences?: OptionEffect[]
  escalationEffects?: OptionEffect[]
}
```

### C. 常用效果参考

```typescript
// 威望
{ type: 'nation', target: 'emperor', field: 'prestige', value: 20, mode: 'delta' }

// 民心
{ type: 'nation', target: 'all', field: 'peopleMorale', value: 10, mode: 'delta' }

// 国库
{ type: 'treasury', target: 'treasury', field: 'gold', value: -5000, mode: 'delta' }

// 派系支持度
{ type: 'minister', target: 'donglin', field: 'support', value: 25, mode: 'delta' }

// 省份民乱
{ type: 'province', target: 'shaanxi', field: 'civilUnrest', value: -20, mode: 'delta' }

// 省份税率
{ type: 'province', target: 'beijing', field: 'taxRate', value: 15, mode: 'set' }

// 党争
{ type: 'nation', target: 'all', field: 'factionConflict', value: -10, mode: 'delta' }

// 大臣忠诚度
{ type: 'minister', target: 'wei_zhongxian', field: 'loyalty', value: -30, mode: 'delta' }
```

### D. 常见问题

#### Q1: 如何创建多结局剧本？
A: 通过 `unlocksEvents` 和 `locksEvents` 控制分支，在每个分支的终点创建结局事件。

#### Q2: 如何让某些选项只在特定条件下可用？
A: 使用触发条件控制事件是否触发，或通过解锁/锁定机制控制选项可用性。

#### Q3: 如何平衡游戏难度？
A: 控制效果数值的大小，确保激进选项有高风险高回报，保守选项效果小但安全。

#### Q4: 如何测试剧本？
A: 使用开发模式快速触发事件，检查每个选项的效果是否按预期生效。

#### Q5: 如何创建随机事件？
A: 在 `ScriptedEvent` 中不设置 `autoTrigger`，而是使用概率触发函数在游戏循环中随机激活。

---

**文档版本**: 1.0  
**最后更新**: 2025-01-XX  
**维护者**: 崇祯帝国开发团队
