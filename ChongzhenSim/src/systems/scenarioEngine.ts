import type { GameState, GameEffect } from '@/core/types'
import { SCRIPTED_EVENTS, type ScriptedEvent } from '@/data/scenario/scriptedEvents'
import { FACTIONS, type Faction } from '@/data/scenario/factions'
import { HISTORICAL_CHARACTERS, CHARACTER_EXIT_RULES } from '@/data/scenario/historicalCharacters'
import { NATIONAL_POLICIES, type NationalPolicy } from '@/data/scenario/nationalPolicies'
import { eventBus } from '@/core/eventBus'

export class ScenarioEngine {

  // ── 每回合 tick 调用（由 GameLoop.ts 在 Phase 5 之后调用）──

  tick(state: GameState): GameState {
    let newState = { ...state }
    try {
      newState = this.checkFactionJoin(newState)
      newState = this.checkFactionDestroy(newState)
      newState = this.checkCharacterJoin(newState)
      newState = this.checkCharacterExit(newState)
      newState = this.checkEventTrigger(newState)
      newState = this.checkEventEscalation(newState)
    } catch (error) {
      console.error('[ScenarioEngine] Error in tick:', error)
    }
    return newState
  }

  // ── 势力：检测加入条件 ──

  checkFactionJoin(state: GameState): GameState {
    let newState = { ...state }
    try {
      FACTIONS.forEach(faction => {
        if (faction.status === 'inactive' && faction.joinConditions) {
          const { joinConditions } = faction
          let canJoin = true

          // 检查民心条件
          if (joinConditions.minPeopleMorale !== undefined) {
            if (state.nationStats.peopleMorale >= joinConditions.minPeopleMorale) {
              canJoin = false
            }
          }

          // 检查财政赤字条件
          if (joinConditions.fiscalDeficitMin !== undefined) {
            // 假设财政赤字在 nationStats 中，这里需要根据实际数据结构调整
            // 暂时使用一个模拟值
            const fiscalDeficit = 45 // 实际应该从 state 中获取
            if (fiscalDeficit < joinConditions.fiscalDeficitMin) {
              canJoin = false
            }
          }

          // 检查边患条件
          if (joinConditions.borderThreatMin !== undefined) {
            if (state.nationStats.borderThreat < joinConditions.borderThreatMin) {
              canJoin = false
            }
          }

          // 检查贸易开放条件
          if (joinConditions.tradeOpen !== undefined) {
            // 这里需要检查是否已开放贸易，暂时假设未开放
            const tradeOpen = false // 实际应该从 state 中获取
            if (joinConditions.tradeOpen && !tradeOpen) {
              canJoin = false
            }
          }

          // 检查需要的势力存在
          if (joinConditions.requireFaction) {
            const requiredFaction = FACTIONS.find(f => f.id === joinConditions.requireFaction)
            if (!requiredFaction || requiredFaction.status !== 'active') {
              canJoin = false
            }
          }

          // 检查需要的人物死亡
          if (joinConditions.requireCharacterDead) {
            const character = HISTORICAL_CHARACTERS.find(c => c.id === joinConditions.requireCharacterDead)
            if (!character || character.status !== 'dead') {
              canJoin = false
            }
          }

          // 检查陕西灾荒回合数
          if (joinConditions.shaanxiDisasterTurns !== undefined) {
            // 这里需要计算陕西连续灾荒回合数，暂时假设未达到
            const shaanxiDisasterTurns = 0 // 实际应该从 state 中获取
            if (shaanxiDisasterTurns < joinConditions.shaanxiDisasterTurns) {
              canJoin = false
            }
          }

          if (canJoin) {
            faction.status = 'active'
            eventBus.emit('faction:joined', { factionId: faction.id, factionName: faction.name })
            
            // 添加到 turnLog
            if (!newState.turnLog) {
              newState.turnLog = []
            }
            newState.turnLog.push(`${faction.name}势力出现`)
          }
        }
      })
    } catch (error) {
      console.error('[ScenarioEngine] Error in checkFactionJoin:', error)
    }
    return newState
  }

