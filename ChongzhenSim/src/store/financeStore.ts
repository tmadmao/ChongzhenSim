import { create } from 'zustand';
import type { Treasury, TreasuryTransaction, ChartData, FinancialHealth } from '../core/types';
import { getRecentTransactions, getTreasuryHistory, getIncomeExpenseSummary, getTotalGold } from '../db/database';

interface FinanceStore {
  treasury: Treasury;
  recentTransactions: TreasuryTransaction[];
  chartData: ChartData[];
  financialHealth: FinancialHealth;
  
  loadFinanceData: () => void;
  refreshChartData: (turns: number) => void;
  getExpenseSummary: (turn: number) => ReturnType<typeof getIncomeExpenseSummary>;
  updateTreasury: (gold: number, grain: number) => void;
  calculateFinancialHealth: (gold: number, income: number, expense: number) => FinancialHealth;
}

const initialTreasury: Treasury = {
  gold: 0,
  grain: 0,
  transactions: []
};

export const useFinanceStore = create<FinanceStore>((set, get) => ({
  treasury: initialTreasury,
  recentTransactions: [],
  chartData: [],
  financialHealth: 'balanced',

  loadFinanceData: () => {
    try {
      const transactions = getRecentTransactions(50);
      const totalGold = getTotalGold();
      
      set({
        recentTransactions: transactions,
        treasury: {
          gold: totalGold,
          grain: 0,
          transactions
        }
      });
      
      get().refreshChartData(20);
      
    } catch (error) {
      console.error('[FinanceStore] loadFinanceData failed:', error);
    }
  },

  refreshChartData: (turns) => {
    try {
      const chartData = getTreasuryHistory(turns);
      set({ chartData });
    } catch (error) {
      console.error('[FinanceStore] refreshChartData failed:', error);
    }
  },

  getExpenseSummary: (turn) => {
    return getIncomeExpenseSummary(turn);
  },

  updateTreasury: (gold, grain) => {
    const { treasury } = get();
    
    const health = get().calculateFinancialHealth(
      gold,
      treasury.transactions
        .filter((t: TreasuryTransaction) => t.type === 'income')
        .reduce((sum: number, t: TreasuryTransaction) => sum + t.amount, 0),
      treasury.transactions
        .filter((t: TreasuryTransaction) => t.type === 'expense')
        .reduce((sum: number, t: TreasuryTransaction) => sum + t.amount, 0)
    );
    
    set({
      treasury: {
        ...treasury,
        gold,
        grain
      },
      financialHealth: health
    });
  },

  calculateFinancialHealth: (gold, income, expense) => {
    const balance = income - expense;
    
    if (gold <= 0) {
      return 'bankrupt';
    }
    
    if (gold < 500) {
      return 'deficit';
    }
    
    if (balance > 0 && gold > 2000) {
      return 'surplus';
    }
    
    return 'balanced';
  }
}));
