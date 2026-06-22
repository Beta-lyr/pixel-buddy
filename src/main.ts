/**
 * 主入口文件
 * 集成所有系统模块
 */

import { invoke } from "@tauri-apps/api/core";

// 导入核心模块
import { eventBus, EventTypes } from './core/events';
import { stateMachine } from './core/state';
import { ruleEngine } from './core/engine';

// 导入系统模块
import { inputHandler } from './systems/interaction';
import { animator } from './systems/animation';
import { spriteManager } from './systems/animation';
import { appearanceManager } from './systems/customization';
import { personalityManager } from './systems/customization';
import { themeManager } from './systems/theme';

// 导入UI模块
import { settingsDialog } from './ui/settings';
import { petUI } from './ui/components';

// 导入工具模块
import { logger } from './utils/logger';
import { storageManager } from './utils/storage';

// 宠物应用类
class PetApp {
  private container: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private currentFrame: number = 0;
  private _frameInterval: number | null = null;

  constructor() {
    this.init();
  }

  // 初始化应用
  private async init(): Promise<void> {
    try {
      logger.info('Initializing PetApp...');

      // 获取DOM元素
      this.container = document.getElementById('pet-container');
      this.canvas = document.getElementById('pet-canvas') as HTMLCanvasElement;

      if (!this.container || !this.canvas) {
        throw new Error('Required DOM elements not found');
      }

      // 初始化各个系统
      await this.initializeSystems();

      // 设置事件监听器
      this.setupEventListeners();

      // 启动动画循环
      this.startAnimationLoop();

      // 触发系统就绪事件
      eventBus.emit(EventTypes.SYSTEM_READY);

      logger.info('PetApp initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize PetApp', error);
      this.handleError(error);
    }
  }

  // 初始化各个系统
  private async initializeSystems(): Promise<void> {
    // 初始化精灵图管理器
    spriteManager.init(this.canvas!);

    // 初始化输入处理器
    inputHandler.init(this.canvas!);

    // 初始化动画控制器
    animator.init(this.canvas!);

    // 初始化外观管理器
    appearanceManager.init(this.canvas!);

    // 初始化主题管理器
    themeManager.init(this.canvas!);

    // 初始化宠物UI
    petUI.init(this.container!, this.canvas!);

    // 初始化规则引擎
    ruleEngine.start(10000);

    // 加载配置
    await this.loadConfiguration();

    logger.info('All systems initialized');
  }

  // 加载配置
  private async loadConfiguration(): Promise<void> {
    try {
      // 加载外观配置
      const appearanceConfig = await storageManager.load('appearance');
      if (appearanceConfig) {
        appearanceManager.setConfig(appearanceConfig);
      }

      // 加载个性配置
      const personalityConfig = await storageManager.load('personality');
      if (personalityConfig) {
        personalityManager.setConfig(personalityConfig);
      }

      // 加载主题配置
      const themeId = await storageManager.load<string>('currentTheme');
      if (themeId) {
        await themeManager.switchTheme(themeId);
      }

      // 加载自定义精灵图
      const customSprites = await storageManager.load<Record<string, string>>('customSprites');
      if (customSprites) {
        await spriteManager.loadSprites(customSprites);
      }

      logger.info('Configuration loaded');
    } catch (error) {
      logger.warn('Failed to load configuration, using defaults', error);
    }
  }

  // 设置事件监听器
  private setupEventListeners(): void {
    // 监听状态变化事件
    eventBus.on(EventTypes.STATE_CHANGE, (data) => {
      this.handleStateChange(data);
    });

    // 监听交互事件
    eventBus.on(EventTypes.INTERACTION_CLICK, (data) => {
      this.handleClick(data);
    });

    eventBus.on(EventTypes.INTERACTION_DOUBLE_CLICK, (data) => {
      this.handleDoubleClick(data);
    });

    eventBus.on(EventTypes.INTERACTION_DRAG_START, (data) => {
      this.handleDragStart(data);
    });

    eventBus.on(EventTypes.INTERACTION_DRAG_MOVE, (data) => {
      this.handleDragMove(data);
    });

    eventBus.on(EventTypes.INTERACTION_DRAG_END, (data) => {
      this.handleDragEnd(data);
    });

    eventBus.on(EventTypes.INTERACTION_RIGHT_CLICK, (data) => {
      this.handleRightClick(data);
    });

    logger.info('Event listeners set up');
  }

  // 启动动画循环
  private startAnimationLoop(): void {
    const fps = 8; // 8帧每秒
    this._frameInterval = window.setInterval(() => {
      this.updateAnimation();
    }, 1000 / fps);
  }

