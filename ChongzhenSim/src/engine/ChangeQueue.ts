/**
 * 统一变动队列系统 - 物理隔离实现
 * 
 * 核心原则：
 * 1. 所有数据变动都先进入队列，不立即执行
 * 2. 只有 applyAll() 方法可以修改游戏状态
 * 3. 只有 GameEngine.endTurn 可以调用 applyAll()
 * 4. 结算完成后清空队列
 * 5. 强制日志审计 - 所有变动必须记录
 */

import type { GameState } from '../core/types';
import { createLogger } from '../utils/logger';
import { ChangeType, toTsField } from '../core/fieldKeys';

const logger = createLogger('ChangeQueue');

// 重新導出 ChangeType 以便向後兼容
export { ChangeType };

// 舊的 ChangeType 定義（為了向後兼容）
export type ChangeTypeString =
  | 'treasury'      // 国库变动
  | 'province'      // 省份变动
  | 'faction'       // 派系变动
  | 'nation'        // 国家属性变动
  | 'official'      // 官员变动
  | 'event';        // 事件效果

// 变动请求接口
export interface ChangeRequest {
  id: string;
  type: ChangeType;
  target: string;       // 目标ID（如省份ID、官员ID等）
  field: string;        // 字段名（建議使用 ProvinceField, NationField 等枚舉）
  delta?: number;       // 变动值（用于累积的数值，如国库银两）
  newValue?: number;    // 新值（用于绝对值，如税率）
  description: string;  // 描述
  source: string;       // 来源（如事件ID、政策ID等）
  timestamp: number;    // 加入队列的时间戳
}

type NumericRecord = Record<string, number | undefined>;

// 变动队列类 - 单例模式
export class ChangeQueue {
  private queue: ChangeRequest[] = [];
  private static instance: ChangeQueue;
  private isApplying: boolean = false; // 防止重入
  private appliedTreasuryChanges: Array<{ delta: number; description: string; source: string }> = []; // 记录应用过的国库变动

  private constructor() {
    logger.info('[ChangeQueue] Initialized');
  }

  static getInstance(): ChangeQueue {
    if (!ChangeQueue.instance) {
      ChangeQueue.instance = new ChangeQueue();
    }
    return ChangeQueue.instance;
  }

  /**
   * 添加变动到队列
   * 这是唯一允许添加变动的方法
   */
  enqueue(change: Omit<ChangeRequest, 'id' | 'timestamp'>): void {
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = Date.now();
    const request: ChangeRequest = { ...change, id, timestamp };
    
    this.queue.push(request);
    
    // 强制日志审计
    logger.info(`[ChangeQueue] Enqueued: ${request.description}`, {
      id: request.id,
      type: request.type,
      target: request.target,
      field: request.field,
      delta: request.delta,
      newValue: request.newValue,
      source: request.source,
      queueLength: this.queue.length
    });
    
    console.log(`[ChangeQueue] 已加入待结算队列: ${request.description}`);
  }

  /**
   * 获取所有变动（只读副本）
   */
  getAll(): ReadonlyArray<ChangeRequest> {
    return Object.freeze([...this.queue]);
  }

  /**
   * 按类型获取变动（只读副本）
   */
  getByType(type: ChangeType): ReadonlyArray<ChangeRequest> {
    return Object.freeze(this.queue.filter(c => c.type === type));
  }

  /**
   * 获取队列长度
   */
  get length(): number {
    return this.queue.length;
  }

