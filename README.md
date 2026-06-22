# PixelBuddy - 桌面像素宠物

一个可爱的桌面像素宠物，使用 Tauri (Rust + TypeScript) 构建。

## 功能特性

- 🎮 **智能行为系统**：基于时间、用户交互、系统状态等因素的智能行为
- 🎨 **完整自定义系统**：支持外观和个性的图形界面配置
- 🎭 **实时主题切换**：完整的视觉主题系统，支持实时切换
- 💾 **配置导入导出**：支持配置备份和分享
- 🖱️ **丰富交互方式**：点击、拖拽、双击、长按、滚轮等多种交互

## 下载安装

### 从 GitHub Releases 下载

1. 访问 [Releases](https://github.com/YOUR_USERNAME/pixel-buddy/releases) 页面
2. 下载适合您操作系统的安装包：
   - **Windows**: `PixelBuddy_x.x.x_x64-setup.exe` 或 `PixelBuddy_x.x.x_x64_en-US.msi`
   - **macOS**: `PixelBuddy_x.x.x_aarch64.dmg` (Apple Silicon) 或 `PixelBuddy_x.x.x_x64.dmg` (Intel)
   - **Linux**: `PixelBuddy_x.x.x_amd64.deb` 或 `PixelBuddy_x.x.x_amd64.AppImage`
3. 运行安装包完成安装

## 开发

### 环境要求

- Rust 1.77+
- Node.js 18+
- pnpm 8+

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm tauri dev
```

### 构建

```bash
pnpm tauri build
```

## 发布

### 自动发布（推荐）

1. 更新 `src-tauri/tauri.conf.json` 中的版本号
2. 更新 `package.json` 中的版本号
3. 提交更改
4. 创建并推送 tag：

```bash
git tag v0.1.0
git push origin v0.1.0
```

5. GitHub Actions 会自动构建并发布到 Releases 页面

### 手动发布

```bash
pnpm tauri build
```

构建完成后，安装包位于 `src-tauri/target/release/bundle/` 目录下。

## 项目结构

```
pixel-buddy/
├── src/                          # 前端代码
│   ├── core/                     # 核心模块
│   │   ├── engine/               # 行为引擎
│   │   ├── state/                # 状态管理
│   │   └── events/               # 事件系统
│   ├── systems/                  # 功能系统
│   │   ├── animation/            # 动画系统
│   │   ├── interaction/          # 交互系统
│   │   ├── customization/        # 自定义系统
│   │   └── theme/                # 主题系统
│   ├── ui/                       # 用户界面
│   │   ├── components/           # UI组件
│   │   └── settings/             # 设置界面
│   └── utils/                    # 工具函数
├── src-tauri/                    # Rust 后端
│   ├── src/                      # Rust 源代码
│   ├── icons/                    # 应用图标
│   ├── Cargo.toml                # Rust 依赖
│   └── tauri.conf.json           # Tauri 配置
├── .github/workflows/            # GitHub Actions
│   └── release.yml               # 发布工作流
├── package.json
└── README.md
```

## 技术栈

- **前端**: TypeScript, Vite, CSS Animations
- **后端**: Rust, Tauri
- **构建**: pnpm, Cargo
- **CI/CD**: GitHub Actions

## 许可证

MIT License