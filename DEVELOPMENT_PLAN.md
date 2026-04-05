# 崇祯皇帝模拟器 - 开发计划

## 已完成功能模块

### 核心引擎

| 模块 | 文件 | 状态 | 说明 |
|------|------|------|------|
| 游戏主循环 | `src/core/gameLoop.ts` | ✅ | 回合结算：税收→财政→省份→大臣→国策→事件→日期推进→存档 |
| 事件总线 | `src/core/eventBus.ts` | ✅ | 组件间事件通信（turn:end, tax:calculated 等） |
| 类型定义 | `src/core/types.ts` | ✅ | 全局类型系统 |
| 变更队列 | `src/engine/ChangeQueue.ts` | ✅ | 单例模式，所有玩家操作入队，四步结算流水线 |
| 会计引擎 | `src/engine/AccountingSystem.ts` | ✅ | 财务总账，区分黄金/粮食资产 |

### 业务系统

| 模块 | 文件 | 状态 | 说明 |
|------|------|------|------|
| 税收系统 | `src/systems/taxSystem.ts` | ✅ | 省份税收计算，贪腐/天灾/民心系数 |
| 财政系统 | `src/systems/financeSystem.ts` | ✅ | 国库收支，军费/俸禄/赈灾/边防 |
| 朝廷系统 | `src/systems/courtSystem.ts` | ✅ | 奏报调度，按优先级排序 |
| 剧本引擎 | `src/systems/scenarioEngine.ts` | ✅ | 势力/人物/事件触发与状态管理 |
| 政策系统 | `src/systems/policySystem.ts` | ✅ | 国策研究进度推进 |

### 数据层

| 模块 | 文件 | 状态 | 说明 |
|------|------|------|------|
| SQLite数据库 | `src/db/database.ts` | ✅ | 客户端存储，provinces/transactions/snapshots 表 |
| 游戏配置 | `src/config/gameConfig.ts` | ✅ | NPC/Province/Nation/GameOver 全量配置常量 |
| 历史人物数据 | `src/data/scenario/historicalCharacters.ts` | ✅ | 86位官员初始数值 |
| 国策数据 | `src/data/policies/nationalPolicies.ts` | ✅ | 50+项国策定义 |
| 明代地理数据 | `src/data/geojson/` | ✅ | GeoJSON + factions_config + geoProcessor |

### UI 面板

| 模块 | 文件 | 状态 | 说明 |
|------|------|------|------|
| 主布局 | `src/components/layout/Layout.tsx` | ✅ | h-screen 固定高度布局 |
| 状态栏 | `src/components/layout/StatusBar.tsx` | ✅ | 威望/民心/国库/军力/边患 |
| 底部操作栏 | `src/components/layout/BottomBar.tsx` | ✅ | 结束回合/设置按钮 |
| 导航标签 | `src/components/navigation/NavigationTabs.tsx` | ✅ | 多面板切换 |
| 皇极殿 | `src/components/panels/CourtPanel.tsx` | ✅ | 朝会流程：宣旨→奏对讨论→圣裁决策→退朝 |
| 众正盈朝 | `src/components/panels/OfficialsPanel.tsx` | ✅ | 官职体系 + 大臣任免 |
| 国策树 | `src/components/panels/PolicyTreePanel.tsx` | ✅ | 分类显示/研究进度/前置条件 |
| 地图 | `src/components/map/GameMap.tsx` | ✅ | Leaflet + 明代疆域 + 热力图模式 |
| 省份面板 | `src/components/province/ProvincePanel.tsx` | ✅ | 滑出式详情面板 |
| 军事面板 | `src/components/panels/MilitaryPanel.tsx` | ✅ | 兵力统计/将领信息 |
| 财政面板 | `src/components/finance/FinancePanel.tsx` | ✅ | 收支总览 + 朝政日志抽屉 |
| 事件面板 | `src/components/event/EventPanel.tsx` | ✅ | 剧本事件展示与决策 |
| 大臣对话 | `src/components/minister/MinisterChatPanel.tsx` | ✅ | LLM对话界面 |
| 设置面板 | `src/components/settings/SettingsPanel.tsx` | ✅ | 存档/模式/LLM配置/主题 |
| 调试面板 | `src/components/debug/DebugPanel.tsx` | ✅ | 开发调试工具 |

