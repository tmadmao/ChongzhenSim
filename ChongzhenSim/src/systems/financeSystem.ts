import type { Province, ExpenseBreakdown, TreasurySnapshot, ChartData, GameState } from '../core/types';
import { getTreasuryHistory, getTotalGold } from '../db/database';
import { GAME_CONFIG } from '../config/gameConfig';
import { accountingSystem } from '../engine/AccountingSystem';

export class FinanceSystem {
  private currentTurn: number = 1;
  private initialTreasury: number = GAME_CONFIG.INITIAL.TREASURY;

  setTurnInfo(turn: number): void {
    this.currentTurn = turn;
  }

  calculateExpenses(state: GameState): ExpenseBreakdown {
    const { provinces, ministers, nationStats } = state;
    
    const totalMilitary = provinces.reduce((sum, p) => sum + p.militaryForce, 0);
    const military = totalMilitary * GAME_CONFIG.FINANCE.MILITARY_COST_PER_FORCE;
    
    const aliveMinisters = ministers.filter(m => m.isAlive);
    const salary = aliveMinisters.length * GAME_CONFIG.FINANCE.MINISTER_SALARY;
    
    const highDisasterProvinces = provinces.filter(p => p.disasterLevel >= 3);
    const disaster = highDisasterProvinces.reduce((sum, p) => sum + p.disasterLevel * GAME_CONFIG.FINANCE.DISASTER_RELIEF_PER_LEVEL, 0);
    
    const border = nationStats.borderThreat * GAME_CONFIG.FINANCE.BORDER_THREAT_COST;
    
    const corruption = Math.floor(nationStats.overallCorruption * GAME_CONFIG.FINANCE.CORRUPTION_LOSS_RATE);
    
    const total = military + salary + disaster + border + corruption;
    
    return {
      military: Math.round(military * 100) / 100,
      salary: Math.round(salary * 100) / 100,
      disaster: Math.round(disaster * 100) / 100,
      border: Math.round(border * 100) / 100,
      corruption: Math.round(corruption * 100) / 100,
      total: Math.round(total * 100) / 100,
      details: [
        { category: '军费', amount: military, description: `全国驻军 ${totalMilitary} 千人` },
        { category: '俸禄', amount: salary, description: `${aliveMinisters.length} 名官员` },
        { category: '赈灾', amount: disaster, description: `${highDisasterProvinces.length} 省受灾` },
        { category: '边防', amount: border, description: `边患等级 ${nationStats.borderThreat}` },
        { category: '贪腐损耗', amount: corruption, description: '官员贪腐造成的财政损失' }
      ]
    };
  }

  recordExpenses(): void {
    // 此方法不再直接写入数据库
    // 支出记录已在gameLoop.ts中通过accountingSystem统一处理
    // 保留此方法用于向后兼容
  }

  updateTreasury(income: number, expenses: ExpenseBreakdown, currentGold: number): TreasurySnapshot {
    const balance = income - expenses.total;
    const newGold = Math.max(0, currentGold + balance);
    
    return {
      turn: this.currentTurn,
      gold: Math.round(newGold * 100) / 100,
      grain: GAME_CONFIG.INITIAL.GRAIN,
      income: Math.round(income * 100) / 100,
      expense: expenses.total,
      balance: Math.round(balance * 100) / 100
    };
  }

  getFinancialHealth(gold: number, income: number, expense: number): 'surplus' | 'balanced' | 'deficit' | 'bankrupt' {
    if (gold <= 0) return 'bankrupt';
    
    const balance = income - expense;
    
    if (gold < GAME_CONFIG.FINANCE.FINANCIAL_HEALTH.DEFICIT_THRESHOLD) return 'deficit';
    if (balance < 0 && gold < GAME_CONFIG.FINANCE.FINANCIAL_HEALTH.BALANCED_THRESHOLD) return 'deficit';
    if (balance > 0 && gold > GAME_CONFIG.FINANCE.FINANCIAL_HEALTH.SURPLUS_THRESHOLD) return 'surplus';
    
    return 'balanced';
  }

  getFinancialHealthDescription(health: string): string {
    switch (health) {
      case 'surplus': return '国库充盈，财政盈余';
      case 'balanced': return '收支平衡，国库稳定';
      case 'deficit': return '入不敷出，国库告急';
      case 'bankrupt': return '国库空虚，财政崩溃';
      default: return '未知状态';
    }
  }

  predictNextTurnBalance(state: GameState, estimatedIncome: number): number {
    const expenses = this.calculateExpenses(state);
    const currentGold = state.treasury.gold;
    return Math.max(0, currentGold + estimatedIncome - expenses.total);
  }

  getHistoryChart(turns: number): ChartData[] {
    return getTreasuryHistory(turns);
  }

  getCurrentTreasury(): number {
    return getTotalGold() + this.initialTreasury;
  }

  calculateTaxEfficiency(provinces: Province[]): number {
    if (provinces.length === 0) return 0;
    
    const totalPotential = provinces.reduce((sum, p) => sum + p.population * p.taxRate * GAME_CONFIG.TAX_EFFICIENCY.POTENTIAL_TAX_FACTOR, 0);
    const totalActual = provinces.reduce((sum, p) => sum + p.taxRevenue, 0);
    
    if (totalPotential === 0) return 0;
    return Math.round((totalActual / totalPotential) * 100);
  }

  getExpenseRatio(expenses: ExpenseBreakdown): Record<string, number> {
    const total = expenses.total;
    if (total === 0) return {};
    
    return {
      military: Math.round((expenses.military / total) * 100),
      salary: Math.round((expenses.salary / total) * 100),
      disaster: Math.round((expenses.disaster / total) * 100),
      border: Math.round((expenses.border / total) * 100),
      corruption: Math.round((expenses.corruption / total) * 100)
    };
  }

  canAfford(amount: number, currentGold: number): boolean {
    return currentGold >= amount;
  }

  spend(amount: number, category: string, description: string): boolean {
    // 记录支出到中央结算系统
    // 数据库写入将在gameLoop的最终结算时统一进行
    accountingSystem.addExpense(category, amount, description);
    
    return true;
  }
}

export const financeSystem = new FinanceSystem();
