/**
 * 规则引擎
 * 处理智能行为规则
 */

import { eventBus } from '../events/event-bus';
import { EventTypes } from '../events/event-types';
import { stateMachine, PetState } from '../state/state-machine';

// 条件类型
export type ConditionType = 'time' | 'interaction' | 'system' | 'environment' | 'application';

// 条件操作符
export type ConditionOperator = 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'between';

// 条件定义
export interface Condition {
  type: ConditionType;
  operator: ConditionOperator;
  value: any;
  negate?: boolean;
}

// 动作类型
export type ActionType = 'state_change' | 'animation' | 'sound' | 'notification' | 'custom';

// 动作定义
export interface Action {
  type: ActionType;
  params: Record<string, any>;
  delay?: number;
}

// 行为规则
export interface BehaviorRule {
  id: string;
  name: string;
  description: string;
  priority: number;
  conditions: Condition[];
  actions: Action[];
  cooldown: number;
  weight: number;
  enabled: boolean;
  lastTriggered?: number;
}

// 规则引擎类
export class RuleEngine {
  private static instance: RuleEngine;
  private rules: Map<string, BehaviorRule> = new Map();
  private checkInterval: number | null = null;
  private isRunning: boolean = false;

  private constructor() {
    this.initializeDefaultRules();
  }

  // 获取单例实例
  static getInstance(): RuleEngine {
    if (!RuleEngine.instance) {
      RuleEngine.instance = new RuleEngine();
    }
    return RuleEngine.instance;
  }

  // 初始化默认规则
  private initializeDefaultRules(): void {
    // 早安问候
    this.addRule({
      id: 'morning_greeting',
      name: '早安问候',
      description: '早上6-9点触发开心状态',
      priority: 5,
      conditions: [
        { type: 'time', operator: 'between', value: [6, 9] },
      ],
      actions: [
        { type: 'state_change', params: { state: 'happy' } },
      ],
      cooldown: 3600000, // 1小时
      weight: 0.8,
      enabled: true,
    });

    // 午休时间
    this.addRule({
      id: 'noon_rest',
      name: '午休时间',
      description: '中午12-14点触发睡觉状态',
      priority: 4,
      conditions: [
        { type: 'time', operator: 'between', value: [12, 14] },
        { type: 'interaction', operator: 'gt', value: { lastInteraction: 300000 } }, // 5分钟无交互
      ],
      actions: [
        { type: 'state_change', params: { state: 'sleep' } },
      ],
      cooldown: 7200000, // 2小时
      weight: 0.7,
      enabled: true,
    });

    // 晚安问候
    this.addRule({
      id: 'night_greeting',
      name: '晚安问候',
      description: '晚上22-24点触发睡觉状态',
      priority: 6,
      conditions: [
        { type: 'time', operator: 'between', value: [22, 24] },
      ],
      actions: [
        { type: 'state_change', params: { state: 'sleep' } },
      ],
      cooldown: 28800000, // 8小时
      weight: 0.9,
      enabled: true,
    });

    // 高CPU使用率时活跃
    this.addRule({
      id: 'high_cpu_activity',
      name: '高CPU活跃',
      description: 'CPU使用率高时宠物变得活跃',
      priority: 3,
      conditions: [
        { type: 'system', operator: 'gt', value: { cpuUsage: 80 } },
      ],
      actions: [
        { type: 'state_change', params: { state: 'active' } },
      ],
      cooldown: 600000, // 10分钟
      weight: 0.6,
      enabled: true,
    });

    // 低电量时困倦
    this.addRule({
      id: 'low_battery_sleepy',
      name: '低电量困倦',
      description: '电池电量低时宠物变得困倦',
      priority: 7,
      conditions: [
        { type: 'system', operator: 'lt', value: { batteryLevel: 20 } },
        { type: 'system', operator: 'eq', value: { isCharging: false } },
      ],
      actions: [
        { type: 'state_change', params: { state: 'sleep' } },
      ],
      cooldown: 1800000, // 30分钟
      weight: 0.85,
      enabled: true,
    });

    // 长时间无交互
    this.addRule({
      id: 'long_idle',
      name: '长时间无交互',
      description: '长时间无交互时宠物睡觉',
      priority: 2,
      conditions: [
        { type: 'interaction', operator: 'gt', value: { lastInteraction: 120000 } }, // 2分钟
      ],
      actions: [
        { type: 'state_change', params: { state: 'sleep' } },
      ],
      cooldown: 600000, // 10分钟
      weight: 0.5,
      enabled: true,
    });

    // 随机活跃
    this.addRule({
      id: 'random_active',
      name: '随机活跃',
      description: '随机触发活跃状态',
      priority: 1,
      conditions: [
        { type: 'application', operator: 'eq', value: { currentState: 'idle' } },
      ],
      actions: [
        { type: 'state_change', params: { state: 'active' } },
      ],
      cooldown: 300000, // 5分钟
      weight: 0.3,
      enabled: true,
    });
  }

  // 添加规则
  addRule(rule: BehaviorRule): void {
    this.rules.set(rule.id, rule);
  }

