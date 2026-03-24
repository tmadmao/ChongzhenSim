// 这是applyPlayerDecision方法的重构版本
// 所有变动都通过ChangeQueue，禁止直接修改状态

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
  
  // 处理不同类型的决策
  switch (decision.type) {
    case 'event_choice': {
      // 处理事件选择
      if (decision.effects && decision.effects.length > 0) {
        console.log(`[GameStore] Queueing ${decision.effects.length} event effects`);
        
        for (const effect of decision.effects) {
          // 所有效果都添加到ChangeQueue
          changeQueue.enqueue({
            type: effect.type as any,
            target: effect.target,
            field: effect.field,
            delta: effect.delta,
            newValue: effect.newValue,
            description: effect.description || '事件效果',
            source: decision.choiceId || 'unknown'
          });
          
          // 财务效果同时记录到AccountingSystem
          if (effect.type === 'treasury' && effect.field === 'gold') {
            if (effect.delta > 0) {
              accountingSystem.addIncome(
                effect.description || '事件收入', 
                effect.delta, 
                decision.choiceId || 'unknown'
              );
            } else if (effect.delta < 0) {
              accountingSystem.addExpense(
                effect.description || '事件支出', 
                Math.abs(effect.delta), 
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
}
