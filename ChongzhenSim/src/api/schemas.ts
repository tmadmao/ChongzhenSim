import { z } from 'zod';

export const GameEffectSchema = z.object({
  type: z.enum(['treasury', 'province', 'minister', 'nation', 'military']),
  target: z.string(),
  field: z.string(),
  delta: z.number(),
  description: z.string()
});

export const ChoiceSchema = z.object({
  id: z.string(),
  text: z.string(),
  hint: z.string().optional(),
  effects: z.array(GameEffectSchema)
});

export const AIEventResponseSchema = z.object({
  narrative: z.string(),
  mood: z.enum(['crisis', 'normal', 'opportunity', 'warning']),
  choices: z.array(ChoiceSchema).min(2).max(4),
  immediateEffects: z.array(GameEffectSchema),
  ministersInvolved: z.array(z.string()).optional()
});

export type GameEffect = z.infer<typeof GameEffectSchema>;
export type Choice = z.infer<typeof ChoiceSchema>;
export type AIEventResponse = z.infer<typeof AIEventResponseSchema>;

export const MinisterChatResponseSchema = z.object({
  response: z.string(),
  mood: z.enum(['loyal', 'neutral', 'displeased', 'angry']),
  suggestion: z.string().optional()
});

export type MinisterChatResponse = z.infer<typeof MinisterChatResponseSchema>;