  // ── 势力：检测灭亡条件 ──

  checkFactionDestroy(state: GameState): GameState {
    let newState = { ...state }
    try {
      FACTIONS.forEach(faction => {
        if (faction.status === 'active') {
          const { destroyConditions } = faction
          let shouldDestroy = false

          // 检查核心人物全部死亡
          if (destroyConditions.coreCharactersAllDead) {
            // 这里需要检查该势力的核心人物是否全部死亡，暂时假设未全部死亡
            const coreCharactersAllDead = false // 实际应该从 state 中获取
            if (coreCharactersAllDead) {
              shouldDestroy = true
            }
          }

          // 检查支持度低于阈值
          if (destroyConditions.supportBelow !== undefined && destroyConditions.supportBelowTurns !== undefined) {
            // 这里需要检查支持度是否连续低于阈值，暂时假设未达到
            const supportBelowThreshold = false // 实际应该从 state 中获取
            if (supportBelowThreshold) {
              shouldDestroy = true
            }
          }

          // 检查军事势力被全歼
          if (destroyConditions.militaryWiped) {
            // 这里需要检查该军事势力是否被全歼，暂时假设未被全歼
            const militaryWiped = false // 实际应该从 state 中获取
            if (militaryWiped) {
              shouldDestroy = true
            }
          }

          // 检查玩家强制清洗
          if (destroyConditions.playerForceDestroy) {
            // 这里需要检查玩家是否强制清洗，暂时假设未强制清洗
            const playerForceDestroy = false // 实际应该从 state 中获取
            if (playerForceDestroy) {
              shouldDestroy = true
            }
          }

          if (shouldDestroy) {
            faction.status = 'destroyed'
            eventBus.emit('faction:destroyed', { factionId: faction.id, factionName: faction.name })

            // 执行灭亡后果
            faction.destroyConsequences.forEach(consequence => {
              // 这里可以根据后果描述应用相应的效果
              // 暂时只是记录到 turnLog
              if (!newState.turnLog) {
                newState.turnLog = []
              }
              newState.turnLog.push(consequence)
            })

            // 检查是否有事件需要锁死
            SCRIPTED_EVENTS.forEach(event => {
              if (event.interruptConditions?.factionDestroyed === faction.id) {
                event.status = 'locked'
              }
            })
          }
        }
      })
    } catch (error) {
      console.error('[ScenarioEngine] Error in checkFactionDestroy:', error)
    }
    return newState
  }

  // ── 人物：检测登场条件 ──

  checkCharacterJoin(state: GameState): GameState {
    let newState = { ...state }
    try {
      HISTORICAL_CHARACTERS.forEach(character => {
        if (character.status === 'pending' && character.joinConditions) {
          const { joinConditions } = character
          let canJoin = true

          // 检查年份
          if (joinConditions.year !== undefined) {
            // 假设 state.date 格式为 "崇祯元年正月"，需要解析年份
            const currentYear = 1627 // 实际应该从 state 中解析
            if (currentYear < joinConditions.year) {
              canJoin = false
            }
          }

          // 检查季节
          if (joinConditions.season !== undefined) {
            // 假设 state.date 格式为 "崇祯元年正月"，需要解析季节
            const currentSeason = 'winter' // 实际应该从 state 中解析
            if (currentSeason !== joinConditions.season) {
              canJoin = false
            }
          }

          // 检查皇帝威望
          if (joinConditions.prestigeMin !== undefined) {
            // 假设皇帝威望在 state 中，暂时使用一个模拟值
            const emperorPrestige = 50 // 实际应该从 state 中获取
            if (emperorPrestige < joinConditions.prestigeMin) {
              canJoin = false
            }
          }

          // 检查势力支持度
          if (joinConditions.factionSupportMin) {
            const { factionId, value } = joinConditions.factionSupportMin
            const faction = FACTIONS.find(f => f.id === factionId)
            if (!faction || faction.support < value) {
              canJoin = false
            }
          }

          // 检查民变强度
          if (joinConditions.unrestMin !== undefined) {
            // 假设民变强度在 state 中，暂时使用一个模拟值
            const unrestLevel = 40 // 实际应该从 state 中获取
            if (unrestLevel < joinConditions.unrestMin) {
              canJoin = false
            }
          }

          if (canJoin) {
            character.status = 'active'
            eventBus.emit('character:joined', { characterId: character.id, characterName: character.name })

            // 添加到 turnLog
            if (!newState.turnLog) {
              newState.turnLog = []
            }
            newState.turnLog.push(`${character.name}登场`)
          }
        }
      })
    } catch (error) {
      console.error('[ScenarioEngine] Error in checkCharacterJoin:', error)
    }
    return newState
  }

