import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, Province, Minister, NationStats, AIEventResponse, PlayerDecision, GamePhase } from '../core/types';
import { emitGameEvent } from '../core/eventBus';
import { gameLoop } from '../core/gameLoop';
import { llmClient, buildEventContext } from '../api';
import type { FinancialLedger } from '../api/schemas';
import { 
  initDatabase, 
  insertProvinces, 
  getAllProvinces, 
  updateProvince,
  saveToLocalStorage,
  clearDatabase
} from '../db/database';
import { useProvinceStore } from './provinceStore';
import { useFinanceStore } from './financeStore';

interface PendingDecision {
  type: string;
  eventId?: string;
  choiceId?: string;
  policyId?: string;
  effects?: any[];
}

interface GameStore {
  gameState: GameState | null;
  isLoading: boolean;
  loadingMessage: string;
  currentPhase: GamePhase;
  turnLog: string[];
  error: string | null;
  currentLedger: FinancialLedger | null;
  pendingDecisions: PendingDecision[];
  
  initGame: (provinces: Province[], ministers: Minister[], initialTreasury: { gold: number; grain: number }) => Promise<void>;
  endTurn: () => Promise<void>;
  applyPlayerDecision: (decision: PlayerDecision) => void;
  setCurrentEvent: (event: AIEventResponse | null) => void;
  addTurnLog: (message: string) => void;
  saveGame: () => void;
  loadGame: () => Promise<boolean>;
  resetGame: () => void;
  setError: (error: string | null) => void;
  adjustProvinceTaxRate: (provinceId: string, rate: number) => void;
  replaceOfficial: (positionTitle: string, newMinisterId: string) => void;
  applyBatchEffects: (effects: any[]) => void;
  setCurrentLedger: (ledger: FinancialLedger) => void;
  clearPendingDecisions: () => void;
}

