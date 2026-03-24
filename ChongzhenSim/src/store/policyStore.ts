import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  NATIONAL_POLICIES,
  type NationalPolicy,
  type PolicyCategory,
  type PolicyStatus,
} from '@/data/policies/nationalPolicies'
import type { GameState } from '@/core/types'

interface PolicyStore {
  // State
  policies: NationalPolicy[]
  researchQueue: string[]           // 正在研究的国策 id 队列
  completedThisTurn: string[]       // 本回合完成的国策（用于 UI 展示）

  // Actions
  initPolicies: () => void
  startResearch: (policyId: string, gameState: GameState) => boolean
  cancelResearch: (policyId: string) => void
  tickResearch: () => string[]      // 每回合推进研究进度，返回本回合完成的国策id列表
  getPoliciesByCategory: (category: PolicyCategory) => NationalPolicy[]
  getAvailablePolicies: () => NationalPolicy[]
  getPolicyById: (id: string) => NationalPolicy | undefined
  isPolicyCompleted: (id: string) => boolean
  canStartResearch: (policyId: string, gameState: GameState) => {
    canResearch: boolean
    reason?: string
  }
}

export const usePolicyStore = create<PolicyStore>()(
  persist(
    (set, get) => ({
      policies: [...NATIONAL_POLICIES],
      researchQueue: [],
      completedThisTurn: [],

      initPolicies: () => {
        set({ policies: [...NATIONAL_POLICIES], researchQueue: [], completedThisTurn: [] })
      },

      startResearch: (policyId, gameState) => {
        const { canStartResearch } = get()
        const check = canStartResearch(policyId, gameState)
        if (!check.canResearch) return false

        set(state => ({
          policies: state.policies.map(p =>
            p.id === policyId
              ? { ...p, status: 'researching' as PolicyStatus, remainingTurns: p.researchTurns }
              : p
          ),
          researchQueue: [...state.researchQueue, policyId],
        }))
        return true
      },

      cancelResearch: (policyId) => {
        set(state => ({
          policies: state.policies.map(p =>
            p.id === policyId
              ? { ...p, status: 'available' as PolicyStatus, remainingTurns: undefined }
              : p
          ),
          researchQueue: state.researchQueue.filter(id => id !== policyId),
        }))
      },

      tickResearch: () => {
        const completed: string[] = []
        set(state => {
          const newPolicies = state.policies.map(p => {
            if (p.status !== 'researching' || p.remainingTurns === undefined) return p
            const newRemaining = p.remainingTurns - 1
            if (newRemaining <= 0) {
              completed.push(p.id)
              // 解锁依赖此国策的其他国策
              return { ...p, status: 'completed' as PolicyStatus, remainingTurns: 0 }
            }
            return { ...p, remainingTurns: newRemaining }
          })

          // 解锁前置条件已满足的 locked 国策
          const updatedPolicies = newPolicies.map(p => {
            if (p.status !== 'locked') return p
            const prereqsMet = p.requirements.prerequisitePolicies.every(
              reqId => newPolicies.find(rp => rp.id === reqId)?.status === 'completed'
            )
            if (prereqsMet) return { ...p, status: 'available' as PolicyStatus }
            return p
          })

          return {
            policies: updatedPolicies,
            researchQueue: state.researchQueue.filter(id => !completed.includes(id)),
            completedThisTurn: completed,
          }
        })
        return completed
      },

      getPoliciesByCategory: (category) => {
        return get().policies.filter(p => p.category === category)
      },

      getAvailablePolicies: () => {
        return get().policies.filter(p => p.status === 'available')
      },

      getPolicyById: (id) => {
        return get().policies.find(p => p.id === id)
      },

      isPolicyCompleted: (id) => {
        return get().policies.find(p => p.id === id)?.status === 'completed'
      },

      canStartResearch: (policyId, gameState) => {
        const policy = get().policies.find(p => p.id === policyId)
        if (!policy) return { canResearch: false, reason: '国策不存在' }
        if (policy.status !== 'available') return { canResearch: false, reason: '当前状态不可研究' }
        if (gameState.treasury.gold < policy.cost)
          return { canResearch: false, reason: `国库不足，需要${policy.cost}万两` }
        if (policy.requirements.prestigeMin && gameState.nationStats.peopleMorale < policy.requirements.prestigeMin)
          return { canResearch: false, reason: `威望不足，需要${policy.requirements.prestigeMin}` }
        const prereqsMet = policy.requirements.prerequisitePolicies.every(
          reqId => get().policies.find(p => p.id === reqId)?.status === 'completed'
        )
        if (!prereqsMet) return { canResearch: false, reason: '前置国策未完成' }
        return { canResearch: true }
      },
    }),
    { name: 'policy-store' }
  )
)
