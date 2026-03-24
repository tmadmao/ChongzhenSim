# 崇祯皇帝模拟器 - 开发计划文档

## 📋 目录

- [项目概述](#项目概述)
- [开发计划与里程碑](#开发计划与里程碑)
- [功能模块说明](#功能模块说明)
- [系统流程](#系统流程)
- [目录结构](#目录结构)
- [技术栈](#技术栈)
- [开发规范](#开发规范)
- [测试计划](#测试计划)
- [部署计划](#部署计划)

## 项目概述

**崇祯皇帝模拟器**是一款基于 React + TypeScript 的历史策略模拟游戏，让玩家扮演明朝崇祯皇帝，在风雨飘摇的明末时局中力挽狂澜。

### 核心目标

- 还原明末崇祯年间的历史背景和政治格局
- 提供沉浸式的皇帝角色扮演体验
- 实现复杂的国家管理和决策系统
- 利用 AI 技术增强游戏的剧情和交互体验
- 构建稳定、可维护的代码架构

### 项目状态

- **当前版本**：ChongzhenSim-v2.0.3（核心系统验证阶段）
- **开发状态**：进行中
- **预计完成时间**：2026年

### 近期开发计划

#### 1. 税收与财政结算系统重构
**目标**：将粮食与国库银两收入改为一年两次结算机制，引入朝堂廷议与圣旨生效流程。

**主要任务**：
- **年度结算机制**：建立夏税、秋粮两次年度结算周期
- **税率冻结机制**：结算时按结算时点税率计算
- **税率调整流程**：废除省份面板手动税率调节功能
- **朝堂廷议系统**：税率调整需通过朝堂廷议提出
- **圣旨生效机制**：廷议通过后需下圣旨方能生效
- **历史追溯**：支持查询历年税率与收入记录

**技术实现要点**：
- 扩展 gameConfig.ts 配置夏税/秋粮时间节点
- 新增 taxRateHistory 表记录税率变更历史
- 实现廷议流程状态管理
- 圣旨生效时间戳与回滚机制

---

#### 2. LLM 动态生成功能实装
**目标**：集成大语言模型，实现动态事件生成与智能交互。

**主要任务**：
- **LLM 接口封装**：完善 llmClient.ts，支持多模型切换（OpenAI、DeepSeek 等）
- **动态事件生成**：根据当前游戏状态生成个性化历史事件
- **大臣智能对话**：实现与大臣的自然语言对话系统
- **剧情生成引擎**：基于历史背景生成连贯剧情分支
- **提示工程**：设计游戏特定的 Prompt 模板库
- **成本控制**：实现 Token 消耗统计与缓存机制

**技术实现要点**：
- 完善 LLM API 错误处理与降级策略
- 实现 Prompt 版本管理与 A/B 测试框架
- 建立对话历史上下文管理
- 集成事件验证与效果解析系统

---

#### 3. 本地化剧本系统（非 LLM 模式）
**目标**：构建纯本地化剧本系统，无需 LLM 即可体验完整游戏内容。

**主要任务**：
- **剧本数据结构设计**：定义剧本事件、分支、条件的完整数据结构
- **核心剧本编写**：
  - 崇祯元年至崇祯三年核心剧情
  - 关键历史事件节点（阉党案、陕西民变、己巳之变等）
  - 多结局分支设计
- **事件编辑器工具**：开发可视化剧本编辑工具（可选）
- **剧本验证系统**：自动检查剧本逻辑连贯性与数值平衡性
- **双模式支持**：实现 LLM 模式与本地化模式的无缝切换

**技术实现要点**：
- 设计可扩展的剧本 DSL（领域特定语言）
- 实现剧本热加载与动态更新
- 建立剧本版本管理与迁移机制
- 支持模组化剧本扩展

## 开发计划与里程碑

### 阶段一：基础框架构建（已完成）

- [x] 项目初始化与技术栈搭建
- [x] 核心类型定义与状态管理
- [x] 游戏主循环实现
- [x] 基础UI组件开发
- [x] 地图系统集成

### 阶段二：核心系统开发（进行中）

- [x] 税收系统
- [x] 财政系统
- [x] 省份管理系统
- [x] 大臣系统
- [x] 国策系统
- [ ] 剧本引擎完善
- [ ] 事件系统
- [ ] 诏书系统

### 阶段三：AI 功能集成

- [ ] LLM 接口封装
- [ ] 动态事件生成
- [ ] 大臣对话系统
- [ ] 剧情生成系统

### 阶段四：游戏内容填充

- [ ] 历史人物数据完善
- [ ] 剧本事件编写
- [ ] 国策树设计
- [ ] 省份数据细化

### 阶段五：测试与优化

- [ ] 功能测试
- [ ] 性能优化
- [ ] 平衡调整
- [ ] 用户体验优化

### 阶段六：发布与维护

- [ ] 生产环境构建
- [ ] 部署上线
- [ ] 文档完善
- [ ] 后续更新计划

## 功能模块说明

### 1. 核心系统

#### 游戏主循环 (GameLoop)

- **功能**：管理游戏的回合流程，协调各个系统的运行
- **流程**：税收计算 → 支出计算 → 省份更新 → 国家状态更新 → 大臣状态更新 → 国策研究 → 剧本事件 → 日期推进 → 存档 → 游戏结束检查
- **文件**：`src/core/gameLoop.ts`

#### 剧本引擎 (ScenarioEngine)

- **功能**：管理势力、人物、事件的触发和状态变化
- **流程**：检查势力加入/灭亡 → 检查人物登场/退出 → 检查事件触发 → 检查事件升级
- **文件**：`src/systems/scenarioEngine.ts`

#### 税收系统 (TaxSystem)

- **功能**：计算各省税收，处理税收相关逻辑
- **公式**：实际税收 = 基础税收 × (1 - 贪腐系数) × (1 - 天灾惩罚) × 民心系数
- **文件**：`src/systems/taxSystem.ts`

#### 财政系统 (FinanceSystem)

- **功能**：管理国库收支，计算各项支出
- **支出**：军费、俸禄、赈灾、边防
- **文件**：`src/systems/financeSystem.ts`

### 2. 界面模块

#### 皇极殿 (CourtPanel)

- **功能**：主界面，显示剧本事件和大臣奏对
- **组件**：事件显示、大臣对话、决策选项、回合结束
- **文件**：`src/components/panels/CourtPanel.tsx`

#### 众正盈朝 (OfficialsPanel)

- **功能**：官员管理界面，显示和管理大臣
- **组件**：官员列表、详细信息、任免操作
- **文件**：`src/components/panels/OfficialsPanel.tsx`

#### 国策树 (PolicyTreePanel)

- **功能**：国策研究界面，显示和研究国家政策
- **组件**：政策分类、政策卡片、研究进度
- **文件**：`src/components/panels/PolicyTreePanel.tsx`

#### 坤舆万国全图 (GameMap)

- **功能**：地图界面，显示国家疆域和省份信息
- **组件**：地图显示、省份高亮、信息面板
- **文件**：`src/components/map/GameMap.tsx`

#### 军事 (MilitaryPanel)

- **功能**：军事管理界面，显示和管理军队
- **组件**：军队列表、将领信息、军事行动
- **文件**：`src/components/panels/MilitaryPanel.tsx`

### 3. 辅助系统

#### 状态管理 (Zustand Stores)

- **功能**：管理游戏状态，提供状态更新和访问
- **存储**：gameStore、provinceStore、financeStore、navigationStore、themeStore
- **文件**：`src/store/`

#### 事件总线 (EventBus)

- **功能**：处理系统间通信，分发事件
- **事件**：turn:end、tax:calculated、finance:updated 等
- **文件**：`src/core/eventBus.ts`

#### 数据库 (SQLite)

- **功能**：存储游戏数据，实现存档功能
- **表结构**：provinces、transactions、snapshots
- **文件**：`src/db/database.ts`

#### AI 接口 (LLM Client)

- **功能**：与大语言模型交互，生成事件和对话
- **API**：OpenAI、DeepSeek
- **文件**：`src/api/llmClient.ts`

## 系统流程

### 游戏启动流程

1. 加载游戏配置和初始数据
2. 初始化状态管理和数据库
3. 渲染主界面（皇极殿）
4. 显示游戏开始事件

### 回合流程

1. **早朝**：处理剧本事件，大臣奏对
2. **午朝**：处理国家管理（税收、财政、军事等）
3. **夜议**：处理国策研究，准备结束回合
4. **结束回合**：执行游戏主循环，推进时间

### 事件处理流程

1. 剧本引擎检查事件触发条件
2. 触发事件，显示事件内容
3. 玩家选择决策选项
4. 应用选项效果
5. 更新游戏状态
6. 记录事件结果

### 国策研究流程

1. 玩家选择可研究的国策
2. 检查研究条件（前置国策、费用等）
3. 扣除研究费用
4. 开始研究（设置研究状态）
5. 每回合推进研究进度
6. 研究完成，应用国策效果

## 目录结构

```
ChongzhenSim-v2/
├── src/
│   ├── api/                    # AI 接口层
│   │   ├── schemas.ts          # Zod Schema 定义
│   │   ├── eventContext.ts     # 事件上下文构建
│   │   ├── llmClient.ts        # LLM 客户端封装
│   │   └── index.ts            # 统一导出
│   │
│   ├── components/             # React 组件
│   │   ├── layout/             # 布局组件
│   │   │   ├── Layout.tsx      # 主布局
│   │   │   ├── StatusBar.tsx   # 顶部状态栏
│   │   │   └── BottomBar.tsx   # 底部操作栏
│   │   ├── map/                # 地图组件
│   │   │   ├── GameMap.tsx     # 明代疆域地图
│   │   │   └── ProvinceInfoPanel.tsx # 省份信息面板
│   │   ├── navigation/         # 导航组件
│   │   │   └── NavigationTabs.tsx
│   │   ├── panels/             # 功能面板
│   │   │   ├── CourtPanel.tsx  # 皇极殿
│   │   │   ├── OfficialsPanel.tsx  # 众正盈朝
│   │   │   ├── MilitaryPanel.tsx   # 军事面板
│   │   │   └── PolicyTreePanel.tsx # 国策树
│   │   ├── province/           # 省份面板
│   │   │   └── ProvincePanel.tsx
│   │   ├── finance/            # 财政面板
│   │   │   └── FinancePanel.tsx
│   │   ├── event/              # 事件面板
│   │   │   └── EventPanel.tsx
│   │   ├── minister/           # 大臣对话
│   │   │   └── MinisterChatPanel.tsx
│   │   ├── decree/             # 诏书系统
│   │   │   └── DecreePanel.tsx
│   │   ├── log/                # 日志面板
│   │   │   └── LogPanel.tsx
│   │   └── index.ts            # 组件导出
│   │
│   ├── core/                   # 核心逻辑
│   │   ├── types.ts            # 全局类型定义
│   │   ├── gameLoop.ts         # 游戏主循环
│   │   └── eventBus.ts         # 事件总线
│   │
│   ├── systems/                # 游戏系统
│   │   ├── taxSystem.ts        # 税收系统
│   │   ├── financeSystem.ts    # 财政系统
│   │   └── scenarioEngine.ts   # 剧本引擎
│   │
│   ├── store/                  # Zustand 状态管理
│   │   ├── gameStore.ts        # 主游戏状态
│   │   ├── provinceStore.ts    # 省份状态
│   │   ├── financeStore.ts     # 财政状态
│   │   ├── navigationStore.ts  # 导航状态
│   │   ├── policyStore.ts      # 国策状态
│   │   └── themeStore.ts       # 主题状态
│   │
│   ├── db/                     # 数据库层
│   │   └── database.ts         # SQLite 初始化与操作
│   │
│   ├── data/                   # 静态数据
│   │   ├── provinces.json      # 16省初始数据
│   │   ├── characters.json     # 86位官员数据
│   │   ├── policies/           # 国策数据
│   │   │   └── nationalPolicies.ts
│   │   ├── scenario/           # 剧本数据
│   │   │   ├── factions.ts
│   │   │   ├── historicalCharacters.ts
│   │   │   ├── nationalPolicies.ts
│   │   │   ├── openingState.ts
│   │   │   └── scriptedEvents.ts
│   │   └── geojson/            # 地理数据
│   │       ├── china_provinces.json
│   │       ├── world_countries.json
│   │       ├── factions_config.ts
│   │       └── geoProcessor.ts
│   │
│   ├── App.tsx                 # 根组件
│   ├── main.tsx                # 入口文件
│   └── index.css               # 全局样式
│
├── public/                     # 静态资源
├── .env.example                # 环境变量示例
├── package.json                # 项目配置
├── tsconfig.json               # TypeScript 配置
├── vite.config.ts              # Vite 配置
├── tailwind.config.js          # Tailwind 配置
├── CHANGELOG.md                # 更新日志
├── README.md                   # 项目说明
└── DEVELOPMENT_PLAN.md         # 开发计划
```

## 技术栈

| 类别        | 技术            | 版本   | 说明          |
| --------- | ------------- | ---- | ----------- |
| **前端框架**  | React         | 19.x | UI 组件化开发    |
| **构建工具**  | Vite          | 6.x  | 快速开发构建      |
| **语言**    | TypeScript    | 5.9  | 类型安全        |
| **状态管理**  | Zustand       | 5.x  | 轻量级状态管理     |
| **样式**    | Tailwind CSS  | 4.x  | 原子化 CSS     |
| **数据库**   | sql.js        | 1.x  | 浏览器端 SQLite |
| **地图**    | Leaflet       | 1.x  | 交互式地图可视化    |
| **图表**    | Recharts      | 3.x  | 数据可视化       |
| **AI 接口** | Vercel AI SDK | 6.x  | LLM 集成      |
| **数据验证**  | Zod           | 4.x  | Schema 验证   |

## 开发规范

### 代码规范

- **TypeScript**：严格使用类型定义，避免 any 类型
- **ESLint**：遵循项目的 ESLint 配置
- **Prettier**：使用 Prettier 格式化代码
- **命名规范**：
  - 组件名：PascalCase
  - 变量名：camelCase
  - 常量名：UPPER\_SNAKE\_CASE
  - 文件名：kebab-case

### 开发流程

1. **分支管理**：
   - `main`：主分支，稳定版本
   - `develop`：开发分支，集成新功能
   - `feature/*`：特性分支，开发具体功能
   - `fix/*`：修复分支，修复 bug
2. **提交规范**：
   - 格式：`type(scope): description`
   - 类型：feat（新功能）、fix（修复）、docs（文档）、style（样式）、refactor（重构）、test（测试）、chore（构建）
3. **代码审查**：
   - 所有代码必须经过审查才能合并到 develop 分支
   - 审查重点：代码质量、类型安全、性能优化、功能正确性

### 测试规范

- **单元测试**：使用 Vitest 编写单元测试
- **测试覆盖率**：核心功能覆盖率不低于 80%
- **集成测试**：测试系统间的交互
- **端到端测试**：使用 Playwright 测试完整流程

## 测试计划

### 功能测试

- [ ] 游戏主循环测试
- [ ] 税收系统测试
- [ ] 财政系统测试
- [ ] 剧本引擎测试
- [ ] 国策系统测试
- [ ] 事件系统测试
- [ ] 大臣系统测试
- [ ] 省份管理测试

### 性能测试

- [ ] 游戏循环性能
- [ ] 地图渲染性能
- [ ] AI 响应时间
- [ ] 内存使用情况

### 兼容性测试

- [ ] 主流浏览器兼容性
- [ ] 不同屏幕尺寸适配
- [ ] 移动设备支持

## 部署计划

### 开发环境

- **本地开发**：`npm run dev`
- **构建测试**：`npm run build && npm run preview`

### 生产环境

- **构建**：`npm run build`
- **部署**：静态网站托管（Vercel、Netlify、GitHub Pages 等）
- **环境变量**：生产环境 API 密钥配置

### 版本管理

- **版本号**：遵循语义化版本规范（MAJOR.MINOR.PATCH）
- **更新日志**：每次版本更新必须更新 CHANGELOG.md
- **发布流程**：
  1. 更新版本号
  2. 更新 CHANGELOG.md
  3. 构建生产版本
  4. 部署到生产环境
  5. 创建 GitHub Release

***

*本开发计划文档将根据项目进展不断更新和完善。*