const initialNationStats: NationStats = {
  militaryPower: 55,
  peopleMorale: 45,
  borderThreat: 40,
  overallCorruption: 35,
  agriculturalOutput: 60
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      gameState: null,
      isLoading: false,
      loadingMessage: '',
      currentPhase: 'morning',
      turnLog: [],
      error: null,
      currentLedger: null,
      pendingDecisions: [],

      initGame: async (provinces, ministers, initialTreasury) => {
        set({ isLoading: true, loadingMessage: '初始化数据库...' });
        
        try {
          console.log('[GameStore] initGame: clearing old database');
          clearDatabase();
          console.log('[GameStore] initGame: calling initDatabase');
          await initDatabase();
          console.log('[GameStore] initGame: initDatabase done');
          
          set({ loadingMessage: '写入初始数据...' });
          console.log('[GameStore] initGame: inserting', provinces.length, 'provinces');
          insertProvinces(provinces);
          console.log('[GameStore] initGame: insertProvinces done');
          
          const gameState: GameState = {
            turn: 1,
            date: '崇祯1年1月',
            phase: 'morning',
            treasury: {
              gold: initialTreasury.gold,
              grain: initialTreasury.grain,
              transactions: []
            },
            provinces,
            ministers,
            nationStats: initialNationStats,
            currentEvent: null,
            eventHistory: [],
            isGameOver: false
          };
          
          console.log('[GameStore] initGame: setting gameState');
          set({ 
            gameState, 
            isLoading: false, 
            loadingMessage: '',
            currentPhase: 'morning',
            turnLog: ['游戏开始：崇祯元年正月']
          });
          
          console.log('[GameStore] initGame: loading province and finance data');
          useProvinceStore.getState().loadProvinces();
          useFinanceStore.getState().loadFinanceData();
          
          emitGameEvent('game:init', gameState);
          
        } catch (error) {
          console.error('[GameStore] initGame failed:', error);
          set({ 
            isLoading: false, 
            error: `初始化失败: ${error instanceof Error ? error.message : '未知错误'}` 
          });
        }
      },

      endTurn: async () => {
        const { gameState, turnLog } = get();
        if (!gameState) return;
        
        set({ isLoading: true, loadingMessage: '处理回合...' });
        
        try {
          const result = await gameLoop.tick(gameState);
          
          let newState: GameState = {
            ...gameState,
            turn: result.turn,
            date: result.date,
            phase: result.phase,
            treasury: result.treasury,
            provinces: result.provinces,
            nationStats: result.nationStats,
            lastIncome: result.lastIncome,
            lastExpense: result.lastExpense,
            isGameOver: result.isGameOver,
            gameOverReason: result.gameOverReason
          };

          set({ loadingMessage: '生成朝廷事件...' });
          
          try {
            const eventContext = buildEventContext(
              newState, 
              turnLog.slice(-10),
              'random'
            );
            const aiEvent = await llmClient.generateEvent(eventContext);
            newState.currentEvent = aiEvent;
          } catch (aiError) {
            console.warn('[GameStore] AI 事件生成失败，使用默认事件', aiError);
            newState.currentEvent = {
              narrative: '今日朝堂平静，诸事无异。皇上批阅奏折至深夜，未有大变。',
              mood: 'normal',
              choices: [
                { id: 'rest', text: '继续处理政务', hint: '维持现状', effects: [] },
                { id: 'inspect', text: '召见大臣问询', hint: '或有新情报', effects: [] }
              ],
              immediateEffects: [],
              ministersInvolved: []
            };
          }
          
          const newLogs = [
            `【${newState.date}】回合 ${newState.turn} 开始`,
            `税收：${newState.lastIncome?.toFixed(1) || 0} 万两`,
            `支出：${newState.lastExpense?.toFixed(1) || 0} 万两`
          ];
          
          set({ 
            gameState: newState, 
            isLoading: false,
            currentPhase: newState.phase,
            turnLog: [...turnLog, ...newLogs]
          });
          
          // 更新 financeStore 中的国库数据
          try {
            const financeStore = useFinanceStore.getState();
            if (financeStore && financeStore.updateTreasury) {
              financeStore.updateTreasury(newState.treasury.gold, newState.treasury.grain);
            }
          } catch (error) {
            console.error('[GameStore] Failed to update financeStore:', error);
          }
          
          emitGameEvent('turn:end', { turn: result.turn });
          
        } catch (error) {
          console.error('[GameStore] endTurn failed:', error);
          set({ 
            isLoading: false, 
            error: `回合处理失败: ${error instanceof Error ? error.message : '未知错误'}` 
          });
        }
      },

      applyPlayerDecision: async (decision) => {
        const { gameState, turnLog } = get();
        if (!gameState) return;

        logger.info(`[GameStore] Applying player decision: ${decision.type}`, decision);
        console.log(`[GameStore] applyPlayerDecision called:`, {
          type: decision.type,
          eventId: decision.eventId,
          choiceId: decision.choiceId,
          effectsCount: decision.effects?.length
        });

        // 导入ChangeQueue和AccountingSystem
        const { changeQueue } = await import('@/engine/ChangeQueue');
        const { accountingSystem } = await import('@/engine/AccountingSystem');
        const { resolveEffectValue } = await import('@/config/gameConfig');

        // 处理不同类型的决策
        switch (decision.type) {
          case 'event_choice': {
            // 处理事件选择
            if (decision.effects && decision.effects.length > 0) {
              console.log(`[GameStore] Queueing ${decision.effects.length} event effects`);

              for (const effect of decision.effects) {
                // 支持新旧两种格式
                // 新格式: OptionEffect (有 value/configKey 和 mode)
                // 旧格式: GameEffect (有 delta)
                let resolvedValue: number;
                let mode: 'delta' | 'absolute';

                if ('value' in effect || 'configKey' in effect) {
                  // 新格式 OptionEffect
                  resolvedValue = resolveEffectValue(
                    effect.configKey as any,
                    effect.value
                  );
                  mode = effect.mode || 'delta';
                } else {
                  // 旧格式 GameEffect
                  resolvedValue = effect.delta || 0;
                  mode = 'delta';
                }

                // 根据 mode 确定 delta 或 newValue
                let delta: number | undefined;
                let newValue: number | undefined;

                if (mode === 'delta') {
                  delta = resolvedValue;
                } else {
                  newValue = resolvedValue;
                }

                // 所有效果都添加到ChangeQueue
                changeQueue.enqueue({
                  type: effect.type as any,
                  target: effect.target,
                  field: effect.field,
                  delta,
                  newValue,
                  description: effect.description || '事件效果',
                  source: decision.choiceId || 'unknown'
                });

                console.log(`[ChangeQueue] 已加入队列: ${effect.type}.${effect.field} ${mode === 'delta' ? (delta && delta >= 0 ? '+' : '') : '='}${resolvedValue}`);

                // 财务效果同时记录到AccountingSystem
                if (effect.type === 'treasury' && effect.field === 'gold' && delta !== undefined) {
                  if (delta > 0) {
                    accountingSystem.addIncome(
                      effect.description || '事件收入',
                      delta,
                      decision.choiceId || 'unknown'
                    );
                  } else if (delta < 0) {
                    accountingSystem.addExpense(
                      effect.description || '事件支出',
                      Math.abs(delta),
                      decision.choiceId || 'unknown'
                    );
                  }
                }
              }

              console.log(`[ChangeQueue] 已加入待结算队列: ${decision.effects.length} 个事件效果`);
            }
            break;
          }
          
          case 'research_policy':
          case 'start_policy_research': {
            // 处理国策研究
            if (decision.policyId) {
              const policyStoreModule = await import('@/store/policyStore') as any;
              const policyStore = policyStoreModule.usePolicyStore.getState();
              const policy = policyStore.getPolicyById(decision.policyId);
              
              if (policy && policy.cost > 0) {
                // 将国策费用添加到ChangeQueue
                changeQueue.enqueue({
                  type: 'treasury',
                  target: 'treasury',
                  field: 'gold',
                  delta: -policy.cost,
                  description: `研究国策费用: ${policy.name}`,
                  source: decision.policyId
                });
                
                // 记录到AccountingSystem
                accountingSystem.addExpense(
                  `研究国策: ${policy.name}`,
                  policy.cost,
                  '国策研究'
                );
                
                console.log(`[ChangeQueue] 已加入待结算队列: 国策研究费用 ${policy.cost}`);
              }
              
              // 开始研究（这不需要修改国库，只修改国策状态）
              if (decision.type === 'start_policy_research') {
                policyStore.startResearch(decision.policyId, gameState);
                set({
                  turnLog: [...turnLog, `开始研究国策：${policy?.name}（预计${policy?.researchTurns}回合完成）`]
                });
              }
            }
            break;
          }
          
          case 'cancel_policy_research': {
            // 取消国策研究
            if (decision.policyId) {
              const policyStoreModule = await import('@/store/policyStore') as any;
              const policyStore = policyStoreModule.usePolicyStore.getState();
              policyStore.cancelResearch(decision.policyId);
              
              const policy = policyStore.getPolicyById(decision.policyId);
              if (policy) {
                set({
                  turnLog: [...turnLog, `取消研究国策：${policy.name}`]
                });
              }
            }
            break;
          }
          
          default: {
            // 处理其他类型的决策效果
            if (decision.effects && decision.effects.length > 0) {
              console.log(`[GameStore] Queueing ${decision.effects.length} decision effects`);
              
              for (const effect of decision.effects) {
                changeQueue.enqueue({
                  type: effect.type as any,
                  target: effect.target,
                  field: effect.field,
                  delta: effect.delta,
                  newValue: effect.newValue,
                  description: effect.description || '决策效果',
                  source: decision.choiceId || 'unknown'
                });
                
                // 财务效果记录到AccountingSystem
                if (effect.type === 'treasury' && effect.field === 'gold') {
                  if (effect.delta > 0) {
                    accountingSystem.addIncome(
                      effect.description || '收入', 
                      effect.delta, 
                      '决策'
                    );
                  } else if (effect.delta < 0) {
                    accountingSystem.addExpense(
                      effect.description || '支出', 
                      Math.abs(effect.delta), 
                      '决策'
                    );
                  }
                }
              }
            }
          }
        }
        
        // 记录决策到日志
        set({
          turnLog: [...turnLog, `决策：${decision.choiceId || decision.policyId || '未知决策'}（待结算）`]
        });
        
        // 触发决策事件
        emitGameEvent('decision:made', decision);
        
        console.log(`[GameStore] Decision queued successfully. Queue length: ${changeQueue.length}`);
      },

      setCurrentEvent: (event) => {
        const { gameState } = get();
        if (!gameState) return;
        
        set({
          gameState: {
            ...gameState,
            currentEvent: event,
            eventHistory: event ? [...gameState.eventHistory, event] : gameState.eventHistory
          }
        });
        
        if (event) {
          emitGameEvent('event:generated', event);
        }
      },

      addTurnLog: (message) => {
        const { turnLog } = get();
        set({ turnLog: [...turnLog, message] });
      },

      saveGame: () => {
        saveToLocalStorage();
        emitGameEvent('game:save', {});
      },

      loadGame: async () => {
        set({ isLoading: true, loadingMessage: '加载存档...' });
        
        try {
          await initDatabase();
          
          const provinces = getAllProvinces();
          
          if (provinces.length === 0) {
            set({ isLoading: false });
            return false;
          }
          
          set({ 
            isLoading: false,
            gameState: {
              turn: 1,
              date: '崇祯1年1月',
              phase: 'morning',
              treasury: { gold: 800, grain: 500, transactions: [] },
              provinces,
              ministers: [],
              nationStats: initialNationStats,
              currentEvent: null,
              eventHistory: [],
              isGameOver: false
            }
          });
          
          emitGameEvent('game:load', {});
          return true;
          
        } catch (error) {
          console.error('[GameStore] loadGame failed:', error);
          set({ 
            isLoading: false, 
            error: `加载失败: ${error instanceof Error ? error.message : '未知错误'}` 
          });
          return false;
        }
      },

      resetGame: () => {
        set({
          gameState: null,
          isLoading: false,
          loadingMessage: '',
          currentPhase: 'morning',
          turnLog: [],
          error: null
        });
      },

      setError: (error) => {
        set({ error });
      },

      adjustProvinceTaxRate: async (provinceId: string, rate: number) => {
        const { gameState, turnLog } = get();
        if (!gameState) return;
        
        const clampedRate = Math.max(0, Math.min(0.8, rate));
        const province = gameState.provinces.find(p => p.id === provinceId);
        
        if (!province) return;
        
        const oldRate = province.taxRate;
        
        // 将税率调整添加到 ChangeQueue，等待回合结算
        // 不立即修改状态！
        const { changeQueue } = await import('@/engine/ChangeQueue');
        
        // 1. 税率变动（使用 newValue 模式，因为这是绝对值）
        changeQueue.enqueue({
          type: 'province',
          target: provinceId,
          field: 'taxRate',
          newValue: clampedRate, // 新值（绝对值）
          description: `${province.name} 税率调整: ${(oldRate * 100).toFixed(0)}% → ${(clampedRate * 100).toFixed(0)}%`,
          source: '税率调整'
        });
        
        // 2. 民乱变动（如果税率变化大）
        let civilUnrestDelta = 0;
        if (clampedRate > oldRate + 0.1) {
          civilUnrestDelta = Math.floor((clampedRate - oldRate) * 30);
        } else if (clampedRate < oldRate - 0.1) {
          civilUnrestDelta = -Math.floor((oldRate - clampedRate) * 15);
        }
        
        if (civilUnrestDelta !== 0) {
          changeQueue.enqueue({
            type: 'province',
            target: provinceId,
            field: 'civilUnrest',
            delta: civilUnrestDelta,
            description: `${province.name} 民乱变化: ${civilUnrestDelta > 0 ? '+' : ''}${civilUnrestDelta}`,
            source: '税率调整'
          });
        }
        
        // 注意：这里不修改 gameState，只记录到队列
        // 状态将在回合结束时统一更新
        
        set({
          turnLog: [...turnLog, `税率调整：${province.name} 税率调整为 ${(clampedRate * 100).toFixed(0)}%（待结算）`]
        });
      },

      replaceOfficial: (positionTitle: string, newMinisterId: string) => {
        const { gameState, turnLog } = get();
        if (!gameState) return;
        
        // 找到当前担任该职位的官员
        const currentOfficial = gameState.ministers.find(
          m => m.isAlive && m.title === positionTitle
        );
        
        // 找到新官员
        const newMinister = gameState.ministers.find(m => m.id === newMinisterId);
        
        if (!newMinister || !newMinister.isAlive) return;
        
        // 更新官员列表
        const updatedMinisters = gameState.ministers.map(m => {
          // 如果是当前任职官员，将其职位改为新官员的原职位（交换）
          if (currentOfficial && m.id === currentOfficial.id) {
            return {
              ...m,
              title: newMinister.title,
              department: newMinister.department,
              positions: newMinister.positions.map(pos => ({
                ...pos,
                title: newMinister.title
              }))
            };
          }
          // 如果是新官员，将其职位改为目标职位
          if (m.id === newMinisterId) {
            return {
              ...m,
              title: positionTitle,
              department: currentOfficial?.department || m.department,
              positions: [{
                title: positionTitle,
                department: currentOfficial?.department || m.department,
                rank: currentOfficial?.positions[0]?.rank || m.positions[0]?.rank || 2,
                isPrimary: true
              }]
            };
          }
          return m;
        });
        
        const oldName = currentOfficial?.name || '空缺';
        const newPosition = positionTitle;
        
        set({
          gameState: {
            ...gameState,
            ministers: updatedMinisters
          },
          turnLog: [...turnLog, `人事变动：${newMinister.name} 接替 ${oldName} 出任 ${newPosition}`]
        });
        
        emitGameEvent('minister:updated', { positionTitle, newMinisterId, oldMinisterId: currentOfficial?.id });
      },

      applyBatchEffects: async (effects) => {
        const { gameState, turnLog } = get();
        if (!gameState) return;
        
        try {
          const { scenarioEngine } = await import('@/systems/scenarioEngine');
          const newState = scenarioEngine.applyEffectsPublic(effects, gameState);
          
          set({ 
            gameState: newState,
            turnLog: [...turnLog, `批量应用 ${effects.length} 个效果`]
          });
          
          emitGameEvent('effects:applied' as any, { effects });
        } catch (error) {
          console.error('[GameStore] applyBatchEffects failed:', error);
          set({ 
            error: `效果应用失败: ${error instanceof Error ? error.message : '未知错误'}` 
          });
        }
      },

      setCurrentLedger: (ledger) => {
        set({ currentLedger: ledger });
        emitGameEvent('ledger:updated', { ledger });
      },

      clearPendingDecisions: () => {
        set({ pendingDecisions: [] });
        logger.info('[GameStore] Pending decisions cleared');
      }
    }),
    {
      name: 'chongzhensim-game-store',
      partialize: (state) => ({
        gameState: state.gameState,
        turnLog: state.turnLog
      })
    }
  )
);
