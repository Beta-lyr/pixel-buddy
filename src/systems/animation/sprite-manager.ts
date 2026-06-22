/**
 * 精灵图管理器
 * 支持加载精灵图和代码绘制占位形象
 */

import { logger } from '../../utils/logger';

// 精灵图配置
export interface SpriteConfig {
  frameWidth: number;   // 每帧宽度
  frameHeight: number;  // 每帧高度
  frameCount: number;   // 帧数
  frameRate: number;    // 帧率 (fps)
}

// 状态精灵图
export interface StateSprite {
  image: HTMLImageElement | null;
  config: SpriteConfig;
  loaded: boolean;
}

// 精灵图管理器类
export class SpriteManager {
  private static instance: SpriteManager;
  private sprites: Map<string, StateSprite> = new Map();
  private useCodeDrawing: boolean = true;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  // 默认精灵图配置
  private defaultConfigs: Record<string, SpriteConfig> = {
    idle: { frameWidth: 32, frameHeight: 32, frameCount: 4, frameRate: 4 },
    walk: { frameWidth: 32, frameHeight: 32, frameCount: 6, frameRate: 8 },
    sleep: { frameWidth: 32, frameHeight: 32, frameCount: 4, frameRate: 2 },
    happy: { frameWidth: 32, frameHeight: 32, frameCount: 4, frameRate: 8 },
    active: { frameWidth: 32, frameHeight: 32, frameCount: 6, frameRate: 6 },
    playing: { frameWidth: 32, frameHeight: 32, frameCount: 8, frameRate: 8 },
    drag: { frameWidth: 32, frameHeight: 32, frameCount: 2, frameRate: 4 },
    error: { frameWidth: 32, frameHeight: 32, frameCount: 4, frameRate: 4 },
  };

  private constructor() {}

  // 获取单例实例
  static getInstance(): SpriteManager {
    if (!SpriteManager.instance) {
      SpriteManager.instance = new SpriteManager();
    }
    return SpriteManager.instance;
  }

