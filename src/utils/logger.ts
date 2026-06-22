/**
 * 日志系统
 * 提供统一的日志记录功能
 */

// 日志级别
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

// 日志条目
export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  data?: any;
  source?: string;
}

// 日志配置
export interface LoggerConfig {
  level: LogLevel;
  maxEntries: number;
  enableConsole: boolean;
  enableStorage: boolean;
  storageKey: string;
}

// 默认配置
const DEFAULT_CONFIG: LoggerConfig = {
  level: LogLevel.DEBUG,
  maxEntries: 1000,
  enableConsole: true,
  enableStorage: true,
  storageKey: 'pixel-buddy-logs',
};

// 日志管理器类
export class Logger {
  private static instance: Logger;
  private config: LoggerConfig;
  private entries: LogEntry[] = [];

  private constructor() {
    this.config = { ...DEFAULT_CONFIG };
  }

  // 获取单例实例
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  // 设置配置
  setConfig(config: Partial<LoggerConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  // 获取配置
  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  // 记录调试日志
  debug(message: string, data?: any, source?: string): void {
    this.log(LogLevel.DEBUG, message, data, source);
  }

  // 记录信息日志
  info(message: string, data?: any, source?: string): void {
    this.log(LogLevel.INFO, message, data, source);
  }

  // 记录警告日志
  warn(message: string, data?: any, source?: string): void {
    this.log(LogLevel.WARN, message, data, source);
  }

  // 记录错误日志
  error(message: string, data?: any, source?: string): void {
    this.log(LogLevel.ERROR, message, data, source);
  }

  // 记录致命错误日志
  fatal(message: string, data?: any, source?: string): void {
    this.log(LogLevel.FATAL, message, data, source);
  }

  // 记录日志
  private log(level: LogLevel, message: string, data?: any, source?: string): void {
    // 检查日志级别
    if (level < this.config.level) {
      return;
    }

    // 创建日志条目
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      data,
      source,
    };

    // 添加到条目列表
    this.entries.push(entry);

    // 限制条目数量
    if (this.entries.length > this.config.maxEntries) {
      this.entries.shift();
    }

    // 输出到控制台
    if (this.config.enableConsole) {
      this.outputToConsole(entry);
    }

    // 保存到存储
    if (this.config.enableStorage) {
      this.saveToStorage();
    }
  }

  // 输出到控制台
  private outputToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString();
    const levelName = LogLevel[entry.level];
    const prefix = `[${timestamp}] [${levelName}]`;
    const message = entry.source ? `${prefix} [${entry.source}] ${entry.message}` : `${prefix} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.data || '');
        break;
      case LogLevel.INFO:
        console.info(message, entry.data || '');
        break;
      case LogLevel.WARN:
        console.warn(message, entry.data || '');
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(message, entry.data || '');
        break;
    }
  }

  // 保存到存储
  private saveToStorage(): void {
    try {
      const data = JSON.stringify(this.entries);
      localStorage.setItem(this.config.storageKey, data);
    } catch (error) {
      console.error('Failed to save logs to storage:', error);
    }
  }

  // 从存储加载
  loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.config.storageKey);
      if (data) {
        this.entries = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load logs from storage:', error);
    }
  }

  // 获取所有日志条目
  getEntries(): LogEntry[] {
    return [...this.entries];
  }

  // 获取指定级别的日志条目
  getEntriesByLevel(level: LogLevel): LogEntry[] {
    return this.entries.filter((entry) => entry.level === level);
  }

  // 获取指定来源的日志条目
  getEntriesBySource(source: string): LogEntry[] {
    return this.entries.filter((entry) => entry.source === source);
  }

  // 获取最近的日志条目
  getRecentEntries(count: number = 10): LogEntry[] {
    return this.entries.slice(-count);
  }

  // 清空日志
  clear(): void {
    this.entries = [];
    if (this.config.enableStorage) {
      localStorage.removeItem(this.config.storageKey);
    }
  }

  // 导出日志
  exportLogs(): string {
    return JSON.stringify(this.entries, null, 2);
  }

  // 导入日志
  importLogs(logsJson: string): boolean {
    try {
      const entries = JSON.parse(logsJson);
      this.entries = entries;
      return true;
    } catch (error) {
      console.error('Failed to import logs:', error);
      return false;
    }
  }

  // 获取日志统计
  getStats(): Record<LogLevel, number> {
    const stats: Record<LogLevel, number> = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 0,
      [LogLevel.WARN]: 0,
      [LogLevel.ERROR]: 0,
      [LogLevel.FATAL]: 0,
    };

    for (const entry of this.entries) {
      stats[entry.level]++;
    }

    return stats;
  }
}

// 导出全局日志管理器实例
export const logger = Logger.getInstance();