/**
 * 事件类型定义
 * 定义系统中所有事件的类型
 */

// 事件类型枚举
export const EventTypes = {
  // 状态事件
  STATE_CHANGE: 'state:change',
  STATE_ENTER: 'state:enter',
  STATE_EXIT: 'state:exit',

  // 交互事件
  INTERACTION_CLICK: 'interaction:click',
  INTERACTION_DOUBLE_CLICK: 'interaction:double_click',
  INTERACTION_LONG_PRESS: 'interaction:long_press',
  INTERACTION_DRAG_START: 'interaction:drag_start',
  INTERACTION_DRAG_MOVE: 'interaction:drag_move',
  INTERACTION_DRAG_END: 'interaction:drag_end',
  INTERACTION_HOVER: 'interaction:hover',
  INTERACTION_HOVER_END: 'interaction:hover_end',
  INTERACTION_RIGHT_CLICK: 'interaction:right_click',
  INTERACTION_SCROLL: 'interaction:scroll',

  // 行为事件
  BEHAVIOR_TRIGGER: 'behavior:trigger',
  BEHAVIOR_ACTION: 'behavior:action',

  // 动画事件
  ANIMATION_START: 'animation:start',
  ANIMATION_END: 'animation:end',
  ANIMATION_LOOP: 'animation:loop',

  // 主题事件
  THEME_CHANGE: 'theme:change',
  THEME_PREVIEW: 'theme:preview',

  // 配置事件
  CONFIG_CHANGE: 'config:change',
  CONFIG_SAVE: 'config:save',
  CONFIG_LOAD: 'config:load',

  // 系统事件
  SYSTEM_READY: 'system:ready',
  SYSTEM_ERROR: 'system:error',
  SYSTEM_RESIZE: 'system:resize',
} as const;

// 事件类型
export type EventType = typeof EventTypes[keyof typeof EventTypes];

// 事件数据接口
export interface EventData {
  type: EventType;
  timestamp: number;
  payload?: any;
}

// 状态事件数据
export interface StateChangeData extends EventData {
  type: typeof EventTypes.STATE_CHANGE;
  payload: {
    from: string;
    to: string;
    reason?: string;
  };
}

// 交互事件数据
export interface InteractionData extends EventData {
  type: typeof EventTypes.INTERACTION_CLICK | typeof EventTypes.INTERACTION_DOUBLE_CLICK;
  payload: {
    x: number;
    y: number;
    button: number;
    area?: string;
  };
}

// 行为事件数据
export interface BehaviorData extends EventData {
  type: typeof EventTypes.BEHAVIOR_TRIGGER;
  payload: {
    ruleId: string;
    ruleName: string;
    actions: string[];
  };
}

// 动画事件数据
export interface AnimationData extends EventData {
  type: typeof EventTypes.ANIMATION_START | typeof EventTypes.ANIMATION_END;
  payload: {
    animationName: string;
    duration: number;
  };
}

// 主题事件数据
export interface ThemeData extends EventData {
  type: typeof EventTypes.THEME_CHANGE;
  payload: {
    themeId: string;
    themeName: string;
  };
}

// 配置事件数据
export interface ConfigData extends EventData {
  type: typeof EventTypes.CONFIG_CHANGE;
  payload: {
    key: string;
    value: any;
    oldValue?: any;
  };
}