  // 初始化
  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.loadDefaultSprites();
    logger.info('SpriteManager initialized');
  }

  // 加载默认精灵图
  private loadDefaultSprites(): void {
    // 初始化所有状态的精灵图配置
    for (const [state, config] of Object.entries(this.defaultConfigs)) {
      this.sprites.set(state, {
        image: null,
        config,
        loaded: false,
      });
    }
  }

  // 加载精灵图
  async loadSprite(state: string, imagePath: string): Promise<boolean> {
    try {
      const sprite = this.sprites.get(state);
      if (!sprite) {
        logger.warn(`Unknown state: ${state}`);
        return false;
      }

      const image = new Image();
      image.src = imagePath;

      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error(`Failed to load image: ${imagePath}`));
      });

      sprite.image = image;
      sprite.loaded = true;
      this.useCodeDrawing = false;

      logger.info(`Sprite loaded for state: ${state}`);
      return true;
    } catch (error) {
      logger.error(`Failed to load sprite for state: ${state}`, error);
      return false;
    }
  }

  // 批量加载精灵图
  async loadSprites(spriteMap: Record<string, string>): Promise<void> {
    const promises = Object.entries(spriteMap).map(([state, path]) =>
      this.loadSprite(state, path)
    );
    await Promise.all(promises);
  }

  // 绘制当前帧
  drawFrame(state: string, frameIndex: number): void {
    if (!this.canvas || !this.ctx) return;

    const sprite = this.sprites.get(state);
    if (!sprite) return;

    // 清除画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (sprite.loaded && sprite.image) {
      // 使用精灵图绘制
      this.drawSpriteFrame(sprite, frameIndex);
    } else {
      // 使用代码绘制占位形象
      this.drawPlaceholder(state, frameIndex);
    }
  }

  // 绘制精灵图帧
  private drawSpriteFrame(sprite: StateSprite, frameIndex: number): void {
    if (!this.ctx || !sprite.image) return;

    const { frameWidth, frameHeight } = sprite.config;
    const sourceX = (frameIndex % sprite.config.frameCount) * frameWidth;
    const sourceY = 0;

    // 计算居中绘制位置
    const destX = (this.canvas!.width - frameWidth * 4) / 2;
    const destY = (this.canvas!.height - frameHeight * 4) / 2;

    // 绘制放大的精灵图
    this.ctx.imageSmoothingEnabled = false; // 像素完美渲染
    this.ctx.drawImage(
      sprite.image,
      sourceX, sourceY, frameWidth, frameHeight,
      destX, destY, frameWidth * 4, frameHeight * 4
    );
  }

  // 绘制占位形象
  private drawPlaceholder(state: string, frameIndex: number): void {
    if (!this.ctx || !this.canvas) return;

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const size = 48;

    // 根据状态选择颜色
    const colors = this.getStateColors(state);
    const bounce = this.getStateBounce(state, frameIndex);

    // 绘制身体
    this.ctx.fillStyle = colors.body;
    this.ctx.beginPath();
    this.ctx.roundRect(centerX - size, centerY - size + bounce, size * 2, size * 2, 8);
    this.ctx.fill();

    // 绘制眼睛
    this.drawEyes(state, frameIndex, centerX, centerY + bounce);

    // 绘制嘴巴
    this.drawMouth(state, frameIndex, centerX, centerY + bounce);

    // 绘制状态特效
    this.drawStateEffect(state, frameIndex, centerX, centerY + bounce);
  }

  // 获取状态颜色
  private getStateColors(state: string): { body: string; eye: string } {
    const colorMap: Record<string, { body: string; eye: string }> = {
      idle: { body: '#FF6B6B', eye: '#333' },
      walk: { body: '#4ECDC4', eye: '#333' },
      sleep: { body: '#9B59B6', eye: '#666' },
      happy: { body: '#FFE66D', eye: '#333' },
      active: { body: '#FF6B6B', eye: '#333' },
      playing: { body: '#4ECDC4', eye: '#333' },
      drag: { body: '#FF6B6B', eye: '#333' },
      error: { body: '#E74C3C', eye: '#FFF' },
    };
    return colorMap[state] || colorMap.idle;
  }

  // 获取状态弹跳
  private getStateBounce(state: string, frameIndex: number): number {
    switch (state) {
      case 'idle':
        return Math.sin(frameIndex * Math.PI / 2) * 4;
      case 'walk':
        return Math.abs(Math.sin(frameIndex * Math.PI / 3)) * 8;
      case 'sleep':
        return 0;
      case 'happy':
        return Math.abs(Math.sin(frameIndex * Math.PI)) * 12;
      case 'active':
        return Math.abs(Math.sin(frameIndex * Math.PI / 2)) * 10;
      case 'playing':
        return Math.sin(frameIndex * Math.PI / 4) * 15;
      case 'drag':
        return 0;
      case 'error':
        return Math.sin(frameIndex * Math.PI) * 3;
      default:
        return 0;
    }
  }

  // 绘制眼睛
  private drawEyes(state: string, frameIndex: number, x: number, y: number): void {
    if (!this.ctx) return;

    const colors = this.getStateColors(state);
    this.ctx.fillStyle = colors.eye;

    if (state === 'sleep') {
      // 睡觉时闭眼
      this.ctx.beginPath();
      this.ctx.moveTo(x - 16, y - 8);
      this.ctx.lineTo(x - 8, y - 4);
      this.ctx.lineTo(x - 16, y);
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.moveTo(x + 16, y - 8);
      this.ctx.lineTo(x + 8, y - 4);
      this.ctx.lineTo(x + 16, y);
      this.ctx.stroke();
    } else if (state === 'happy' || state === 'playing') {
      // 开心时弯眼
      this.ctx.beginPath();
      this.ctx.arc(x - 12, y - 8, 5, Math.PI, 0);
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.arc(x + 12, y - 8, 5, Math.PI, 0);
      this.ctx.stroke();
    } else {
      // 正常眼睛
      const blink = frameIndex % 8 === 0;
      if (blink) {
        // 眨眼
        this.ctx.beginPath();
        this.ctx.moveTo(x - 16, y - 8);
        this.ctx.lineTo(x - 8, y - 8);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(x + 8, y - 8);
        this.ctx.lineTo(x + 16, y - 8);
        this.ctx.stroke();
      } else {
        // 正常
        this.ctx.beginPath();
        this.ctx.arc(x - 12, y - 8, 4, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.arc(x + 12, y - 8, 4, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  // 绘制嘴巴
  private drawMouth(state: string, _frameIndex: number, x: number, y: number): void {
    if (!this.ctx) return;

    this.ctx.strokeStyle = this.getStateColors(state).eye;
    this.ctx.lineWidth = 2;

    if (state === 'sleep') {
      // 睡觉时嘴巴
      this.ctx.beginPath();
      this.ctx.arc(x, y + 12, 4, 0, Math.PI);
      this.ctx.stroke();
    } else if (state === 'happy' || state === 'playing') {
      // 开心时大笑
      this.ctx.beginPath();
      this.ctx.arc(x, y + 8, 10, 0, Math.PI);
      this.ctx.stroke();
    } else if (state === 'error') {
      // 错误时嘴巴
      this.ctx.beginPath();
      this.ctx.arc(x, y + 16, 8, Math.PI, 0);
      this.ctx.stroke();
    } else {
      // 正常微笑
      this.ctx.beginPath();
      this.ctx.arc(x, y + 10, 6, 0.1, Math.PI - 0.1);
      this.ctx.stroke();
    }
  }

  // 绘制状态特效
  private drawStateEffect(state: string, frameIndex: number, x: number, y: number): void {
    if (!this.ctx) return;

    if (state === 'sleep') {
      // Z 字母
      this.ctx.fillStyle = '#4ECDC4';
      this.ctx.font = '16px Arial';
      const offset = (frameIndex % 4) * 8;
      this.ctx.globalAlpha = 0.8;
      this.ctx.fillText('Z', x + 30 + offset, y - 20 - offset);
      this.ctx.globalAlpha = 0.5;
      this.ctx.fillText('z', x + 45 + offset, y - 35 - offset);
      this.ctx.globalAlpha = 1;
    } else if (state === 'happy' || state === 'playing') {
      // 爱心
      this.ctx.fillStyle = '#FF6B6B';
      this.ctx.font = '14px Arial';
      const offset = Math.sin(frameIndex * Math.PI / 2) * 5;
      this.ctx.fillText('❤', x - 30, y - 25 + offset);
      this.ctx.fillText('❤', x + 25, y - 30 - offset);
    } else if (state === 'active') {
      // 星星
      this.ctx.fillStyle = '#FFE66D';
      this.ctx.font = '12px Arial';
      const angle = frameIndex * Math.PI / 3;
      this.ctx.fillText('★', x + 35 * Math.cos(angle), y - 30 + 35 * Math.sin(angle));
    }
  }

  // 是否使用代码绘制
  isUsingCodeDrawing(): boolean {
    return this.useCodeDrawing;
  }

  // 获取精灵图
  getSprite(state: string): StateSprite | undefined {
    return this.sprites.get(state);
  }

  // 重置
  reset(): void {
    this.sprites.clear();
    this.useCodeDrawing = true;
    this.loadDefaultSprites();
  }
}

// 导出全局精灵图管理器实例
export const spriteManager = SpriteManager.getInstance();