  /**
   * 应用所有变动到游戏状态
   * 
   * ⚠️ 警告：只有 GameEngine.endTurn 可以调用此方法！
   * 
   * @param state 当前游戏状态
   * @returns 新的游戏状态和变动日志
   */
  applyAll(state: GameState): { newState: GameState; logs: string[]; appliedCount: number } {
    // 防止重入
    if (this.isApplying) {
      logger.error('[ChangeQueue] applyAll called while already applying!');
      throw new Error('ChangeQueue.applyAll is already in progress');
    }
    
    this.isApplying = true;
    this.appliedTreasuryChanges = []; // 清空之前的记录
    logger.info(`[ChangeQueue] Starting applyAll with ${this.queue.length} changes`);
    
    const newState = JSON.parse(JSON.stringify(state)); // 深拷贝
    const logs: string[] = [];
    let appliedCount = 0;

    try {
      // 按加入顺序处理所有变动
      for (let i = 0; i < this.queue.length; i++) {
        const change = this.queue[i];
        
        logger.info(`[ChangeQueue] Applying change ${i + 1}/${this.queue.length}: ${change.description}`, {
          id: change.id,
          type: change.type,
          target: change.target,
          field: change.field,
          delta: change.delta,
          newValue: change.newValue
        });
        
        switch (change.type) {
          case 'treasury':
            this.applyTreasuryChange(newState, change, logs);
            break;
          case 'province':
            this.applyProvinceChange(newState, change, logs);
            break;
          case 'faction':
            this.applyFactionChange(newState, change, logs);
            break;
          case 'nation':
            this.applyNationChange(newState, change, logs);
            break;
          case 'official':
            this.applyOfficialChange(newState, change, logs);
            break;
          case 'event':
            this.applyEventChange(newState, change, logs);
            break;
          default:
            logger.warn(`[ChangeQueue] Unknown change type: ${change.type}`);
        }
        
        appliedCount++;
      }
      
      logger.info(`[ChangeQueue] Applied ${appliedCount} changes successfully`);
      
    } catch (error) {
      logger.error('[ChangeQueue] Error applying changes:', error);
      throw error;
    } finally {
      this.isApplying = false;
    }

    return { newState, logs, appliedCount };
  }

  /**
   * 清空队列
   * 应在 applyAll 成功后调用
   */
  clear(): void {
    const count = this.queue.length;
    this.queue = [];
    logger.info(`[ChangeQueue] Cleared ${count} changes from queue`);
  }

  /**
   * 获取变动统计
   */
  getStats(): { total: number; byType: Record<ChangeType, number> } {
    const byType: Record<ChangeType, number> = {
      treasury: 0,
      province: 0,
      faction: 0,
      nation: 0,
      official: 0,
      event: 0
    };

    for (const change of this.queue) {
      byType[change.type]++;
    }

    return { total: this.queue.length, byType };
  }

  // ==================== 私有方法：应用各类变动 ====================

  private applyTreasuryChange(state: GameState, change: ChangeRequest, logs: string[]): void {
    // 安全检查：确保 treasury 存在
    if (!state.treasury) {
      logger.warn(`[ChangeQueue] state.treasury is undefined`);
      return;
    }

    // 統一架構：優先使用 field 屬性，向後兼容 target 屬性
    const field = change.field || change.target;

    if (field === 'gold') {
      const oldValue = state.treasury.gold ?? 0;
      const delta = change.delta || 0;
      const newValue = Math.max(0, oldValue + delta);
      state.treasury.gold = newValue;

      const logMsg = `国库银两: ${oldValue.toFixed(1)} → ${newValue.toFixed(1)} (${delta >= 0 ? '+' : ''}${delta}) [${change.description}]`;
      logs.push(logMsg);
      logger.info(`[ChangeQueue] ${logMsg}`);

      // 记录到应用过的国库变动列表
      this.appliedTreasuryChanges.push({
        delta,
        description: change.description || '国库变动',
        source: change.source || '未知'
      });

    } else if (field === 'grain') {
      const oldValue = state.treasury.grain ?? 0;
      const delta = change.delta || 0;
      const newValue = Math.max(0, oldValue + delta);
      state.treasury.grain = newValue;

      const logMsg = `国库粮食: ${oldValue.toFixed(1)} → ${newValue.toFixed(1)} (${delta >= 0 ? '+' : ''}${delta}) [${change.description}]`;
      logs.push(logMsg);
      logger.info(`[ChangeQueue] ${logMsg}`);
    } else {
      logger.warn(`[ChangeQueue] Unknown treasury field: ${field}, change:`, change);
    }
  }

  private applyProvinceChange(state: GameState, change: ChangeRequest, logs: string[]): void {
    // 安全检查：确保 provinces 数组存在
    if (!state.provinces || !Array.isArray(state.provinces)) {
      logger.warn(`[ChangeQueue] state.provinces is undefined or not an array`);
      return;
    }

    const provinceIndex = state.provinces.findIndex(p => p.id === change.target);
    if (provinceIndex === -1) {
      logger.warn(`[ChangeQueue] Province not found: ${change.target}`);
      return;
    }

    const province = state.provinces[provinceIndex];
    
    // 統一架構：將可能的數據庫字段名轉換為 TypeScript 字段名
    const tsField = toTsField(change.field);
    const provinceRecord = province as NumericRecord;
    const oldValue = provinceRecord[tsField] ?? 0;

    if (change.newValue !== undefined) {
      // 绝对值模式
      provinceRecord[tsField] = change.newValue;
      const logMsg = `${province.name}.${tsField}: ${oldValue} → ${change.newValue} [${change.description}]`;
      logs.push(logMsg);
      logger.info(`[ChangeQueue] ${logMsg}`);
    } else if (change.delta !== undefined) {
      // 变动值模式
      const newValue = Math.max(0, (oldValue || 0) + change.delta);
      provinceRecord[tsField] = newValue;
      const logMsg = `${province.name}.${tsField}: ${oldValue} → ${newValue} (${change.delta >= 0 ? '+' : ''}${change.delta}) [${change.description}]`;
      logs.push(logMsg);
      logger.info(`[ChangeQueue] ${logMsg}`);
    }
  }

