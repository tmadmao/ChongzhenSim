import { DAY1_SCRIPT, DAY1_META, type CourtMemorial } from '../data/scenario/day1Script'
import { SCRIPTED_EVENTS } from '../data/scenario/scriptedEvents'
import type { GameState } from '../core/types'
import type { ScriptedEvent } from '../data/scenario/scriptedEvents'

export type GameMode = 'local' | 'llm'

export class CourtSystem {

  /**
   * 获取本回合的奏报列表（最多 MAX_MEMORIALS 条）
   * 本地模式：按回合从预设剧本中取数据
   * LLM 模式（预留）：调用 AI 生成同结构的 CourtMemorial[]
   */
  async getMemorialsForTurn(
    turn: number,
    _state: GameState,
    mode: GameMode = 'local'
  ): Promise<CourtMemorial[]> {

    if (mode === 'local') {
      return this.getLocalMemorials(turn)
    }

    // LLM 模式预留接口（后期实现）
    console.warn('[CourtSystem] LLM 模式奏报生成尚未实现，当前使用本地剧本作为回退');
    // return this.getLLMMemorials(turn, state)
    return this.getLocalMemorials(turn)
  }

  /**
   * 本地模式：获取指定回合的奏报
   * 第1回合：返回 DAY1_SCRIPT 全部3条
   * 后续回合：从 scriptedEvents 中筛选 status==='active' 的事件并转换格式
   */
  private getLocalMemorials(turn: number): CourtMemorial[] {
    if (turn === 1) {
      return DAY1_SCRIPT.slice(0, DAY1_META.maxMemorials)
    }

    // 后续回合：从 scriptedEvents 中获取已激活的事件，转换为 CourtMemorial 格式
    const activeEvents = SCRIPTED_EVENTS
      .filter(e => e.status === 'active')
      .sort((a, b) => {
        // 按优先级排序：urgent > important > normal
        const priority = { urgent: 0, important: 1, normal: 2 }
        return priority[a.priority] - priority[b.priority]
      })
      .slice(0, DAY1_META.maxMemorials)  // 最多取3条

    return activeEvents.map(event => this.convertEventToMemorial(event))
  }

  /**
   * 将 ScriptedEvent 转换为 CourtMemorial 格式
   */
  private convertEventToMemorial(event: ScriptedEvent): CourtMemorial {
    // 从 historicalCharacters 中查找奏报大臣
    // 优先选择涉及该事件的大臣，否则用默认大臣
    return {
      id: `memorial_${event.id}`,
      ministerId: event.ministerId ?? 'wang_chengen',
      ministerName: event.ministerName ?? '王承恩',
      ministerTitle: event.ministerTitle ?? '司礼监秉笔太监',
      ministerFaction: event.ministerFaction ?? '帝党',
      urgencyLevel: event.priority,
      subject: event.title,
      content: event.description,
      choices: event.choices.map((c) => ({
        id: c.id,
        text: c.text,
        hint: c.hint ?? '',
        effects: c.effects,
        locksEventIds: c.locksEvents,
        unlocksEventIds: c.unlocksEvents,
      })),
      immediateEffects: event.immediateEffects,
    }
  }

  /**
   * 获取本回合的开场白元数据
   */
  getSessionMeta(turn: number) {
    if (turn === 1) return DAY1_META

    return {
      turn,
      date: this.getTurnDate(turn),
      phase: 'morning' as const,
      sessionTitle: `崇祯${this.getTurnDate(turn)}·早朝`,
      openingNarration: `${this.getTurnDate(turn)}，皇极殿早朝，诸臣肃立，恭候圣裁。`,
      closingNarration: '诸臣叩首，山呼万岁，早朝已毕。',
      maxMemorials: 3,
      mode: 'local' as const,
    }
  }

  private getTurnDate(turn: number): string {
    const month = ((turn - 1) % 12) + 1
    const year = Math.floor((turn - 1) / 12) + 1
    const monthNames = ['正月', '二月', '三月', '四月', '五月', '六月',
                        '七月', '八月', '九月', '十月', '十一月', '腊月']
    return `崇祯${year === 1 ? '元' : year}年${monthNames[month - 1]}`
  }
}

export const courtSystem = new CourtSystem()
