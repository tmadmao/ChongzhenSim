import { z } from 'zod';

// ============================================
// 旧版 GameEffectSchema - 保持向后兼容
// ============================================
export const GameEffectSchema = z.object({
  type: z.enum(['treasury', 'province', 'minister', 'nation', 'military']),
  target: z.string(),
  field: z.string(),
  delta: z.number(),
  description: z.string()
});

// ============================================
// 新版 OptionEffectSchema - 支持配置驱动
// ============================================
export const OptionEffectSchema = z.object({
  type: z.enum(['treasury', 'province', 'minister', 'nation', 'faction', 'military']),
  target: z.string(),
  field: z.string(),
  configKey: z.string().optional(),  // 引用 gameConfig.ts 中的配置键
  value: z.number().optional(),      // 硬编码数值（当没有 configKey 时使用）
  mode: z.enum(['delta', 'absolute']), // 'delta' = 累加, 'absolute' = 绝对值
  description: z.string()
});

export const ChoiceSchema = z.object({
  id: z.string(),
  text: z.string(),
  hint: z.string().optional(),
  effects: z.array(OptionEffectSchema)  // 使用新的 OptionEffectSchema
});

export const AIEventResponseSchema = z.object({
  narrative: z.string(),
  mood: z.enum(['crisis', 'normal', 'opportunity', 'warning']),
  choices: z.array(ChoiceSchema).min(2).max(4),
  immediateEffects: z.array(OptionEffectSchema),  // 使用新的 OptionEffectSchema
  ministersInvolved: z.array(z.string()).optional()
});

export type GameEffect = z.infer<typeof GameEffectSchema>;
export type OptionEffect = z.infer<typeof OptionEffectSchema>;
export type Choice = z.infer<typeof ChoiceSchema>;
export type AIEventResponse = z.infer<typeof AIEventResponseSchema>;

export const MinisterChatResponseSchema = z.object({
  response: z.string(),
  mood: z.enum(['loyal', 'neutral', 'displeased', 'angry']),
  suggestion: z.string().optional()
});

export type MinisterChatResponse = z.infer<typeof MinisterChatResponseSchema>;

// 游戏设置接口
export interface GameSettings {
  theme: 'dark' | 'light';
  gameMode: 'local' | 'llm';
  llmConfig: {
    provider: string;
    apiKey: string;
    baseUrl: string;
    model: string;
  };
}

// 财务账目项接口
export interface LedgerItem {
  name: string;
  amount: number;
  type: 'income' | 'expense';
  description: string;
}

// 财务总账接口
export interface FinancialLedger {
  items: LedgerItem[];
  totalIncome: number;
  totalExpense: number;
  netChange: number;
  timestamp: number;
}
