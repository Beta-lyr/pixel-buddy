/**
 * 个性配置系统
 * 管理宠物的个性设置
 */

import { eventBus } from '../../core/events/event-bus';
import { EventTypes } from '../../core/events/event-types';

// 行为倾向
export interface Tendencies {
  activity: number;
  friendliness: number;
  curiosity: number;
  sleepiness: number;
}

// 偏好设置
export interface Preferences {
  favoriteFood?: string;
  favoriteToy?: string;
  favoriteActivity?: string;
}

// 个性配置
export interface PersonalityConfig {
  name: string;
  personality: string;
  tendencies: Tendencies;
  preferences: Preferences;
  backstory?: string;
}

// 默认个性配置
const DEFAULT_PERSONALITY: PersonalityConfig = {
  name: 'Pixel',
  personality: '友好、活泼、好奇',
  tendencies: {
    activity: 0.7,
    friendliness: 0.9,
    curiosity: 0.8,
    sleepiness: 0.3,
  },
  preferences: {
    favoriteFood: '像素蛋糕',
    favoriteToy: '像素球',
    favoriteActivity: '散步',
  },
  backstory: '一个来自像素世界的可爱宠物，喜欢探索和交朋友。',
};

// 个性管理器类
export class PersonalityManager {
  private static instance: PersonalityManager;
  private config: PersonalityConfig;

  private constructor() {
    this.config = { ...DEFAULT_PERSONALITY };
  }

  // 获取单例实例
  static getInstance(): PersonalityManager {
    if (!PersonalityManager.instance) {
      PersonalityManager.instance = new PersonalityManager();
    }
    return PersonalityManager.instance;
  }

  // 获取配置
  getConfig(): PersonalityConfig {
    return { ...this.config };
  }

  // 设置配置
  setConfig(config: Partial<PersonalityConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };

    // 触发配置变化事件
    eventBus.emit(EventTypes.CONFIG_CHANGE, {
      key: 'personality',
      value: this.config,
    });
  }

  // 设置名字
  setName(name: string): void {
    this.setConfig({ name });
  }

  // 设置性格描述
  setPersonality(personality: string): void {
    this.setConfig({ personality });
  }

  // 设置行为倾向
  setTendencies(tendencies: Partial<Tendencies>): void {
    this.setConfig({
      tendencies: {
        ...this.config.tendencies,
        ...tendencies,
      },
    });
  }

  // 设置偏好
  setPreferences(preferences: Partial<Preferences>): void {
    this.setConfig({
      preferences: {
        ...this.config.preferences,
        ...preferences,
      },
    });
  }

  // 设置背景故事
  setBackstory(backstory: string): void {
    this.setConfig({ backstory });
  }

  // 获取活跃度
  getActivity(): number {
    return this.config.tendencies.activity;
  }

  // 获取友好度
  getFriendliness(): number {
    return this.config.tendencies.friendliness;
  }

  // 获取好奇心
  getCuriosity(): number {
    return this.config.tendencies.curiosity;
  }

  // 获取困倦度
  getSleepiness(): number {
    return this.config.tendencies.sleepiness;
  }

  // 获取名字
  getName(): string {
    return this.config.name;
  }

  // 获取性格描述
  getPersonality(): string {
    return this.config.personality;
  }

  // 获取背景故事
  getBackstory(): string | undefined {
    return this.config.backstory;
  }

  // 重置为默认配置
  reset(): void {
    this.config = { ...DEFAULT_PERSONALITY };
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
      console.error('Failed to import personality config:', error);
      return false;
    }
  }
}

// 导出全局个性管理器实例
export const personalityManager = PersonalityManager.getInstance();