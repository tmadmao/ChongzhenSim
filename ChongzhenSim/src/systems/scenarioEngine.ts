import type { GameState, GameEffect } from '@/core/types'
import { SCRIPTED_EVENTS } from '@/data/scenario/scriptedEvents'
import { HISTORICAL_CHARACTERS } from '@/data/scenario/historicalCharacters'
import { NATIONAL_POLICIES } from '@/data/scenario/nationalPolicies'
import { eventBus } from '@/core/eventBus'
import { accountingSystem } from '@/engine/AccountingSystem'
import { changeQueue } from '@/engine/ChangeQueue'

export class ScenarioEngine {

  // ── 每回合 tick 调用（由 GameLoop.ts 在 Phase 5 之后调用）──

  tick(state: GameState): GameState {
    let newState = { ...state }
    try {
      // 1. 检查角色离场
      newState = this.checkCharacterExits(newState)
      
      // 2. 检查国策完成
      newState = this.checkPolicyCompletion(newState)
      
      // 3. 检查事件升级
      newState = this.checkEventEscalation(newState)
      
    } catch (error) {
      console.error('[ScenarioEngine] Error in tick:', error)
    }
    return newState
  }

  // ── 角色离场逻辑 ──

  private checkCharacterExits(state: GameState): GameState {
    let newState = { ...state }
    const currentTurn = state.turn
    
    // 遍历所有历史人物，检查是否需要离场
    for (const character of HISTORICAL_CHARACTERS) {
      // 只检查当前在任的角色
      if (character.status !== 'active') continue
      
      // 检查退出触发条件
      const exitTriggers = character.exitTriggers
      if (!exitTriggers) continue
      
      let shouldExit = false
      let exitType: 'death' | 'dismissal' | 'resignation' = 'resignation'
      
      // 检查年份条件
      if (exitTriggers.year && currentTurn >= exitTriggers.year) {
        shouldExit = true
        // 如果角色有年龄且>=65，视为自然死亡
        exitType = (character.age && character.age >= 65) ? 'death' : 'resignation'
      }
      
      // 检查回合数条件
      if (exitTriggers.turn && currentTurn >= exitTriggers.turn) {
        shouldExit = true
        exitType = 'resignation'
      }
      
      // 检查忠诚度条件
      if (exitTriggers.loyaltyBelow && character.loyalty <= exitTriggers.loyaltyBelow) {
        shouldExit = true
        exitType = 'dismissal'
      }
      
      if (shouldExit) {
        // 触发离场剧情
        this.triggerExitStory(character.id, exitType)
        
        // 从大臣列表中移除
        newState.ministers = newState.ministers.filter(
          m => m.id !== character.id
        )
        
        // 更新角色状态
        character.status = exitType === 'death' ? 'dead' : 
                          exitType === 'dismissal' ? 'exiled' : 'dead'
        
        // 触发事件通知
        eventBus.emit('character:exit', {
          characterId: character.id,
          exitType: exitType,
          turn: currentTurn
        })
      }
    }
    
    return newState
  }

  private triggerExitStory(characterId: string, exitType: 'death' | 'dismissal' | 'resignation'): void {
    const character = HISTORICAL_CHARACTERS.find(c => c.id === characterId)
    if (!character) return

    const storyTemplates: Record<typeof exitType, string[]> = {
      death: [
        `${character.name}病逝，朝野震动`,
        `${character.name}突然离世，享年${character.age || '??'}岁`,
        `${character.name}病重不治，撒手人寰`
      ],
      dismissal: [
        `${character.name}被革职查办，家产充公`,
        `${character.name}因罪免职，发配边疆`,
        `${character.name}遭御史弹劾，罢官归田`
      ],
      resignation: [
        `${character.name}称病辞官，告老还乡`,
        `${character.name}上疏乞骸骨，陛下准奏`,
        `${character.name}以年老为由，请求致仕`
      ]
    }

    const templates = storyTemplates[exitType]
    const story = templates[Math.floor(Math.random() * templates.length)]
    
    eventBus.emit('story:show', { story, characterId, exitType })
  }

  // ── 国策完成检查 ──

  private checkPolicyCompletion(state: GameState): GameState {
    let newState = { ...state }
    
    for (const policy of NATIONAL_POLICIES) {
      const progress = policy.progress || 0;
      if (policy.status === 'researching' && progress >= policy.researchTurns) {
        policy.status = 'completed'
        policy.progress = policy.researchTurns
        
        // 应用国策效果
        for (const effect of policy.effects) {
          this.queueEffect(effect, `国策完成：${policy.name}`)
        }
        
        eventBus.emit('policy:completed', { policyId: policy.id })
      }
    }
    
    return newState
  }

  // ── 事件升级检查 ──

  private checkEventEscalation(state: GameState): GameState {
    let newState = { ...state }
    
    for (const event of SCRIPTED_EVENTS) {
      if (event.status === 'active' && event.escalation) {
        const shouldEscalate = event.escalation.check(state)
        
        if (shouldEscalate) {
          // 将原事件标记为已升级
          event.status = 'escalated'
          
          // 触发升级后的事件
          const escalatedEvent = SCRIPTED_EVENTS.find(e => e.id === event.escalation!.nextEventId)
          if (escalatedEvent) {
            escalatedEvent.status = 'active'
            
            eventBus.emit('event:escalated', {
              originalEvent: event.id,
              newEvent: escalatedEvent.id
            })
          }
        }
      }
    }
    
    return newState
  }

  // ── 玩家选择：应用效果 ──

