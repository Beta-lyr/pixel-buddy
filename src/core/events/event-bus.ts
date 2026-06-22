/**
 * 事件总线
 * 用于模块间通信的事件系统
 */

import { EventType, EventData } from './event-types';

// 事件监听器类型
type EventListener = (data: EventData) => void;

// 事件总线类
export class EventBus {
  private static instance: EventBus;
  private listeners: Map<EventType, Set<EventListener>> = new Map();
  private eventHistory: EventData[] = [];
  private maxHistorySize: number = 100;

  private constructor() {}

  // 获取单例实例
  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  // 订阅事件
  on(eventType: EventType, listener: EventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);

    // 返回取消订阅函数
    return () => this.off(eventType, listener);
  }

  // 取消订阅
  off(eventType: EventType, listener: EventListener): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  // 订阅一次事件
  once(eventType: EventType, listener: EventListener): () => void {
    const onceListener: EventListener = (data) => {
      listener(data);
      this.off(eventType, onceListener);
    };
    return this.on(eventType, onceListener);
  }

  // 触发事件
  emit(eventType: EventType, payload?: any): void {
    const eventData: EventData = {
      type: eventType,
      timestamp: Date.now(),
      payload,
    };

    // 记录事件历史
    this.eventHistory.push(eventData);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // 触发监听器
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(eventData);
        } catch (error) {
          console.error(`Event listener error for ${eventType}:`, error);
        }
      });
    }
  }

  // 获取事件历史
  getEventHistory(eventType?: EventType): EventData[] {
    if (eventType) {
      return this.eventHistory.filter((e) => e.type === eventType);
    }
    return [...this.eventHistory];
  }

  // 清除事件历史
  clearEventHistory(): void {
    this.eventHistory = [];
  }

  // 获取监听器数量
  getListenerCount(eventType: EventType): number {
    return this.listeners.get(eventType)?.size || 0;
  }

  // 检查是否有监听器
  hasListeners(eventType: EventType): boolean {
    return this.getListenerCount(eventType) > 0;
  }

  // 清除所有监听器
  clearAllListeners(): void {
    this.listeners.clear();
  }
}

// 导出全局事件总线实例
export const eventBus = EventBus.getInstance();