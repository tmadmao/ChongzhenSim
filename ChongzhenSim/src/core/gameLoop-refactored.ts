// gameLoop.ts 的重构版本
// 严格按照用户的四步流程执行结算

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
    
    // 计算最终国库变动
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
      insertTransaction({
        id: generateId(),
        turn: state.turn,
        date: state.date,
        type: item.type,
        category: item.name,
        amount: item.amount,
        description: item.description,
        createdAt: Date.now()
      });
      
      logger.info(`[Step C] 写入交易记录: ${item.name} ${item.type === 'income' ? '+' : '-'}${item.amount}`);
    }
    
    // 保存本次回合的收支数据到 state
    state.lastIncome = ledger.totalIncome;
    state.lastExpense = ledger.totalExpense;
    
    // 保存游戏状态快照
    await insertGameSnapshot({
      turn: state.turn,
      date: state.date,
      gameState: JSON.parse(JSON.stringify(state))
    });
    
    // 保存到本地存储
    saveToLocalStorage();
    
    logger.info('[Step C] 数据库写入完成');
    
    // 更新 financeStore
    try {
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
    
    // 重置 AccountingSystem（可选，为下一回合做准备）
    accountingSystem.resetLedger();
    logger.info('[Step D] AccountingSystem 已重置');
    
    // 执行其他回合结束逻辑
    // ...
    
    // 日期推进
    state = await this.advanceDate(state, logs);
    
    logger.info('[Step D] 回合结束处理完成');
    
  } catch (error) {
    logger.error('[Step D] 回合结束处理失败:', error);
    throw error;
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

// 辅助方法：日期推进
private async advanceDate(state: GameState, logs: string[]): Promise<GameState> {
  // 日期推进逻辑
  let { turn, date, phase } = state;
  
  turn += 1;
  phase = 'morning';
  
  // 简单的日期推进逻辑
  const match = date.match(/崇祯(\d+)年(\d+)/);
  if (match) {
    const year = parseInt(match[1]);
    const month = parseInt(match[2]);
    
    // 每个月30天，简化处理
    const day = ((turn - 1) % 30) + 1;
    
    if (day === 1 && turn > 1) {
      // 新月
      const newMonth = month + 1;
      if (newMonth > 12) {
        date = `崇祯${year + 1}年1月`;
      } else {
        date = `崇祯${year}年${newMonth}月`;
      }
    }
  }
  
  logs.push(`【${date}】回合 ${turn} 开始`);
  
  return { ...state, turn, date, phase };
}
