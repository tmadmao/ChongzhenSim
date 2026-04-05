// 通用计算结果缓存工具

interface CacheItem<T> {
  value: T;
  timestamp: number;
}

export class Cache<T> {
  private cache: Map<string, CacheItem<T>> = new Map();
  private readonly ttl: number;

  constructor(ttl: number = 5 * 60 * 1000) { // 默认5分钟
    this.ttl = ttl;
  }

  /**
   * 生成缓存键
   */
  private generateKey(...args: any[]): string {
    return JSON.stringify(args);
  }

  /**
   * 检查缓存是否有效
   */
  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.ttl;
  }

  /**
   * 获取缓存值，如果缓存不存在或已过期，则调用计算函数并缓存结果
   */
  async get(key: string | any[], compute: () => Promise<T>): Promise<T> {
    const cacheKey = typeof key === 'string' ? key : this.generateKey(key);
    
    const cached = this.cache.get(cacheKey);
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.value;
    }

    const value = await compute();
    this.cache.set(cacheKey, {
      value,
      timestamp: Date.now()
    });

    return value;
  }

  /**
   * 手动设置缓存值
   */
  set(key: string | any[], value: T): void {
    const cacheKey = typeof key === 'string' ? key : this.generateKey(key);
    this.cache.set(cacheKey, {
      value,
      timestamp: Date.now()
    });
  }

  /**
   * 清除指定缓存
   */
  delete(key: string | any[]): void {
    const cacheKey = typeof key === 'string' ? key : this.generateKey(key);
    this.cache.delete(cacheKey);
  }

  /**
   * 清除所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size;
  }
}

// 全局缓存实例
export const globalCache = new Cache<any>();

// 特定用途的缓存实例
export const apiCache = new Cache<any>(10 * 60 * 1000); // API响应缓存10分钟
export const computationCache = new Cache<any>(5 * 60 * 1000); // 计算结果缓存5分钟
export const gameStateCache = new Cache<any>(30 * 1000); // 游戏状态缓存30秒