# 更新日志 Changelog

> **声明：本游戏当前版本处于框架构建阶段，尚不可游玩。**

## [v0.2.2] - 2026-03-25

### 重大更新

#### 配置系统全面增强
- 扩展 `gameConfig.ts`，新增完整的游戏数值配置体系
- NPC 属性配置：忠诚、贪腐、能力、关系、野心五大属性，支持 MIN/MAX/DEFAULT/HIGH/LOW/CRITICAL 分级
- 省份配置：人口、税率、民乱、天灾、贪腐、士气、军事、粮仓八大维度
- 国家配置：民心、军力、边患、贪腐、农业产出五大国力指标
- 游戏结束条件配置：民心崩溃、边患失控、国库枯竭、皇帝驾崩等多种结局阈值

#### 剧本文件配置化改造
- `historicalCharacters.ts`：80+ 历史人物的初始数值全部改用 `GAME_CONFIG.NPC` 常量
- `scriptedEvents.ts`：事件效果数值抽离为 `EFFECT_VALUES` 常量对象
- `nationalPolicies.ts`：国策效果数值抽离为 `POLICY_EFFECTS` 常量对象
- 彻底消除剧本中的魔法数字，所有数值从配置中心读取

#### 配置验证体系
- 新增 `validateNPCAttributes()` 函数：验证 NPC 属性值是否在合法范围内
- 新增 `validateProvinceAttributes()` 函数：验证省份属性值合法性
- 新增 `validateNationAttributes()` 函数：验证国家属性值合法性
- 新增 `checkGameOverConditions()` 函数：统一检查游戏结束条件

### 技术改进

#### 类型安全增强
- 修复 `ChangeQueue.ts` 中的 factions/officials 类型错误
- 修复 `courtStore.ts` 中的 EffectType 类型不匹配问题
- 修复 `scenarioEngine.ts` 中的多处类型错误
- 清理所有未使用的导入和变量

#### 代码清理
- 删除废弃的重构备份文件：`gameLoop-refactored.ts`、`gameStore-decision-refactor.ts`
- 统一使用 `ministers` 属性替代 `factions`/`officials`

### 配置文件结构

```typescript
GAME_CONFIG = {
  NPC: {
    LOYALTY: { MIN: 0, MAX: 100, DEFAULT: 50, HIGH: 80, LOW: 30, CRITICAL: 10 },
    CORRUPTION: { MIN: 0, MAX: 100, DEFAULT: 30, HIGH: 70, LOW: 20, CRITICAL: 90 },
    COMPETENCE: { MIN: 0, MAX: 100, DEFAULT: 50, HIGH: 80, LOW: 30, EXCELLENT: 90 },
    RELATIONSHIP: { MIN: -100, MAX: 100, DEFAULT: 0, FRIENDLY: 50, HOSTILE: -50 },
    AMBITION: { MIN: 0, MAX: 100, DEFAULT: 50, HIGH: 70, LOW: 30 }
  },
  PROVINCE: {
    POPULATION: { MIN: 10000, MAX: 5000000, DEFAULT: 500000 },
    TAX_RATE: { MIN: 0.05, MAX: 0.60, DEFAULT: 0.25, STEP: 0.05 },
    UNREST: { MIN: 0, MAX: 100, DEFAULT: 10, HIGH: 60, CRITICAL: 80 },
    // ... 更多配置
  },
  NATION: {
    PEOPLE_MORALE: { MIN: 0, MAX: 100, DEFAULT: 50, COLLAPSE: 20 },
    MILITARY_POWER: { MIN: 0, MAX: 100, DEFAULT: 50, CRITICAL: 20 },
    // ... 更多配置
  },
  GAME_OVER: {
    PEOPLE_MORALE_COLLAPSE: 10,
    BORDER_THREAT_CRITICAL: 90,
    TREASURY_BANKRUPT: -500,
    // ... 更多条件
  }
}
```

