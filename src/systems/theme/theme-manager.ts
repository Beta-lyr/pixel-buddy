/**
 * 主题管理器
 * 管理宠物的视觉主题
 */

import { eventBus } from '../../core/events/event-bus';
import { EventTypes } from '../../core/events/event-types';

// 主题颜色
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

// 主题动画
export interface ThemeAnimation {
  style: 'smooth' | 'bouncy' | 'elastic' | 'none';
  speed: number;
  effects: string[];
}

// 主题粒子
export interface ThemeParticles {
  type: 'none' | 'sparkle' | 'confetti' | 'hearts' | 'stars';
  density: number;
  color: string;
}

// 主题视觉配置
export interface ThemeVisual {
  colors: ThemeColors;
  animation: ThemeAnimation;
  particles: ThemeParticles;
}

// 主题精灵图配置
export interface ThemeSprites {
  idle: string;
  walk: string;
  sleep: string;
  happy: string;
  active: string;
  playing: string;
  drag: string;
  error: string;
}

// 主题音效配置
export interface ThemeSounds {
  click: string;
  happy: string;
  sleep: string;
  walk: string;
  active: string;
  playing: string;
}

// 主题配置
export interface Theme {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  visual: ThemeVisual;
  sprites: ThemeSprites;
  sounds?: ThemeSounds;
}

// 默认主题
const DEFAULT_THEME: Theme = {
  id: 'default',
  name: '默认主题',
  description: 'PixelBuddy 默认主题',
  version: '1.0.0',
  author: 'PixelBuddy Team',
  visual: {
    colors: {
      primary: '#FF6B6B',
      secondary: '#4ECDC4',
      accent: '#FFE66D',
      background: 'transparent',
      text: '#333333',
    },
    animation: {
      style: 'smooth',
      speed: 1.0,
      effects: ['shadow', 'outline'],
    },
    particles: {
      type: 'none',
      density: 0.5,
      color: '#FFE66D',
    },
  },
  sprites: {
    idle: '/sprites/idle.png',
    walk: '/sprites/walk.png',
    sleep: '/sprites/sleep.png',
    happy: '/sprites/happy.png',
    active: '/sprites/active.png',
    playing: '/sprites/playing.png',
    drag: '/sprites/drag.png',
    error: '/sprites/error.png',
  },
};

// 主题管理器类
export class ThemeManager {
  private static instance: ThemeManager;
  private themes: Map<string, Theme> = new Map();
  private currentTheme: Theme;
  private element: HTMLElement | null = null;

  private constructor() {
    this.currentTheme = DEFAULT_THEME;
    this.addTheme(DEFAULT_THEME);
  }

  // 获取单例实例
  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  // 初始化
  init(element: HTMLElement): void {
    this.element = element;
    this.applyTheme(this.currentTheme);
  }

  // 添加主题
  addTheme(theme: Theme): void {
    this.themes.set(theme.id, theme);
  }

  // 获取主题
  getTheme(themeId: string): Theme | undefined {
    return this.themes.get(themeId);
  }

  // 获取所有主题
  getAllThemes(): Theme[] {
    return Array.from(this.themes.values());
  }

  // 获取当前主题
  getCurrentTheme(): Theme {
    return this.currentTheme;
  }

  // 切换主题
  async switchTheme(themeId: string): Promise<boolean> {
    const theme = this.themes.get(themeId);
    if (!theme) {
      console.warn(`Theme not found: ${themeId}`);
      return false;
    }

    // 清理旧主题
    this.cleanupOldTheme();

    // 预加载主题资源
    await this.preloadTheme(theme);

    // 应用主题
    this.currentTheme = theme;
    this.applyTheme(theme);

    // 触发主题切换事件
    eventBus.emit(EventTypes.THEME_CHANGE, {
      themeId: theme.id,
      themeName: theme.name,
    });

    return true;
  }

  // 预览主题
  async previewTheme(themeId: string): Promise<boolean> {
    const theme = this.themes.get(themeId);
    if (!theme) {
      return false;
    }

    // 预加载主题资源
    await this.preloadTheme(theme);

    // 触发主题预览事件
    eventBus.emit(EventTypes.THEME_PREVIEW, {
      themeId: theme.id,
      themeName: theme.name,
    });

    return true;
  }

  // 预加载主题资源
  private async preloadTheme(theme: Theme): Promise<void> {
    // 预加载精灵图
    const spritePromises = Object.values(theme.sprites).map((sprite) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve(); // 即使加载失败也继续
        img.src = sprite;
      });
    });

    await Promise.all(spritePromises);
  }

  // 应用主题到DOM
  private applyTheme(theme: Theme): void {
    if (!this.element) return;

    const { colors, animation, particles } = theme.visual;

    // 应用颜色
    this.element.style.setProperty('--theme-primary', colors.primary);
    this.element.style.setProperty('--theme-secondary', colors.secondary);
    this.element.style.setProperty('--theme-accent', colors.accent);
    this.element.style.setProperty('--theme-background', colors.background);
    this.element.style.setProperty('--theme-text', colors.text);

    // 应用动画样式
    this.element.style.setProperty('--theme-animation-style', animation.style);
    this.element.style.setProperty('--theme-animation-speed', `${animation.speed}`);

    // 应用粒子效果
    this.element.style.setProperty('--theme-particles-type', particles.type);
    this.element.style.setProperty('--theme-particles-density', `${particles.density}`);
    this.element.style.setProperty('--theme-particles-color', particles.color);

    // 更新精灵图
    this.updateSprites(theme.sprites);
  }

  // 更新精灵图
  private updateSprites(sprites: ThemeSprites): void {
    // 这里需要与动画系统集成
    // 暂时只是记录日志
    console.log('Updating sprites:', sprites);
  }

  // 清理旧主题资源
  private cleanupOldTheme(): void {
    // 清理旧的CSS变量
    if (this.element) {
      this.element.style.removeProperty('--theme-primary');
      this.element.style.removeProperty('--theme-secondary');
      this.element.style.removeProperty('--theme-accent');
      this.element.style.removeProperty('--theme-background');
      this.element.style.removeProperty('--theme-text');
    }
  }

  // 重置为默认主题
  reset(): void {
    this.currentTheme = DEFAULT_THEME;
    this.applyTheme(DEFAULT_THEME);
  }

  // 导出主题
  exportTheme(themeId: string): string | null {
    const theme = this.themes.get(themeId);
    if (!theme) {
      return null;
    }
    return JSON.stringify(theme, null, 2);
  }

  // 导入主题
  importTheme(themeJson: string): boolean {
    try {
      const theme = JSON.parse(themeJson) as Theme;
      this.addTheme(theme);
      return true;
    } catch (error) {
      console.error('Failed to import theme:', error);
      return false;
    }
  }
}

// 导出全局主题管理器实例
export const themeManager = ThemeManager.getInstance();