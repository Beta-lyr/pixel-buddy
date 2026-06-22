/**
 * 输入处理器
 * 处理所有用户输入事件
 */

import { eventBus } from '../../core/events/event-bus';
import { EventTypes } from '../../core/events/event-types';

// 交互区域
export interface InteractionArea {
  id: string;
  name: string;
  bounds: { x: number; y: number; width: number; height: number };
  sensitivity: number;
}

// 手势类型
export type GestureType = 'circle' | 'swipe' | 'shake' | 'pat';

// 手势数据
export interface Gesture {
  type: GestureType;
  direction?: 'up' | 'down' | 'left' | 'right';
  speed: number;
  accuracy: number;
}

// 输入处理器类
export class InputHandler {
  private static instance: InputHandler;
  private element: HTMLElement | null = null;
  private isDragging: boolean = false;
  private dragOffset: { x: number; y: number } = { x: 0, y: 0 };
  private lastClickTime: number = 0;
  private lastClickX: number = 0;
  private lastClickY: number = 0;
  private longPressTimer: number | null = null;
  private longPressDuration: number = 500;
  private doubleClickDelay: number = 300;
  private interactionAreas: Map<string, InteractionArea> = new Map();
  private mousePosition: { x: number; y: number } = { x: 0, y: 0 };
  private hoverTimer: number | null = null;
  private hoverDelay: number = 2000;

  private constructor() {}

  // 获取单例实例
  static getInstance(): InputHandler {
    if (!InputHandler.instance) {
      InputHandler.instance = new InputHandler();
    }
    return InputHandler.instance;
  }

  // 初始化
  init(element: HTMLElement): void {
    this.element = element;
    this.setupEventListeners();
    this.setupDefaultAreas();
  }