## [v0.2.1] - 2026-03-25

### 重大更新

#### 统一财务结算体系重构
- 建立了基于 ChangeQueue 的统一变动队列系统
- 实现了物理隔离：所有组件必须入队，禁止直接修改数据库
- 配置驱动：所有数值从 gameConfig.ts 读取
- 统一结算：所有变动在 endTurn 时统一处理
- 强制审计：所有变动必须记录日志

### 新增文件

- `src/engine/ChangeQueue.ts` - 统一变动队列，单例模式
- `src/api/schemas.ts` - 新增 OptionEffectSchema 支持 configKey

### 核心机制

#### ChangeQueue 统一变动队列
- 单例模式确保唯一入口
- enqueue() 入队所有变动
- applyAll() 执行四步结算流水线
- 支持 Delta 和 Absolute 两种数值变动模式
- 全面安全检查防止 undefined 错误

#### 四步结算流水线
- **Step A**: 玩家操作入队（朝堂决策、事件响应）
- **Step B**: 常规收支计算（税收、俸禄、军饷）
- **Step C**: 合并所有变动，统一更新状态
- **Step D**: 清空队列，记录日志

#### 配置驱动开发
- 新增 EVENT_CONSTANTS 配置块
- getEventConstant() 辅助函数
- resolveEffectValue() 解析配置数值
- OptionEffect 支持 configKey、value、mode 字段

### 重构文件

- `src/components/event/ScenarioEventPanel.tsx` - 改用 ChangeQueue 入队
- `src/store/courtStore.ts` - 移除 pendingEffects，决策立即入队
- `src/core/gameLoop.ts` - 严格四步结算流程
- `src/data/scenario/scriptedEvents.ts` - 更新为新 OptionEffect 格式
- `src/config/gameConfig.ts` - 新增 EVENT_CONSTANTS 和辅助函数

### 已知问题

- 系统收支数据计算有误，需要进一步重整
- 已在 commit 信息中标记此已知问题

## [v0.2.0] - 2026-03-24

### 重大更新

#### 皇极殿·主剧情系统
- 实现了完整的皇极殿主剧情系统，包括第一天剧本的3条奏报
- 开发了朝堂状态管理系统，支持朝会流程控制
- 设计了奏报调度系统，实现按优先级排序的奏报展示
- 实现了完整的朝会流程：鸣鞭·上朝 → 大臣奏报 → 退朝总结

### 新增文件

- `src/data/scenario/day1Script.ts` - 第一天剧本数据，包含3条奏报
- `src/store/courtStore.ts` - 朝堂状态管理
- `src/systems/courtSystem.ts` - 奏报调度系统

### 功能特性

#### 朝会流程
- 鸣鞭·上朝：动画过渡，营造庄重的朝会氛围
- 大臣奏报：展示大臣头像、官职、奏报内容
- 决策选择：每个奏报提供2-3个选项，显示效果预览
- 退朝总结：展示本次朝会的所有决策和效果

#### 剧本内容
- 第一奏：魏忠贤去留 - 决定阉党的命运
- 第二奏：陕西旱灾赈济 - 处理赈灾事宜
- 第三奏：辽东军饷 - 解决军饷危机

#### 技术改进
- 扩展场景引擎，添加新的公开方法
- 实现批量效果应用功能
- 修复TypeScript编译错误
- 优化按钮样式，提高用户体验

## [v0.1.5] - 2026-03-24

### 新增功能
- 实现了完整的游戏设置功能，包括存档管理、模式切换、LLM 配置和主题选择
- 在底部栏添加了设置按钮，使用 Lucide 的 Settings 图标
- LLM 客户端现在优先从用户设置中读取 API 配置，提高了灵活性

### 界面优化
- 修复了设置面板弹出时其他界面全黑的问题，现在使用半透明背景效果
- 移除了底部栏的存档按钮，避免功能重复
- 优化了设置面板的样式，使用了统一的模态框样式

