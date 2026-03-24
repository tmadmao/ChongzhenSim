# 崇祯皇帝模拟器 ChongzhenSim-v2

> ⚠️ **声明：本游戏当前版本处于框架构建阶段，尚不可游玩。**

一款基于 React + TypeScript 的历史策略模拟游戏，让玩家扮演明朝崇祯皇帝，在风雨飘摇的明末时局中力挽狂澜。

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff.svg)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📖 目录

- [游戏简介](#游戏简介)
- [技术栈](#技术栈)
- [项目架构](#项目架构)
- [核心系统](#核心系统)
- [数据流设计](#数据流设计)
- [快速开始](#快速开始)
- [配置说明](#配置说明)
- [开发指南](#开发指南)
- [更新日志](CHANGELOG.md)

---

## 游戏简介

**崇祯皇帝模拟器** 是一款历史策略模拟游戏，背景设定在明朝崇祯年间（1628-1644）。玩家将扮演崇祯皇帝朱由检，面对内有农民起义、外有后金虎视眈眈的危局，通过税收调整、官员任免、发布诏书等决策，试图拯救这个摇摇欲坠的帝国。

### 核心玩法

- **回合制决策**：每个回合分为早朝、午朝、夜议三个时段
- **省份管理**：调整各省税率，应对民变和天灾
- **官员系统**：86位历史官员，分属东林党、阉党、中立等派系
- **AI 剧情生成**：基于 Vercel AI SDK 的动态事件系统
- **财政管理**：平衡国库收支，应对军费、赈灾等开支

---

## 技术栈

| 类别 | 技术 | 版本 | 说明 |
|------|------|------|------|
| **前端框架** | React | 19.x | UI 组件化开发 |
| **构建工具** | Vite | 6.x | 快速开发构建 |
| **语言** | TypeScript | 5.9 | 类型安全 |
| **状态管理** | Zustand | 5.x | 轻量级状态管理 |
| **样式** | Tailwind CSS | 4.x | 原子化 CSS |
| **数据库** | sql.js | 1.x | 浏览器端 SQLite |
| **地图** | Leaflet | 1.x | 交互式地图可视化 |
| **图表** | Recharts | 3.x | 数据可视化 |
| **AI 接口** | Vercel AI SDK | 6.x | LLM 集成 |
| **数据验证** | Zod | 4.x | Schema 验证 |

---

## 项目架构

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
│   │   └── financeSystem.ts    # 财政系统
│   │
│   ├── store/                  # Zustand 状态管理
│   │   ├── gameStore.ts        # 主游戏状态
│   │   ├── provinceStore.ts    # 省份状态
│   │   ├── financeStore.ts     # 财政状态
│   │   ├── navigationStore.ts  # 导航状态
│   │   └── themeStore.ts       # 主题状态
│   │
│   ├── db/                     # 数据库层
│   │   └── database.ts         # SQLite 初始化与操作
│   │
│   ├── data/                   # 静态数据
│   │   ├── provinces.json      # 16省初始数据
│   │   ├── characters.json     # 86位官员数据
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
└── README.md                   # 项目说明
```

---

## 核心系统

### 1. 游戏主循环 (GameLoop)

游戏主循环是整个游戏的中枢，每次玩家点击「结束回合」时执行一次完整的 `tick()`：

```
┌─────────────────────────────────────────────────────────────┐
│                     GameLoop.tick()                         │
├─────────────────────────────────────────────────────────────┤
│  Phase 1: 税收阶段                                          │
│    ├── 计算各省税收（人口 × 税率 × 贪腐系数 × 天灾惩罚）     │
│    ├── 更新国库                                              │
│    └── 触发 tax:calculated 事件                              │
├─────────────────────────────────────────────────────────────┤
│  Phase 2: 支出阶段                                          │
│    ├── 计算军费、俸禄、赈灾、边防支出                        │
│    ├── 扣除国库                                              │
│    └── 触发 finance:updated 事件                             │
├─────────────────────────────────────────────────────────────┤
│  Phase 3: 省份状态更新                                      │
│    ├── 民乱自然衰减/增长                                     │
│    ├── 天灾恢复/恶化                                         │
│    └── 触发 province:updated 事件                            │
├─────────────────────────────────────────────────────────────┤
│  Phase 4: 全国指数更新                                      │
│    ├── 军力、民心、边患、贪腐、农业产出                      │
│    └── 触发 nation:updated 事件                              │
├─────────────────────────────────────────────────────────────┤
│  Phase 5: 大臣状态更新                                      │
│    ├── 忠诚度波动                                            │
│    ├── 贪腐度变化                                            │
│    └── 触发 minister:updated 事件                            │
├─────────────────────────────────────────────────────────────┤
│  Phase 6: 日期推进                                          │
│    ├── 时段切换 (morning → afternoon → night)               │
│    └── 月份推进                                              │
├─────────────────────────────────────────────────────────────┤
│  Phase 7: 存档快照                                          │
│    └── 保存完整 GameState 到 SQLite                          │
├─────────────────────────────────────────────────────────────┤
│  Phase 8: 游戏结束检查                                      │
│    ├── 国库破产检测                                          │
│    ├── 民心崩溃检测                                          │
│    └── 边患失控检测                                          │
└─────────────────────────────────────────────────────────────┘
```

### 2. 税收系统 (TaxSystem)

税收计算公式：

```typescript
实际税收 = 基础税收 × (1 - 贪腐系数) × (1 - 天灾惩罚) × 民心系数

其中：
- 基础税收 = 人口 × 税率 × 0.1（单位：万两）
- 贪腐系数 = corruptionLevel / 200
- 天灾惩罚 = disasterLevel × 0.1
- 民心系数 = max(0.3, peopleMorale / 100)
```

### 3. 财政系统 (FinanceSystem)

支出计算：

```typescript
总支出 = 军费 + 俸禄 + 赈灾 + 边防

其中：
- 军费 = 全国驻军总数 × 0.5 万两/千人
- 俸禄 = 大臣数量 × 固定额度
- 赈灾 = Σ(高灾省份 × 救济系数)
- 边防 = borderThreat × 系数
```

### 4. AI 事件系统

使用 Vercel AI SDK 的 `generateObject` 实现结构化输出：

```typescript
// Zod Schema 定义
const AIEventResponseSchema = z.object({
  narrative: z.string(),                              // 剧情文本 200-400 字
  mood: z.enum(['crisis', 'normal', 'opportunity', 'warning']),
  choices: z.array(ChoiceSchema).min(2).max(4),       // 2-4个选项
  immediateEffects: z.array(GameEffectSchema),        // 即时效果
  ministersInvolved: z.array(z.string()).optional()   // 涉及的大臣
});

// AI 调用
const { object } = await generateObject({
  model: provider('gpt-4o'),
  schema: AIEventResponseSchema,
  system: SYSTEM_PROMPT,
  prompt: buildUserPrompt(context),
  maxRetries: 2,
});
```

---

## 数据流设计

### 状态管理架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Zustand Stores                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ gameStore   │  │provinceStore│  │financeStore │         │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤         │
│  │ gameState   │  │ provinces   │  │ treasury    │         │
│  │ isLoading   │  │ selectedId  │  │ chartData   │         │
│  │ turnLog     │  │ filterRegion│  │ health      │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                 │
│         └────────────────┼────────────────┘                 │
│                          │                                  │
│                          ▼                                  │
│              ┌─────────────────────┐                       │
│              │   SQLite (sql.js)   │                       │
│              │   ┌───────────────┐ │                       │
│              │   │ provinces     │ │                       │
│              │   │ transactions  │ │                       │
│              │   │ snapshots     │ │                       │
│              │   └───────────────┘ │                       │
│              └─────────────────────┘                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 事件驱动架构

```typescript
// 事件总线
eventBus.emit('turn:end', { turn, logs });
eventBus.on('tax:calculated', handler);

// 事件类型
type GameEventType =
  | 'turn:start' | 'turn:end'
  | 'tax:calculated' | 'finance:updated'
  | 'province:updated' | 'minister:updated'
  | 'event:generated' | 'choice:selected'
  | 'game:over' | 'error';
```

---

## 快速开始

### 环境要求

- Node.js >= 18.x
- npm >= 9.x

### 安装依赖

```bash
git clone https://github.com/tmadmao/HistorySimAI.git
cd HistorySimAI/ChongzhenSim-v2
npm install
```

### 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# OpenAI API（推荐）
VITE_OPENAI_API_KEY=sk-xxxxx

# 或使用 DeepSeek API
VITE_DEEPSEEK_API_KEY=sk-xxxxx
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173 开始游戏。

### 构建生产版本

```bash
npm run build
npm run preview
```

---

## 配置说明

### AI 模型配置

项目支持 OpenAI 和 DeepSeek 两种 API：

```typescript
// src/api/llmClient.ts
const provider = process.env.VITE_DEEPSEEK_API_KEY
  ? createOpenAI({
      apiKey: process.env.VITE_DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com/v1',
    })
  : createOpenAI();
```

### 游戏配置

```typescript
// src/core/types.ts
export const GameConfig = {
  MAX_TAX_RATE: 0.8,           // 最高税率 80%
  MIN_TAX_RATE: 0,             // 最低税率 0%
  INITIAL_GOLD: 800,           // 初始国库 800万两
  INITIAL_GRAIN: 500,          // 初始粮仓 500万石
  GAME_OVER_GOLD_THRESHOLD: 0, // 国库归零游戏结束
  GAME_OVER_MORALE_THRESHOLD: 10, // 民心低于10游戏结束
  GAME_OVER_BORDER_THRESHOLD: 100, // 边患达到100游戏结束
};
```

---

## 开发指南

### 添加新省份

编辑 `src/data/provinces.json`：

```json
{
  "id": "new_province",
  "name": "新省份",
  "population": 500,
  "taxRate": 0.25,
  "granaryStock": 100,
  "civilUnrest": 20,
  "militaryForce": 30,
  "disasterLevel": 0,
  "corruptionLevel": 25,
  "coordinates": { "lat": 35.0, "lng": 115.0 },
  "region": "north"
}
```

### 添加新官员

编辑 `src/data/characters.json`：

```json
{
  "id": "new_minister",
  "name": "新官员",
  "title": "兵部尚书",
  "faction": "donglin",
  "factionLabel": "东林党",
  "loyalty": 70,
  "competence": 80,
  "corruption": 20,
  "relationship": 30,
  "isAlive": true,
  "department": "six_ministries",
  "positions": [{ "title": "兵部尚书", "department": "six_ministries", "rank": 2, "isPrimary": true }],
  "summary": "官员简介..."
}
```

### 添加新诏书

编辑 `src/components/decree/DecreePanel.tsx`：

```typescript
const decreeOptions: DecreeOption[] = [
  {
    id: 'new_decree',
    title: '新诏书',
    description: '诏书效果描述',
    effects: [
      { type: 'nation', field: 'peopleMorale', delta: 10, description: '民心 +10' }
    ],
    cost: 50,
    requirements: { minGold: 100 }
  },
  // ...
];
```

---

## 项目特色

### 🏛️ 历史还原

- 86位真实历史人物，包括温体仁、周延儒、洪承畴、卢象升等
- 基于明崇祯年间的真实政治格局
- 东林党、阉党、军事将领等派系斗争

### 🎮 策略深度

- 多维度决策：税收、军事、民生、官员
- 派系影响：不同派系官员对不同决策有不同反应
- 连锁反应：一个决策可能引发后续事件

### 🤖 AI 驱动

- 动态事件生成：每回合都有独特的朝廷事件
- 智能对话：与大臣进行有深度的对话
- 历史感叙事：AI 生成的剧情符合明末历史背景

---

## 许可证

MIT License

---

## 致谢

- 历史数据参考自《明史》等史料
- UI 设计灵感来源于故宫博物院藏品
- 感谢所有贡献者

---

*大明崇祯元年，天下初定。然内有流寇四起，外有后金虎视眈眈。你能否力挽狂澜，拯救这摇摇欲坠的大明江山？*