  // 移除规则
  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  // 获取规则
  getRule(ruleId: string): BehaviorRule | undefined {
    return this.rules.get(ruleId);
  }

  // 获取所有规则
  getAllRules(): BehaviorRule[] {
    return Array.from(this.rules.values());
  }

  // 启用规则
  enableRule(ruleId: string): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = true;
    }
  }

  // 禁用规则
  disableRule(ruleId: string): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = false;
    }
  }

  // 检查条件
  private checkCondition(condition: Condition): boolean {
    const result = this.evaluateCondition(condition);
    return condition.negate ? !result : result;
  }

  // 评估条件
  private evaluateCondition(condition: Condition): boolean {
    switch (condition.type) {
      case 'time':
        return this.checkTimeCondition(condition);
      case 'interaction':
        return this.checkInteractionCondition(condition);
      case 'system':
        return this.checkSystemCondition(condition);
      case 'environment':
        return this.checkEnvironmentCondition(condition);
      case 'application':
        return this.checkApplicationCondition(condition);
      default:
        return false;
    }
  }

  // 检查时间条件
  private checkTimeCondition(condition: Condition): boolean {
    const now = new Date();
    const hour = now.getHours();

    switch (condition.operator) {
      case 'between':
        const [start, end] = condition.value;
        return hour >= start && hour < end;
      case 'eq':
        return hour === condition.value;
      case 'gt':
        return hour > condition.value;
      case 'lt':
        return hour < condition.value;
      default:
        return false;
    }
  }

  // 检查交互条件
  private checkInteractionCondition(_condition: Condition): boolean {
    // 这里需要从交互系统获取数据
    // 暂时返回true，实际实现时需要连接交互系统
    return true;
  }

  // 检查系统条件
  private checkSystemCondition(_condition: Condition): boolean {
    // 这里需要从系统状态获取数据
    // 暂时返回true，实际实现时需要连接系统状态
    return true;
  }

  // 检查环境条件
  private checkEnvironmentCondition(_condition: Condition): boolean {
    // 这里需要从环境系统获取数据
    // 暂时返回true，实际实现时需要连接环境系统
    return true;
  }

  // 检查应用条件
  private checkApplicationCondition(condition: Condition): boolean {
    if (condition.value.currentState) {
      return stateMachine.isState(condition.value.currentState);
    }
    return true;
  }

  // 执行规则
  private executeRule(rule: BehaviorRule): void {
    // 检查冷却时间
    if (rule.lastTriggered) {
      const elapsed = Date.now() - rule.lastTriggered;
      if (elapsed < rule.cooldown) {
        return;
      }
    }

    // 更新最后触发时间
    rule.lastTriggered = Date.now();

    // 触发行为事件
    eventBus.emit(EventTypes.BEHAVIOR_TRIGGER, {
      ruleId: rule.id,
      ruleName: rule.name,
      actions: rule.actions.map((a) => a.type),
    });

    // 执行动作
    rule.actions.forEach((action) => {
      if (action.delay) {
        setTimeout(() => this.executeAction(action), action.delay);
      } else {
        this.executeAction(action);
      }
    });
  }

  // 执行动作
  private executeAction(action: Action): void {
    switch (action.type) {
      case 'state_change':
        const targetState = action.params.state as PetState;
        stateMachine.forceTransition(targetState, 'rule_engine');
        break;
      case 'animation':
        // 触发动画事件
        eventBus.emit(EventTypes.ANIMATION_START, {
          animationName: action.params.animation,
          duration: action.params.duration || 1000,
        });
        break;
      case 'sound':
        // 播放音效
        console.log('Play sound:', action.params.sound);
        break;
      case 'notification':
        // 显示通知
        console.log('Show notification:', action.params.message);
        break;
      case 'custom':
        // 自定义动作
        if (action.params.handler) {
          action.params.handler();
        }
        break;
    }
  }

  // 检查所有规则
  checkRules(): void {
    const now = Date.now();

    // 获取所有启用的规则，按优先级排序
    const activeRules = Array.from(this.rules.values())
      .filter((rule) => rule.enabled)
      .sort((a, b) => b.priority - a.priority);

    // 检查每个规则
    for (const rule of activeRules) {
      // 检查冷却时间
      if (rule.lastTriggered && (now - rule.lastTriggered) < rule.cooldown) {
        continue;
      }

      // 检查所有条件
      const allConditionsMet = rule.conditions.every((condition) =>
        this.checkCondition(condition)
      );

      if (allConditionsMet) {
        // 根据权重决定是否执行
        if (Math.random() < rule.weight) {
          this.executeRule(rule);
          break; // 只执行第一个匹配的规则
        }
      }
    }
  }

  // 启动规则检查
  start(checkInterval: number = 10000): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.checkInterval = window.setInterval(() => {
      this.checkRules();
    }, checkInterval);

    // 立即检查一次
    this.checkRules();
  }

  // 停止规则检查
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
  }

  // 重置规则引擎
  reset(): void {
    this.stop();
    this.rules.clear();
    this.initializeDefaultRules();
  }
}

// 导出全局规则引擎实例
export const ruleEngine = RuleEngine.getInstance();