  // ── 人物：检测退出条件（自然死亡/忠诚叛变）──

  checkCharacterExit(state: GameState): GameState {
    let newState = { ...state }
    try {
      HISTORICAL_CHARACTERS.forEach(character => {
        if (character.status === 'active') {
          // 检查自然死亡
          if (character.exitMethods.naturalDeath) {
            // 假设人物年龄 >= 65，每季度10%概率死亡
            const age = 65 // 实际应该从 state 中获取
            if (age >= CHARACTER_EXIT_RULES.naturalDeathAgeThreshold) {
              const deathProbability = 0.1 // 10% 概率
              if (Math.random() < deathProbability) {
                character.status = 'dead'
                eventBus.emit('character:exited', { 
                  characterId: character.id, 
                  characterName: character.name, 
                  reason: 'naturalDeath' 
                })
                
                if (!newState.turnLog) {
                  newState.turnLog = []
                }
                newState.turnLog.push(`${character.name}自然死亡`)
                return
              }
            }
          }

          // 检查忠诚叛变
          if (character.exitMethods.canBetrayed) {
            if (character.loyalty < CHARACTER_EXIT_RULES.betrayalLoyaltyThreshold) {
              // 假设人物有兵权
              const hasMilitaryPower = true // 实际应该从 state 中获取
              if (hasMilitaryPower) {
                character.status = 'betrayed'
                eventBus.emit('character:exited', { 
                  characterId: character.id, 
                  characterName: character.name, 
                  reason: 'betrayed' 
                })
                
                // 应用叛变后果
                if (character.exitConsequences.betrayed) {
                  character.exitConsequences.betrayed.forEach(consequence => {
                    if (!newState.turnLog) {
                      newState.turnLog = []
                    }
                    newState.turnLog.push(consequence)
                  })
                }
                return
              }
            }
          }

          // 检查势力灭亡强制退出
          if (character.exitMethods.exitOnFactionDestroy) {
            const faction = FACTIONS.find(f => f.id === character.faction)
            if (faction && faction.status === 'destroyed') {
              character.status = 'exiled'
              eventBus.emit('character:exited', { 
                characterId: character.id, 
                characterName: character.name, 
                reason: 'factionDestroyed' 
              })
              
              if (!newState.turnLog) {
                newState.turnLog = []
              }
              newState.turnLog.push(`${character.name}因势力灭亡而隐退`)
              return
            }
          }
        }
      })
    } catch (error) {
      console.error('[ScenarioEngine] Error in checkCharacterExit:', error)
    }
    return newState
  }

  // ── 事件：检测触发条件 ──