### 技术改进
- 修复了 TypeScript 编译错误，确保代码类型安全
- 改进了 LLM 客户端的配置管理逻辑
- 优化了组件的懒加载实现

## [v0.1.4] - 2026-03-24

### 性能优化

#### 代码分割优化
- 使用 React.lazy 和 Suspense 实现组件懒加载
- 主要面板组件（FinancePanel、DecreePanel、EventPanel 等）改为按需加载
- 添加 Loading 占位符，提升用户体验
- 减少初始页面加载时间

#### 构建配置优化
- 配置 Vite manualChunks，将 React 相关库分离为独立 chunk
- 调整 chunkSizeWarningLimit 为 1000 KB，减少构建警告
- 确保 WASM 文件路径处理正确

### 代码质量

#### 硬编码数值抽离
- 创建 `src/config/gameConfig.ts` 配置文件
- 将所有影响数值平衡的常量抽离到配置对象中
- 修改 FinanceSystem 和 TaxSystem 使用配置参数
- 提高代码可维护性和可扩展性

#### 全局日志系统
- 创建 `src/utils/logger.ts` 日志工具
- 实现分级日志（info、warn、error、debug）
- 在 LLM 客户端和游戏引擎中集成日志
- 支持生产环境自动关闭 Debug 日志

### 修复

#### TypeScript 编译错误
- 修复所有 51 个 TypeScript 编译错误
- 解决类型转换、未使用变量、模块导入等问题
- 项目构建成功完成

## [v0.1.3] - 2026-03-24

### 重大更新

#### 国策树系统构建完成
- 实现了完整的国策树UI界面，支持分类显示、研究进度、前置条件等功能
- 开发了国策状态管理系统，支持开始研究、取消研究、研究进度推进等功能
- 设计了丰富的国策数据，涵盖内政、军事、政治、科技、外交、民生等多个类别

### 新增文件

- `src/components/panels/PolicyTreePanel.tsx` - 国策树主界面组件
- `src/store/policyStore.ts` - 国策状态管理
- `src/data/policies/nationalPolicies.ts` - 国策数据定义，包含50+项国策

### 功能特性

#### 国策树界面
- 左侧分类标签：内政、军事、政治、科技、外交、民生、破局
- 右侧国策卡片：显示国策名称、描述、历史典故、效果、费用、研究时间
- 研究状态管理：锁定、可研究、研究中、已完成四种状态
- 前置条件检查：自动检查前置国策完成情况
- 研究进度条：实时显示研究剩余时间

#### 国策系统
- 支持同时研究多个国策
- 每回合自动推进研究进度
- 研究完成后自动解锁相关国策
- 自动检查国库资金是否足够
- 支持取消正在进行的研究

#### 国策数据
- 内政类：轻徭薄赋、税制改革、漕运整顿等12项
- 军事类：守边固防、火器革新、京营整训等10项
- 政治类：派系制衡、密折监察、考成法重启等10项
- 科技类：农耕改良、历法修订、水利工程推广等8项
- 外交类：联蒙制满、朝鲜羁縻、澳门通商等6项
- 民生类：疫政推行、流民安置、义仓普及等3项
- 破局类：南洋拓殖计划等1项

## [v0.1.2] - 2026-03-21

### 新增功能

#### 地图系统
- 使用 Leaflet + react-leaflet 重构地图渲染，替代 ECharts
- 支持明代省份轮廓显示（基于 GeoJSON 数据）
- 添加周边势力区域显示（朝鲜、日本、蒙古、安南、罗斯）
- 添加后金区域标注（东北方向深红色区域）
- 支持鼠标滚轮缩放、拖拽移动
- 支持省份悬停显示 tooltip（省份名、省会、热力值）
- 支持点击省份选中并显示详情面板