### 状态管理 (Zustand)

| Store | 文件 | 状态 |
|-------|------|------|
| gameStore | `src/store/gameStore.ts` | ✅ |
| provinceStore | `src/store/provinceStore.ts` | ✅ |
| financeStore | `src/store/financeStore.ts` | ✅ |
| courtStore | `src/store/courtStore.ts` | ✅ |
| policyStore | `src/store/policyStore.ts` | ✅ |
| navigationStore | `src/store/navigationStore.ts` | ✅ |
| themeStore | `src/store/themeStore.ts` | ✅ |

### AI 接口

| 模块 | 文件 | 状态 | 说明 |
|------|------|------|------|
| LLM客户端 | `src/api/llmClient.ts` | ✅ | OpenAI/DeepSeek多模型支持 |
| Schema验证 | `src/api/schemas.ts` | ✅ | Zod数据校验 |
| 事件上下文 | `src/api/eventContext.ts` | ✅ | 游戏状态→LLM上下文转换 |

### 剧本系统

| 模块 | 文件 | 状态 | 说明 |
|------|------|------|------|
| 朝会剧本框架 | CourtMemorial / MemorialChoice 接口 | ✅ | 太监宣旨→大臣奏对→皇帝决策→结果展示 |
| 剧本事件框架 | ScriptedEvent 接口 | ✅ | 触发条件(静态+动态)/升级/中断/连锁/unlocks-locks分支 |
| 效果系统 | GameEffect / OptionEffect | ✅ | Treasury/Province/Nation/Minister 四大类型 |
| 框架文档 | [docs/scenario-framework.md](ChongzhenSim/docs/scenario-framework.md) | ✅ | 8大章节完整文档 |
| 快速参考 | [docs/scenario-quick-reference.md](ChongzhenSim/docs/scenario-quick-reference.md) | ✅ | 模板/效果速查/数值参考/检查清单 |
| 朝会模板 | `src/data/scenario/template-turn-script.ts` | ✅ | 含3个示例奏折占位符 |
| 事件模板 | `src/data/scenario/template-scripted-event.ts` | ✅ | 含5个实际示例 |
| 第1天剧本 | `src/data/scenario/day1Script.ts` | ✅ | 3条奏折（魏忠贤/陕西旱灾/辽东军饷） |
| 剧本事件库 | `src/data/scenario/scriptedEvents.ts` | ✅ | 初始事件集 |
| 朝堂流程文档 | [docs/court-flow.md](ChongzhenSim/docs/court-flow.md) | ✅ | 入场→奏对→圣裁→效果→退朝完整流程 |

---

## 进行中功能模块

### 夏银/秋粮结算与朝堂裁决

| 功能点 | 状态 | 说明 |
|--------|------|------|
| 夏银/秋粮双结算节点 | ✅ | gameLoop 中按回合判定结算时机 |
| 结算税率状态管理 | ✅ | 税率仅结算时生效 |
| 税率历史记录 | ✅ | taxRateHistory 表写入 |
| 省级税率调整 | ✅ | 通过朝堂税务议题事件触发 |
| 税率→民心联动 | ✅ | 提升税率降民心，降低税率升民心 |
| 废除省份实时调税入口 | ✅ | ProvincePanel 仅展示当前税率 |
| 朝堂多阶段UI流程 | ✅ | CourtPanel 重构为 奏对讨论 → 圣裁决策 |
| 戏剧性朝堂体验 | ✅ | 太监宣旨/皇帝御座/大臣顺序表达 |
| 派系观点表达 | ✅ | 支持方/反对方观点展示 |
| 皇帝圣裁决策 | ✅ | 选择一方 or 直接下令（LLM独占） |
| 忠诚度反馈 | ✅ | 采纳派+忠诚，对立派-忠诚 |
| 圣旨立即生效 | ✅ | 选择后立即显示效果预览 |
| LLM自拟圣旨接口 | ⚠️ 占位 | UI入口已保留，推理逻辑未实现 |
| 圣旨与结算/税率/忠诚度深度联动 | ⏳ 待完成 | |
| 流程端到端验证 | ⏳ 待完成 | |

