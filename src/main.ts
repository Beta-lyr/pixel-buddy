import { invoke } from "@tauri-apps/api/core";

// 状态类型定义
type PetState = "idle" | "happy" | "sleep" | "walk" | "active" | "playing" | "drag";

// 宠物类
class Pet {
  private element: HTMLElement;
  private container: HTMLElement;
  private currentState: PetState = "idle";
  private isDragging: boolean = false;
  private dragOffset: { x: number; y: number } = { x: 0, y: 0 };
  private lastInteraction: number = Date.now();
  private stateTimeout: number | null = null;

  constructor() {
    this.container = document.getElementById("pet-container")!;
    this.element = document.getElementById("pet")!;
    this.init();
  }

  private init(): void {
    this.setupEventListeners();
    this.startBehaviorLoop();
    this.setState("idle");
  }

  private setupEventListeners(): void {
    // 点击事件
    this.element.addEventListener("click", (e) => {
      e.stopPropagation();
      this.handleClick();
    });

    // 双击事件
    this.element.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      this.handleDoubleClick();
    });

    // 鼠标按下
    this.element.addEventListener("mousedown", (e) => {
      if (e.button === 0) {
        this.startDrag(e);
      }
    });

    // 鼠标移动
    document.addEventListener("mousemove", (e) => {
      if (this.isDragging) {
        this.handleDrag(e);
      }
    });

    // 鼠标释放
    document.addEventListener("mouseup", () => {
      if (this.isDragging) {
        this.endDrag();
      }
    });

    // 右键菜单
    this.container.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.handleRightClick(e);
    });

    // 鼠标悬停
    this.element.addEventListener("mouseenter", () => {
      this.handleHover();
    });

    // 鼠标离开
    this.element.addEventListener("mouseleave", () => {
      this.handleHoverEnd();
    });
  }

  private handleClick(): void {
    this.lastInteraction = Date.now();
    this.setState("happy");
    this.createHeartEffect();

    // 1秒后回到之前的状态
    setTimeout(() => {
      if (this.currentState === "happy") {
        this.setState("idle");
      }
    }, 1000);
  }

  private handleDoubleClick(): void {
    this.lastInteraction = Date.now();
    // 双击：跳跃动画
    this.element.style.animation = "none";
    this.element.offsetHeight; // 触发重绘
    this.element.style.animation = "happy 0.5s ease-in-out";

    setTimeout(() => {
      this.setState("idle");
    }, 500);
  }

  private startDrag(e: MouseEvent): void {
    this.isDragging = true;
    this.dragOffset = {
      x: e.clientX - this.container.offsetLeft,
      y: e.clientY - this.container.offsetTop,
    };
    this.element.classList.add("dragging");
    this.setState("drag");
    this.lastInteraction = Date.now();
  }

  private handleDrag(e: MouseEvent): void {
    if (!this.isDragging) return;

    const x = e.clientX - this.dragOffset.x;
    const y = e.clientY - this.dragOffset.y;

    this.container.style.position = "absolute";
    this.container.style.left = `${x}px`;
    this.container.style.top = `${y}px`;

    // 更新窗口位置
    invoke("set_window_position", { x, y });
  }

  private endDrag(): void {
    this.isDragging = false;
    this.element.classList.remove("dragging");
    this.lastInteraction = Date.now();

    setTimeout(() => {
      if (this.currentState === "drag") {
        this.setState("idle");
      }
    }, 500);
  }

  private handleRightClick(e: MouseEvent): void {
    // 创建简单的右键菜单
    const menu = document.createElement("div");
    menu.style.cssText = `
      position: fixed;
      left: ${e.clientX}px;
      top: ${e.clientY}px;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 4px 0;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      z-index: 1000;
    `;

    const items = [
      { text: "摸摸头", action: () => this.handleClick() },
      { text: "设置", action: () => this.openSettings() },
      { text: "退出", action: () => this.quit() },
    ];

    items.forEach((item) => {
      const menuItem = document.createElement("div");
      menuItem.textContent = item.text;
      menuItem.style.cssText = `
        padding: 8px 16px;
        cursor: pointer;
        font-size: 14px;
      `;
      menuItem.addEventListener("click", () => {
        item.action();
        menu.remove();
      });
      menuItem.addEventListener("mouseenter", () => {
        menuItem.style.background = "#f0f0f0";
      });
      menuItem.addEventListener("mouseleave", () => {
        menuItem.style.background = "transparent";
      });
      menu.appendChild(menuItem);
    });

    document.body.appendChild(menu);

    // 点击其他地方关闭菜单
    const closeMenu = (e: MouseEvent) => {
      if (!menu.contains(e.target as Node)) {
        menu.remove();
        document.removeEventListener("click", closeMenu);
      }
    };
    setTimeout(() => {
      document.addEventListener("click", closeMenu);
    }, 0);
  }

  private handleHover(): void {
    // 悬停时看向鼠标
    this.lastInteraction = Date.now();
  }

  private handleHoverEnd(): void {
    // 鼠标离开
  }

  private openSettings(): void {
    // TODO: 打开设置窗口
    console.log("打开设置");
  }

  private quit(): void {
    invoke("toggle_window_visibility");
  }

  private setState(newState: PetState): void {
    if (this.currentState === newState) return;

    // 移除旧状态类
    this.element.classList.remove(this.currentState);

    // 添加新状态类
    this.currentState = newState;
    this.element.classList.add(newState);

    // 清除之前的超时
    if (this.stateTimeout) {
      clearTimeout(this.stateTimeout);
      this.stateTimeout = null;
    }

    // 设置状态持续时间
    this.setStateDuration();
  }

  private setStateDuration(): void {
    const durations: Record<PetState, number> = {
      idle: 5000 + Math.random() * 10000, // 5-15秒
      happy: 1000,
      sleep: 10000 + Math.random() * 20000, // 10-30秒
      walk: 3000 + Math.random() * 5000, // 3-8秒
      active: 5000 + Math.random() * 10000, // 5-15秒
      playing: 5000 + Math.random() * 10000, // 5-15秒
      drag: 0, // 拖拽状态持续到释放
    };

    const duration = durations[this.currentState];
    if (duration > 0) {
      this.stateTimeout = window.setTimeout(() => {
        this.transitionState();
      }, duration);
    }
  }

  private transitionState(): void {
    const timeSinceLastInteraction = Date.now() - this.lastInteraction;

    // 根据时间和交互决定下一个状态
    if (timeSinceLastInteraction > 60000) { // 1分钟无交互
      this.setState("sleep");
    } else if (Math.random() < 0.3) { // 30%概率切换到活跃状态
      this.setState("active");
    } else {
      this.setState("idle");
    }
  }

  private startBehaviorLoop(): void {
    // 每10秒检查一次状态
    setInterval(() => {
      this.updateBehavior();
    }, 10000);
  }

  private updateBehavior(): void {
    const hour = new Date().getHours();
    const timeSinceLastInteraction = Date.now() - this.lastInteraction;

    // 夜间自动睡觉 (22:00 - 6:00)
    if ((hour >= 22 || hour < 6) && this.currentState !== "sleep") {
      this.setState("sleep");
      return;
    }

    // 长时间无交互，进入睡眠
    if (timeSinceLastInteraction > 120000 && this.currentState !== "sleep") { // 2分钟
      this.setState("sleep");
      return;
    }

    // 随机行为切换
    if (this.currentState === "idle" && Math.random() < 0.2) { // 20%概率
      const states: PetState[] = ["active", "walk"];
      const randomState = states[Math.floor(Math.random() * states.length)];
      this.setState(randomState);
    }
  }

  private createHeartEffect(): void {
    const heart = document.createElement("div");
    heart.className = "heart";

    const rect = this.element.getBoundingClientRect();
    heart.style.left = `${rect.left + rect.width / 2 - 10}px`;
    heart.style.top = `${rect.top - 10}px`;

    document.body.appendChild(heart);

    setTimeout(() => {
      heart.remove();
    }, 1000);
  }
}

// 初始化宠物
document.addEventListener("DOMContentLoaded", () => {
  new Pet();
});