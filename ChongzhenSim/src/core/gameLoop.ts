import type { GameState } from './types';
import { emitGameEvent } from './eventBus';
import { TaxSystem } from '../systems/taxSystem';
import { FinanceSystem } from '../systems/financeSystem';
import { insertGameSnapshot, generateId, saveToLocalStorage, insertTransaction } from '../db/database';
import { createLogger } from '../utils/logger';
import { useCourtStore } from '../store/courtStore';
import { accountingSystem } from '../engine/AccountingSystem';
import { changeQueue } from '../engine/ChangeQueue';

const logger = createLogger('GameEngine');

export class GameLoop {
  private taxSystem: TaxSystem;
  private financeSystem: FinanceSystem;

  constructor() {
    this.taxSystem = new TaxSystem();
    this.financeSystem = new FinanceSystem();
  }

  async tick(currentState: GameState): Promise<GameState> {
    logger.info('========== 回合结算开始 ==========', {
      turn: currentState.turn,
      date: currentState.date
    });

    let state = JSON.parse(JSON.stringify(currentState)); // 深拷贝
    const logs: string[] = [];

    // ==================== Step A: 执行 changeQueue.applyAll() ====================
    // 处理玩家本回合的所有选择（事件效果、税率调整等）
    logger.info('[Step A] 开始应用变动队列');
    try {
      const queueLength = changeQueue.length;
      logger.info(`[Step A] 队列中有 ${queueLength} 个待处理变动`);

      if (queueLength > 0) {
        const { newState, logs: changeLogs, appliedCount } = changeQueue.applyAll(state);
        state = newState;
        logs.push(...changeLogs);

        logger.info(`[Step A] 成功应用 ${appliedCount} 个变动`, {
          queueLength,
          appliedCount
        });

        // 显示队列统计
        const stats = changeQueue.getStats();
        logger.info('[Step A] 变动统计', stats);
      } else {
        logger.info('[Step A] 队列为空，无变动需要应用');
      }
    } catch (error) {
      logger.error('[Step A] 应用变动队列失败:', error);
      throw error;
    }

    // ==================== Step B: 执行 AccountingSystem.calculate() ====================
    // 计算常规税收和维护费
    logger.info('[Step B] 开始计算常规收支');
    try {
      this.taxSystem.setTurnInfo(state.turn, state.date);
      this.financeSystem.setTurnInfo(state.turn, state.date);

      // 计算税收
      const taxResults = this.taxSystem.calculateTax(state.provinces);
      const totalTax = taxResults.reduce((sum, r) => sum + r.actualTax, 0);

      // 计算支出
      const expenses = this.financeSystem.calculateExpenses(state);

      // 记录到 AccountingSystem
      accountingSystem.resetLedger(); // 先重置，确保只包含本回合的常规收支

      // 记录税收收入
      accountingSystem.addIncome('全国各省份税收总收入', totalTax, '常规税收');

      // 记录各项支出
      accountingSystem.addExpense('军队维持费用', expenses.military, '常规支出');
      accountingSystem.addExpense('官员俸禄支出', expenses.salary, '常规支出');
      accountingSystem.addExpense('自然灾害救济支出', expenses.disaster, '常规支出');
      accountingSystem.addExpense('边境防御费用', expenses.border, '常规支出');
      accountingSystem.addExpense('官员贪腐造成的财政损失', expenses.corruption, '常规支出');

      logger.info('[Step B] 常规收支计算完成', {
        totalTax,
        totalExpense: expenses.total,
        netIncome: totalTax - expenses.total
      });

      logs.push(`常规税收：${totalTax.toFixed(1)} 万两`);
      logs.push(`常规支出：${expenses.total.toFixed(1)} 万两`);

    } catch (error) {
      logger.error('[Step B] 计算常规收支失败:', error);
      throw error;
    }

    // ==================== Step C: 合并 A 和 B，执行唯一一次数据库 UPDATE ====================
    logger.info('[Step C] 开始合并并写入数据库');
    try {
      // 获取 AccountingSystem 的总账
      const ledger = accountingSystem.getLedger();

      // 注意：Step A 已经通过 changeQueue.applyAll 更新了 state.treasury.gold
      // 这里只需要记录到数据库，不需要再次修改 state

      logger.info('[Step C] 准备写入数据库', {
        treasuryGold: state.treasury.gold,
        treasuryGrain: state.treasury.grain,
        ledgerItems: ledger.items.length,
        totalIncome: ledger.totalIncome,
        totalExpense: ledger.totalExpense,
        netChange: ledger.netChange
      });

      // 写入所有财务交易记录到数据库
      for (const item of ledger.items) {
        // 安全检查：确保所有必需字段都有值
        const transaction = {
          id: generateId(),
          turn: state.turn ?? 1,
          date: state.date ?? '崇祯元年正月',
          type: item.type,
          category: item.name ?? '未知类别',
          amount: item.amount ?? 0,
          description: item.description ?? '',
          createdAt: Date.now()
        };

        // 验证数据
        if (!transaction.id || !transaction.date) {
          logger.error('[Step C] 交易数据验证失败', transaction);
          continue;
        }

        insertTransaction(transaction);

        logger.info(`[Step C] 写入交易记录: ${transaction.category} ${transaction.type === 'income' ? '+' : '-'}${transaction.amount}`);
      }

      // 保存本次回合的收支数据到 state
      state.lastIncome = ledger.totalIncome;
      state.lastExpense = ledger.totalExpense;

      // 保存游戏状态快照
      await insertGameSnapshot({
        id: generateId(),
        turn: state.turn ?? 1,
        snapshotJson: JSON.stringify(state),
        type: 'auto',
        createdAt: Date.now()
      });

      // 保存到本地存储
      saveToLocalStorage();

      logger.info('[Step C] 数据库写入完成');

      // 更新 financeStore
      try {
        const gameStoreModule = await import('@/store/gameStore') as any;
        const gameStore = gameStoreModule.useGameStore.getState();
        if (gameStore && gameStore.setCurrentLedger) {
          gameStore.setCurrentLedger(ledger);
        }

        const financeStoreModule = await import('@/store/financeStore') as any;
        const financeStore = financeStoreModule.useFinanceStore.getState();
        if (financeStore) {
          if (financeStore.updateTreasury) {
            financeStore.updateTreasury(state.treasury.gold, state.treasury.grain);
          }
          if (financeStore.loadFinanceData) {
            financeStore.loadFinanceData();
          }
        }
      } catch (error) {
        logger.error('[Step C] 更新 financeStore 失败:', error);
      }

      // 添加到日志
      logs.push(`财务结算：净 ${ledger.netChange >= 0 ? '收入' : '支出'} ${Math.abs(ledger.netChange).toFixed(1)} 万两`);
      logs.push(`国库余额：${state.treasury.gold.toFixed(1)} 万两`);

    } catch (error) {
      logger.error('[Step C] 写入数据库失败:', error);
      throw error;
    }

    // ==================== Step D: 清空队列，进入下一回合 ====================
    logger.info('[Step D] 清空队列，准备进入下一回合');
    try {
      // 清空变动队列
      const queueLength = changeQueue.length;
      changeQueue.clear();
      logger.info(`[Step D] 变动队列已清空（原长度: ${queueLength}）`);

      // 重置 AccountingSystem（为下一回合做准备）
      accountingSystem.resetLedger();
      logger.info('[Step D] AccountingSystem 已重置');

      // 检查并重置朝堂状态
      try {
        const courtStore = useCourtStore.getState();
        if (courtStore) {
          courtStore.resetCourt();
          logger.debug('[Step D] 朝堂状态已重置');
        }
      } catch (error) {
        logger.error('[Step D] 重置朝堂状态失败:', error);
      }

      // 触发回合结束事件
      emitGameEvent('turn:end', { turn: state.turn, logs });

      logger.info('[Step D] 回合结束处理完成');

    } catch (error) {
      logger.error('[Step D] 回合结束处理失败:', error);
      throw error;
    }

    // 国策研究推进
    try {
      logger.debug('Starting policy research phase');
      const policyStoreModule = await import('@/store/policyStore') as any;
      const policyStore = policyStoreModule.usePolicyStore.getState();
      const completedPolicies = policyStore.tickResearch();

      for (const policyId of completedPolicies) {
        const policy = policyStore.getPolicyById(policyId);
        if (!policy) continue;
        logs.push(`【国策】${policy.name} 研究完成`);
      }
      logger.debug('Policy research phase completed');
    } catch (err) {
      logger.error('Policy research failed', err);
    }

    // 剧本引擎
    try {
      logger.debug('Starting scenario engine phase');
      const { scenarioEngine } = await import('@/systems/scenarioEngine');
      state = scenarioEngine.tick(state);
      logger.debug('Scenario engine phase completed');
    } catch (err) {
      logger.error('Scenario engine tick failed', err);
    }

    // 日期推进
    try {
      logger.debug('Starting date advance phase');
      state = await this.phase_DateAdvance(state, logs);
      logger.debug('Date advance phase completed');
    } catch (error) {
      logger.error('Date Advance failed:', error);
      emitGameEvent('error', { phase: 'date', error });
    }

    // 保存快照
    try {
      logger.debug('Starting save snapshot phase');
      await this.phase_SaveSnapshot(state, logs);
      logger.debug('Save snapshot phase completed');
    } catch (error) {
      logger.error('Save Snapshot failed:', error);
      emitGameEvent('error', { phase: 'snapshot', error });
    }

    // 游戏结束检查
    try {
      logger.debug('Starting game over check phase');
      state = await this.phase_GameOverCheck(state, logs);
      logger.debug('Game over check phase completed');
    } catch (error) {
      logger.error('Game Over Check failed:', error);
      emitGameEvent('error', { phase: 'gameover', error });
    }

    // 更新状态中的回合日志
    if (!state.turnLog) {
      state.turnLog = [];
    }
    state.turnLog = [...state.turnLog, ...logs];

    logger.info('========== 回合结算完成 ==========', {
      turn: state.turn,
      date: state.date,
      treasury: state.treasury.gold
    });

    return state;
  }

  private async phase_DateAdvance(state: GameState, logs: string[]): Promise<GameState> {
    let { turn, date, phase } = state;

    // 直接推进到下一天的早晨，不按早中晚顺序
    phase = 'morning';
    turn += 1;

    // 保持月份不变，只增加回合数，天数由StatusBar.tsx根据回合数计算
    // 这样可以确保日期正确显示为正月初一、正月初二、正月初三...

    const phaseName = '早朝';
    logs.push(`时间推进：${date} · ${phaseName}`);

    return { ...state, turn, date, phase };
  }

  private async phase_SaveSnapshot(state: GameState, logs: string[]): Promise<void> {
    insertGameSnapshot({
      id: generateId(),
      turn: state.turn ?? 1,
      snapshotJson: JSON.stringify(state),
      type: 'auto',
      createdAt: Date.now()
    });

    saveToLocalStorage();
    logs.push(`存档：第 ${state.turn ?? 1} 回合快照已保存`);
  }

  private async phase_GameOverCheck(state: GameState, logs: string[]): Promise<GameState> {
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
