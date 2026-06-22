/**
 * 动画控制器
 * 管理宠物的所有动画
 */

import { eventBus } from '../../core/events/event-bus';
import { EventTypes } from '../../core/events/event-types';

// 动画配置
export interface AnimationConfig {
  name: string;
  frames: number;
  duration: number;
  loop: boolean;
  speed: number;
  onComplete?: () => void;
  onStart?: () => void;
  onLoop?: () => void;
}

// 动画状态
export interface AnimationState {
  name: string;
  currentFrame: number;
  isPlaying: boolean;
  isPaused: boolean;
  startTime: number;
  elapsedTime: number;
}

// 动画控制器类
export class Animator {
  private static instance: Animator;
  private element: HTMLElement | null = null;
  private currentAnimation: AnimationState | null = null;
  private animationQueue: string[] = [];
  private animations: Map<string, AnimationConfig> = new Map();
  private animationFrame: number | null = null;
  private lastFrameTime: number = 0;

  private constructor() {
    this.initializeDefaultAnimations();
  }

  // 获取单例实例
  static getInstance(): Animator {
    if (!Animator.instance) {
      Animator.instance = new Animator();
    }
    return Animator.instance;
  }

  // 初始化默认动画
  private initializeDefaultAnimations(): void {
    // 待机动画
    this.addAnimation({
      name: 'idle',
      frames: 4,
      duration: 2000,
      loop: true,
      speed: 1.0,
    });

    // 开心动画
    this.addAnimation({
      name: 'happy',
      frames: 4,
      duration: 1000,
      loop: false,
      speed: 1.5,
    });

    // 睡觉动画
    this.addAnimation({
      name: 'sleep',
      frames: 4,
      duration: 3000,
      loop: true,
      speed: 0.5,
    });

    // 走路动画
    this.addAnimation({
      name: 'walk',
      frames: 6,
      duration: 1500,
      loop: true,
      speed: 1.2,
    });

    // 活跃动画
    this.addAnimation({
      name: 'active',
      frames: 6,
      duration: 2000,
      loop: true,
      speed: 1.0,
    });

    // 玩耍动画
    this.addAnimation({
      name: 'playing',
      frames: 8,
      duration: 2500,
      loop: true,
      speed: 1.3,
    });

    // 被拖拽动画
    this.addAnimation({
      name: 'drag',
      frames: 2,
      duration: 500,
      loop: true,
      speed: 2.0,
    });

    // 错误动画
    this.addAnimation({
      name: 'error',
      frames: 4,
      duration: 2000,
      loop: false,
      speed: 1.0,
    });
  }

  // 初始化
  init(element: HTMLElement): void {
    this.element = element;
  }

  // 添加动画
  addAnimation(config: AnimationConfig): void {
    this.animations.set(config.name, config);
  }

  // 获取动画配置
  getAnimation(name: string): AnimationConfig | undefined {
    return this.animations.get(name);
  }

  // 播放动画
  play(animationName: string, options?: Partial<AnimationConfig>): void {
    const config = this.animations.get(animationName);
    if (!config) {
      console.warn(`Animation not found: ${animationName}`);
      return;
    }

    // 合并配置
    const finalConfig: AnimationConfig = {
      ...config,
      ...options,
    };

    // 停止当前动画
    this.stop();

    // 设置当前动画状态
    this.currentAnimation = {
      name: animationName,
      currentFrame: 0,
      isPlaying: true,
      isPaused: false,
      startTime: Date.now(),
      elapsedTime: 0,
    };

    // 触发动画开始事件
    eventBus.emit(EventTypes.ANIMATION_START, {
      animationName,
      duration: finalConfig.duration,
    });

    // 调用开始回调
    if (finalConfig.onStart) {
      finalConfig.onStart();
    }

    // 开始动画循环
    this.startAnimationLoop(finalConfig);
  }

