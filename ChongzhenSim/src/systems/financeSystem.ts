import type { Province, Minister, NationStats, ExpenseBreakdown, TreasurySnapshot, ChartData, GameState } from '../core/types';
import { insertTransaction, generateId, getTreasuryHistory, getTotalGold } from '../db/database';

export class FinanceSystem {
  private currentTurn: number = 1;
  private currentDate: string = '崇祯元年正月';
  private initialTreasury: number = 800;

  setTurnInfo(turn: number, date: string): void {
    this.currentTurn = turn;
    this.currentDate = date;
  }

  calculateExpenses(state: GameState): ExpenseBreakdown {
    const { provinces, ministers, nationStats } = state;
    
    const totalMilitary = provinces.reduce((sum, p) => sum + p.militaryForce, 0);
    const military = totalMilitary * 0.5;
    
    const aliveMinisters = ministers.filter(m => m.isAlive);
    const salary = aliveMinisters.length * 2;
    
    const highDisasterProvinces = provinces.filter(p => p.disasterLevel >= 3);
    const disaster = highDisasterProvinces.reduce((sum, p) => sum + p.disasterLevel * 3, 0);
    
    const border = nationStats.borderThreat * 0.5;
    
    const corruption = Math.floor(nationStats.overallCorruption * 0.3);
    
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

  recordExpenses(expenses: ExpenseBreakdown): void {
    const categories: Array<{ key: keyof Omit<ExpenseBreakdown, 'total' | 'details'>; category: string; description: string }> = [
      { key: 'military', category: 'military', description: '军费开支' },
      { key: 'salary', category: 'salary', description: '官员俸禄' },
      { key: 'disaster', category: 'disaster', description: '灾害救济' },
      { key: 'border', category: 'border_defense', description: '边境防御' },
      { key: 'corruption', category: 'corruption_loss', description: '贪腐损耗' }
    ];
    
    categories.forEach(({ key, category, description }) => {
      const amount = expenses[key];
      if (amount > 0) {
        insertTransaction({
          id: generateId(),
          turn: this.currentTurn,
          date: this.currentDate,
          type: 'expense',
          category,
          amount,
          description,
          createdAt: Date.now()
        });
      }
    });
  }

  updateTreasury(income: number, expenses: ExpenseBreakdown, currentGold: number): TreasurySnapshot {
    const balance = income - expenses.total;
    const newGold = Math.max(0, currentGold + balance);
    
    return {
      turn: this.currentTurn,
      gold: Math.round(newGold * 100) / 100,
      grain: 500,
      income: Math.round(income * 100) / 100,
      expense: expenses.total,
      balance: Math.round(balance * 100) / 100
    };
  }

  getFinancialHealth(gold: number, income: number, expense: number): 'surplus' | 'balanced' | 'deficit' | 'bankrupt' {
    if (gold <= 0) return 'bankrupt';
    
    const balance = income - expense;
    
    if (gold < 200) return 'deficit';
    if (balance < 0 && gold < 500) return 'deficit';
    if (balance > 0 && gold > 1500) return 'surplus';
    
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
    
    const totalPotential = provinces.reduce((sum, p) => sum + p.population * p.taxRate * 0.1, 0);
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
    const currentGold = this.getCurrentTreasury();
    if (!this.canAfford(amount, currentGold)) return false;
    
    insertTransaction({
      id: generateId(),
      turn: this.currentTurn,
      date: this.currentDate,
      type: 'expense',
      category,
      amount,
      description,
      createdAt: Date.now()
    });
    
    return true;
  }
}

export const financeSystem = new FinanceSystem();
