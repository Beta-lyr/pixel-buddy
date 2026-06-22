/**
 * 配置管理器组件
 * 提供配置导入导出功能
 */

import { storageManager } from '../../utils/storage';
import { appearanceManager } from '../../systems/customization';
import { personalityManager } from '../../systems/customization';
import { themeManager } from '../../systems/theme';
import { logger } from '../../utils/logger';

// 应用配置数据接口
export interface AppConfigData {
  version: string;
  timestamp: number;
  appearance: any;
  personality: any;
  theme: string;
  behaviorRules: any[];
}

// 配置管理器类
export class ConfigManagerComponent {
  private static instance: ConfigManagerComponent;

  private constructor() {}

  // 获取单例实例
  static getInstance(): ConfigManagerComponent {
    if (!ConfigManagerComponent.instance) {
      ConfigManagerComponent.instance = new ConfigManagerComponent();
    }
    return ConfigManagerComponent.instance;
  }

  // 导出配置
  async exportConfig(): Promise<string> {
    try {
      const config: AppConfigData = {
        version: '1.0.0',
        timestamp: Date.now(),
        appearance: appearanceManager.getConfig(),
        personality: personalityManager.getConfig(),
        theme: themeManager.getCurrentTheme().id,
        behaviorRules: [],
      };

      const configJson = JSON.stringify(config, null, 2);
      logger.info('Configuration exported successfully');
      return configJson;
    } catch (error) {
      logger.error('Failed to export configuration', error);
      throw error;
    }
  }

  // 导入配置
  async importConfig(configJson: string): Promise<boolean> {
    try {
      const config: AppConfigData = JSON.parse(configJson);

      // 验证配置版本
      if (!config.version) {
        throw new Error('Invalid configuration: missing version');
      }

      // 应用外观配置
      if (config.appearance) {
        appearanceManager.setConfig(config.appearance);
      }

      // 应用个性配置
      if (config.personality) {
        personalityManager.setConfig(config.personality);
      }

      // 应用主题配置
      if (config.theme) {
        await themeManager.switchTheme(config.theme);
      }

      // 保存配置到存储
      await this.saveConfigToStorage(config);

      logger.info('Configuration imported successfully');
      return true;
    } catch (error) {
      logger.error('Failed to import configuration', error);
      return false;
    }
  }

  // 保存配置到存储
  private async saveConfigToStorage(config: AppConfigData): Promise<void> {
    await storageManager.save('appearance', config.appearance);
    await storageManager.save('personality', config.personality);
    await storageManager.save('currentTheme', config.theme);
  }

  // 导出配置到文件
  async exportToFile(): Promise<void> {
    try {
      const configJson = await this.exportConfig();

      // 创建下载链接
      const blob = new Blob([configJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pixel-buddy-config-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      logger.info('Configuration exported to file');
    } catch (error) {
      logger.error('Failed to export configuration to file', error);
      throw error;
    }
  }

  // 从文件导入配置
  async importFromFile(): Promise<boolean> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve(false);
          return;
        }

        try {
          const text = await file.text();
          const result = await this.importConfig(text);
          resolve(result);
        } catch (error) {
          logger.error('Failed to read configuration file', error);
          resolve(false);
        }
      };

      input.click();
    });
  }

  // 验证配置
  validateConfig(configJson: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      const config = JSON.parse(configJson);

      if (!config.version) {
        errors.push('Missing version field');
      }

      if (!config.appearance) {
        errors.push('Missing appearance configuration');
      }

      if (!config.personality) {
        errors.push('Missing personality configuration');
      }

      if (!config.theme) {
        errors.push('Missing theme configuration');
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      return {
        valid: false,
        errors: ['Invalid JSON format'],
      };
    }
  }

  // 重置配置
  async resetConfig(): Promise<void> {
    try {
      appearanceManager.reset();
      personalityManager.reset();
      themeManager.reset();

      await storageManager.clear();

      logger.info('Configuration reset to defaults');
    } catch (error) {
      logger.error('Failed to reset configuration', error);
      throw error;
    }
  }
}

// 导出全局配置管理器组件实例
export const configManagerComponent = ConfigManagerComponent.getInstance();