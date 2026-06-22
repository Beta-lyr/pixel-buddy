/**
 * 存储工具
 * 管理配置文件的读写
 */

import { invoke } from '@tauri-apps/api/core';

// 存储类型
export type StorageType = 'local' | 'file';

// 存储配置
export interface StorageConfig {
  type: StorageType;
  path?: string;
  encrypt?: boolean;
}

// 存储管理器类
export class StorageManager {
  private static instance: StorageManager;
  private config: StorageConfig;

  private constructor() {
    this.config = {
      type: 'local',
    };
  }

  // 获取单例实例
  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  // 设置存储配置
  setConfig(config: Partial<StorageConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  // 获取存储配置
  getConfig(): StorageConfig {
    return { ...this.config };
  }

  // 保存数据
  async save(key: string, value: any): Promise<boolean> {
    try {
      const data = JSON.stringify(value);

      if (this.config.type === 'local') {
        localStorage.setItem(key, data);
      } else if (this.config.type === 'file') {
        await this.saveToFile(key, data);
      }

      return true;
    } catch (error) {
      console.error('Failed to save data:', error);
      return false;
    }
  }

  // 加载数据
  async load<T>(key: string, defaultValue?: T): Promise<T | null> {
    try {
      let data: string | null = null;

      if (this.config.type === 'local') {
        data = localStorage.getItem(key);
      } else if (this.config.type === 'file') {
        data = await this.loadFromFile(key);
      }

      if (data === null) {
        return defaultValue || null;
      }

      return JSON.parse(data) as T;
    } catch (error) {
      console.error('Failed to load data:', error);
      return defaultValue || null;
    }
  }

  // 删除数据
  async remove(key: string): Promise<boolean> {
    try {
      if (this.config.type === 'local') {
        localStorage.removeItem(key);
      } else if (this.config.type === 'file') {
        await this.removeFile(key);
      }

      return true;
    } catch (error) {
      console.error('Failed to remove data:', error);
      return false;
    }
  }

  // 清空所有数据
  async clear(): Promise<boolean> {
    try {
      if (this.config.type === 'local') {
        localStorage.clear();
      } else if (this.config.type === 'file') {
        // 文件存储需要特殊处理
        console.warn('File storage clear not implemented');
      }

      return true;
    } catch (error) {
      console.error('Failed to clear data:', error);
      return false;
    }
  }

  // 检查是否存在
  async has(key: string): Promise<boolean> {
    try {
      if (this.config.type === 'local') {
        return localStorage.getItem(key) !== null;
      } else if (this.config.type === 'file') {
        return await this.fileExists(key);
      }

      return false;
    } catch (error) {
      console.error('Failed to check existence:', error);
      return false;
    }
  }

  // 获取所有键
  async keys(): Promise<string[]> {
    try {
      if (this.config.type === 'local') {
        return Object.keys(localStorage);
      } else if (this.config.type === 'file') {
        // 文件存储需要特殊处理
        console.warn('File storage keys not implemented');
        return [];
      }

      return [];
    } catch (error) {
      console.error('Failed to get keys:', error);
      return [];
    }
  }

  // 保存到文件
  private async saveToFile(key: string, data: string): Promise<void> {
    const filePath = this.getFilePath(key);
    await invoke('save_config', { path: filePath, data });
  }

  // 从文件加载
  private async loadFromFile(key: string): Promise<string | null> {
    const filePath = this.getFilePath(key);
    try {
      const data = await invoke('load_config', { path: filePath });
      return data as string;
    } catch (error) {
      return null;
    }
  }

  // 删除文件
  private async removeFile(key: string): Promise<void> {
    const filePath = this.getFilePath(key);
    await invoke('remove_config', { path: filePath });
  }

  // 检查文件是否存在
  private async fileExists(key: string): Promise<boolean> {
    const filePath = this.getFilePath(key);
    try {
      await invoke('load_config', { path: filePath });
      return true;
    } catch (error) {
      return false;
    }
  }

  // 获取文件路径
  private getFilePath(key: string): string {
    const basePath = this.config.path || './config';
    return `${basePath}/${key}.json`;
  }

  // 导出配置
  async exportConfig(filePath: string): Promise<boolean> {
    try {
      const allData: Record<string, any> = {};
      const keys = await this.keys();

      for (const key of keys) {
        const value = await this.load(key);
        if (value !== null) {
          allData[key] = value;
        }
      }

      const data = JSON.stringify(allData, null, 2);
      await invoke('save_config', { path: filePath, data });

      return true;
    } catch (error) {
      console.error('Failed to export config:', error);
      return false;
    }
  }

  // 导入配置
  async importConfig(filePath: string): Promise<boolean> {
    try {
      const data = await invoke('load_config', { path: filePath });
      const allData = JSON.parse(data as string);

      for (const [key, value] of Object.entries(allData)) {
        await this.save(key, value);
      }

      return true;
    } catch (error) {
      console.error('Failed to import config:', error);
      return false;
    }
  }
}

// 导出全局存储管理器实例
export const storageManager = StorageManager.getInstance();