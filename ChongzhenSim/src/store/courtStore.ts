import { create } from 'zustand'
import type { CourtMemorial, MemorialChoice, DAY1_META } from '../data/scenario/day1Script'
import type { GameEffect } from '../core/types'
import { ChangeType } from '../core/fieldKeys'

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
  | 'opening'       // 开场白（进入动画）
  | 'memorial'      // 大臣奏报（主交互阶段）
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
  proceedToMemorial: () => void        // 从开场白进入奏报阶段

  makeChoice: (
    memorial: CourtMemorial,
    choice: MemorialChoice
  ) => Promise<void>                   // 玩家做出选择，立即提交效果到 ChangeQueue

  nextMemorial: () => void             // 推进到下一条奏报
  proceedToSummary: () => void         // 进入退朝总结（所有奏报处理完或玩家主动退朝）
  dismissCourt: () => void             // 确认退朝

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
    // 开场白动画结束后自动调用 proceedToMemorial
    setTimeout(() => {
      set({ phase: 'memorial', isAnimating: false })
    }, 3000)
  },

  proceedToMemorial: () => {
    set({ phase: 'memorial', isAnimating: false })
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
            (effect as any).configKey,
            (effect as any).value
          )
          mode = (effect as any).mode || 'delta'
        } else {
          // 旧格式 GameEffect (有 delta)
          resolvedValue = (effect as any).delta || 0
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
        switch (effect.type) {
          case 'treasury':
            changeType = ChangeType.TREASURY
            break
          case 'province':
            changeType = ChangeType.PROVINCE
            break
          case 'minister':
            changeType = ChangeType.OFFICIAL
            break
          case 'nation':
            changeType = ChangeType.NATION
            break
          case 'military':
            changeType = ChangeType.NATION
            break
          default:
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

        console.log(`[ChangeQueue] 已加入队列: ${effect.type}.${effect.field} ${mode === 'delta' ? (delta && delta >= 0 ? '+' : '') : '='}${resolvedValue}`)
      }

      console.log(`[CourtStore] 已提交 ${allEffects.length} 个效果到 ChangeQueue`)
    }

    // 记录选择到日志
    const { useGameStore } = await import('./gameStore')
    const gameStore = useGameStore.getState()
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
