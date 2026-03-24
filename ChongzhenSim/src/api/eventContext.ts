import type { GameState, NationStats } from '../core/types';

export type TriggerType = 'random' | 'crisis' | 'opportunity' | 'player_action';

export interface EventContext {
  turn: number;
  date: string;
  treasury: {
    gold: number;
    grain: number;
    lastIncome: number;
    lastExpense: number;
  };
  topAlertProvinces: Array<{
    id: string;
    name: string;
    civilUnrest: number;
    disasterLevel: number;
  }>;
  nationStats: NationStats;
  recentHistory: string[];
  triggerType: TriggerType;
  ministersContext: Array<{
    id: string;
    name: string;
    title: string;
    faction: string;
  }>;
}

export function buildEventContext(
  gameState: GameState,
  recentHistory: string[] = [],
  triggerType: TriggerType = 'random'
): EventContext {
  const alertProvinces = gameState.provinces
    .filter(p => p.civilUnrest > 60 || p.disasterLevel >= 3)
    .sort((a, b) => (b.civilUnrest + b.disasterLevel * 20) - (a.civilUnrest + a.disasterLevel * 20))
    .slice(0, 3)
    .map(p => ({
      id: p.id,
      name: p.name,
      civilUnrest: p.civilUnrest,
      disasterLevel: p.disasterLevel
    }));

  const ministersContext = (gameState.ministers || [])
    .filter(m => m.isAlive)
    .slice(0, 5)
    .map(m => ({
      id: m.id,
      name: m.name,
      title: m.title,
      faction: m.factionLabel
    }));

  return {
    turn: gameState.turn,
    date: gameState.date,
    treasury: {
      gold: gameState.treasury.gold,
      grain: gameState.treasury.grain,
      lastIncome: gameState.lastIncome || 0,
      lastExpense: gameState.lastExpense || 0
    },
    topAlertProvinces: alertProvinces,
    nationStats: gameState.nationStats,
    recentHistory,
    triggerType,
    ministersContext
  };
}

export function buildUserPrompt(ctx: EventContext): string {
  const alerts = ctx.topAlertProvinces
    .map(p => `${p.name}（民乱${p.civilUnrest}，天灾${p.disasterLevel}级）`)
    .join('、') || '暂无';

  const ministers = ctx.ministersContext
    .map(m => `${m.name}（${m.title}，${m.faction}）`)
    .join('、') || '暂无';

  return `
现在是${ctx.date}，第${ctx.turn}回合。
当前国库：${ctx.treasury.gold}万两白银，粮仓${ctx.treasury.grain}万石。
上回合收入${ctx.treasury.lastIncome}万两，支出${ctx.treasury.lastExpense}万两。
警报省份：${alerts}。
全国军力${ctx.nationStats.militaryPower}，民心${ctx.nationStats.peopleMorale}，
边患${ctx.nationStats.borderThreat}，贪腐${ctx.nationStats.overallCorruption}。
在朝大臣：${ministers}。
近期已发生：${ctx.recentHistory.join('；') || '无'}。
触发类型：${ctx.triggerType}。

请生成一个符合此背景的朝廷事件，要有历史感，选项要有真实的两难困境。
  `.trim();
}

export const SYSTEM_PROMPT = `
你是历史策略游戏「崇祯皇帝模拟器」的叙事引擎，背景为明崇祯年间（1628-1644）。
根据玩家提供的当前游戏状态，生成一个朝廷事件。

叙事要求：
- 剧情有历史感，可以提及真实人物（李自成、皇太极、东林党、魏忠贤余党等）
- 选项呈现真实的两难困境，不要有明显"正确答案"
- narrative 字段 200-400 字，用文言文风格书写
- mood 根据当前局势客观判断

数值约束（delta 字段的合理范围）：
- 财政（gold）变化：-800 到 +500 万两
- 粮食（grain）变化：-50 到 +30 万石
- 民乱（civilUnrest）变化：-30 到 +40
- 军力（militaryPower）变化：-20 到 +15
- 民心（peopleMorale）变化：-25 到 +20
- 忠诚（loyalty）变化：-30 到 +30

选项设计原则：
- 每个选项都要有代价
- 效果要合理，不能出现极端数值
- 可以涉及特定大臣或省份
- hint 字段暗示可能结果，但不要完全揭示
`.trim();

export function buildMinisterSystemPrompt(
  minister: { name: string; title: string; factionLabel: string; competence: number; corruption: number; loyalty: number },
  gameContext: string
): string {
  return `
你扮演明末大臣「${minister.name}」，官职「${minister.title}」，属于${minister.factionLabel}派系。
性格特点：能力${minister.competence}/100，贪腐${minister.corruption}/100，忠诚${minister.loyalty}/100。
当前游戏背景：${gameContext}

要求：
- 用符合明代官场的语气回应皇帝（可掺杂文言）
- 回答要体现该大臣的立场和利益（东林党反对宦官，阉党维护既得利益等）
- 如果皇帝问到该大臣专业之外的事，可以婉转推脱或给出不专业的建议
- 每次回复 80-150 字，不要过长
`.trim();
}
