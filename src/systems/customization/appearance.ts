/**
 * 外观配置系统
 * 管理宠物的外观设置
 */

import { eventBus } from '../../core/events/event-bus';
import { EventTypes } from '../../core/events/event-types';

// 颜色配置
export interface ColorConfig {
  primary: string;
  secondary: string;
  accent: string;
  outline: string;
}

// 外观动画配置
export interface AppearanceAnimationConfig {
  speed: number;
  smoothness: number;
  effects: string[];
}

// 显示配置
export interface DisplayConfig {
  showShadow: boolean;
  showOutline: boolean;
  showParticles: boolean;
}

// 外观配置
export interface AppearanceConfig {
  size: number;
  opacity: number;
  colors: ColorConfig;
  animation: AppearanceAnimationConfig;
  display: DisplayConfig;
}

// 默认外观配置
const DEFAULT_APPEARANCE: AppearanceConfig = {
  size: 1.5,
  opacity: 0.9,
  colors: {
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
    accent: '#FFE66D',
    outline: '#2C3E50',
  },
  animation: {
    speed: 1.0,
    smoothness: 0.8,
    effects: ['shadow', 'outline'],
  },
  display: {
    showShadow: true,
    showOutline: true,
    showParticles: false,
  },
};

// 外观管理器类
export class AppearanceManager {
  private static instance: AppearanceManager;
  private config: AppearanceConfig;
  private element: HTMLElement | null = null;

  private constructor() {
    this.config = { ...DEFAULT_APPEARANCE };
  }

  // 获取单例实例
  static getInstance(): AppearanceManager {
    if (!AppearanceManager.instance) {
      AppearanceManager.instance = new AppearanceManager();
    }
    return AppearanceManager.instance;
  }

  // 初始化
  init(element: HTMLElement): void {
    this.element = element;
    this.applyConfig();
  }

  // 获取配置
  getConfig(): AppearanceConfig {
    return { ...this.config };
  }

  // 设置配置
  setConfig(config: Partial<AppearanceConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };

    // 触发配置变化事件
    eventBus.emit(EventTypes.CONFIG_CHANGE, {
      key: 'appearance',
      value: this.config,
    });

    // 应用配置
    this.applyConfig();
  }

  // 设置大小
  setSize(size: number): void {
    this.setConfig({ size: Math.max(0.5, Math.min(3, size)) });
  }

  // 设置透明度
  setOpacity(opacity: number): void {
    this.setConfig({ opacity: Math.max(0, Math.min(1, opacity)) });
  }

  // 设置颜色
  setColors(colors: Partial<ColorConfig>): void {
    this.setConfig({
      colors: {
        ...this.config.colors,
        ...colors,
      },
    });
  }

  // 设置动画速度
  setAnimationSpeed(speed: number): void {
    this.setConfig({
      animation: {
        ...this.config.animation,
        speed: Math.max(0.1, Math.min(3, speed)),
      },
    });
  }

  // 设置动画平滑度
  setAnimationSmoothness(smoothness: number): void {
    this.setConfig({
      animation: {
        ...this.config.animation,
        smoothness: Math.max(0, Math.min(1, smoothness)),
      },
    });
  }

  // 添加动画效果
  addAnimationEffect(effect: string): void {
    if (!this.config.animation.effects.includes(effect)) {
      this.setConfig({
        animation: {
          ...this.config.animation,
          effects: [...this.config.animation.effects, effect],
        },
      });
    }
  }

  // 移除动画效果
  removeAnimationEffect(effect: string): void {
    this.setConfig({
      animation: {
        ...this.config.animation,
        effects: this.config.animation.effects.filter((e) => e !== effect),
      },
    });
  }

  // 设置显示配置
  setDisplayConfig(display: Partial<DisplayConfig>): void {
    this.setConfig({
      display: {
        ...this.config.display,
        ...display,
      },
    });
  }

  // 应用配置到DOM
  private applyConfig(): void {
    if (!this.element) return;

    const { size, opacity, colors, animation, display } = this.config;

    // 应用大小
    this.element.style.transform = `scale(${size})`;

    // 应用透明度
    this.element.style.opacity = `${opacity}`;

    // 应用颜色
    this.element.style.backgroundColor = colors.primary;
    this.element.style.borderColor = colors.outline;

    // 应用动画速度
    this.element.style.animationDuration = `${1 / animation.speed}s`;

    // 应用阴影效果
    if (display.showShadow) {
      this.element.style.boxShadow = `0 4px 8px rgba(0, 0, 0, 0.2)`;
    } else {
      this.element.style.boxShadow = 'none';
    }

    // 应用轮廓效果
    if (display.showOutline) {
      this.element.style.border = `2px solid ${colors.outline}`;
    } else {
      this.element.style.border = 'none';
    }
  }

  // 重置为默认配置
  reset(): void {
    this.config = { ...DEFAULT_APPEARANCE };
    this.applyConfig();
  }

  // 导出配置
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  // 导入配置
  importConfig(configJson: string): boolean {
    try {
      const config = JSON.parse(configJson);
      this.setConfig(config);
      return true;
    } catch (error) {
      console.error('Failed to import appearance config:', error);
      return false;
    }
  }
}

// 导出全局外观管理器实例
export const appearanceManager = AppearanceManager.getInstance();