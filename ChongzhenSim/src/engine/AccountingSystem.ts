import type { LedgerItem, FinancialLedger } from '../api/schemas';
import { createLogger } from '../utils/logger';

const logger = createLogger('Accounting');

export class AccountingSystem {
  private ledger!: FinancialLedger;

  constructor() {
    this.resetLedger();
  }

  resetLedger(): void {
    this.ledger = {
      items: [],
      totalIncome: 0,
      totalExpense: 0,
      netChange: 0,
      timestamp: Date.now()
    };
    logger.info('[Accounting] Ledger reset');
  }

  getLedger(): FinancialLedger {
    return { ...this.ledger };
  }

  addItem(item: LedgerItem): void {
    // 检查数值异常
    if (isNaN(item.amount) || item.amount < 0) {
      logger.error('[Accounting] Invalid amount detected:', item);
      throw new Error('Invalid amount for ledger item');
    }

    this.ledger.items.push(item);

    if (item.type === 'income') {
      this.ledger.totalIncome += item.amount;
      logger.info(`[Finance] Income added: ${item.amount} (Source: ${item.name})`);
    } else if (item.type === 'expense') {
      this.ledger.totalExpense += item.amount;
      logger.info(`[Finance] Expense added: ${item.amount} (Source: ${item.name})`);
    }

    this.ledger.netChange = this.ledger.totalIncome - this.ledger.totalExpense;
  }

  addIncome(name: string, amount: number, description: string): void {
    this.addItem({
      name,
      amount,
      type: 'income',
      description
    });
  }

  addExpense(name: string, amount: number, description: string): void {
    this.addItem({
      name,
      amount,
      type: 'expense',
      description
    });
  }

  calculateTotals(): void {
    this.ledger.totalIncome = this.ledger.items
      .filter(item => item.type === 'income')
      .reduce((sum, item) => sum + item.amount, 0);

    this.ledger.totalExpense = this.ledger.items
      .filter(item => item.type === 'expense')
      .reduce((sum, item) => sum + item.amount, 0);

    this.ledger.netChange = this.ledger.totalIncome - this.ledger.totalExpense;

    logger.info('[Accounting] Recalculated totals:', {
      totalIncome: this.ledger.totalIncome,
      totalExpense: this.ledger.totalExpense,
      netChange: this.ledger.netChange
    });
  }

  validateLedger(): boolean {
    // 检查是否有异常数值
    const hasInvalidAmounts = this.ledger.items.some(item => 
      isNaN(item.amount) || item.amount < 0
    );

    if (hasInvalidAmounts) {
      logger.error('[Accounting] Ledger contains invalid amounts');
      return false;
    }

    // 检查计算是否正确
    const calculatedIncome = this.ledger.items
      .filter(item => item.type === 'income')
      .reduce((sum, item) => sum + item.amount, 0);

    const calculatedExpense = this.ledger.items
      .filter(item => item.type === 'expense')
      .reduce((sum, item) => sum + item.amount, 0);

    const calculatedNetChange = calculatedIncome - calculatedExpense;

    if (calculatedIncome !== this.ledger.totalIncome ||
        calculatedExpense !== this.ledger.totalExpense ||
        calculatedNetChange !== this.ledger.netChange) {
      logger.error('[Accounting] Ledger calculation mismatch');
      return false;
    }

    logger.info('[Accounting] Ledger validation passed');
    return true;
  }
}

// 导出单例实例
export const accountingSystem = new AccountingSystem();