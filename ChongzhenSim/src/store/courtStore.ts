import { create } from 'zustand'
import type { CourtMemorial, MemorialChoice, DAY1_META } from '../data/scenario/day1Script'
import type { GameEffect } from '../core/types'

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
  pendingEffects: GameEffect[]         // 退朝时批量应用的所有效果

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
  ) => void                            // 玩家做出选择

  nextMemorial: () => void             // 推进到下一条奏报
  proceedToSummary: () => void         // 进入退朝总结（所有奏报处理完或玩家主动退朝）
  dismissCourt: () => void             // 确认退朝，收集所有 pendingEffects

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
  pendingEffects: [],
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
      pendingEffects: [],
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

  makeChoice: (memorial, choice) => {
    const { choiceRecords, pendingEffects } = get()

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

    set({
      choiceRecords: [...choiceRecords, record],
      pendingEffects: [...pendingEffects, ...allEffects],
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
    set({ phase: 'closed', hasCourtedThisTurn: true })
    // 注意：pendingEffects 在此时由 CourtPanel 统一提交给 gameStore
  },

  resetCourt: () => {
    set({
      phase: 'closed',
      memorials: [],
      currentMemorialIndex: 0,
      choiceRecords: [],
      pendingEffects: [],
      isAnimating: false,
      hasCourtedThisTurn: false,
    })
  },
}))