  // 停止动画
  stop(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    if (this.currentAnimation) {
      // 触发动画结束事件
      eventBus.emit(EventTypes.ANIMATION_END, {
        animationName: this.currentAnimation.name,
        duration: 0,
      });

      this.currentAnimation = null;
    }
  }

  // 暂停动画
  pause(): void {
    if (this.currentAnimation) {
      this.currentAnimation.isPaused = true;
    }
  }

  // 恢复动画
  resume(): void {
    if (this.currentAnimation) {
      this.currentAnimation.isPaused = false;
    }
  }

  // 队列动画
  queue(animationName: string): void {
    this.animationQueue.push(animationName);
  }

  // 清空队列
  clearQueue(): void {
    this.animationQueue = [];
  }

  // 设置动画速度
  setSpeed(speed: number): void {
    if (this.currentAnimation) {
      const config = this.animations.get(this.currentAnimation.name);
      if (config) {
        config.speed = speed;
      }
    }
  }

  // 开始动画循环
  private startAnimationLoop(config: AnimationConfig): void {
    this.lastFrameTime = Date.now();

    const animate = (currentTime: number) => {
      if (!this.currentAnimation || this.currentAnimation.isPaused) {
        this.animationFrame = requestAnimationFrame(animate);
        return;
      }

      const deltaTime = currentTime - this.lastFrameTime;
      this.lastFrameTime = currentTime;

      // 更新动画状态
      this.currentAnimation.elapsedTime += deltaTime;

      // 计算当前帧
      const frameDuration = config.duration / config.frames;
      const expectedFrame = Math.floor(
        (this.currentAnimation.elapsedTime * config.speed) / frameDuration
      );

      // 检查动画是否完成
      if (expectedFrame >= config.frames) {
        if (config.loop) {
          // 循环动画
          this.currentAnimation.elapsedTime = 0;
          this.currentAnimation.currentFrame = 0;

          // 触发循环事件
          eventBus.emit(EventTypes.ANIMATION_LOOP, {
            animationName: config.name,
            duration: config.duration,
          });

          // 调用循环回调
          if (config.onLoop) {
            config.onLoop();
          }
        } else {
          // 非循环动画完成
          this.currentAnimation.isPlaying = false;

          // 调用完成回调
          if (config.onComplete) {
            config.onComplete();
          }

          // 播放队列中的下一个动画
          this.playNextInQueue();
          return;
        }
      } else {
        // 更新帧
        this.currentAnimation.currentFrame = expectedFrame;
      }

      // 更新DOM
      this.updateDOM(config);

      // 继续动画循环
      this.animationFrame = requestAnimationFrame(animate);
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  // 更新DOM
  private updateDOM(_config: AnimationConfig): void {
    if (!this.element || !this.currentAnimation) return;

    // 计算背景位置
    const frameWidth = 32; // 每帧32像素
    const offsetX = this.currentAnimation.currentFrame * frameWidth;

    // 更新背景位置
    this.element.style.backgroundPosition = `-${offsetX}px 0`;
  }

  // 播放队列中的下一个动画
  private playNextInQueue(): void {
    if (this.animationQueue.length > 0) {
      const nextAnimation = this.animationQueue.shift();
      if (nextAnimation) {
        this.play(nextAnimation);
      }
    }
  }

  // 获取当前动画状态
  getCurrentAnimation(): AnimationState | null {
    return this.currentAnimation;
  }

  // 检查是否正在播放
  isPlaying(): boolean {
    return this.currentAnimation?.isPlaying || false;
  }

  // 检查是否暂停
  isPaused(): boolean {
    return this.currentAnimation?.isPaused || false;
  }

  // 获取当前帧
  getCurrentFrame(): number {
    return this.currentAnimation?.currentFrame || 0;
  }

  // 获取动画列表
  getAnimationList(): string[] {
    return Array.from(this.animations.keys());
  }

  // 销毁
  destroy(): void {
    this.stop();
    this.clearQueue();
    this.animations.clear();
  }
}

// 导出全局动画控制器实例
export const animator = Animator.getInstance();