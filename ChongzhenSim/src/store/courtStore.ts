import { create } from 'zustand'
import type { CourtMemorial, MemorialChoice, DAY1_META } from '../data/scenario/day1Script'
import type { GameEffect } from '../core/types'
import type { OptionEffect } from '../api/schemas'
import { ChangeType } from '../core/fieldKeys'
import { SCRIPTED_EVENTS } from '../data/scenario/scriptedEvents'
import { useGameStore } from './gameStore'

// 单次选择记录
export interface ChoiceRecord {
  memorialId: string
  ministerName: string
  subject: string
  choiceId: string
  choiceText: string
  effects: GameEffect[]
  timestamp: number
}

// 上朝阶段
export type CourtPhase =
  | 'opening'       // 开场白（司礼监秉笔太监）
  | 'discussion'    // 大臣讨论（各派系表达观点）
  | 'decision'      // 皇帝决策（显示选项）
  | 'summary'       // 退朝总结（展示本次所有决策）
  | 'closed'        // 已退朝（等待玩家点「结束回合」）

interface CourtStore {
  // ── 状态 ──
  phase: CourtPhase
  sessionTitle: string
  openingNarration: string
  closingNarration: string

  memorials: CourtMemorial[]          // 本回合的奏报列表（最多3条）
  currentMemorialIndex: number         // 当前正在处理的奏报索引（0-2）
  choiceRecords: ChoiceRecord[]        // 本回合已做的所有选择记录

  isAnimating: boolean                 // 是否正在播放动画（防止连点）
  hasCourtedThisTurn: boolean          // 本回合是否已经上过朝

  // ── Actions ──
  initCourt: (
    memorials: CourtMemorial[],
    meta: typeof DAY1_META
  ) => void

  startOpening: () => void             // 进入开场白
  proceedToDiscussion: () => void     // 从开场白进入大臣讨论
  proceedToDecision: () => void       // 从大臣讨论进入皇帝决策

  makeChoice: (
    memorial: CourtMemorial,
    choice: MemorialChoice
  ) => Promise<void>                   // 玩家做出选择，立即提交效果到 ChangeQueue

  nextMemorial: () => void             // 推进到下一条奏报
  proceedToSummary: () => void         // 进入退朝总结（所有奏报处理完或玩家主动退朝）
  dismissCourt: () => void             // 确认退朝

  submitLLMDecree: (content: string) => void  // LLM 自拟圣旨接口占位

  resetCourt: () => void               // 新回合重置
}

