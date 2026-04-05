# 崇祯皇帝模拟器 - 朝堂流程设计

## 🎬 完整朝堂流程

### 阶段 1：入场（Phase: opening）

**触发**：玩家在皇极殿点击"鸣鞭·上朝"

**UI 展示**：
1. 显示司礼监秉笔太监的头像（可由玩家设置）
2. 太监台词：「皇上驾到！」
3. 百官齐呼：「吾皇万岁万岁万万岁！」
4. 皇帝台词：「众爱卿平身。有事起奏，无事退朝。」
5. 提示文字：正在准备大臣奏报...

**自动过渡**：3秒后自动进入讨论阶段

---

### 阶段 2：大臣奏对（Phase: discussion）

**触发**：开场动画结束

**数据来源**：
1. **剧本事件**：根据 `day1Script.ts` 或当前回合的 `SCRIPTED_EVENTS`
2. **私聊提案**（LLM独占）：玩家上一回合与大臣私聊生成的提案

**流程**：
1. 显示"文武百官分列两班"的背景描述
2. 按照讨论序列依次展示每位大臣的发言
3. 每位大臣发言后显示"继续听取奏对"按钮
4. 最后一位大臣发言后显示"听取完毕，圣裁"按钮

**讨论序列结构**：
```typescript
interface DiscussionSpeaker {
  // 发言者信息
  speaker: {
    ministerName: string;      // 大臣姓名（如"毕自严"）
    ministerTitle: string;     // 官职（如"户部尚书"）
    ministerFaction: string;   // 派系（如"帝党"）
    ministerAvatar?: string;   // 头像（可选）
  };

  // 发言内容
  content: string;             // 发言文本
  actionDescription?: string;  // 动作描述（如"手持一份奏折，神色凝重"）

  // 发言角色
  isMain: boolean;             // 是否为主要奏报大臣
  isOpposing: boolean;         // 是否为反对观点

  // 表情/状态（可选）
  emotion?: 'anxious' | 'confident' | 'hesitant' | 'angry' | 'calm';
}
```

---

### 阶段 3：皇帝决策（Phase: decision）

**触发**：玩家点击"听取完毕，圣裁"

**UI 展示**：
1. 标题：皇帝圣裁
2. 描述：你端坐龙椅之上，望着殿下争论不休的群臣，深知每一个选择都将牵动天下大局。
3. 显示主要奏报大臣的信息（头像、姓名、官职、派系）
4. 显示奏报主题
5. 显示3个决策选项

**选项示例**：
```typescript
interface MemorialChoice {
  id: string;
  text: string;              // 选项文本
  hint: string;              // 选项提示/说明
  effects: GameEffect[];     // 效果列表

  // 事件联动（可选）
  unlocksEventIds?: string[];    // 解锁的事件ID
  locksEventIds?: string[];      // 锁定的事件ID

  // LLM 独占功能（可选）
  requiresLLM?: boolean;         // 是否需要LLM模式
}
```

---

### 阶段 4：效果展示（Phase: decision - 已选择后）

**触发**：玩家点击某个决策选项

**UI 展示**：
1. 标题：圣旨已下
2. 显示选择的选项文本和提示
3. 显示效果预览：
   - 格式：`[+/-数值] 效果描述`
   - 正面效果：绿色
   - 负面效果：红色
4. 2秒后自动进入下一条奏报或退朝总结

---

### 阶段 5：退朝总结（Phase: summary）

**触发**：所有奏报处理完毕

**UI 展示**：
1. 标题：退朝总结
2. 显示本次上朝的所有决策汇总：
   - 奏报主题
   - 奏报大臣
   - 选择的方案
   - 产生的效果
3. 按钮："鸣鞭·退朝"
4. 提示：退朝后效果将在回合结算时统一应用

**点击退朝后**：
- 将所有效果提交到 ChangeQueue
- 关闭朝堂面板
- 标记 `hasCourtedThisTurn = true`

---

## 📊 完整示例：辽东军饷事件

### 1. 入场
```
【皇极殿】

司礼监秉笔太监 王承恩
头像：👤

「皇上驾到！」

百官：「吾皇万岁万岁万万岁！」

崇祯皇帝：「众爱卿平身。有事起奏，无事退朝。」

正在准备大臣奏报...
```

### 2. 大臣奏对

**第一人**：户部尚书 毕自严（帝党）
```
【大臣奏对】
文武百官分列两班

头像：👤 毕自严
官职：户部尚书
派系：帝党

毕自严跪奏道：
"陛下，臣有紧急军情禀报。辽东军饷已拖欠三月，关宁将士怨声四起。
同时，陕西巡抚来报，今春旱情加剧，流民已超十万之众。而国库现银，
仅余五十万两，实在是……"

他的声音有些哽咽，顿了顿才继续说道：
"银库老鼠都饿死了三窝，这是臣的原话，并非戏言。"

殿内一片寂静。

[继续听取奏对]
```

**第二人**：兵部右侍郎 梁廷栋（帝党）
```
【大臣奏对】
文武百官分列两班

头像：👤 梁廷栋
官职：兵部右侍郎
派系：帝党

梁廷栋上前一步：
"陛下，臣以为当务之急有三：其一，辽饷不可再拖，否则边军哗变之祸不远；
其二，陕西流民须加以安抚，否则从贼者日众；
其三，登州孔有德部欠饷十月，万一生变，山东将不可收拾。"

[继续听取奏对]
```

