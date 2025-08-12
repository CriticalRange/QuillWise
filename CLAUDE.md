# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

QuillWise is an AI-powered writing assistant desktop application built with Electron, React, TypeScript, and Tailwind CSS. It provides translation, summarization, and text enhancement tools through a floating overlay system and global hotkeys.

## Development Commands

### Build and Development
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the application for production
- `npm run preview` - Preview the built application

### Code Quality
- `npm run check` - Run type checking and linting
- `npm run type-check` - Run TypeScript type checking only
- `npm run lint` - Run ESLint with max 100 warnings
- `npm run lint:fix` - Fix linting errors automatically

### Distribution
- `npm run pack` - Build and package without creating installer
- `npm run dist` - Build and create distribution packages
- `npm run dist:win` - Create Windows installer
- `npm run dist:mac` - Create macOS installer
- `npm run dist:linux` - Create Linux installer

## Architecture Overview

### Electron Main Process (`electron/main.ts`)
The main process handles:
- Window management (main window and overlay window)
- System tray integration
- Global hotkey registration using uIOhook
- Text input detection and floating overlay system
- Settings persistence with electron-store
- IPC communication between main and renderer processes

### React Frontend (`src/`)
- **State Management**: Zustand stores for app state, settings, prompts, and AI tools
- **Routing**: React Router with pages for different features (Main, Settings, Library, etc.)
- **Components**: Reusable UI components with Tailwind CSS styling
- **Hooks**: Custom hooks like `useFloatingOverlay` for floating overlay functionality

### Key Features
- **Floating Overlay System**: Text input detection and AI suggestions overlay
- **Global Hotkeys**: System-wide shortcuts using uIOhook-napi
- **Multi-page Interface**: Main app, settings, library, and specialized AI tool pages
- **Persistent Storage**: Settings and data stored using electron-store

### Store Structure
- `useAppStore`: Global app state, window management, navigation
- `useSettingsStore`: User preferences, theme, hotkeys
- `usePromptStore`: Custom prompts and categories management
- `useAIToolsStore`: AI service integration and caching

### AI Service (`src/utils/aiService.ts`)
Mock AI service for development with caching system. Provides text improvement, completion, rephrasing, and summarization features.

## Important Implementation Notes

- The application uses a sophisticated floating overlay system that detects text inputs globally
- Global hotkeys are managed through uIOhook-napi for cross-platform support
- Settings are persisted automatically and include window state management
- The app supports system tray integration with hide-to-tray functionality
- Error handling includes comprehensive logging to user data directory