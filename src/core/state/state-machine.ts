/**
 * 状态机
 * 管理宠物的状态和转换
 */

import { eventBus } from '../events/event-bus';
import { EventTypes } from '../events/event-types';

// 状态类型
export type PetState =
  | 'idle'      // 待机
  | 'happy'     // 开心
  | 'sleep'     // 睡觉
  | 'walk'      // 走路
  | 'active'    // 活跃
  | 'playing'   // 玩耍
  | 'drag'      // 被拖拽
  | 'error';    // 错误

// 状态配置
export interface StateConfig {
  id: PetState;
  name: string;
  description: string;
  animation: string;
  duration: {
    min: number;
    max: number;
  };
  transitions: Transition[];
  onEnter?: () => void;
  onExit?: () => void;
  onUpdate?: (delta: number) => void;
}

// 转换规则
export interface Transition {
  targetState: PetState;
  trigger: string;
  condition?: () => boolean;
  priority: number;
}

// 状态机类
export class StateMachine {
  private currentState: PetState = 'idle';
  private previousState: PetState | null = null;
  private states: Map<PetState, StateConfig> = new Map();
  private stateStartTime: number = Date.now();
  private stateTimeout: number | null = null;
  private isTransitioning: boolean = false;

  constructor() {
    this.initializeStates();
  }

  // 初始化状态配置
  private initializeStates(): void {
    // 待机状态
    this.addState({
      id: 'idle',
      name: '待机',
      description: '宠物在待机状态',
      animation: 'idle',
      duration: { min: 5000, max: 15000 },
      transitions: [
        { targetState: 'active', trigger: 'random', priority: 1 },
        { targetState: 'walk', trigger: 'random', priority: 2 },
        { targetState: 'sleep', trigger: 'timeout', priority: 3 },
        { targetState: 'happy', trigger: 'click', priority: 4 },
      ],
    });

    // 开心状态
    this.addState({
      id: 'happy',
      name: '开心',
      description: '宠物很开心',
      animation: 'happy',
      duration: { min: 1000, max: 2000 },
      transitions: [
        { targetState: 'idle', trigger: 'timeout', priority: 1 },
      ],
    });

    // 睡觉状态
    this.addState({
      id: 'sleep',
      name: '睡觉',
      description: '宠物在睡觉',
      animation: 'sleep',
      duration: { min: 10000, max: 30000 },
      transitions: [
        { targetState: 'idle', trigger: 'timeout', priority: 1 },
        { targetState: 'idle', trigger: 'click', priority: 2 },
      ],
    });

    // 走路状态
    this.addState({
      id: 'walk',
      name: '走路',
      description: '宠物在走路',
      animation: 'walk',
      duration: { min: 3000, max: 8000 },
      transitions: [
        { targetState: 'idle', trigger: 'timeout', priority: 1 },
        { targetState: 'happy', trigger: 'click', priority: 2 },
      ],
    });

    // 活跃状态
    this.addState({
      id: 'active',
      name: '活跃',
      description: '宠物很活跃',
      animation: 'active',
      duration: { min: 5000, max: 15000 },
      transitions: [
        { targetState: 'idle', trigger: 'timeout', priority: 1 },
        { targetState: 'playing', trigger: 'random', priority: 2 },
        { targetState: 'happy', trigger: 'click', priority: 3 },
      ],
    });

    // 玩耍状态
    this.addState({
      id: 'playing',
      name: '玩耍',
      description: '宠物在玩耍',
      animation: 'playing',
      duration: { min: 5000, max: 15000 },
      transitions: [
        { targetState: 'active', trigger: 'timeout', priority: 1 },
        { targetState: 'happy', trigger: 'click', priority: 2 },
      ],
    });

    // 被拖拽状态
    this.addState({
      id: 'drag',
      name: '被拖拽',
      description: '宠物被拖拽',
      animation: 'drag',
      duration: { min: 0, max: 0 },
      transitions: [
        { targetState: 'idle', trigger: 'drag_end', priority: 1 },
      ],
    });

    // 错误状态
    this.addState({
      id: 'error',
      name: '错误',
      description: '宠物遇到错误',
      animation: 'error',
      duration: { min: 2000, max: 5000 },
      transitions: [
        { targetState: 'idle', trigger: 'timeout', priority: 1 },
      ],
    });
  }

