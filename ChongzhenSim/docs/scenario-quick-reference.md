# 剧本创作快速参考

> 完整文档请参考 [scenario-framework.md](./scenario-framework.md)

## 📋 基础模板

### 朝会奏折模板

```typescript
{
  id: 'memorial_xxx',
  ministerId: 'minister_id',
  ministerName: '大臣姓名',
  faction: '派系',
  urgency: 'urgent',  // urgent | important | normal
  subject: '奏折主题',
  content: '背景 → 现状 → 问题 → 请求',
  choices: [
    {
      id: 'choice_1',
      text: '选项文本',
      hint: '暗示结果',
      effects: [
        { type: 'treasury', target: 'treasury', field: 'gold', value: -1000, mode: 'delta' }
      ],
      unlocksEventIds: ['event_a'],
      locksEventIds: ['event_b'],
    },
    // 更多选项...
  ],
  immediateEffects: [
    { type: 'nation', target: 'emperor', field: 'prestige', value: 5, mode: 'delta' }
  ],
}
```

### 剧本事件模板

```typescript
{
  id: 'event_xxx',
  title: '事件标题',
  description: '背景 + 现状 + 问题',
  priority: 'urgent',  // urgent | important | normal
  status: 'pending',
  triggerConditions: {
    autoTrigger: true,  // 或使用 year/season 等条件
  },
  choices: [
    {
      id: 'choice_1',
      text: '选项文本',
      hint: '暗示结果',
      effects: [
        { type: 'nation', target: 'emperor', field: 'prestige', value: 20, mode: 'delta' }
      ],
      unlocksEvents: ['event_a'],
      locksEvents: ['event_b'],
    },
  ],
  immediateEffects: [],
  escalationEffects: [],  // 超时未处理的恶化效果
  interruptConditions: { turnsWithoutAction: 2 },
  interruptConsequences: [],  // 中断后的后果
}
```

## 🎯 效果类型速查

### Treasury (国库)
```typescript
{ type: 'treasury', target: 'treasury', field: 'gold', value: -1000, mode: 'delta' }
```

### Province (省份)
```typescript
{ type: 'province', target: 'shaanxi', field: 'civilUnrest', value: -20, mode: 'delta' }
// 字段: civilUnrest | taxRate | prosperity | population
```

### Nation (国家)
```typescript
{ type: 'nation', target: 'emperor', field: 'prestige', value: 20, mode: 'delta' }
// 字段: prestige | peopleMorale | factionConflict
```

### Minister (大臣/派系)
```typescript
{ type: 'minister', target: 'donglin', field: 'support', value: 25, mode: 'delta' }
// 字段: support | loyalty | ability
```

## 📊 效果数值参考

### 威望
- 重大决策: 20
- 重要决策: 15
- 一般决策: 8
- 细微影响: 5

### 派系支持度
- 完全倒向: 25
- 明显支持: 15
- 略微支持: 8
- 彻底决裂: -60
- 明显削弱: -30
- 略微不满: -15

### 民心
- 重大事件: ±15
- 重要事件: ±10
- 一般事件: ±5

### 民乱
- 严重动乱: ±20
- 明显动乱: ±15
- 轻微动乱: ±10

### 财政
- 重大支出: -5000
- 一般支出: -3000
- 小额支出: -1000

## 🔗 分支机制

### 解锁/锁定后续事件
```typescript
unlocksEventIds: ['event_a'],  // 解锁事件A
locksEventIds: ['event_b'],    // 锁定事件B
```

### 互斥分支
```typescript
// 选项A
unlocksEvents: ['route_a'], locksEvents: ['route_b']
// 选项B
unlocksEvents: ['route_b'], locksEvents: ['route_a']
```

### 连锁解锁
```typescript
// 选择A → 解锁B → 再选择B → 解锁C
unlocksEvents: ['event_b']
```

## 📝 剧本命名规范

### 文件命名
- 朝会剧本: `turnXScript.ts` (turn1Script.ts, turn2Script.ts)
- 事件定义: 在 `scriptedEvents.ts` 中添加

### ID命名
- 奏折: `memorial_xxx`
- 事件: `xxx_event` 或 `xxx_action`
- 使用下划线分隔: `shaanxi_drought`, `wei_zhongxian_disposal`

## ✅ 检查清单

### 完成剧本后检查

- [ ] 所有奏折/事件都有唯一的 `id`
- [ ] 每个 `id` 都在 `choices` 中被引用
- [ ] 所有选项都有清晰的 `text` 和 `hint`
- [ ] 效果数值平衡，没有明显的"最优解"
- [ ] 分支逻辑清晰，解锁/锁定正确
- [ ] 描述文本符合历史背景和游戏风格
- [ ] 旁白（如有）符合半文言风格

## 🎨 选项设计原则

### 选项数量
- 推荐: 2-3 个选项
- 避免: 4个以上

### 选项特征
```
选项1: 激进 → 效果大，副作用大
选项2: 温和 → 效果适中，副作用可控
选项3: 保守 → 效果小，但安全
```

### 提示文本
- ✓ 党争加剧
- ✓ 阉党覆灭
- ✗ 威望+20
- ✗ factionConflict+15

## 🚀 快速开始

1. **创建文件**: 在 `src/data/scenario/` 下创建 `turnXScript.ts`
2. **复制模板**: 使用上面的模板
3. **填充内容**: 添加奏折和选项
4. **注册剧本**: 修改 `src/systems/scenarioEngine.ts`
5. **测试运行**: 启动游戏，触发对应回合

## 📚 完整示例

### 简单奏折示例

```typescript
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
}
```

## 💡 常见问题

### Q: 如何创建多结局？
A: 使用 `unlocksEvents` 和 `locksEvents` 创建分支，每个分支终点是结局事件。

### Q: 如何让某些选项只在特定条件下可用？
A: 通过触发条件控制事件是否触发，或通过解锁/锁定机制。

### Q: 如何平衡游戏难度？
A: 激进选项高风险高回报，保守选项效果小但安全。

### Q: 如何引用配置常量？
A: 使用 `configKey` 字段引用 `gameConfig.ts` 中的常量。

```typescript
{ type: 'treasury', target: 'treasury', field: 'gold', configKey: 'RELIEF_COST_BASE', mode: 'delta' }
```

---

**提示**: 详细文档请参考 [scenario-framework.md](./scenario-framework.md)
