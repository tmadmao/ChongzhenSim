# 数据流设计文档

## 核心原则

1. **回合结束前数据不变动** - 所有数据变动都进入队列等待
2. **统一结算** - 回合结束时统一结算队列中的所有变动
3. **单一数据源** - 结算结果写入数据库，所有展示从数据库读取
4. **消除直接修改** - 禁止任何组件直接修改游戏状态

## 数据流架构

```
用户操作（选择事件、调整税率等）
    ↓
创建变动请求（ChangeRequest）
    ↓
添加到变动队列（ChangeQueue）
    ↓
同时记录到中央结算系统（AccountingSystem）
    ↓
回合结束
    ↓
结算变动队列（ChangeQueue.applyAll）
    ↓
计算常规收支（TaxSystem + FinanceSystem）
    ↓
更新游戏状态（内存）
    ↓
写入数据库（持久化）
    ↓
所有组件从数据库读取展示
```

## 关键组件

### 1. ChangeQueue（变动队列）
- **职责**：接收所有数据变动请求，按类型分类存储
- **模式**：
  - **Delta 模式** - 适用于累积的数值（如国库银两、民乱值）
  - **Absolute 模式** - 适用于绝对值（如税率）
- **结算**：回合结束时统一应用所有变动

### 2. AccountingSystem（中央结算系统）
- **职责**：记录所有财务变动，计算总收入、总支出、净变化
- **使用场景**：
  - 事件拨款/收入
  - 常规支出（军费、俸禄等）
  - 税收收入
- **输出**：财务总账（Ledger），用于流水展示

### 3. TaxSystem（税收系统）
- **职责**：计算各省份税收
- **结算时机**：回合结束时

### 4. FinanceSystem（财政系统）
- **职责**：计算常规支出（军费、俸禄、赈灾等）
- **结算时机**：回合结束时

## 变动类型

### 1. 国库变动（TreasuryChange）
- **字段**：gold（银两）、grain（粮食）
- **来源**：事件拨款、税收、军费支出等
- **示例**：赏赐王承恩十万两 → gold: -10
- **记录**：ChangeQueue + AccountingSystem

### 2. 省份变动（ProvinceChange）
- **字段**：taxRate（税率）、civilUnrest（民乱）、disasterLevel（灾害等级）等
- **来源**：加税政策、赈灾、灾害等
- **示例**：陕西加税 → taxRate: 0.1 → 0.2（Absolute 模式）
- **记录**：ChangeQueue

### 3. 官员变动（OfficialChange）
- **字段**：corruption（贪腐）、loyalty（忠诚）等
- **来源**：赏赐、惩罚、事件等
- **示例**：王承恩贪腐-20 → corruption: -20（Delta 模式）
- **记录**：ChangeQueue

### 4. 派系变动（FactionChange）
- **字段**：support（支持度）、influence（影响力）等
- **来源**：政治事件、政策等
- **示例**：东林党支持+10 → support: +10（Delta 模式）
- **记录**：ChangeQueue

### 5. 国家属性变动（NationChange）
- **字段**：peopleMorale（民心）、borderThreat（边患）等
- **来源**：战争、灾害、政策等
- **记录**：ChangeQueue

## 禁止直接修改的地方

### 1. EventPanel.tsx
- ❌ 禁止：直接修改 state.treasury.gold
- ✅ 正确：创建 TreasuryChange 添加到 ChangeQueue + AccountingSystem

### 2. ProvincePanel.tsx
- ❌ 禁止：直接修改 province.taxRate
- ✅ 正确：创建 ProvinceChange 添加到 ChangeQueue（Absolute 模式）

### 3. gameStore.ts
- ❌ 禁止：直接修改 gameState.treasury
- ✅ 正确：通过 ChangeQueue.applyAll() 统一应用

### 4. 任何组件
- ❌ 禁止：直接调用 updateProvince() 写入数据库
- ✅ 正确：回合结算时统一写入

## 结算流程（回合结束时）

### 1. 应用变动队列
```typescript
const { newState, logs } = changeQueue.applyAll(currentState);
gameState = newState;
```

### 2. 计算常规收支
```typescript
const taxIncome = taxSystem.calculateTax(newState.provinces);
const expenses = financeSystem.calculateExpenses(newState);

// 记录到 AccountingSystem
accountingSystem.addIncome('税收收入', taxIncome, '全国各省份税收');
accountingSystem.addExpense('军费', expenses.military, '军队维持费用');
accountingSystem.addExpense('俸禄', expenses.salary, '官员俸禄支出');
// ...
```

