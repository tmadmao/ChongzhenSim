# 崇祯皇帝模拟器 ChongzhenSim

> ⚠️ **声明：本游戏当前版本处于框架构建阶段，尚不可游玩。**

一款基于 React + TypeScript 的历史策略模拟游戏，让玩家扮演明朝崇祯皇帝，在风雨飘摇的明末时局中力挽狂澜。

## 📋 项目概览

- **项目状态**：框架构建阶段
- **技术栈**：React 19 + TypeScript 5.9 + Vite 6 + Zustand 5 + Tailwind CSS 4
- **核心功能**：回合制决策、省份管理、官员系统、AI剧情生成、财政管理

## 🚀 快速开始

### 环境要求
- Node.js >= 18.x
- npm >= 9.x

### 安装依赖
```bash
npm install
```

### 配置环境变量
```bash
cp .env.example .env
```

编辑 `.env` 文件，添加 AI API 密钥。

### 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:5173 开始游戏。

## 📚 文档指南

- **开发计划**：详细的项目规划和里程碑 → [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md)
- **更新日志**：项目更新记录和版本说明 → [CHANGELOG.md](CHANGELOG.md)

## 🛠️ 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 前端框架 | React | 19.x |
| 构建工具 | Vite | 6.x |
| 语言 | TypeScript | 5.9 |
| 状态管理 | Zustand | 5.x |
| 样式 | Tailwind CSS | 4.x |
| 数据库 | sql.js | 1.x |
| 地图 | Leaflet | 1.x |
| 图表 | Recharts | 3.x |
| AI 接口 | Vercel AI SDK | 6.x |
| 数据验证 | Zod | 4.x |

## 📁 项目结构

```
ChongzhenSim/
├── src/             # 源代码
├── public/          # 静态资源
├── server/          # 后端服务
├── .env.example     # 环境变量示例
├── package.json     # 项目配置
├── tsconfig.json    # TypeScript 配置
├── vite.config.ts   # Vite 配置
├── CHANGELOG.md     # 更新日志
├── DEVELOPMENT_PLAN.md # 开发计划
└── README.md        # 项目说明
```

## 🔍 核心功能

- **地图系统**：明代疆域地图，支持省份管理和热力图
- **国策树**：完整的国家政策研究体系
- **官职系统**：大明官员体系管理和任免
- **军事系统**：兵力管理与将领调配
- **经济系统**：税收、财政管理
- **事件系统**：历史事件与剧本引擎
- **AI 对话**：与大臣进行智能对话

## 📄 许可证

MIT License

## 🎯 项目目标

还原明末崇祯年间的历史背景和政治格局，提供沉浸式的皇帝角色扮演体验，实现复杂的国家管理和决策系统，利用 AI 技术增强游戏的剧情和交互体验。

---

*大明崇祯元年，天下初定。然内有流寇四起，外有后金虎视眈眈。你能否力挽狂澜，拯救这摇摇欲坠的大明江山？*