  // 添加状态
  addState(config: StateConfig): void {
    this.states.set(config.id, config);
  }

  // 获取当前状态
  getCurrentState(): PetState {
    return this.currentState;
  }

  // 获取之前状态
  getPreviousState(): PetState | null {
    return this.previousState;
  }

  // 获取状态配置
  getStateConfig(state: PetState): StateConfig | undefined {
    return this.states.get(state);
  }

  // 获取当前状态配置
  getCurrentStateConfig(): StateConfig | undefined {
    return this.states.get(this.currentState);
  }

  // 切换状态
  transition(trigger: string, reason?: string): boolean {
    if (this.isTransitioning) {
      return false;
    }

    const currentConfig = this.states.get(this.currentState);
    if (!currentConfig) {
      return false;
    }

    // 查找匹配的转换规则
    const transition = currentConfig.transitions
      .filter((t) => t.trigger === trigger)
      .sort((a, b) => b.priority - a.priority)[0];

    if (!transition) {
      return false;
    }

    // 检查转换条件
    if (transition.condition && !transition.condition()) {
      return false;
    }

    // 执行状态切换
    this.changeState(transition.targetState, reason || trigger);
    return true;
  }

  // 强制切换状态
  forceTransition(targetState: PetState, reason?: string): void {
    this.changeState(targetState, reason || 'force');
  }

  // 改变状态
  private changeState(newState: PetState, reason: string): void {
    this.isTransitioning = true;

    // 清除之前的超时
    if (this.stateTimeout) {
      clearTimeout(this.stateTimeout);
      this.stateTimeout = null;
    }

    // 触发退出事件
    const oldConfig = this.states.get(this.currentState);
    if (oldConfig?.onExit) {
      oldConfig.onExit();
    }

    eventBus.emit(EventTypes.STATE_EXIT, {
      state: this.currentState,
      reason,
    });

    // 更新状态
    this.previousState = this.currentState;
    this.currentState = newState;
    this.stateStartTime = Date.now();

    // 触发进入事件
    const newConfig = this.states.get(newState);
    if (newConfig?.onEnter) {
      newConfig.onEnter();
    }

    eventBus.emit(EventTypes.STATE_ENTER, {
      state: newState,
      reason,
    });

    // 触发状态变化事件
    eventBus.emit(EventTypes.STATE_CHANGE, {
      from: this.previousState,
      to: newState,
      reason,
    });

    // 设置状态持续时间
    this.setStateDuration();

    this.isTransitioning = false;
  }

  // 设置状态持续时间
  private setStateDuration(): void {
    const config = this.states.get(this.currentState);
    if (!config || config.duration.max === 0) {
      return;
    }

    const duration = this.getRandomDuration(config.duration.min, config.duration.max);

    this.stateTimeout = window.setTimeout(() => {
      this.transition('timeout', 'duration_expired');
    }, duration);
  }

  // 获取随机持续时间
  private getRandomDuration(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  // 获取状态持续时间
  getStateDuration(): number {
    return Date.now() - this.stateStartTime;
  }

  // 检查是否处于某个状态
  isState(state: PetState): boolean {
    return this.currentState === state;
  }

  // 检查是否处于任一状态
  isAnyState(...states: PetState[]): boolean {
    return states.includes(this.currentState);
  }

  // 重置状态机
  reset(): void {
    if (this.stateTimeout) {
      clearTimeout(this.stateTimeout);
      this.stateTimeout = null;
    }
    this.currentState = 'idle';
    this.previousState = null;
    this.stateStartTime = Date.now();
    this.isTransitioning = false;
  }
}

// 导出全局状态机实例
export const stateMachine = new StateMachine();