  // 停止动画循环
  private stopAnimationLoop(): void {
    if (this._frameInterval) {
      clearInterval(this._frameInterval);
      this._frameInterval = null;
    }
  }

  // 更新动画
  private updateAnimation(): void {
    const currentState = stateMachine.getCurrentState();
    const sprite = spriteManager.getSprite(currentState);

    if (sprite) {
      this.currentFrame = (this.currentFrame + 1) % sprite.config.frameCount;
      spriteManager.drawFrame(currentState, this.currentFrame);
    }
  }

  // 处理状态变化
  private handleStateChange(data: any): void {
    const { from, to, reason } = data.payload;
    logger.info(`State changed: ${from} -> ${to} (${reason})`);

    // 重置帧计数
    this.currentFrame = 0;

    // 立即绘制新状态的第一帧
    spriteManager.drawFrame(to, 0);
  }

  // 处理点击
  private handleClick(data: any): void {
    logger.info('Click detected', data.payload);
    stateMachine.transition('click', 'user_click');
    if (this.canvas) {
      petUI.createPulseEffect(this.canvas);
    }
  }

  // 处理双击
  private handleDoubleClick(data: any): void {
    logger.info('Double click detected', data.payload);
    stateMachine.transition('click', 'user_double_click');
    if (this.canvas) {
      petUI.createBounceEffect(this.canvas);
    }
  }

  // 处理拖拽开始
  private handleDragStart(data: any): void {
    logger.info('Drag started', data.payload);
    stateMachine.forceTransition('drag', 'user_drag');
  }

  // 处理拖拽移动
  private handleDragMove(data: any): void {
    const { x, y } = data.payload;
    if (this.container) {
      this.container.style.position = 'absolute';
      this.container.style.left = `${x}px`;
      this.container.style.top = `${y}px`;
    }
    invoke('set_window_position', { x, y });
  }

  // 处理拖拽结束
  private handleDragEnd(data: any): void {
    logger.info('Drag ended', data.payload);
    stateMachine.transition('drag_end', 'drag_finished');
  }

  // 处理右键点击
  private handleRightClick(data: any): void {
    logger.info('Right click detected', data.payload);
    this.showContextMenu(data.payload.x, data.payload.y);
  }

  // 显示上下文菜单
  private showContextMenu(x: number, y: number): void {
    const existingMenu = document.querySelector('.context-menu');
    if (existingMenu) {
      existingMenu.remove();
    }

    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 4px 0;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      z-index: 1000;
    `;

    const items = [
      { text: '摸摸头', action: () => this.handleClick({ payload: { x, y } }) },
      { text: '设置', action: () => this.openSettings() },
      { text: '退出', action: () => this.quit() },
    ];

    items.forEach((item) => {
      const menuItem = document.createElement('div');
      menuItem.textContent = item.text;
      menuItem.style.cssText = `
        padding: 8px 16px;
        cursor: pointer;
        font-size: 14px;
      `;
      menuItem.addEventListener('click', () => {
        item.action();
        menu.remove();
      });
      menuItem.addEventListener('mouseenter', () => {
        menuItem.style.background = '#f0f0f0';
      });
      menuItem.addEventListener('mouseleave', () => {
        menuItem.style.background = 'transparent';
      });
      menu.appendChild(menuItem);
    });

    document.body.appendChild(menu);

    const closeMenu = (e: MouseEvent) => {
      if (!menu.contains(e.target as Node)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    };
    setTimeout(() => {
      document.addEventListener('click', closeMenu);
    }, 0);
  }

  // 打开设置
  private openSettings(): void {
    logger.info('Opening settings...');
    settingsDialog.open();
  }

  // 退出应用
  private quit(): void {
    logger.info('Quitting application...');
    this.stopAnimationLoop();
    this.saveConfiguration();
    invoke('toggle_window_visibility');
  }

  // 保存配置
  private async saveConfiguration(): Promise<void> {
    try {
      await storageManager.save('appearance', appearanceManager.getConfig());
      await storageManager.save('personality', personalityManager.getConfig());
      await storageManager.save('currentTheme', themeManager.getCurrentTheme().id);
      logger.info('Configuration saved');
    } catch (error) {
      logger.error('Failed to save configuration', error);
    }
  }

  // 处理错误
  private handleError(error: any): void {
    logger.error('Application error', error);
    stateMachine.forceTransition('error', 'error_occurred');
  }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  new PetApp();
});