export const useCourtStore = create<CourtStore>((set, get) => ({
  phase: 'closed',
  sessionTitle: '',
  openingNarration: '',
  closingNarration: '',
  memorials: [],
  currentMemorialIndex: 0,
  choiceRecords: [],
  isAnimating: false,
  hasCourtedThisTurn: false,

  initCourt: (memorials, meta) => {
    set({
      phase: 'closed',
      sessionTitle: meta.sessionTitle,
      openingNarration: meta.openingNarration,
      closingNarration: meta.closingNarration,
      memorials,
      currentMemorialIndex: 0,
      choiceRecords: [],
      isAnimating: false,
      hasCourtedThisTurn: false,
    })
  },

  startOpening: () => {
    set({ phase: 'opening', isAnimating: true })
    // 开场白动画结束后自动调用 proceedToDiscussion
    setTimeout(() => {
      set({ phase: 'discussion', isAnimating: false })
    }, 3000)
  },

  proceedToDiscussion: () => {
    set({ phase: 'discussion', isAnimating: false })
  },

  proceedToDecision: () => {
    set({ phase: 'decision', isAnimating: false })
  },

  makeChoice: async (memorial, choice) => {
    const { choiceRecords } = get()

    // 收集选项效果 + 奏报立即效果
    const allEffects = [
      ...choice.effects,
      ...(memorial.immediateEffects ?? []),
    ]

    const record: ChoiceRecord = {
      memorialId: memorial.id,
      ministerName: memorial.ministerName,
      subject: memorial.subject,
      choiceId: choice.id,
      choiceText: choice.text,
      effects: allEffects,
      timestamp: Date.now(),
    }

    // 立即将效果提交到 ChangeQueue（不再等待退朝）
    const { useGameStore } = await import('./gameStore')
    const gameStore = useGameStore.getState()
    
    if (allEffects.length > 0) {
      const { changeQueue } = await import('../engine/ChangeQueue')
      const { resolveEffectValue } = await import('../config/gameConfig')

      console.log(`[CourtStore] 选择「${choice.text}」，立即提交 ${allEffects.length} 个效果到 ChangeQueue`)

      for (const effect of allEffects) {
        // 支持新旧两种格式
        let resolvedValue: number
        let mode: 'delta' | 'absolute'

        if ('value' in effect || 'configKey' in effect) {
          // 新格式 OptionEffect
          resolvedValue = resolveEffectValue(
            (effect as OptionEffect).configKey,
            (effect as OptionEffect).value
          )
          mode = (effect as OptionEffect).mode || 'delta'
        } else {
          // 旧格式 GameEffect (有 delta)
          resolvedValue = (effect as GameEffect).delta || 0
          mode = 'delta'
        }

        // 根据 mode 确定 delta 或 newValue
        let delta: number | undefined
        let newValue: number | undefined

        if (mode === 'delta') {
          delta = resolvedValue
        } else {
          newValue = resolvedValue
        }

        // 确定 ChangeType
        let changeType: ChangeType
        if (effect.type === 'treasury') {
          changeType = ChangeType.TREASURY
        } else if (effect.type === 'province') {
          changeType = ChangeType.PROVINCE
        } else if (effect.type === 'nation' || effect.type === 'military') {
          changeType = ChangeType.NATION
        } else if (effect.type === 'minister') {
          // minister 可能是针对某个官员，也可能是针对派系支持度
          const gameState = gameStore.gameState
          const hasMinisterId = gameState?.ministers?.some(m => m.id === effect.target)
          changeType = hasMinisterId ? ChangeType.OFFICIAL : ChangeType.FACTION
        } else if (effect.type === 'faction') {
          changeType = ChangeType.FACTION
        } else {
          changeType = ChangeType.EVENT
        }

        // 添加到 ChangeQueue
        changeQueue.enqueue({
          type: changeType,
          target: effect.target,
          field: effect.field,
          delta,
          newValue,
          description: effect.description || '朝堂决策效果',
          source: `朝堂[${memorial.subject}]`
        })

        if (effect.type === 'province' && effect.field === 'taxRate') {
          const currentState = gameStore.gameState
          if (currentState?.taxRateHistory && currentState.provinces) {
            const province = currentState.provinces.find(p => p.id === effect.target)
            if (province) {
              const oldRate = province.taxRate
              const newRate = newValue !== undefined ? newValue : oldRate + (delta || 0)
              if (gameStore.recordTaxRateHistoryEntry) {
                gameStore.recordTaxRateHistoryEntry({
                  turn: currentState.turn,
                  date: currentState.date,
                  provinceId: province.id,
                  provinceName: province.name,
                  oldRate,
                  newRate,
                  description: `朝堂决策：${province.name} 税率调整`
                })
              }
            }
          }
        }

        console.log(`[ChangeQueue] 已加入队列: ${effect.type}.${effect.field} ${mode === 'delta' ? (delta && delta >= 0 ? '+' : '') : '='}${resolvedValue}`)
      }

      console.log(`[CourtStore] 已提交 ${allEffects.length} 个效果到 ChangeQueue`)

      // 处理事件之间的锁定与解锁关系
      if (choice.unlocksEventIds?.length || choice.locksEventIds?.length) {
        const modifyEventStatus = (eventId: string, status: 'active' | 'locked' | 'failed' | 'completed') => {
          const targetEvent = SCRIPTED_EVENTS.find(e => e.id === eventId)
          if (targetEvent) {
            targetEvent.status = status
            return targetEvent.title
          }
          return null
        }

        const unlockedTitles: string[] = []
        const lockedTitles: string[] = []

        if (choice.unlocksEventIds?.length) {
          for (const eventId of choice.unlocksEventIds) {
            const title = modifyEventStatus(eventId, 'active')
            if (title) unlockedTitles.push(title)
          }
        }
        if (choice.locksEventIds?.length) {
          for (const eventId of choice.locksEventIds) {
            const title = modifyEventStatus(eventId, 'locked')
            if (title) lockedTitles.push(title)
          }
        }

        if (unlockedTitles.length > 0) {
          gameStore.addTurnLog(`[朝堂] 解锁后续事件：${unlockedTitles.join('、')}`)
        }
        if (lockedTitles.length > 0) {
          gameStore.addTurnLog(`[朝堂] 锁定事件：${lockedTitles.join('、')}`)
        }
      }
    }

    // 记录选择到日志
    gameStore.addTurnLog(`[朝堂] ${memorial.ministerName} - ${memorial.subject}: ${choice.text}`)

    set({
      choiceRecords: [...choiceRecords, record],
      isAnimating: true,  // 触发效果展示动画
    })

    // 动画结束后推进（由 UI 层 setTimeout 调用 nextMemorial）
  },

  nextMemorial: () => {
    const { currentMemorialIndex, memorials } = get()
    const next = currentMemorialIndex + 1

    if (next >= memorials.length) {
      // 所有奏报处理完，自动进入总结
      set({ phase: 'summary', isAnimating: false })
    } else {
      set({ currentMemorialIndex: next, isAnimating: false })
    }
  },

  proceedToSummary: () => {
    set({ phase: 'summary', isAnimating: false })
  },

  dismissCourt: () => {
    // 效果已在 makeChoice 时提交到 ChangeQueue，这里只需关闭朝堂
    set({ phase: 'closed', hasCourtedThisTurn: true })
  },

  submitLLMDecree: (content) => {
    const { addTurnLog } = useGameStore.getState();
    addTurnLog(`LLM 自拟圣旨占位：${content}`);
    console.warn('[CourtStore] submitLLMDecree called (placeholder):', content);
  },

  resetCourt: () => {
    set({
      phase: 'closed',
      memorials: [],
      currentMemorialIndex: 0,
      choiceRecords: [],
      isAnimating: false,
      hasCourtedThisTurn: false,
    })
  },
}))
