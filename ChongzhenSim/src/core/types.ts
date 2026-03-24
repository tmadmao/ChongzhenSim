// ========================================
// 核心游戏类型定义
// ========================================

export interface Province {
  id: string;
  name: string;
  population: number;
  taxRate: number;
  taxRevenue: number;
  granaryStock: number;
  civilUnrest: number;
  militaryForce: number;
  disasterLevel: number;
  corruptionLevel: number;
  coordinates: { lat: number; lng: number };
  region: Region;
  peopleMorale?: number;
  isCapital?: boolean;
  isBorder?: boolean;
}

export interface Treasury {
  gold: number;
  grain: number;
}

export interface TreasuryTransaction {
  id: string;
  turn: number;
  date: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  provinceId?: string;
  description: string;
  createdAt: number;
}

export type MinisterDepartment = 'cabinet' | 'six_ministries' | 'censorate' | 'military' | 'local';

export interface MinisterPosition {
  title: string;
  department: MinisterDepartment;
  rank: number;
  isPrimary: boolean;
}

export interface Minister {
  id: string;
  name: string;
  title: string;
  faction: string;
  factionLabel: string;
  loyalty: number;
  competence: number;
  corruption: number;
  relationship: number;
  isAlive: boolean;
  positions: MinisterPosition[];
  department: MinisterDepartment;
  summary?: string;
}

export interface NationStats {
  militaryPower: number;
  peopleMorale: number;
  borderThreat: number;
  overallCorruption: number;
  agriculturalOutput: number;
}

export type GamePhase = 'morning' | 'afternoon' | 'night';

export interface GameState {
  turn: number;
  date: string;
  phase: GamePhase;
  treasury: Treasury;
  provinces: Province[];
  ministers: Minister[];
  nationStats: NationStats;
  currentEvent: AIEventResponse | null;
  eventHistory: AIEventResponse[];
  isGameOver: boolean;
  gameOverReason?: string;
  lastIncome?: number;
  lastExpense?: number;
  turnLog?: string[];
}

export interface AIEventResponse {
  narrative: string;
  mood: 'crisis' | 'normal' | 'opportunity' | 'warning';
  choices: Choice[];
  immediateEffects: GameEffect[];
  ministersInvolved?: string[];
}

export interface Choice {
  id: string;
  text: string;
  hint?: string;
  effects: GameEffect[];
}

export type EffectType = 'treasury' | 'province' | 'minister' | 'nation' | 'military';

export interface GameEffect {
  type: EffectType;
  target: string;
  field: string;
  delta: number;
  description: string;
}

export interface PlayerDecision {
  type: 'event_choice' | 'research_policy' | 'start_policy_research' | 'cancel_policy_research' | 'decree' | 'tax_adjust';
  eventId?: string;
  choiceId?: string;
  policyId?: string;
  effects: GameEffect[];
}

export interface TaxResult {
  provinceId: string;
  provinceName: string;
  baseTax: number;
  actualTax: number;
  corruptionLoss: number;
  disasterLoss: number;
}

export interface TaxReport {
  turn: number;
  totalIncome: number;
  provinceResults: TaxResult[];
  topProvince: TaxResult | null;
  bottomProvince: TaxResult | null;
}

export interface ExpenseBreakdown {
  military: number;
  salary: number;
  disaster: number;
  border: number;
  corruption: number;
  total: number;
  details: { category: string; amount: number; description: string }[];
}

export interface TreasurySnapshot {
  turn: number;
  gold: number;
  grain: number;
  income: number;
  expense: number;
  balance: number;
}

export interface ChartData {
  turn: number;
  date: string;
  income: number;
  expense: number;
  balance: number;
}

export interface GameSnapshot {
  id: string;
  turn: number;
  snapshotJson: string;
  type: 'auto' | 'manual';
  createdAt: number;
}

export interface MinisterLog {
  id: string;
  turn: number;
  ministerId: string;
  actionType: string;
  description: string;
  effectsJson: string;
  createdAt: number;
}

export interface AIEvent {
  id: string;
  gameTurn: number;
  narrative: string;
  mood: string;
  choicesJson: string;
  selectedChoiceId: string | null;
  createdAt: number;
}

export type GameEventType =
  | 'turn:start'
  | 'turn:end'
  | 'tax:calculated'
  | 'finance:updated'
  | 'province:updated'
  | 'military:updated'
  | 'minister:updated'
  | 'event:generated'
  | 'choice:selected'
  | 'game:over'
  | 'error';

export interface GameEvent {
  type: GameEventType;
  data?: unknown;
  timestamp: number;
}

export type Faction = 'donglin' | 'eunuch' | 'neutral';
export type FinancialHealth = 'surplus' | 'balanced' | 'deficit' | 'bankrupt';
export type TriggerType = 'random' | 'crisis' | 'opportunity' | 'player_action';
export type Region = 'north' | 'south' | 'east' | 'west' | 'central' | 'border';

export const GameConfig = {
  MAX_TAX_RATE: 0.8,
  MIN_TAX_RATE: 0,
  INITIAL_GOLD: 800,
  INITIAL_GRAIN: 500,
  GAME_OVER_GOLD_THRESHOLD: 0,
  GAME_OVER_MORALE_THRESHOLD: 10,
  GAME_OVER_BORDER_THRESHOLD: 100,
  UNREST_REBEL_THRESHOLD: 80,
  DISASTER_HIGH_THRESHOLD: 3,
} as const;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export interface PersistOptions {
  name: string;
  storage?: () => Storage;
  partialize?: (state: unknown) => unknown;
}