  private applyFactionChange(state: GameState, change: ChangeRequest, logs: string[]): void {
    // 派系变动通过 ministers 中的 faction 字段来处理
    if (!state.ministers || !Array.isArray(state.ministers)) {
      logger.warn(`[ChangeQueue] state.ministers is undefined or not an array`);
      return;
    }

    const affectedMinisters = state.ministers.filter(m => m.faction === change.target);
    if (affectedMinisters.length === 0) {
      logger.warn(`[ChangeQueue] No ministers found for faction: ${change.target}`);
      return;
    }

    const field = change.field;
    const isAbsolute = change.newValue !== undefined;
    const delta = change.delta || 0;

    for (const minister of affectedMinisters) {
      const ministerRecord = minister as NumericRecord;
      const oldValue = ministerRecord[field] ?? 0;
      const newValue = isAbsolute
        ? Math.max(0, Math.min(100, change.newValue || 0))
        : Math.max(0, Math.min(100, oldValue + delta));
      ministerRecord[field] = newValue;

      const logMsg = `${minister.name} (${minister.faction}).${field}: ${oldValue} → ${newValue} ${isAbsolute ? '' : `(${delta >= 0 ? '+' : ''}${delta})`} [${change.description}]`;
      logs.push(logMsg);
      logger.info(`[ChangeQueue] ${logMsg}`);
    }
  }

  private applyNationChange(state: GameState, change: ChangeRequest, logs: string[]): void {
    // 安全检查：确保 nationStats 存在
    if (!state.nationStats) {
      logger.warn(`[ChangeQueue] state.nationStats is undefined`);
      return;
    }

    const nationRecord = state.nationStats as NumericRecord;
    const oldValue = nationRecord[change.field] ?? 0;
    const newValue = Math.max(0, Math.min(100, oldValue + (change.delta || 0)));
    nationRecord[change.field] = newValue;

    const logMsg = `国家属性.${change.field}: ${oldValue} → ${newValue} (${change.delta && change.delta >= 0 ? '+' : ''}${change.delta}) [${change.description}]`;
    logs.push(logMsg);
    logger.info(`[ChangeQueue] ${logMsg}`);
  }

  private applyOfficialChange(state: GameState, change: ChangeRequest, logs: string[]): void {
    // 安全检查：确保 ministers 数组存在
    if (!state.ministers || !Array.isArray(state.ministers)) {
      logger.warn(`[ChangeQueue] state.ministers is undefined or not an array`);
      return;
    }

    const minister = state.ministers.find(m => m.id === change.target);
    if (!minister) {
      logger.warn(`[ChangeQueue] Minister not found: ${change.target}`);
      return;
    }

    const ministerRecord = minister as NumericRecord;
    const oldValue = ministerRecord[change.field] ?? 0;
    const newValue = Math.max(0, Math.min(100, oldValue + (change.delta || 0)));
    ministerRecord[change.field] = newValue;

    const logMsg = `${minister.name}.${change.field}: ${oldValue} → ${newValue} (${change.delta && change.delta >= 0 ? '+' : ''}${change.delta}) [${change.description}]`;
    logs.push(logMsg);
    logger.info(`[ChangeQueue] ${logMsg}`);
  }

  private applyEventChange(_state: GameState, change: ChangeRequest, logs: string[]): void {
    // 事件类型的变动可以根据需要特殊处理
    const logMsg = `事件效果: [${change.description}]`;
    logs.push(logMsg);
    logger.info(`[ChangeQueue] ${logMsg}`);
  }

  /**
   * 获取本次 applyAll 应用过的国库变动记录
   * 用于 AccountingSystem 统计
   */
  getTreasuryChanges(): Array<{ delta: number; description: string; source: string }> {
    return [...this.appliedTreasuryChanges];
  }
}

// 导出单例实例
export const changeQueue = ChangeQueue.getInstance();
