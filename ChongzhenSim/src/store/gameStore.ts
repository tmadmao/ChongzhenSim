import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, Province, Minister, NationStats, AIEventResponse, PlayerDecision, GamePhase } from '../core/types';
import { emitGameEvent } from '../core/eventBus';
import { gameLoop } from '../core/gameLoop';
import { llmClient, buildEventContext } from '../api';
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

interface GameStore {
  gameState: GameState | null;
  isLoading: boolean;
  loadingMessage: string;
  currentPhase: GamePhase;
  turnLog: string[];
  error: string | null;
  
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
            date: '崇祯元年正月',
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
            nationStats: result.nationStats,
            lastIncome: result.lastIncome,
            lastExpense: result.lastExpense,
            isGameOver: result.isGameOver,
            gameOverReason: result.gameOverReason
          };

          const updatedProvinces = getAllProvinces();
          if (updatedProvinces.length > 0) {
            newState.provinces = updatedProvinces;
          }

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
        
        let newState = { ...gameState };
        
        if (decision.type === 'event_choice') {
          const { scenarioEngine } = await import('@/systems/scenarioEngine');
          newState = scenarioEngine.applyChoice(
            decision.eventId!,
            decision.choiceId!,
            gameState
          );
          set({ gameState: newState });
        } else if (decision.type === 'research_policy') {
          // 处理国策研究决策
          if (decision.policyId) {
            // 扣除研究费用
            const policyStoreModule = await import('@/store/policyStore') as any;
            const policy = policyStoreModule.usePolicyStore.getState().getPolicyById(decision.policyId);
            if (policy) {
              newState.treasury.gold -= policy.cost;
              set({ gameState: newState });
            }
          }
        } else if (decision.type === 'start_policy_research') {
          const policyStoreModule = await import('@/store/policyStore') as any;
          const policyStore = policyStoreModule.usePolicyStore.getState();
          const currentState = get().gameState;
          if (!currentState) return;

          const result = policyStore.canStartResearch(decision.policyId!, currentState);
          if (!result.canResearch) {
            set({ error: result.reason });
            return;
          }

          // 扣除研究费用
          const policy = policyStore.getPolicyById(decision.policyId!)!;
          if (policy.cost > 0) {
            set(state => ({
              gameState: state.gameState ? {
                ...state.gameState,
                treasury: {
                  ...state.gameState.treasury,
                  gold: state.gameState.treasury.gold - policy.cost,
                }
              } : null
            }));
          }

          policyStore.startResearch(decision.policyId!, get().gameState!);
          const { addTurnLog } = get();
          addTurnLog(`开始研究国策：${policy.name}（预计${policy.researchTurns}回合完成）`);
        } else if (decision.type === 'cancel_policy_research') {
          const policyStoreModule = await import('@/store/policyStore') as any;
          const policyStore = policyStoreModule.usePolicyStore.getState();
          if (decision.policyId) {
            policyStore.cancelResearch(decision.policyId);
            const policy = policyStore.getPolicyById(decision.policyId);
            if (policy) {
              const { addTurnLog } = get();
              addTurnLog(`取消研究国策：${policy.name}`);
            }
          }
        } else {
          decision.effects.forEach(effect => {
            switch (effect.type) {
              case 'treasury':
                if (effect.field === 'gold') {
                  newState.treasury.gold += effect.delta;
                } else if (effect.field === 'grain') {
                  newState.treasury.grain += effect.delta;
                }
                break;
                
              case 'province':
                const province = newState.provinces.find(p => p.id === effect.target);
                if (province) {
                  const key = effect.field as keyof Province;
                  if (typeof province[key] === 'number') {
                    (province as unknown as Record<string, number>)[key] += effect.delta;
                    updateProvince(effect.target, { [key]: (province as unknown as Record<string, number>)[key] });
                  }
                }
                break;
                
              case 'minister':
                const minister = newState.ministers.find(m => m.id === effect.target);
                if (minister) {
                  const key = effect.field as keyof Minister;
                  if (typeof minister[key] === 'number') {
                    (minister as unknown as Record<string, number>)[key] += effect.delta;
                  }
                }
                break;
                
              case 'nation':
                const statsKey = effect.field as keyof NationStats;
                if (statsKey in newState.nationStats) {
                  newState.nationStats[statsKey] += effect.delta;
                }
                break;
            }
          });
          
          set({ 
            gameState: newState,
            turnLog: [...turnLog, `决策：${decision.choiceId || decision.policyId}`]
          });
        }
        
        emitGameEvent('decision:made', decision);
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
              date: '崇祯元年正月',
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

      adjustProvinceTaxRate: (provinceId: string, rate: number) => {
        const { gameState, turnLog } = get();
        if (!gameState) return;
        
        const clampedRate = Math.max(0, Math.min(0.8, rate));
        const province = gameState.provinces.find(p => p.id === provinceId);
        
        if (!province) return;
        
        updateProvince(provinceId, { taxRate: clampedRate });
        
        const oldRate = province.taxRate;
        let civilUnrest = province.civilUnrest;
        
        if (clampedRate > oldRate + 0.1) {
          civilUnrest = Math.min(100, civilUnrest + Math.floor((clampedRate - oldRate) * 30));
        } else if (clampedRate < oldRate - 0.1) {
          civilUnrest = Math.max(0, civilUnrest - Math.floor((oldRate - clampedRate) * 15));
        }
        
        updateProvince(provinceId, { civilUnrest });
        
        const updatedProvinces = gameState.provinces.map(p => 
          p.id === provinceId 
            ? { ...p, taxRate: clampedRate, civilUnrest, taxRevenue: p.population * clampedRate * 0.1 }
            : p
        );
        
        set({
          gameState: {
            ...gameState,
            provinces: updatedProvinces
          },
          turnLog: [...turnLog, `税率调整：${province.name} 税率调整为 ${(clampedRate * 100).toFixed(0)}%`]
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