  checkEventTrigger(state: GameState): GameState {
    let newState = { ...state }
    try {
      SCRIPTED_EVENTS.forEach(event => {
        if (event.status === 'pending') {
          const { triggerConditions } = event
          let canTrigger = true

          // 检查自动触发
          if (triggerConditions.autoTrigger) {
            // 自动触发事件
          } else {
            // 检查年份
            if (triggerConditions.year !== undefined) {
              const currentYear = 1627 // 实际应该从 state 中解析
              if (currentYear !== triggerConditions.year) {
                canTrigger = false
              }
            }

            // 检查季节
            if (triggerConditions.season !== undefined) {
              const currentSeason = 'winter' // 实际应该从 state 中解析
              if (currentSeason !== triggerConditions.season) {
                canTrigger = false
              }
            }

            // 检查人物存在
            if (triggerConditions.characterPresent) {
              const character = HISTORICAL_CHARACTERS.find(c => c.id === triggerConditions.characterPresent)
              if (!character || character.status !== 'active') {
                canTrigger = false
              }
            }

            // 检查势力存在
            if (triggerConditions.factionActive) {
              const faction = FACTIONS.find(f => f.id === triggerConditions.factionActive)
              if (!faction || faction.status !== 'active') {
                canTrigger = false
              }
            }

            // 检查皇帝威望
            if (triggerConditions.prestigeMin !== undefined) {
              const emperorPrestige = 50 // 实际应该从 state 中获取
              if (emperorPrestige < triggerConditions.prestigeMin) {
                canTrigger = false
              }
            }

            // 检查民心
            if (triggerConditions.peopleMoraleMax !== undefined) {
              if (state.nationStats.peopleMorale > triggerConditions.peopleMoraleMax) {
                canTrigger = false
              }
            }

            // 检查民变强度
            if (triggerConditions.unrestMin !== undefined) {
              const unrestLevel = 40 // 实际应该从 state 中获取
              if (unrestLevel < triggerConditions.unrestMin) {
                canTrigger = false
              }
            }

            // 检查势力支持度
            if (triggerConditions.factionSupportMin) {
              const { factionId, value } = triggerConditions.factionSupportMin
              const faction = FACTIONS.find(f => f.id === factionId)
              if (!faction || faction.support < value) {
                canTrigger = false
              }
            }
          }

          if (canTrigger) {
            event.status = 'active'

            // 应用立即效果
            if (event.immediateEffects) {
              for (const effect of event.immediateEffects) {
                newState = this.applyEffect(effect, newState)
              }
            }

            eventBus.emit('event:triggered', { eventId: event.id, eventTitle: event.title })
          }
        }
      })
    } catch (error) {
      console.error('[ScenarioEngine] Error in checkEventTrigger:', error)
    }
    return newState
  }

  // ── 事件：超时自动恶化 ──

  checkEventEscalation(state: GameState): GameState {
    let newState = { ...state }
    try {
      SCRIPTED_EVENTS.forEach(event => {
        if (event.status === 'active') {
          // 假设事件已经活跃了超过1季度
          const turnsWithoutAction = 2 // 实际应该从 state 中获取

          // 检查是否超过中断条件中的回合数
          if (event.interruptConditions?.turnsWithoutAction !== undefined) {
            if (turnsWithoutAction >= event.interruptConditions.turnsWithoutAction) {
              // 应用恶化效果
              if (event.escalationEffects) {
                for (const effect of event.escalationEffects) {
                  newState = this.applyEffect(effect, newState)
                }
              }

              // 将事件标记为失败
              event.status = 'failed'
              eventBus.emit('event:failed', { eventId: event.id })
            }
          }
        }
      })
    } catch (error) {
      console.error('[ScenarioEngine] Error in checkEventEscalation:', error)
    }
    return newState
  }

  // ── 玩家选择：应用效果 ──

  applyChoice(eventId: string, choiceId: string, state: GameState): GameState {
    try {
      const event = SCRIPTED_EVENTS.find(e => e.id === eventId)
      if (!event) return state
      const choice = event.choices.find(c => c.id === choiceId)
      if (!choice) return state

      let newState = { ...state }

      // 1. 应用选项效果
      for (const effect of choice.effects) {
        newState = this.applyEffect(effect, newState)
      }

      // 2. 锁死后续事件
      for (const lockId of (choice.locksEvents ?? [])) {
        const lockEvent = SCRIPTED_EVENTS.find(e => e.id === lockId)
        if (lockEvent) lockEvent.status = 'locked'
      }

      // 3. 解锁后续事件
      for (const unlockId of (choice.unlocksEvents ?? [])) {
        const unlockEvent = SCRIPTED_EVENTS.find(e => e.id === unlockId)
        if (unlockEvent && unlockEvent.status === 'locked') {
          unlockEvent.status = 'pending'
        }
      }

      // 4. 将当前事件标为完成
      event.status = 'completed'

      // 5. emit 事件
      eventBus.emit('event:completed', { eventId, choiceId })

      return newState
    } catch (error) {
      console.error('[ScenarioEngine] Error in applyChoice:', error)
      return state
    }
  }

