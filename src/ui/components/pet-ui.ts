/**
 * 宠物UI组件
 * 提供宠物的视觉反馈和特效
 */

import { eventBus, EventTypes } from '../../core/events';
import { logger } from '../../utils/logger';

// 粒子类型
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  element: HTMLElement;
}

// 宠物UI类
export class PetUI {
  private static instance: PetUI;
  private container: HTMLElement | null = null;
  private petElement: HTMLElement | null = null;
  private particles: Particle[] = [];
  private animationFrame: number | null = null;
  private isRunning: boolean = false;

  private constructor() {}

  // 获取单例实例
  static getInstance(): PetUI {
    if (!PetUI.instance) {
      PetUI.instance = new PetUI();
    }
    return PetUI.instance;
  }

  // 初始化
  init(container: HTMLElement, petElement: HTMLElement): void {
    this.container = container;
    this.petElement = petElement;

    // 监听事件
    this.setupEventListeners();

    // 启动粒子系统
    this.startParticleSystem();

    logger.info('PetUI initialized');
  }

  // 设置事件监听器
  private setupEventListeners(): void {
    // 监听状态变化事件
    eventBus.on(EventTypes.STATE_CHANGE, (data) => {
      this.handleStateChange(data);
    });

    // 监听交互事件
    eventBus.on(EventTypes.INTERACTION_CLICK, () => {
      this.createClickEffect();
    });

    eventBus.on(EventTypes.INTERACTION_HOVER, () => {
      this.createHoverEffect();
    });
  }

  // 处理状态变化
  private handleStateChange(data: any): void {
    const { to } = data.payload;

    // 根据状态创建特效
    switch (to) {
      case 'happy':
        this.createHappyEffect();
        break;
      case 'sleep':
        this.createSleepEffect();
        break;
      case 'active':
        this.createActiveEffect();
        break;
    }
  }

  // 创建点击特效
  private createClickEffect(): void {
    if (!this.petElement) return;

    const rect = this.petElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // 创建爱心粒子
    for (let i = 0; i < 5; i++) {
      this.createParticle(
        centerX + (Math.random() - 0.5) * 20,
        centerY - 10,
        '❤️',
        '#FF6B6B'
      );
    }
  }

  // 创建悬停特效
  private createHoverEffect(): void {
    if (!this.petElement) return;

    const rect = this.petElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // 创建闪烁粒子
    this.createParticle(
      centerX + (Math.random() - 0.5) * 30,
      centerY - 5,
      '✨',
      '#FFE66D'
    );
  }

  // 创建开心特效
  private createHappyEffect(): void {
    if (!this.petElement) return;

    const rect = this.petElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // 创建多个爱心
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        this.createParticle(
          centerX + (Math.random() - 0.5) * 40,
          centerY - 20,
          '❤️',
          '#FF6B6B'
        );
      }, i * 100);
    }
  }

  // 创建睡觉特效
  private createSleepEffect(): void {
    if (!this.petElement) return;

    const rect = this.petElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top;

    // 创建Z字母粒子
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.createParticle(
          centerX + 20 + i * 10,
          centerY - i * 15,
          'Z',
          '#4ECDC4'
        );
      }, i * 500);
    }
  }

  // 创建活跃特效
  private createActiveEffect(): void {
    if (!this.petElement) return;

    const rect = this.petElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // 创建星星粒子
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        this.createParticle(
          centerX + (Math.random() - 0.5) * 50,
          centerY + (Math.random() - 0.5) * 30,
          '⭐',
          '#FFE66D'
        );
      }, i * 150);
    }
  }

  // 创建粒子
  private createParticle(x: number, y: number, emoji: string, color: string): void {
    if (!this.container) return;

    const element = document.createElement('div');
    element.textContent = emoji;
    element.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      font-size: 16px;
      pointer-events: none;
      z-index: 10000;
      transition: all 1s ease-out;
    `;

    document.body.appendChild(element);

    const particle: Particle = {
      x,
      y,
      vx: (Math.random() - 0.5) * 2,
      vy: -2 - Math.random() * 2,
      life: 60,
      maxLife: 60,
      size: 16,
      color,
      element,
    };

    this.particles.push(particle);

    // 动画粒子
    requestAnimationFrame(() => {
      element.style.transform = `translate(${particle.vx * 50}px, ${particle.vy * 50}px) scale(0)`;
      element.style.opacity = '0';
    });

    // 移除粒子
    setTimeout(() => {
      element.remove();
      const index = this.particles.indexOf(particle);
      if (index > -1) {
        this.particles.splice(index, 1);
      }
    }, 1000);
  }

  // 启动粒子系统
  private startParticleSystem(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.updateParticleSystem();
  }

  // 更新粒子系统
  private updateParticleSystem(): void {
    if (!this.isRunning) return;

    // 更新粒子
    this.particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life--;
    });

    // 移除死亡粒子
    this.particles = this.particles.filter((p) => p.life > 0);

    // 继续更新
    this.animationFrame = requestAnimationFrame(() => this.updateParticleSystem());
  }

  // 停止粒子系统
  stopParticleSystem(): void {
    this.isRunning = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  // 创建浮动文字效果
  createFloatingText(text: string, x: number, y: number, color: string = '#333'): void {
    const element = document.createElement('div');
    element.textContent = text;
    element.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      color: ${color};
      font-size: 14px;
      font-weight: bold;
      pointer-events: none;
      z-index: 10000;
      transition: all 1.5s ease-out;
      text-shadow: 0 1px 2px rgba(0,0,0,0.2);
    `;

    document.body.appendChild(element);

    // 动画
    requestAnimationFrame(() => {
      element.style.transform = 'translateY(-50px)';
      element.style.opacity = '0';
    });

    // 移除
    setTimeout(() => {
      element.remove();
    }, 1500);
  }

  // 创建脉冲效果
  createPulseEffect(element: HTMLElement, color: string = '#FF6B6B'): void {
    const pulse = document.createElement('div');
    const rect = element.getBoundingClientRect();

    pulse.style.cssText = `
      position: fixed;
      left: ${rect.left + rect.width / 2}px;
      top: ${rect.top + rect.height / 2}px;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: ${color};
      opacity: 0.5;
      pointer-events: none;
      z-index: 9999;
      transform: translate(-50%, -50%);
      transition: all 0.5s ease-out;
    `;

    document.body.appendChild(pulse);

    // 动画
    requestAnimationFrame(() => {
      pulse.style.width = '100px';
      pulse.style.height = '100px';
      pulse.style.opacity = '0';
    });

    // 移除
    setTimeout(() => {
      pulse.remove();
    }, 500);
  }

  // 创建摇晃效果
  createShakeEffect(element: HTMLElement): void {
    element.style.animation = 'none';
    element.offsetHeight; // 触发重绘
    element.style.animation = 'shake 0.5s ease-in-out';
  }

  // 创建弹跳效果
  createBounceEffect(element: HTMLElement): void {
    element.style.animation = 'none';
    element.offsetHeight; // 触发重绘
    element.style.animation = 'bounce 0.5s ease-in-out';
  }

  // 销毁
  destroy(): void {
    this.stopParticleSystem();
    this.particles.forEach((p) => p.element.remove());
    this.particles = [];
  }
}

// 导出全局宠物UI实例
export const petUI = PetUI.getInstance();