### 3. 获取财务总账
```typescript
const ledger = accountingSystem.getLedger();
// ledger.totalIncome - 总收入
// ledger.totalExpense - 总支出
// ledger.netChange - 净变化
// ledger.items - 详细交易记录
```

### 4. 更新数据库
```typescript
// 写入国库变动（来自 AccountingSystem）
for (const item of ledger.items) {
  insertTransaction({
    type: item.type, // 'income' | 'expense'
    category: item.name,
    amount: item.amount,
    description: item.description,
    // ...
  });
}

// 写入省份变动（来自 ChangeQueue）
for (const change of provinceChanges) {
  updateProvince(change.provinceId, { [change.field]: change.newValue });
}

// 保存游戏状态
saveGameState(newState);
```

### 5. 清空队列
```typescript
changeQueue.clear();
accountingSystem.resetLedger(); // 可选，下一回合重新开始
```

## 展示逻辑

所有组件从数据库读取数据：

```typescript
// 财务面板
const transactions = getRecentTransactions(50);
const treasury = getCurrentTreasury();

// 省份面板
const provinces = getAllProvinces();

// 官员面板
const officials = getAllOfficials();
```

## 事件效果定义

每个事件选项的效果应该明确定义：

```typescript
interface EventEffect {
  type: 'treasury' | 'province' | 'official' | 'faction' | 'nation';
  target: string; // 目标ID，如 'treasury', 'shanxi', 'wang_chengen'
  field: string;  // 字段名，如 'gold', 'taxRate', 'corruption'
  delta?: number;  // 变动值（Delta 模式）
  newValue?: number; // 新值（Absolute 模式）
  description: string; // 描述，如 "赏赐王承恩十万两"
}
```

示例（Delta 模式）：
```typescript
{
  type: 'treasury',
  target: 'treasury',
  field: 'gold',
  delta: -10,
  description: '赏赐王承恩十万两'
}
```

示例（Absolute 模式）：
```typescript
{
  type: 'province',
  target: 'shanxi',
  field: 'taxRate',
  newValue: 0.15,
  description: '陕西税率调整: 10% → 15%'
}
```

## 关键代码示例

### 处理事件选择（applyPlayerDecision）
```typescript
if (decision.type === 'event_choice') {
  const { changeQueue } = await import('@/engine/ChangeQueue');
  const { accountingSystem } = await import('@/engine/AccountingSystem');
  
  for (const effect of decision.effects) {
    // 添加到 ChangeQueue
    changeQueue.enqueue({
      type: effect.type,
      target: effect.target,
      field: effect.field,
      delta: effect.delta,
      newValue: effect.newValue,
      description: effect.description,
      source: decision.choiceId
    });
    
    // 同时记录到 AccountingSystem（用于财务计算）
    if (effect.type === 'treasury' && effect.field === 'gold') {
      if (effect.delta > 0) {
        accountingSystem.addIncome(effect.description, effect.delta, '事件选择');
      } else if (effect.delta < 0) {
        accountingSystem.addExpense(effect.description, Math.abs(effect.delta), '事件选择');
      }
    }
  }
}
```

### 处理税率调整（adjustProvinceTaxRate）
```typescript
const { changeQueue } = await import('@/engine/ChangeQueue');

// 税率变动（Absolute 模式）
changeQueue.enqueue({
  type: 'province',
  target: provinceId,
  field: 'taxRate',
  newValue: clampedRate, // 新值
  description: `${province.name} 税率调整`,
  source: '税率调整'
});

// 民乱变动（Delta 模式）
if (civilUnrestDelta !== 0) {
  changeQueue.enqueue({
    type: 'province',
    target: provinceId,
    field: 'civilUnrest',
    delta: civilUnrestDelta, // 变动值
    description: `${province.name} 民乱变化`,
    source: '税率调整'
  });
}
```

## 改造计划

### 第一阶段：禁止直接修改 ✅
1. 修改 EventPanel.tsx - 使用 ChangeQueue + AccountingSystem ✅
2. 修改 ProvincePanel.tsx - 使用 ChangeQueue ✅
3. 修改 gameStore.ts - 移除直接修改逻辑 ✅

### 第二阶段：统一结算 ✅
1. 完善 ChangeQueue.applyAll() ✅
2. 修改 gameLoop.ts - 统一结算流程 ✅
3. 确保所有变动都经过队列 ✅

### 第三阶段：统一展示 ✅
1. 所有组件从数据库读取 ✅
2. 移除内存中的临时状态 ✅
3. 确保数据一致性 ✅
