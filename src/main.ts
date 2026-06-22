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
import { appearanceManager } from './systems/customization';
import { personalityManager } from './systems/customization';
import { themeManager } from './systems/theme';

// 导入工具模块
import { logger } from './utils/logger';
import { storageManager } from './utils/storage';

// 宠物应用类
class PetApp {
  private container: HTMLElement | null = null;
  private petElement: HTMLElement | null = null;

  constructor() {
    this.init();
  }

  // 初始化应用
  private async init(): Promise<void> {
    try {
      logger.info('Initializing PetApp...');

      // 获取DOM元素
      this.container = document.getElementById('pet-container');
      this.petElement = document.getElementById('pet');

      if (!this.container || !this.petElement) {
        throw new Error('Required DOM elements not found');
      }

      // 初始化各个系统
      await this.initializeSystems();

      // 设置事件监听器
      this.setupEventListeners();

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
    // 初始化输入处理器
    inputHandler.init(this.petElement!);

    // 初始化动画控制器
    animator.init(this.petElement!);

    // 初始化外观管理器
    appearanceManager.init(this.petElement!);

    // 初始化主题管理器
    themeManager.init(this.petElement!);

    // 初始化规则引擎
    ruleEngine.start(10000); // 每10秒检查一次规则

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

    eventBus.on(EventTypes.INTERACTION_HOVER, (data) => {
      this.handleHover(data);
    });

    eventBus.on(EventTypes.INTERACTION_HOVER_END, (data) => {
      this.handleHoverEnd(data);
    });

    // 监听行为事件
    eventBus.on(EventTypes.BEHAVIOR_TRIGGER, (data) => {
      this.handleBehaviorTrigger(data);
    });

    // 监听配置变化事件
    eventBus.on(EventTypes.CONFIG_CHANGE, (data) => {
      this.handleConfigChange(data);
    });

    logger.info('Event listeners set up');
  }

  // 处理状态变化
  private handleStateChange(data: any): void {
    const { from, to, reason } = data.payload;

    logger.info(`State changed: ${from} -> ${to} (${reason})`);

    // 更新动画
    if (this.petElement) {
      // 移除旧状态类
      this.petElement.classList.remove(from);

      // 添加新状态类
      this.petElement.classList.add(to);

      // 播放对应动画
      animator.play(to);
    }
  }

  // 处理点击
  private handleClick(data: any): void {
    logger.info('Click detected', data.payload);

    // 切换到开心状态
    stateMachine.transition('click', 'user_click');

    // 创建爱心效果
    this.createHeartEffect();

    // 更新最后交互时间
    this.updateLastInteraction();
  }

  // 处理双击
  private handleDoubleClick(data: any): void {
    logger.info('Double click detected', data.payload);

    // 切换到开心状态
    stateMachine.transition('click', 'user_double_click');

    // 创建特殊效果
    this.createSpecialEffect();

    // 更新最后交互时间
    this.updateLastInteraction();
  }

  // 处理拖拽开始
  private handleDragStart(data: any): void {
    logger.info('Drag started', data.payload);

    // 切换到拖拽状态
    stateMachine.forceTransition('drag', 'user_drag');

    // 更新最后交互时间
    this.updateLastInteraction();
  }

  // 处理拖拽移动
  private handleDragMove(data: any): void {
    const { x, y } = data.payload;

    // 更新容器位置
    if (this.container) {
      this.container.style.position = 'absolute';
      this.container.style.left = `${x}px`;
      this.container.style.top = `${y}px`;
    }

    // 更新窗口位置
    invoke('set_window_position', { x, y });
  }

  // 处理拖拽结束
  private handleDragEnd(data: any): void {
    logger.info('Drag ended', data.payload);

    // 切换回空闲状态
    stateMachine.transition('drag_end', 'drag_finished');

    // 更新最后交互时间
    this.updateLastInteraction();
  }

  // 处理右键点击
  private handleRightClick(data: any): void {
    logger.info('Right click detected', data.payload);

    // 显示上下文菜单
    this.showContextMenu(data.payload.x, data.payload.y);
  }

  // 处理悬停
  private handleHover(data: any): void {
    logger.info('Hover detected', data.payload);

    // 可以在这里添加悬停效果
  }

  // 处理悬停结束
  private handleHoverEnd(data: any): void {
    logger.info('Hover ended', data.payload);

    // 可以在这里移除悬停效果
  }

  // 处理行为触发
  private handleBehaviorTrigger(data: any): void {
    const { ruleId, ruleName } = data.payload;

    logger.info(`Behavior triggered: ${ruleName} (${ruleId})`);

    // 可以在这里添加行为触发的视觉反馈
  }

  // 处理配置变化
  private handleConfigChange(data: any): void {
    const { key, value } = data.payload;

    logger.info(`Config changed: ${key}`, value);

    // 保存配置
    storageManager.save(key, value);
  }

  // 创建爱心效果
  private createHeartEffect(): void {
    if (!this.petElement) return;

    const heart = document.createElement('div');
    heart.className = 'heart';

    const rect = this.petElement.getBoundingClientRect();
    heart.style.left = `${rect.left + rect.width / 2 - 10}px`;
    heart.style.top = `${rect.top - 10}px`;

    document.body.appendChild(heart);

    setTimeout(() => {
      heart.remove();
    }, 1000);
  }

  // 创建特殊效果
  private createSpecialEffect(): void {
    if (!this.petElement) return;

    // 创建多个爱心效果
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.createHeartEffect();
      }, i * 100);
    }
  }

  // 显示上下文菜单
  private showContextMenu(x: number, y: number): void {
    // 移除现有菜单
    const existingMenu = document.querySelector('.context-menu');
    if (existingMenu) {
      existingMenu.remove();
    }

    // 创建菜单
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

    // 菜单项
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

    // 点击其他地方关闭菜单
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

    // TODO: 实现设置界面
    alert('设置功能开发中...');
  }

  // 退出应用
  private quit(): void {
    logger.info('Quitting application...');

    // 保存配置
    this.saveConfiguration();

    // 隐藏窗口
    invoke('toggle_window_visibility');
  }

  // 保存配置
  private async saveConfiguration(): Promise<void> {
    try {
      // 保存外观配置
      await storageManager.save('appearance', appearanceManager.getConfig());

      // 保存个性配置
      await storageManager.save('personality', personalityManager.getConfig());

      // 保存当前主题
      await storageManager.save('currentTheme', themeManager.getCurrentTheme().id);

      logger.info('Configuration saved');
    } catch (error) {
      logger.error('Failed to save configuration', error);
    }
  }

  // 更新最后交互时间
  private updateLastInteraction(): void {
    // 这里可以更新规则引擎中的交互时间
    // 暂时只是记录日志
    logger.debug('Last interaction updated');
  }

  // 处理错误
  private handleError(error: any): void {
    logger.error('Application error', error);

    // 切换到错误状态
    stateMachine.forceTransition('error', 'error_occurred');

    // 显示错误通知
    this.showErrorNotification(error.message || '发生未知错误');
  }

  // 显示错误通知
  private showErrorNotification(message: string): void {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff6b6b;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 10000;
      font-size: 14px;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  new PetApp();
});