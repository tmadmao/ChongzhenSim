import type { GameState, Province, NationStats, TreasurySnapshot, TaxResult, ExpenseBreakdown, GameEffect, Minister } from './types';
import { emitGameEvent } from './eventBus';
import { TaxSystem } from '../systems/taxSystem';
import { FinanceSystem } from '../systems/financeSystem';
import { updateProvince, getAllProvinces, insertGameSnapshot, generateId, saveToLocalStorage } from '../db/database';

export class GameLoop {
  private taxSystem: TaxSystem;
  private financeSystem: FinanceSystem;

  constructor() {
    this.taxSystem = new TaxSystem();
    this.financeSystem = new FinanceSystem();
  }

  async tick(currentState: GameState): Promise<GameState> {
    let state = { ...currentState };
    const logs: string[] = [];

    this.taxSystem.setTurnInfo(state.turn, state.date);
    this.financeSystem.setTurnInfo(state.turn, state.date);

    // Phase 1 - 税收计算
    try {
      state = await this.phase1_Tax(state, logs);
    } catch (error) {
      console.error('[GameLoop] Phase 1 - Tax failed:', error);
      emitGameEvent('error', { phase: 'tax', error });
    }

    // Phase 2 - 支出计算
    try {
      state = await this.phase2_Expense(state, logs);
    } catch (error) {
      console.error('[GameLoop] Phase 2 - Expense failed:', error);
      emitGameEvent('error', { phase: 'expense', error });
    }

    // Phase 3 - 省份状态更新
    try {
      state = await this.phase3_ProvinceUpdate(state, logs);
    } catch (error) {
      console.error('[GameLoop] Phase 3 - Province Update failed:', error);
      emitGameEvent('error', { phase: 'province', error });
    }

    // Phase 4 - 国家状态更新
    try {
      state = await this.phase4_NationStatsUpdate(state, logs);
    } catch (error) {
      console.error('[GameLoop] Phase 4 - Nation Stats Update failed:', error);
      emitGameEvent('error', { phase: 'nation', error });
    }

    // Phase 5 - 大臣状态更新
    try {
      state = await this.phase5_MinisterUpdate(state, logs);
    } catch (error) {
      console.error('[GameLoop] Phase 5 - Minister Update failed:', error);
      emitGameEvent('error', { phase: 'minister', error });
    }

    // Phase 6 - 国策研究推进
    try {
      // 动态导入并忽略类型检查，避免路径大小写问题
      const policyStoreModule = await import('@/store/policyStore') as any;
      const policyStore = policyStoreModule.usePolicyStore.getState();
      const completedPolicies = policyStore.tickResearch();

      // 将本回合完成的国策效果应用到 gameState
      for (const policyId of completedPolicies) {
        const policy = policyStore.getPolicyById(policyId);
        if (!policy) continue;
        for (const effect of policy.effects) {
          state = this.applyEffect(effect, state); // 复用现有的 applyEffect 函数
        }
        emitGameEvent('policy:completed', { policyId, policyName: policy.name });
        // 向回合日志添加记录
        logs.push(`【国策】${policy.name} 研究完成，效果已生效`);
      }
    } catch (err) {
      console.error('[GameLoop] 国策推进失败', err);
      emitGameEvent('error', { phase: 'policy', error: err });
    }

    // Phase 7 - 剧本引擎
    try {
      const { scenarioEngine } = await import('@/systems/scenarioEngine');
      state = scenarioEngine.tick(state);
      emitGameEvent('scenario:updated', { turn: state.turn });
    } catch (err) {
      console.error('[GameLoop] 剧本引擎 tick 失败', err);
      emitGameEvent('error', { phase: 'scenario', error: err });
    }

    // Phase 8 - 日期推进
    try {
      state = await this.phase6_DateAdvance(state, logs);
    } catch (error) {
      console.error('[GameLoop] Phase 8 - Date Advance failed:', error);
      emitGameEvent('error', { phase: 'date', error });
    }

    // Phase 9 - 保存快照
    try {
      await this.phase7_SaveSnapshot(state, logs);
    } catch (error) {
      console.error('[GameLoop] Phase 9 - Save Snapshot failed:', error);
      emitGameEvent('error', { phase: 'snapshot', error });
    }

    // Phase 10 - 游戏结束检查
    try {
      state = await this.phase8_GameOverCheck(state, logs);
    } catch (error) {
      console.error('[GameLoop] Phase 10 - Game Over Check failed:', error);
      emitGameEvent('error', { phase: 'gameover', error });
    }

    // 更新状态中的回合日志
    if (!state.turnLog) {
      state.turnLog = [];
    }
    state.turnLog = [...state.turnLog, ...logs];

    emitGameEvent('turn:end', { turn: state.turn, logs });

    return state;
  }