  // 设置事件监听器
  private setupEventListeners(): void {
    if (!this.element) return;

    // 鼠标按下
    this.element.addEventListener('mousedown', this.handleMouseDown.bind(this));

    // 鼠标移动
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));

    // 鼠标释放
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));

    // 点击
    this.element.addEventListener('click', this.handleClick.bind(this));

    // 双击
    this.element.addEventListener('dblclick', this.handleDoubleClick.bind(this));

    // 右键菜单
    this.element.addEventListener('contextmenu', this.handleContextMenu.bind(this));

    // 鼠标进入
    this.element.addEventListener('mouseenter', this.handleMouseEnter.bind(this));

    // 鼠标离开
    this.element.addEventListener('mouseleave', this.handleMouseLeave.bind(this));

    // 滚轮
    this.element.addEventListener('wheel', this.handleWheel.bind(this));

    // 触摸事件（支持移动端）
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this));
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }

  // 设置默认交互区域
  private setupDefaultAreas(): void {
    // 头部区域
    this.addInteractionArea({
      id: 'head',
      name: '头部',
      bounds: { x: 0, y: 0, width: 100, height: 40 },
      sensitivity: 1.0,
    });

    // 身体区域
    this.addInteractionArea({
      id: 'body',
      name: '身体',
      bounds: { x: 0, y: 40, width: 100, height: 40 },
      sensitivity: 0.8,
    });

    // 尾巴区域
    this.addInteractionArea({
      id: 'tail',
      name: '尾巴',
      bounds: { x: 0, y: 80, width: 100, height: 20 },
      sensitivity: 0.6,
    });
  }

  // 添加交互区域
  addInteractionArea(area: InteractionArea): void {
    this.interactionAreas.set(area.id, area);
  }

  // 移除交互区域
  removeInteractionArea(areaId: string): void {
    this.interactionAreas.delete(areaId);
  }

  // 获取交互区域
  getInteractionArea(areaId: string): InteractionArea | undefined {
    return this.interactionAreas.get(areaId);
  }

  // 获取点击区域
  private getClickArea(x: number, y: number): string | undefined {
    for (const [id, area] of this.interactionAreas) {
      const { bounds } = area;
      if (
        x >= bounds.x &&
        x <= bounds.x + bounds.width &&
        y >= bounds.y &&
        y <= bounds.y + bounds.height
      ) {
        return id;
      }
    }
    return undefined;
  }

  // 处理鼠标按下
  private handleMouseDown(e: MouseEvent): void {
    if (e.button === 0) {
      // 左键按下
      this.startDrag(e.clientX, e.clientY);

      // 开始长按检测
      this.longPressTimer = window.setTimeout(() => {
        this.handleLongPress(e.clientX, e.clientY);
      }, this.longPressDuration);
    }
  }

  // 处理鼠标移动
  private handleMouseMove(e: MouseEvent): void {
    this.mousePosition = { x: e.clientX, y: e.clientY };

    if (this.isDragging) {
      this.handleDrag(e.clientX, e.clientY);
    }
  }

  // 处理鼠标释放
  private handleMouseUp(e: MouseEvent): void {
    if (e.button === 0) {
      // 清除长按检测
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }

      if (this.isDragging) {
        this.endDrag();
      }
    }
  }

  // 处理点击
  private handleClick(e: MouseEvent): void {
    const now = Date.now();
    const area = this.getClickArea(e.offsetX, e.offsetY);

    // 检查是否是双击
    const isDoubleClick =
      now - this.lastClickTime < this.doubleClickDelay &&
      Math.abs(e.clientX - this.lastClickX) < 5 &&
      Math.abs(e.clientY - this.lastClickY) < 5;

    if (!isDoubleClick) {
      // 单击事件
      eventBus.emit(EventTypes.INTERACTION_CLICK, {
        x: e.clientX,
        y: e.clientY,
        button: e.button,
        area,
      });
    }

    this.lastClickTime = now;
    this.lastClickX = e.clientX;
    this.lastClickY = e.clientY;
  }

  // 处理双击
  private handleDoubleClick(e: MouseEvent): void {
    const area = this.getClickArea(e.offsetX, e.offsetY);

    eventBus.emit(EventTypes.INTERACTION_DOUBLE_CLICK, {
      x: e.clientX,
      y: e.clientY,
      button: e.button,
      area,
    });
  }

  // 处理长按
  private handleLongPress(x: number, y: number): void {
    const area = this.getClickArea(x, y);

    eventBus.emit(EventTypes.INTERACTION_LONG_PRESS, {
      x,
      y,
      area,
    });
  }

  // 处理右键菜单
  private handleContextMenu(e: MouseEvent): void {
    e.preventDefault();
    const area = this.getClickArea(e.offsetX, e.offsetY);

    eventBus.emit(EventTypes.INTERACTION_RIGHT_CLICK, {
      x: e.clientX,
      y: e.clientY,
      area,
    });
  }

  // 处理鼠标进入
  private handleMouseEnter(_e: MouseEvent): void {
    // 开始悬停检测
    this.hoverTimer = window.setTimeout(() => {
      eventBus.emit(EventTypes.INTERACTION_HOVER, {
        x: this.mousePosition.x,
        y: this.mousePosition.y,
      });
    }, this.hoverDelay);
  }

  // 处理鼠标离开
  private handleMouseLeave(_e: MouseEvent): void {
    // 清除悬停检测
    if (this.hoverTimer) {
      clearTimeout(this.hoverTimer);
      this.hoverTimer = null;
    }

    eventBus.emit(EventTypes.INTERACTION_HOVER_END, {
      x: this.mousePosition.x,
      y: this.mousePosition.y,
    });
  }

  // 处理滚轮
  private handleWheel(e: WheelEvent): void {
    e.preventDefault();
    const area = this.getClickArea(e.offsetX, e.offsetY);

    eventBus.emit(EventTypes.INTERACTION_SCROLL, {
      x: e.clientX,
      y: e.clientY,
      deltaX: e.deltaX,
      deltaY: e.deltaY,
      area,
    });
  }

  // 处理触摸开始
  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();
    const touch = e.touches[0];
    this.startDrag(touch.clientX, touch.clientY);

    // 开始长按检测
    this.longPressTimer = window.setTimeout(() => {
      this.handleLongPress(touch.clientX, touch.clientY);
    }, this.longPressDuration);
  }

  // 处理触摸移动
  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();
    if (this.isDragging) {
      const touch = e.touches[0];
      this.handleDrag(touch.clientX, touch.clientY);
    }
  }

  // 处理触摸结束
  private handleTouchEnd(e: TouchEvent): void {
    e.preventDefault();

    // 清除长按检测
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    if (this.isDragging) {
      this.endDrag();
    }
  }

  // 开始拖拽
  private startDrag(x: number, y: number): void {
    this.isDragging = true;
    this.dragOffset = { x, y };

    eventBus.emit(EventTypes.INTERACTION_DRAG_START, {
      x,
      y,
    });
  }

  // 处理拖拽
  private handleDrag(x: number, y: number): void {
    eventBus.emit(EventTypes.INTERACTION_DRAG_MOVE, {
      x,
      y,
      deltaX: x - this.dragOffset.x,
      deltaY: y - this.dragOffset.y,
    });
  }

  // 结束拖拽
  private endDrag(): void {
    this.isDragging = false;

    eventBus.emit(EventTypes.INTERACTION_DRAG_END, {
      x: this.mousePosition.x,
      y: this.mousePosition.y,
    });
  }

  // 获取鼠标位置
  getMousePosition(): { x: number; y: number } {
    return { ...this.mousePosition };
  }

  // 检查是否正在拖拽
  isDraggingActive(): boolean {
    return this.isDragging;
  }

  // 销毁
  destroy(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
    }
    if (this.hoverTimer) {
      clearTimeout(this.hoverTimer);
    }
  }
}

// 导出全局输入处理器实例
export const inputHandler = InputHandler.getInstance();