---

## 待开发功能模块

### 核心系统完善

| 任务 | 状态 | 说明 |
|------|------|------|
| 圣旨生成与发布机制 | ⏳ | 设计诏书生成UI |
| 圣旨→结算/税率/忠诚度联动 | ⏳ | 让诏书驱动核心数据变更 |
| 历史操作记录与日志展示 | ⏳ | 圣旨执行日志 |
| ESLint + 类型检查全量通过 | ⏳ | Phase 2验收标准 |
| 夏银/秋粮结算手动验证 | ⏳ | 端到端流程走通 |
| 朝堂反馈准确性验证 | ⏳ | 忠诚度/民心变化正确性 |
| 体验问题修复 | ⏳ | 决策流优化 |

---

### 后续开发方向

#### LLM 动态内容实装

| 功能 | 优先级 | 状态 |
|------|--------|------|
| 多模型切换完善（OpenAI/DeepSeek） | 高 | ⏳ |
| Token消耗统计与成本控制 | 高 | ⏳ |
| 动态事件生成（基于游戏状态） | 高 | ⏳ |
| Prompt模板库设计 | 中 | ⏳ |
| 事件验证系统集成 | 中 | ⏳ |
| 大臣对话性格系统 | 中 | ⏳ |
| 对话历史上下文管理 | 低 | ⏳ |

#### 本地化剧本编写

| 功能 | 优先级 | 状态 |
|------|--------|------|
| 崇祯元年～三年核心剧情 | 高 | ⏳ |
| 关键历史事件节点（阉党案/陕西民变/己巳之变） | 高 | ⏳ |
| 多结局分支设计 | 高 | ⏳ |
| 数值平衡调优 | 中 | ⏳ |
| 双模式切换（LLM/本地） | 中 | ⏳ |
| 剧本热加载与版本管理 | 低 | ⏳ |
| 可视化剧本编辑器（可选） | 低 | ⏳ |

#### 测试体系

| 功能 | 优先级 | 状态 |
|------|--------|------|
| Vitest 引入与配置 | 高 | ⏳ |
| 核心业务逻辑单元测试（Tax/Accounting/ChangeQueue） | 高 | ⏳ |
| CI/CD 测试流水线 | 中 | ⏳ |
| 目标覆盖率 > 80% | 中 | ⏳ |

---

## 里程碑时间线

```
2026-04-05 ──── v0.2.4 剧本框架完成
     │
     ├─ 阶段一: 核心系统完善 (当前)
     │    ├─ ✓ M1.1 结算与税率基础 ────── (已完成)
     │    ├─ ✓ M1.2 朝堂讨论与裁决 ────── (已完成)
     │    ├─ ⚠️ M1.3 圣旨与流程联动 ───── (部分完成)
     │    └─ ⏳ M1.4 验证与优化 ────────── (待完成)
     │
     ├─ 阶段二: AI功能集成 (预计 8月 - 9月) ───── ⏳
     ├─ 阶段三: 本地化剧本 (预计 10月 - 11月) ── ⏳
     └─ 阶段四: 测试与发布 (预计 12月 - ) ─────── ⏳
```

---

*本文档仅记录开发计划与进度。项目介绍见 README.md，更新日志见 CHANGELOG.md，架构说明见 docs/ARCHITECTURE.md。*
