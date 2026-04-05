// 全局日志系统

/**
 * 日志级别
 */
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

/**
 * Logger 类 - 提供分级日志功能
 */
export class Logger {
  private module: string;
  private isProduction: boolean;

  /**
   * 构造函数
   * @param module 模块标签，如 "LLM", "GameEngine"
   */
  constructor(module: string) {
    this.module = module;
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  /**
   * 生成带时间戳的日志前缀
   * @param level 日志级别
   * @returns 格式化的日志前缀
   */
  private getLogPrefix(level: LogLevel): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] [${this.module}]`;
  }

  /**
   * 信息级日志
   * @param message 日志消息
   * @param data 附加数据（可选）
   */
  info(message: string, data?: unknown): void {
    console.log(`${this.getLogPrefix('info')} ${message}`, data || '');
  }

  /**
   * 警告级日志
   * @param message 日志消息
   * @param data 附加数据（可选）
   */
  warn(message: string, data?: unknown): void {
    console.warn(`${this.getLogPrefix('warn')} ${message}`, data || '');
  }

  /**
   * 错误级日志
   * @param message 日志消息
   * @param data 附加数据（可选）
   */
  error(message: string, data?: unknown): void {
    console.error(`${this.getLogPrefix('error')} ${message}`, data || '');
  }

  /**
   * 调试级日志（生产环境下会被忽略）
   * @param message 日志消息
   * @param data 附加数据（可选）
   */
  debug(message: string, data?: unknown): void {
    if (!this.isProduction) {
      console.debug(`${this.getLogPrefix('debug')} ${message}`, data || '');
    }
  }
}

/**
 * 创建日志实例的工厂函数
 * @param module 模块标签
 * @returns Logger 实例
 */
export function createLogger(module: string): Logger {
  return new Logger(module);
}