**第三人**：内阁首辅 温体仁（阉党）
```
【大臣奏对】
文武百官分列两班

头像：👤 温体仁
官职：内阁首辅
派系：阉党

内阁首辅温体仁却不慌不忙地出列：
"陛下圣明。臣以为梁侍郎所言虽有道理，但加征饷银势必加重百姓负担，
不可不慎。或可先从内库拨银应急，再从长计议。"

[听取完毕，圣裁]
```

### 3. 皇帝决策

```
【皇帝圣裁】

你端坐龙椅之上，望着殿下争论不休的群臣，
深知每一个选择都将牵动天下大局。

头像：👤 毕自严
官职：户部尚书
派系：帝党
紧急：紧急

奏报主题
辽东军饷与陕西流民

请选择圣裁：

[选项 1]
下旨从内帑拨银三十万两，先解辽东军饷之急。
提示：可暂缓边军哗变，但国库将更加空虚

[选项 2]
命洪承畴加紧围剿陕西流寇，同时开仓放量赈济灾民。
提示：流民可暂得安抚，但军饷问题依然严峻

[选项 3]
召集内阁与六部堂官廷议，共商开源节流之策。
提示：可集思广益，但可能延误战机
```

### 4. 效果展示

```
【圣旨已下】

下旨从内帑拨银三十万两，先解辽东军饷之急。
可暂缓边军哗变，但国库将更加空虚

效果预览：
[-300000] 国库银两
[+5] 辽东边军士气
[-2] 民心
[-3] 阉党忠诚度
```

### 5. 退朝总结

```
【退朝总结】

本次上朝决策汇总

辽东军饷与陕西流民
毕自严（户部尚书）
选择：下旨从内帑拨银三十万两，先解辽东军饷之急
效果：
  [-300000] 国库银两
  [+5] 辽东边军士气
  [-2] 民心
  [-3] 阉党忠诚度

今日早朝已结束，效果已加入结算队列

[鸣鞭·退朝]

退朝后效果将在回合结算时统一应用
```

---

## 🔧 技术实现要点

### 1. 讨论序列生成

```typescript
// 在 courtSystem.ts 中
function generateDiscussionSequence(memorial: CourtMemorial): DiscussionSpeaker[] {
  const sequence: DiscussionSpeaker[] = [];

  // 1. 主要奏报大臣
  sequence.push({
    speaker: {
      ministerName: memorial.ministerName,
      ministerTitle: memorial.ministerTitle,
      ministerFaction: memorial.ministerFaction,
    },
    content: memorial.content,
    actionDescription: "手持一份奏折，神色凝重",
    isMain: true,
    isOpposing: false,
    emotion: 'anxious'
  });

  // 2. 支持派系大臣（如果有的话）
  if (memorial.supportingSpeaker) {
    sequence.push({
      speaker: memorial.supportingSpeaker,
      content: memorial.supportingSpeech,
      isMain: false,
      isOpposing: false,
      emotion: 'confident'
    });
  }

  // 3. 反对派系大臣（如果有的话）
  if (memorial.opposingSpeaker) {
    sequence.push({
      speaker: memorial.opposingSpeaker,
      content: memorial.opposingSpeech,
      isMain: false,
      isOpposing: true,
      emotion: 'calm'
    });
  }

  return sequence;
}
```

### 2. 司礼监设置

```typescript
// 在 gameConfig.ts 中
interface GrandSecretaryConfig {
  ministerId: string;        // 大臣ID
  ministerName: string;      // 姓名
  ministerTitle: string;     // 官职
  avatar?: string;           // 头像
}

// 默认设置
const DEFAULT_GRAND_SECRETARY: GrandSecretaryConfig = {
  ministerId: 'wang_chengen',
  ministerName: '王承恩',
  ministerTitle: '司礼监秉笔太监',
};
```

### 3. LLM 私聊提案集成

```typescript
// 在 courtStore.ts 中
interface CourtStore {
  // 新增字段
  privateChatProposals: Proposal[];  // 本回合的私聊提案

  // 新增方法
  addPrivateChatProposal: (proposal: Proposal) => void;
  mergeProposalsWithScript: () => void;
}
```

---

## 📝 数据结构扩展

### CourtMemorial 扩展

```typescript
interface CourtMemorial {
  id: string;
  subject: string;
  content: string;

  // 发言者信息
  ministerName: string;
  ministerTitle: string;
  ministerFaction: string;

  // 支持和反对派系发言（可选）
  supportingSpeaker?: {
    ministerName: string;
    ministerTitle: string;
    ministerFaction: string;
  };
  supportingSpeech?: string;

  opposingSpeaker?: {
    ministerName: string;
    ministerTitle: string;
    ministerFaction: string;
  };
  opposingSpeech?: string;

  // 紧急程度
  urgencyLevel: 'urgent' | 'important' | 'normal';

  // 选项
  choices: MemorialChoice[];

  // 立即效果（选择时立即生效）
  immediateEffects?: GameEffect[];
}
```

---

## 🎯 实现优先级

### Phase 2.2.1：基础流程（已完成 ✅）
- [x] 入场动画
- [x] 单人发言展示
- [x] 决策选项
- [x] 效果展示

### Phase 2.2.2：多人讨论（进行中 ⚠️）
- [ ] 支持多个大臣依次发言
- [ ] 动作描述展示
- [ ] 情感状态显示
- [ ] 派系信息突出

### Phase 2.2.3：私聊提案（待实现 ❌）
- [ ] LLM 私聊生成提案
- [ ] 提案与剧本事件合并
- [ ] 提案优先级排序

### Phase 2.2.4：司礼监设置（待实现 ❌）
- [ ] 玩家自定义司礼监
- [ ] 头像上传/选择
- [ ] 台词自定义
