/**
 * 设置对话框
 * 提供宠物配置界面
 */

import { appearanceManager } from '../../systems/customization';
import { personalityManager } from '../../systems/customization';
import { themeManager } from '../../systems/theme';
import { configManagerComponent } from '../components/config-manager';
import { logger } from '../../utils/logger';

// 设置标签页类型
type SettingsTab = 'appearance' | 'personality' | 'theme' | 'config';

// 设置对话框类
export class SettingsDialog {
  private static instance: SettingsDialog;
  private dialog: HTMLElement | null = null;
  private isOpen: boolean = false;
  private currentTab: SettingsTab = 'appearance';

  private constructor() {}

  // 获取单例实例
  static getInstance(): SettingsDialog {
    if (!SettingsDialog.instance) {
      SettingsDialog.instance = new SettingsDialog();
    }
    return SettingsDialog.instance;
  }

  // 打开设置对话框
  open(): void {
    if (this.isOpen) {
      return;
    }

    this.createDialog();
    this.isOpen = true;
    logger.info('Settings dialog opened');
  }

  // 关闭设置对话框
  close(): void {
    if (this.dialog) {
      this.dialog.remove();
      this.dialog = null;
    }
    this.isOpen = false;
    logger.info('Settings dialog closed');
  }

  // 创建对话框
  private createDialog(): void {
    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.className = 'settings-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    // 创建对话框
    const dialog = document.createElement('div');
    dialog.className = 'settings-dialog';
    dialog.style.cssText = `
      background: white;
      border-radius: 8px;
      width: 500px;
      max-height: 80vh;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;

    // 创建标题栏
    const header = this.createHeader();
    dialog.appendChild(header);

    // 创建标签页
    const tabs = this.createTabs();
    dialog.appendChild(tabs);

    // 创建内容区域
    const content = this.createContent();
    dialog.appendChild(content);

    // 创建底部按钮
    const footer = this.createFooter();
    dialog.appendChild(footer);

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    this.dialog = overlay;

    // 点击遮罩层关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.close();
      }
    });
  }

  // 创建标题栏
  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #eee;
    `;

    const title = document.createElement('h2');
    title.textContent = 'PixelBuddy 设置';
    title.style.cssText = `
      margin: 0;
      font-size: 18px;
      color: #333;
    `;

    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.cssText = `
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
    `;
    closeButton.addEventListener('click', () => this.close());
    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.background = '#f0f0f0';
    });
    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.background = 'none';
    });

    header.appendChild(title);
    header.appendChild(closeButton);
    return header;
  }

  // 创建标签页
  private createTabs(): HTMLElement {
    const tabs = document.createElement('div');
    tabs.style.cssText = `
      display: flex;
      border-bottom: 1px solid #eee;
    `;

    const tabNames: { id: SettingsTab; label: string }[] = [
      { id: 'appearance', label: '外观' },
      { id: 'personality', label: '个性' },
      { id: 'theme', label: '主题' },
      { id: 'config', label: '配置' },
    ];

    tabNames.forEach(({ id, label }) => {
      const tab = document.createElement('button');
      tab.textContent = label;
      tab.style.cssText = `
        flex: 1;
        padding: 12px;
        border: none;
        background: ${this.currentTab === id ? '#f0f0f0' : 'white'};
        cursor: pointer;
        font-size: 14px;
        color: ${this.currentTab === id ? '#333' : '#666'};
        border-bottom: 2px solid ${this.currentTab === id ? '#FF6B6B' : 'transparent'};
        transition: all 0.2s;
      `;
      tab.addEventListener('click', () => {
        this.currentTab = id;
        this.updateContent();
      });
      tab.addEventListener('mouseenter', () => {
        if (this.currentTab !== id) {
          tab.style.background = '#f8f8f8';
        }
      });
      tab.addEventListener('mouseleave', () => {
        if (this.currentTab !== id) {
          tab.style.background = 'white';
        }
      });
      tabs.appendChild(tab);
    });

    return tabs;
  }

  // 创建内容区域
  private createContent(): HTMLElement {
    const content = document.createElement('div');
    content.className = 'settings-content';
    content.style.cssText = `
      padding: 20px;
      max-height: 400px;
      overflow-y: auto;
    `;

    this.updateContent();
    return content;
  }

  // 更新内容
  private updateContent(): void {
    const content = document.querySelector('.settings-content');
    if (!content) return;

    content.innerHTML = '';

    switch (this.currentTab) {
      case 'appearance':
        this.renderAppearanceTab(content as HTMLElement);
        break;
      case 'personality':
        this.renderPersonalityTab(content as HTMLElement);
        break;
      case 'theme':
        this.renderThemeTab(content as HTMLElement);
        break;
      case 'config':
        this.renderConfigTab(content as HTMLElement);
        break;
    }
  }

  // 渲染外观标签页
  private renderAppearanceTab(container: HTMLElement): void {
    const config = appearanceManager.getConfig();

    // 大小滑块
    this.createSlider(container, '大小', config.size, 0.5, 3, (value) => {
      appearanceManager.setSize(value);
    });

    // 透明度滑块
    this.createSlider(container, '透明度', config.opacity, 0, 1, (value) => {
      appearanceManager.setOpacity(value);
    });

    // 动画速度滑块
    this.createSlider(container, '动画速度', config.animation.speed, 0.1, 3, (value) => {
      appearanceManager.setAnimationSpeed(value);
    });

    // 颜色选择器
    this.createColorPicker(container, '主色', config.colors.primary, (color) => {
      appearanceManager.setColors({ primary: color });
    });

    this.createColorPicker(container, '副色', config.colors.secondary, (color) => {
      appearanceManager.setColors({ secondary: color });
    });

    // 显示选项
    this.createCheckbox(container, '显示阴影', config.display.showShadow, (checked) => {
      appearanceManager.setDisplayConfig({ showShadow: checked });
    });

    this.createCheckbox(container, '显示轮廓', config.display.showOutline, (checked) => {
      appearanceManager.setDisplayConfig({ showOutline: checked });
    });
  }

  // 渲染个性标签页
  private renderPersonalityTab(container: HTMLElement): void {
    const config = personalityManager.getConfig();

    // 名字输入框
    this.createInput(container, '名字', config.name, (value) => {
      personalityManager.setName(value);
    });

    // 性格描述输入框
    this.createInput(container, '性格描述', config.personality, (value) => {
      personalityManager.setPersonality(value);
    });

    // 行为倾向滑块
    this.createSlider(container, '活跃度', config.tendencies.activity, 0, 1, (value) => {
      personalityManager.setTendencies({ activity: value });
    });

    this.createSlider(container, '友好度', config.tendencies.friendliness, 0, 1, (value) => {
      personalityManager.setTendencies({ friendliness: value });
    });

    this.createSlider(container, '好奇心', config.tendencies.curiosity, 0, 1, (value) => {
      personalityManager.setTendencies({ curiosity: value });
    });

    this.createSlider(container, '困倦度', config.tendencies.sleepiness, 0, 1, (value) => {
      personalityManager.setTendencies({ sleepiness: value });
    });
  }

  // 渲染主题标签页
  private renderThemeTab(container: HTMLElement): void {
    const themes = themeManager.getAllThemes();
    const currentTheme = themeManager.getCurrentTheme();

    themes.forEach((theme) => {
      const themeItem = document.createElement('div');
      themeItem.style.cssText = `
        display: flex;
        align-items: center;
        padding: 12px;
        margin-bottom: 8px;
        border: 2px solid ${theme.id === currentTheme.id ? '#FF6B6B' : '#eee'};
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
      `;

      const themeInfo = document.createElement('div');
      themeInfo.style.cssText = `
        flex: 1;
      `;

      const themeName = document.createElement('div');
      themeName.textContent = theme.name;
      themeName.style.cssText = `
        font-weight: bold;
        margin-bottom: 4px;
      `;

      const themeDesc = document.createElement('div');
      themeDesc.textContent = theme.description;
      themeDesc.style.cssText = `
        font-size: 12px;
        color: #666;
      `;

      themeInfo.appendChild(themeName);
      themeInfo.appendChild(themeDesc);
      themeItem.appendChild(themeInfo);

      themeItem.addEventListener('click', async () => {
        await themeManager.switchTheme(theme.id);
        this.updateContent();
      });

      themeItem.addEventListener('mouseenter', () => {
        themeItem.style.background = '#f8f8f8';
      });

      themeItem.addEventListener('mouseleave', () => {
        themeItem.style.background = 'white';
      });

      container.appendChild(themeItem);
    });
  }

  // 渲染配置标签页
  private renderConfigTab(container: HTMLElement): void {
    // 导出配置按钮
    const exportButton = this.createButton('导出配置', async () => {
      try {
        await configManagerComponent.exportToFile();
        alert('配置导出成功！');
      } catch (error) {
        alert('配置导出失败：' + error);
      }
    });
    container.appendChild(exportButton);

    // 导入配置按钮
    const importButton = this.createButton('导入配置', async () => {
      try {
        const success = await configManagerComponent.importFromFile();
        if (success) {
          alert('配置导入成功！');
          this.updateContent();
        } else {
          alert('配置导入失败');
        }
      } catch (error) {
        alert('配置导入失败：' + error);
      }
    });
    container.appendChild(importButton);

    // 重置配置按钮
    const resetButton = this.createButton('重置为默认', async () => {
      if (confirm('确定要重置所有配置吗？')) {
        try {
          await configManagerComponent.resetConfig();
          alert('配置已重置');
          this.updateContent();
        } catch (error) {
          alert('配置重置失败：' + error);
        }
      }
    });
    container.appendChild(resetButton);
  }

  // 创建滑块
  private createSlider(
    container: HTMLElement,
    label: string,
    value: number,
    min: number,
    max: number,
    onChange: (value: number) => void
  ): void {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      margin-bottom: 16px;
    `;

    const labelElement = document.createElement('label');
    labelElement.style.cssText = `
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
      color: #333;
    `;

    const labelText = document.createElement('span');
    labelText.textContent = label;

    const valueText = document.createElement('span');
    valueText.textContent = value.toFixed(2);
    valueText.style.color = '#666';

    labelElement.appendChild(labelText);
    labelElement.appendChild(valueText);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = String(min);
    slider.max = String(max);
    slider.step = '0.01';
    slider.value = String(value);
    slider.style.cssText = `
      width: 100%;
      height: 6px;
      -webkit-appearance: none;
      background: #ddd;
      border-radius: 3px;
      outline: none;
    `;

    slider.addEventListener('input', () => {
      const newValue = parseFloat(slider.value);
      valueText.textContent = newValue.toFixed(2);
      onChange(newValue);
    });

    wrapper.appendChild(labelElement);
    wrapper.appendChild(slider);
    container.appendChild(wrapper);
  }

  // 创建颜色选择器
  private createColorPicker(
    container: HTMLElement,
    label: string,
    value: string,
    onChange: (color: string) => void
  ): void {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    `;

    const labelElement = document.createElement('label');
    labelElement.textContent = label;
    labelElement.style.cssText = `
      font-size: 14px;
      color: #333;
    `;

    const input = document.createElement('input');
    input.type = 'color';
    input.value = value;
    input.style.cssText = `
      width: 40px;
      height: 32px;
      border: 1px solid #ccc;
      border-radius: 4px;
      cursor: pointer;
    `;

    input.addEventListener('input', () => {
      onChange(input.value);
    });

    wrapper.appendChild(labelElement);
    wrapper.appendChild(input);
    container.appendChild(wrapper);
  }

  // 创建复选框
  private createCheckbox(
    container: HTMLElement,
    label: string,
    checked: boolean,
    onChange: (checked: boolean) => void
  ): void {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      display: flex;
      align-items: center;
      margin-bottom: 12px;
    `;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = checked;
    checkbox.style.cssText = `
      margin-right: 8px;
      width: 16px;
      height: 16px;
    `;

    const labelElement = document.createElement('label');
    labelElement.textContent = label;
    labelElement.style.cssText = `
      font-size: 14px;
      color: #333;
      cursor: pointer;
    `;

    checkbox.addEventListener('change', () => {
      onChange(checkbox.checked);
    });

    wrapper.appendChild(checkbox);
    wrapper.appendChild(labelElement);
    container.appendChild(wrapper);
  }

  // 创建输入框
  private createInput(
    container: HTMLElement,
    label: string,
    value: string,
    onChange: (value: string) => void
  ): void {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      margin-bottom: 16px;
    `;

    const labelElement = document.createElement('label');
    labelElement.textContent = label;
    labelElement.style.cssText = `
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
      color: #333;
    `;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = value;
    input.style.cssText = `
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 14px;
      box-sizing: border-box;
    `;

    input.addEventListener('input', () => {
      onChange(input.value);
    });

    wrapper.appendChild(labelElement);
    wrapper.appendChild(input);
    container.appendChild(wrapper);
  }

  // 创建按钮
  private createButton(text: string, onClick: () => void): HTMLElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.cssText = `
      width: 100%;
      padding: 12px;
      margin-bottom: 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: white;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    `;

    button.addEventListener('click', onClick);
    button.addEventListener('mouseenter', () => {
      button.style.background = '#f0f0f0';
    });
    button.addEventListener('mouseleave', () => {
      button.style.background = 'white';
    });

    return button;
  }

  // 创建底部按钮
  private createFooter(): HTMLElement {
    const footer = document.createElement('div');
    footer.style.cssText = `
      display: flex;
      justify-content: flex-end;
      padding: 16px 20px;
      border-top: 1px solid #eee;
    `;

    const closeButton = document.createElement('button');
    closeButton.textContent = '关闭';
    closeButton.style.cssText = `
      padding: 8px 24px;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: white;
      cursor: pointer;
      font-size: 14px;
    `;
    closeButton.addEventListener('click', () => this.close());

    footer.appendChild(closeButton);
    return footer;
  }
}

// 导出全局设置对话框实例
export const settingsDialog = SettingsDialog.getInstance();