  private async phase1_Tax(state: GameState, logs: string[]): Promise<GameState> {
    const taxResults = this.taxSystem.calculateAllProvincesTax(state.provinces, state.nationStats);
    
    this.taxSystem.applyTaxEffects(state.provinces, taxResults);
    
    const totalIncome = this.taxSystem.getTotalTaxRevenue(taxResults);
    state.treasury.gold += totalIncome;
    
    const report = this.taxSystem.getTaxReport(taxResults);
    logs.push(`税收阶段：全国税收 ${report.totalIncome.toFixed(1)} 万两`);
    
    if (report.topProvince) {
      logs.push(`税收最高：${report.topProvince.provinceName} (${report.topProvince.actualTax.toFixed(1)}万两)`);
    }
    
    emitGameEvent('tax:calculated', { results: taxResults, total: totalIncome });
    
    return state;
  }

  private async phase2_Expense(state: GameState, logs: string[]): Promise<GameState> {
    const expenses = this.financeSystem.calculateExpenses(state);
    
    this.financeSystem.recordExpenses(expenses);
    
    const snapshot = this.financeSystem.updateTreasury(
      state.treasury.gold - expenses.total + state.treasury.gold,
      expenses,
      state.treasury.gold
    );
    
    state.treasury.gold = snapshot.gold;
    
    if (state.treasury.gold <= 0) {
      logs.push(`警告：国库已空虚！`);
    }
    
    logs.push(`支出阶段：总支出 ${expenses.total.toFixed(1)} 万两`);
    logs.push(`  - 军费: ${expenses.military.toFixed(1)}万两`);
    logs.push(`  - 俸禄: ${expenses.salary.toFixed(1)}万两`);
    logs.push(`  - 赈灾: ${expenses.disaster.toFixed(1)}万两`);
    
    const health = this.financeSystem.getFinancialHealth(state.treasury.gold, snapshot.income, expenses.total);
    emitGameEvent('finance:updated', { snapshot, expenses, health });
    
    return state;
  }

  private async phase3_ProvinceUpdate(state: GameState, logs: string[]): Promise<GameState> {
    const updatedProvinces = state.provinces.map(province => {
      let civilUnrest = province.civilUnrest;
      let disasterLevel = province.disasterLevel;
      
      civilUnrest = Math.max(0, civilUnrest - 5);
      
      if (province.disasterLevel >= 3) {
        civilUnrest = Math.min(100, civilUnrest + 10);
      }
      
      if (province.taxRate > 0.3) {
        civilUnrest = Math.min(100, civilUnrest + Math.floor((province.taxRate - 0.3) * 15));
      }
      
      if (province.disasterLevel > 0 && Math.random() < 0.2) {
        disasterLevel = Math.max(0, disasterLevel - 1);
      }
      
      const corruptionChange = (Math.random() - 0.5) * 5;
      const corruptionLevel = Math.max(0, Math.min(100, province.corruptionLevel + corruptionChange));
      
      updateProvince(province.id, { civilUnrest, disasterLevel, corruptionLevel });
      
      return {
        ...province,
        civilUnrest,
        disasterLevel,
        corruptionLevel: Math.round(corruptionLevel),
        taxRevenue: province.population * province.taxRate * 0.1
      };
    });
    
    const highUnrestProvinces = updatedProvinces.filter(p => p.civilUnrest > 70);
    if (highUnrestProvinces.length > 0) {
      logs.push(`警报：${highUnrestProvinces.map(p => p.name).join('、')} 民乱告急`);
    }
    
    const highDisasterProvinces = updatedProvinces.filter(p => p.disasterLevel >= 3);
    if (highDisasterProvinces.length > 0) {
      logs.push(`天灾：${highDisasterProvinces.map(p => p.name).join('、')} 灾情严重`);
    }
    
    state.provinces = updatedProvinces;
    emitGameEvent('province:updated', updatedProvinces);
    
    return state;
  }

  private async phase4_NationStatsUpdate(state: GameState, logs: string[]): Promise<GameState> {
    const { provinces, ministers, nationStats } = state;
    
    const totalMilitary = provinces.reduce((sum, p) => sum + p.militaryForce, 0);
    const militaryPower = Math.min(100, Math.round(totalMilitary / 10));
    
    const avgUnrest = provinces.reduce((sum, p) => sum + p.civilUnrest, 0) / provinces.length;
    const peopleMorale = Math.max(0, Math.min(100, Math.round(100 - avgUnrest)));
    
    const fluctuation = (Math.random() - 0.5) * 10;
    let borderThreat = nationStats.borderThreat + fluctuation;
    
    if (militaryPower < 30) {
      borderThreat += 5;
    }
    borderThreat = Math.max(0, Math.min(100, borderThreat));
    
    const avgCorruption = provinces.reduce((sum, p) => sum + p.corruptionLevel, 0) / provinces.length;
    const overallCorruption = Math.round(avgCorruption);
    
    const avgDisaster = provinces.reduce((sum, p) => sum + p.disasterLevel, 0) / provinces.length;
    const agriculturalOutput = Math.max(0, Math.min(100, Math.round(100 - avgDisaster * 10)));
    
    const newNationStats: NationStats = {
      militaryPower,
      peopleMorale,
      borderThreat: Math.round(borderThreat),
      overallCorruption,
      agriculturalOutput
    };
    
    state.nationStats = newNationStats;
    
    if (borderThreat > 80) {
      logs.push(`警报：边患严重，已达 ${Math.round(borderThreat)}%`);
    }
    
    if (peopleMorale < 30) {
      logs.push(`警报：民心涣散，仅剩 ${peopleMorale}%`);
    }
    
    emitGameEvent('nation:updated', newNationStats);
    
    return state;
  }

