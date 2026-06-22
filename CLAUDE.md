# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PixelBuddy is a desktop pixel pet application built with Tauri (Rust + TypeScript). The pet displays on the desktop with transparent window, supports intelligent behaviors based on time/user interaction/system state, and allows customization of appearance and personality.

## Build & Development Commands

```bash
# Install dependencies
pnpm install

# Development mode (starts both frontend and Tauri)
pnpm tauri dev

# Build frontend only
pnpm build

# Build full application (creates installer)
pnpm tauri build

# Check Rust compilation
cd src-tauri && cargo check
```

## Architecture

### Frontend (TypeScript/Vite)

The frontend uses a modular architecture with event-driven communication:

**Core Modules** (`src/core/`):
- `events/` - EventBus singleton for inter-module communication
- `state/` - StateMachine manages 8 pet states: idle, happy, sleep, walk, active, playing, drag, error
- `engine/` - RuleEngine evaluates behavior rules based on conditions (time, interaction, system state)

**Systems** (`src/systems/`):
- `animation/` - Animator for frame control, SpriteManager for sprite loading/code-drawn placeholder
- `interaction/` - InputHandler processes mouse/touch events (click, double-click, drag, scroll, hover)
- `customization/` - AppearanceManager (visual config) and PersonalityManager (behavior tendencies)
- `theme/` - ThemeManager supports real-time theme switching

**UI** (`src/ui/`):
- `settings/` - SettingsDialog with tabs for appearance, personality, theme, config import/export
- `components/` - PetUI for particle effects, ConfigManagerComponent for import/export

**Key Pattern**: All modules are singletons accessed via `getInstance()`. Communication happens through EventBus, not direct coupling.

### Backend (Rust/Tauri)

`src-tauri/src/main.rs` handles:
- Window management (transparent, frameless, always-on-top)
- System tray with context menu
- Tauri commands exposed to frontend: `toggle_window_visibility`, `set_window_position`, `get_window_position`

### Sprite System

The SpriteManager supports two modes:
1. **Code-drawn placeholder** (default) - Canvas-based rendering with eyes, mouth, expressions
2. **Sprite sheets** - Load PNG sprite sheets with horizontal frame layout (32x32 per frame)

Sprite sheet format: `{state}.png` with frames arranged horizontally (e.g., 4 frames = 128x32)

## Key Configuration Files

- `src-tauri/tauri.conf.json` - Tauri app config (window, bundle, tray)
- `src-tauri/Cargo.toml` - Rust dependencies
- `package.json` - Frontend dependencies and scripts
- `vite.config.ts` - Vite build config with Tauri-specific settings

## State Machine Flow

```
idle ↔ active ↔ playing
  ↓       ↓
sleep   walk
  ↓
happy (triggered by click)
drag (triggered by drag)
```

States transition via: timeout, random chance, user interaction, or rule engine triggers.

## Release Process

Push a version tag to trigger GitHub Actions:
```bash
git tag v0.1.0
git push origin v0.1.0
```

This builds Windows (exe/msi), macOS (dmg for Intel + Apple Silicon), and Linux (deb/AppImage) automatically.

## Current Status

- Core systems (state machine, rule engine, event bus, interaction) are functional
- Sprite system works with code-drawn placeholder; needs actual pixel sprite sheets
- Settings UI is functional for appearance/personality/theme configuration
- Mouse passthrough (click-through to desktop) is not yet implemented