#### 热力图模式
- 税收指数：显示各省税收情况
- 民乱指数：显示各省民乱程度
- 军力指数：显示各省驻军情况
- 天灾等级：显示各省天灾程度
- 贪腐指数：显示各省贪腐程度

#### 导航系统
- 新增顶部导航标签：【众正盈朝】、【国策树】、【坤舆万国全图】、【军事】
- 支持视图切换，不同功能面板独立展示

#### 众正盈朝（官职系统）
- 按层级展示大明官职体系：内阁 → 六部 → 都察院 → 督抚 → 武将 → 内廷
- 内阁官员金色渐变高亮显示
- 六部尚书红色左边框标识
- 都察院蓝色左边框标识
- 支持点击官职卡片更换官员
- 候选人列表按能力排序
- 显示官员属性（忠诚、能力、贪腐、关系）

#### 军事面板
- 显示总兵力统计
- 显示月饷银消耗
- 显示月粮草消耗
- 各将领详细信息（驻地、统兵数量、能力评级）

#### 省份信息面板
- 左侧滑出式面板
- 显示省份基本信息（人丁、税率、粮仓、驻军）
- 显示状态条（民乱、贪腐）
- 显示天灾等级指示器
- 显示本回合税收
- 显示警报提示（民乱/天灾警告）

### 视觉优化

#### 统一视觉风格
- 华贵暗金主题：深色背景 + 金色装饰 + 发光效果
- 白色简约主题：浅色背景 + 柔和阴影 + 适度效果
- 面板顶部金色装饰线
- 微光脉冲动画效果
- 卡片悬浮发光效果
- 按钮发光扫光效果
- 进度条发光效果

#### 组件样式统一
- StatusBar：状态项样式、进度条发光
- BottomBar：按钮发光效果
- ProvincePanel：面板装饰、卡片悬浮效果
- FinancePanel：统计卡片、分隔线装饰
- LogPanel：标题装饰、日志条目样式
- NavigationTabs：激活标签发光、指示器脉冲

### 技术改进

- 添加 `resolveJsonModule` 支持 JSON 导入
- 配置 Vite optimizeDeps 包含 leaflet
- 新增 navigationStore 管理导航状态
- 新增 replaceOfficial 方法支持官员更换
- 优化 CSS 类结构，统一视觉效果

### 文件变更

- 新增 `src/components/navigation/` 导航组件目录
- 新增 `src/components/panels/` 面板组件目录
- 新增 `src/store/navigationStore.ts` 导航状态管理
- 新增 `src/data/geojson/factions_config.ts` 势力配置
- 重构 `src/components/map/GameMap.tsx` 使用 Leaflet
- 更新 `src/index.css` 添加统一视觉样式
- 更新 `tsconfig.app.json` 添加 JSON 模块支持
- 更新 `vite.config.ts` 配置 Leaflet 优化

---

## [v0.1.1] - 2026-03-21

### 新功能

#### ECharts 地图系统
- 使用 ECharts 替换 Leaflet，实现明代疆域地图可视化
- 支持热力图模式：税收、民乱、军力、天灾、贪腐
- 明代两京十三省地理数据映射
- GeoJSON 数据处理工具，将现代省份边界转换为明代行政区划
- 省份点击信息面板，显示详细省份状态

#### 双主题支持
- 新增白色简约主题，与原有华贵暗金主题可切换

### 修复

#### 数据库初始化问题
- 修复 SQL.js 数据库初始化时序问题
- 确保数据库表在加载旧数据后正确创建
- 修复省份列表为空的问题
- 添加数据库单例模式，避免重复初始化

### 技术改进

- 移除 Leaflet 相关依赖
- 新增 `ming_map_config.ts` 明代省份配置文件
- 新增 `geoProcessor.ts` GeoJSON 处理工具
- 新增 `ProvinceInfoPanel.tsx` 省份信息面板组件

---

## [v0.1.0] - 初始版本

初始框架搭建，基础游戏循环实现。
