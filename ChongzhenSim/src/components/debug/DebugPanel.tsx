import { useState, useEffect } from 'react';
import { accountingSystem } from '../../engine/AccountingSystem';
import { useGameStore } from '../../store/gameStore';
import { getIncomeExpenseSummary, getRecentTransactions } from '../../db/database';

export function DebugPanel() {
  const { gameState } = useGameStore();
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [dbSummary, setDbSummary] = useState<any>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (gameState) {
      // 获取中央结算系统的财务总账
      const ledger = accountingSystem.getLedger();
      setLedgerData(ledger);

      // 获取数据库中的收支汇总
      const summary = getIncomeExpenseSummary(gameState.turn);
      setDbSummary(summary);

      // 获取最近的交易记录
      const transactions = getRecentTransactions(10);
      setRecentTransactions(transactions);
    }
  }, [gameState]);

  if (!gameState) {
    return <div className="p-4 text-palace-text">游戏未初始化</div>;
  }

  return (
    <div className="p-6 space-y-6 bg-palace-bg rounded-lg">
      <h2 className="text-xl font-bold text-palace-gold mb-4">中央结算系统数据</h2>
      
      {/* 当前游戏状态 */}
      <div className="bg-palace-bg-light p-4 rounded border border-palace-border">
        <h3 className="text-lg font-semibold text-palace-text mb-2">当前游戏状态</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-palace-text-muted">回合：</span>
            <span className="text-palace-text">{gameState.turn}</span>
          </div>
          <div>
            <span className="text-palace-text-muted">日期：</span>
            <span className="text-palace-text">{gameState.date}</span>
          </div>
          <div>
            <span className="text-palace-text-muted">国库银两：</span>
            <span className="text-palace-gold">{gameState.treasury.gold.toFixed(1)} 万两</span>
          </div>
          <div>
            <span className="text-palace-text-muted">粮仓储备：</span>
            <span className="text-palace-text">{gameState.treasury.grain.toFixed(1)} 万石</span>
          </div>
        </div>
      </div>

      {/* 财务总账数据 */}
      {ledgerData && (
        <div className="bg-palace-bg-light p-4 rounded border border-palace-border">
          <h3 className="text-lg font-semibold text-palace-text mb-2">财务总账 (AccountingSystem)</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-palace-text-muted">总收入：</span>
              <span className="text-green-400">{ledgerData.totalIncome.toFixed(1)} 万两</span>
            </div>
            <div>
              <span className="text-palace-text-muted">总支出：</span>
              <span className="text-red-400">{ledgerData.totalExpense.toFixed(1)} 万两</span>
            </div>
            <div>
              <span className="text-palace-text-muted">净变化：</span>
              <span className={ledgerData.netChange >= 0 ? 'text-green-400' : 'text-red-400'}>
                {ledgerData.netChange >= 0 ? '+' : ''}{ledgerData.netChange.toFixed(1)} 万两
              </span>
            </div>
            <div>
              <span className="text-palace-text-muted">交易项数：</span>
              <span className="text-palace-text">{ledgerData.items.length} 项</span>
            </div>
          </div>
          
          {/* 详细交易项 */}
          {ledgerData.items.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-palace-text-muted mb-2">交易明细</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {ledgerData.items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between text-xs py-1 border-b border-palace-border/30">
                    <span className="text-palace-text">{item.name}</span>
                    <span className={item.type === 'income' ? 'text-green-400' : 'text-red-400'}>
                      {item.type === 'income' ? '+' : '-'}{item.amount.toFixed(1)} 万两
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 数据库收支汇总 */}
      {dbSummary && (
        <div className="bg-palace-bg-light p-4 rounded border border-palace-border">
          <h3 className="text-lg font-semibold text-palace-text mb-2">数据库收支汇总 (第 {gameState.turn} 回合)</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-palace-text-muted">总收入：</span>
              <span className="text-green-400">{dbSummary.totalIncome.toFixed(1)} 万两</span>
            </div>
            <div>
              <span className="text-palace-text-muted">总支出：</span>
              <span className="text-red-400">{dbSummary.totalExpense.toFixed(1)} 万两</span>
            </div>
            <div>
              <span className="text-palace-text-muted">余额：</span>
              <span className={dbSummary.balance >= 0 ? 'text-green-400' : 'text-red-400'}>
                {dbSummary.balance >= 0 ? '+' : ''}{dbSummary.balance.toFixed(1)} 万两
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 最近交易记录 */}
      {recentTransactions.length > 0 && (
        <div className="bg-palace-bg-light p-4 rounded border border-palace-border">
          <h3 className="text-lg font-semibold text-palace-text mb-2">最近交易记录</h3>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {recentTransactions.map((transaction, index) => (
              <div key={index} className="flex justify-between text-xs py-2 border-b border-palace-border/30">
                <div className="flex flex-col">
                  <span className="text-palace-text">{transaction.description}</span>
                  <span className="text-palace-text-muted">{transaction.date} · 第 {transaction.turn} 回合</span>
                </div>
                <span className={transaction.type === 'income' ? 'text-green-400' : 'text-red-400'}>
                  {transaction.type === 'income' ? '+' : '-'}{transaction.amount.toFixed(1)} 万两
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