  private async phase5_MinisterUpdate(state: GameState, logs: string[]): Promise<GameState> {
    const updatedMinisters = state.ministers.map(minister => {
      if (!minister.isAlive) return minister;
      
      let loyalty = minister.loyalty;
      let corruption = minister.corruption;
      
      if (corruption > 50) {
        loyalty = Math.max(0, loyalty - 1);
      }
      
      if (state.nationStats.overallCorruption > 60) {
        corruption = Math.min(100, corruption + 1);
      }
      
      const loyaltyChange = (Math.random() - 0.5) * 3;
      loyalty = Math.max(0, Math.min(100, loyalty + loyaltyChange));
      
      return {
        ...minister,
        loyalty: Math.round(loyalty),
        corruption: Math.round(corruption)
      };
    });
    
    const disloyalMinisters = updatedMinisters.filter(m => m.isAlive && m.loyalty < 30);
    if (disloyalMinisters.length > 0) {
      logs.push(`警告：${disloyalMinisters.map(m => m.name).join('、')} 忠诚度过低`);
    }
    
    state.ministers = updatedMinisters;
    emitGameEvent('minister:updated', updatedMinisters);
    
    return state;
  }

  private async phase6_DateAdvance(state: GameState, logs: string[]): Promise<GameState> {
    let { turn, date, phase } = state;
    
    const phases: Array<'morning' | 'afternoon' | 'night'> = ['morning', 'afternoon', 'night'];
    const currentIndex = phases.indexOf(phase);
    
    if (currentIndex < phases.length - 1) {
      phase = phases[currentIndex + 1];
    } else {
      phase = 'morning';
      turn += 1;
      
      const { year, month } = parseGameDate(date);
      let newMonth = month + 1;
      let newYear = year;
      
      if (newMonth > 12) {
        newMonth = 1;
        newYear += 1;
      }
      
      date = formatGameDate(newYear, newMonth);
    }
    
    const phaseName = phase === 'morning' ? '早朝' : phase === 'afternoon' ? '午朝' : '夜议';
    logs.push(`时间推进：${date} · ${phaseName}`);
    
    return { ...state, turn, date, phase };
  }

  private async phase7_SaveSnapshot(state: GameState, logs: string[]): Promise<void> {
    insertGameSnapshot({
      id: generateId(),
      turn: state.turn,
      snapshotJson: JSON.stringify(state),
      type: 'auto',
      createdAt: Date.now()
    });
    
    saveToLocalStorage();
    logs.push(`存档：第 ${state.turn} 回合快照已保存`);
  }

  private async phase8_GameOverCheck(state: GameState, logs: string[]): Promise<GameState> {
    const { treasury, nationStats, provinces } = state;
    
    if (treasury.gold <= 0) {
      state.isGameOver = true;
      state.gameOverReason = '国库空虚，大明财政崩溃';
      logs.push(`游戏结束：${state.gameOverReason}`);
      return state;
    }
    
    if (nationStats.peopleMorale <= 10) {
      state.isGameOver = true;
      state.gameOverReason = '民心尽失，天下大乱';
      logs.push(`游戏结束：${state.gameOverReason}`);
      return state;
    }
    
    if (nationStats.borderThreat >= 100) {
      state.isGameOver = true;
      state.gameOverReason = '边患失控，京师沦陷';
      logs.push(`游戏结束：${state.gameOverReason}`);
      return state;
    }
    
    const highUnrestProvinces = provinces.filter(p => p.civilUnrest >= 90);
    if (highUnrestProvinces.length >= 5) {
      state.isGameOver = true;
      state.gameOverReason = '民变四起，大明覆灭';
      logs.push(`游戏结束：${state.gameOverReason}`);
      return state;
    }
    
    return state;
  }

  // 应用游戏效果
  private applyEffect(effect: GameEffect, state: GameState): GameState {
    let newState = { ...state };
    
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
        
      case 'military':
        // 处理军事相关效果
        if (effect.target === 'all') {
          newState.nationStats.militaryPower += effect.delta;
        }
        break;
    }
    
    return newState;
  }
}

export function parseGameDate(date: string): { year: number; month: number } {
  const match = date.match(/崇祯(\d+)年(\d+)月/);
  if (match) {
    return {
      year: parseInt(match[1], 10),
      month: parseInt(match[2], 10)
    };
  }
  return { year: 1, month: 1 };
}

export function formatGameDate(year: number, month: number): string {
  return `崇祯${year}年${month}月`;
}

export const gameLoop = new GameLoop();