  // ── 研究国策 ──

  researchPolicy(policyId: string, state: GameState): GameState {
    try {
      const policy = NATIONAL_POLICIES.find(p => p.id === policyId)
      if (!policy || policy.status !== 'available') return state

      // 检查前置条件
      if (policy.requirements?.prerequisitePolicies) {
        const allMet = policy.requirements.prerequisitePolicies.every(
          reqId => NATIONAL_POLICIES.find(p => p.id === reqId)?.status === 'completed'
        )
        if (!allMet) return state
      }

      // 检查威望条件
      if (policy.requirements?.prestigeMin) {
        const emperorPrestige = 50 // 实际应该从 state 中获取
        if (emperorPrestige < policy.requirements.prestigeMin) {
          return state
        }
      }

      // 检查势力支持度条件
      if (policy.requirements?.factionSupport) {
        const { factionId, value } = policy.requirements.factionSupport
        const faction = FACTIONS.find(f => f.id === factionId)
        if (!faction || faction.support < value) {
          return state
        }
      }

      // 检查科技等级条件
      if (policy.requirements?.techLevel) {
        const techLevel = 1 // 实际应该从 state 中获取
        if (techLevel < policy.requirements.techLevel) {
          return state
        }
      }

      // 扣除费用
      let newState = { ...state }
      if (policy.cost > 0) {
        newState = this.applyEffect(
          { type: 'treasury', target: 'treasury', field: 'gold', delta: -policy.cost, description: `研究${policy.name}` },
          newState
        )
      }

      // 标记为研究中（实际完成在 N 个 tick 后）
      policy.status = 'researching'
      eventBus.emit('policy:researching', { policyId })

      return newState
    } catch (error) {
      console.error('[ScenarioEngine] Error in researchPolicy:', error)
      return state
    }
  }

  // ── 私有：应用单条效果到 state ──

  private applyEffect(effect: GameEffect, state: GameState): GameState {
    try {
      let newState = JSON.parse(JSON.stringify(state)) // 深拷贝

      switch (effect.type) {
        case 'treasury':
          if (effect.target === 'treasury' && (effect.field === 'gold' || effect.field === 'grain')) {
            // @ts-ignore - 动态字段访问
            newState.treasury[effect.field] = Math.max(0, newState.treasury[effect.field] + effect.delta)
          }
          break

        case 'province':
          const provinceIndex = newState.provinces.findIndex(p => p.id === effect.target)
          if (provinceIndex !== -1) {
            // @ts-ignore - 动态字段访问
            const currentValue = newState.provinces[provinceIndex][effect.field]
            if (typeof currentValue === 'number') {
              // @ts-ignore - 动态字段访问
              newState.provinces[provinceIndex][effect.field] = Math.max(0, Math.min(100, currentValue + effect.delta))
            }
          }
          break

        case 'minister':
          // 这里处理大臣或势力的属性变化
          // 暂时只处理势力支持度
          const faction = FACTIONS.find(f => f.id === effect.target)
          if (faction && effect.field === 'support') {
            faction.support = Math.max(0, Math.min(100, faction.support + effect.delta))
          }
          break

        case 'nation':
          if (effect.target === 'all') {
            // @ts-ignore - 动态字段访问
            const currentValue = newState.nationStats[effect.field]
            if (typeof currentValue === 'number') {
              // @ts-ignore - 动态字段访问
              newState.nationStats[effect.field] = Math.max(0, Math.min(100, currentValue + effect.delta))
            }
          } else if (effect.target === 'emperor') {
            // 处理皇帝属性
            // 暂时假设皇帝属性在 state 中，实际可能需要从其他地方获取
          }
          break

        case 'military':
          // 处理军事相关效果
          break

        default:
          break
      }

      return newState
    } catch (error) {
      console.error('[ScenarioEngine] Error in applyEffect:', error)
      return state
    }
  }
}

export const scenarioEngine = new ScenarioEngine()