  applyChoice(eventId: string, choiceId: string, state: GameState): GameState {
    try {
      console.log(`[ScenarioEngine] applyChoice called:`, { eventId, choiceId, effectsCount: state.currentEvent?.choices?.length });
      
      const event = SCRIPTED_EVENTS.find(e => e.id === eventId)
      if (!event) {
        console.log(`[ScenarioEngine] Event not found:`, eventId);
        return state
      }
      const choice = event.choices.find(c => c.id === choiceId)
      if (!choice) {
        console.log(`[ScenarioEngine] Choice not found:`, choiceId);
        return state
      }

      console.log(`[ScenarioEngine] Processing choice:`, { choiceId, effectsCount: choice.effects?.length });
      
      // 将所有效果添加到变动队列
      // 变动将在回合结束时统一应用
      for (const effect of choice.effects) {
        console.log(`[ScenarioEngine] Processing effect:`, effect);
        this.queueEffect(effect, `${event.title} - ${choice.text}`)
      }

      // 应用事件锁定/解锁
      this.applyChoiceEventLocks(choice.locksEvents, choice.unlocksEvents)

      // 触发事件
      eventBus.emit('event:choice-made', {
        eventId,
        choiceId,
        effects: choice.effects
      })

      // 返回原状态（因为变动还未实际应用，只是进入队列）
      // 但为了UI展示，可以返回一个预览状态
      return state
    } catch (error) {
      console.error('[ScenarioEngine] Error in applyChoice:', error)
      return state
    }
  }

  /**
   * 将效果添加到变动队列
   * 不再直接修改游戏状态，而是进入队列等待回合结算
   * 支持 GameEffect 和 OptionEffect 两种格式
   */
  private queueEffect(effect: GameEffect | any, source: string): void {
    try {
      console.log(`[ScenarioEngine] queueEffect called:`, { type: effect.type, target: effect.target, field: effect.field, source });
      
      // 解析数值：优先使用 delta，否则使用 value
      const delta = effect.delta !== undefined ? effect.delta : effect.value;
      
      switch (effect.type) {
        case 'treasury':
          if (effect.target === 'treasury' && (effect.field === 'gold' || effect.field === 'grain')) {
            console.log(`[ScenarioEngine] Adding treasury effect to queue:`, { field: effect.field, delta });
            
            // 添加到变动队列
            changeQueue.enqueue({
              type: 'treasury',
              target: effect.field,
              field: effect.field,
              delta,
              description: effect.description || '国库变动',
              source
            })
            
            // 同时记录到中央结算系统（用于财务计算）
            if (effect.field === 'gold') {
              if (delta > 0) {
                console.log(`[ScenarioEngine] Adding income to accounting system:`, delta);
                accountingSystem.addIncome(effect.description || '收入', delta, source)
              } else if (delta < 0) {
                console.log(`[ScenarioEngine] Adding expense to accounting system:`, Math.abs(delta));
                accountingSystem.addExpense(effect.description || '支出', Math.abs(delta), source)
              }
            }
          }
          break

        case 'province':
          changeQueue.enqueue({
            type: 'province',
            target: effect.target,
            field: effect.field,
            delta,
            description: effect.description || '省份变动',
            source
          })
          break

        case 'minister':
          changeQueue.enqueue({
            type: 'faction',
            target: effect.target,
            field: effect.field,
            delta,
            description: effect.description || '派系变动',
            source
          })
          break

        case 'nation':
          changeQueue.enqueue({
            type: 'nation',
            target: effect.target,
            field: effect.field,
            delta,
            description: effect.description || '国家属性变动',
            source
          })
          break

        default:
          break
      }
    } catch (error) {
      console.error('[ScenarioEngine] Error in queueEffect:', error)
    }
  }

  // ── 公开：处理基于玩家选择的事件锁定/解锁 ──

  applyChoiceEventLocks(locksEvents: string[] = [], unlocksEvents: string[] = []): void {
    try {
      // 锁死指定事件
      for (const lockId of locksEvents) {
        const lockEvent = SCRIPTED_EVENTS.find(e => e.id === lockId)
        if (lockEvent) lockEvent.status = 'locked'
      }

      // 解锁指定事件
      for (const unlockId of unlocksEvents) {
        const unlockEvent = SCRIPTED_EVENTS.find(e => e.id === unlockId)
        if (unlockEvent) unlockEvent.status = 'active'
      }
    } catch (error) {
      console.error('[ScenarioEngine] Error in applyChoiceEventLocks:', error)
    }
  }

  // ── 公开：获取当前可用的剧本事件 ──

  getAvailableEvents(state: GameState): typeof SCRIPTED_EVENTS {
    return SCRIPTED_EVENTS.filter(event => {
      // 检查事件是否已激活或锁定
      if (event.status === 'locked') return false
      if (event.status === 'completed') return false
      if (event.status === 'escalated') return false
      
      // 检查触发条件
      if (event.triggerCondition && !event.triggerCondition(state)) {
        return false
      }
      
      return true
    })
  }

  // ── 公开：获取指定ID的事件 ──

  getEventById(eventId: string): typeof SCRIPTED_EVENTS[0] | undefined {
    return SCRIPTED_EVENTS.find(e => e.id === eventId)
  }

  // ── 公开：重置事件状态（用于测试或新游戏）──

  resetEventStatus(): void {
    for (const event of SCRIPTED_EVENTS) {
      event.status = 'active'
    }
  }
}

// 导出单例实例
export const scenarioEngine = new ScenarioEngine()
