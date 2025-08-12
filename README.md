# QuillWise - AI-Powered Writing Assistant

<div align="center">

![QuillWise Logo](src/assets/icon.png)

**Intelligent writing assistance with AI-powered translation, summarization, and text enhancement**

[![Version](https://img.shields.io/badge/version-0.0.1-blue.svg)](https://github.com/quillwise/quillwise)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-28.1.4-47848f.svg)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18.2.0-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-3178c6.svg)](https://www.typescriptlang.org/)

[Download](#installation) • [Features](#features) • [Documentation](#development) • [Contributing](#contributing)

</div>

## 🚀 Overview

QuillWise is a sophisticated desktop application that brings AI-powered writing assistance directly to your workflow. With global hotkeys, floating overlays, and seamless integration across all applications, QuillWise enhances your writing experience with intelligent suggestions, translations, and text improvements.

### ✨ Key Highlights

- **🌍 Global Accessibility**: Works in any application with system-wide hotkeys
- **🎯 Floating Overlay**: Intelligent suggestions appear contextually as you type
- **🧠 AI-Powered Tools**: Translation, summarization, enhancement, and completion
- **⚡ Real-time Processing**: Instant text analysis and suggestions
- **🎨 Modern Interface**: Beautiful, responsive UI built with React and Tailwind CSS
- **🔒 Privacy-First**: Local processing with optional cloud AI integration

## 🎯 Features

### Core Writing Tools

#### 📝 **Text Enhancement**
- Grammar and style corrections
- Clarity and readability improvements
- Tone adjustment and formality optimization
- Writing style suggestions

#### 🌐 **Smart Translation**
- Multi-language translation support
- Context-aware translations
- Preserve formatting and structure
- Real-time language detection

#### 📄 **Intelligent Summarization**
- Extract key points from long texts
- Adjustable summary length
- Bullet point and paragraph formats
- Topic highlighting

#### ✍️ **Text Completion**
- Smart autocomplete suggestions
- Context-aware completions
- Writing flow enhancement
- Creative writing assistance

### Advanced Features

#### 🎮 **Global Hotkeys**
- System-wide keyboard shortcuts
- Customizable key combinations
- Quick access to AI tools
- Clipboard integration

#### 💬 **Floating Overlay System**
- Text input detection
- Real-time suggestions
- Minimal interference
- Smart positioning

#### 🎨 **Custom Prompts Library**
- Create and manage custom prompts
- Categorized prompt organization
- Import/export functionality
- Template sharing

#### ⚙️ **Flexible AI Integration**
- OpenAI GPT models support
- Google Gemini integration
- Local Ollama models
- Configurable AI providers

## 🏗️ Architecture

### Technology Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Desktop Framework**: Electron 28
- **State Management**: Zustand
- **Build System**: Vite + electron-vite
- **Styling**: Tailwind CSS with custom components
- **Icons**: Lucide React
- **Notifications**: Sonner

### Project Structure

```
QuillWise/
├── electron/                 # Electron main process
│   ├── main.ts              # Main process entry point
│   └── preload/             # Preload scripts
├── src/                     # React application
│   ├── components/          # Reusable UI components
│   ├── pages/              # Application pages
│   ├── store/              # Zustand state management
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   └── types/              # TypeScript definitions
├── build/                  # Build resources
│   ├── installer.nsh       # NSIS installer script
│   └── icon.png           # Application icon
└── release/               # Distribution files
```

### Core Components

#### 🖥️ **Main Process** (`electron/main.ts`)
- Window management (main + overlay windows)
- System tray integration
- Global hotkey registration using uIOhook
- Settings persistence with electron-store
- IPC communication

#### ⚛️ **React Frontend** (`src/`)
- **State Management**: Zustand stores for app state, settings, prompts, and AI tools
- **Routing**: React Router with pages for different features
- **Components**: Reusable UI components with Tailwind CSS
- **Hooks**: Custom hooks like `useFloatingOverlay`

#### 📊 **State Stores**
- `useAppStore`: Global app state and navigation
- `useSettingsStore`: User preferences and configuration
- `usePromptStore`: Custom prompts management
- `useAIToolsStore`: AI service integration and caching

## 📦 Installation

### For End Users

#### Windows
1. Download the latest `QuillWise Setup.exe` from [Releases](https://github.com/quillwise/quillwise/releases)
2. Run the installer and select your preferred language
3. Follow the installation wizard
4. Launch QuillWise from the desktop or start menu

#### macOS
1. Download the latest `QuillWise.dmg` from [Releases](https://github.com/quillwise/quillwise/releases)
2. Open the DMG file and drag QuillWise to Applications
3. Launch from Applications folder

#### Linux
1. Download the latest `QuillWise.AppImage` from [Releases](https://github.com/quillwise/quillwise/releases)
2. Make it executable: `chmod +x QuillWise.AppImage`
3. Run the AppImage

### Multi-language Installer Support
The Windows installer supports multiple languages:
- **English** (Default)
- **Türkçe** (Turkish)
- **Français** (French)
- **Deutsch** (German)

## 🚀 Quick Start

### First Launch
1. **Onboarding**: Complete the initial setup wizard
2. **AI Configuration**: Configure your preferred AI provider
3. **Hotkeys Setup**: Customize global keyboard shortcuts
4. **Test Features**: Try the floating overlay and text enhancement

### Basic Usage
1. **Global Access**: Use configured hotkeys in any application
2. **Text Selection**: Select text and use QuillWise tools
3. **Floating Overlay**: Start typing to see intelligent suggestions
4. **Custom Prompts**: Create and use personalized writing prompts

## 🛠️ Development

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Git**

### Setup
```bash
# Clone the repository
git clone https://github.com/quillwise/quillwise.git
cd quillwise

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

#### Development
```bash
npm run dev          # Start development server with hot reload
npm run preview      # Preview the built application
```

#### Building
```bash
npm run build        # Build for production
npm run pack         # Package without installer
npm run dist         # Create distribution packages
npm run dist:win     # Create Windows installer
npm run dist:mac     # Create macOS installer
npm run dist:linux   # Create Linux installer
```

#### Code Quality
```bash
npm run check        # Run type checking and linting
npm run type-check   # TypeScript type checking only
npm run lint         # ESLint with max 100 warnings
npm run lint:fix     # Fix linting errors automatically
```

### Development Workflow

1. **Feature Development**: Create feature branches from `main`
2. **Code Quality**: Run `npm run check` before commits
3. **Testing**: Test on target platforms
4. **Documentation**: Update README and docs as needed
5. **Pull Request**: Submit for review

### Building Installers

The project includes comprehensive installer configurations:

#### Windows (NSIS)
- Multi-language support (EN, TR, FR, DE)
- Custom branding and icons
- Registry entries and file associations
- Uninstaller with cleanup

#### macOS (DMG)
- Notarized builds (when configured)
- Custom DMG styling
- Application signing

#### Linux (AppImage)
- Universal Linux compatibility
- Desktop integration
- Icon and menu entries

## ⚙️ Configuration

### AI Providers
Configure AI services in Settings:

```typescript
// OpenAI Configuration
{
  provider: 'openai',
  apiKey: 'your-api-key',
  model: 'gpt-3.5-turbo',
  maxTokens: 1000
}

// Local Ollama
{
  provider: 'ollama',
  baseUrl: 'http://localhost:11434',
  model: 'llama2'
}
```

### Global Hotkeys
Customize keyboard shortcuts:
- **Quick Enhancement**: `Ctrl+Alt+E`
- **Translation**: `Ctrl+Alt+T`
- **Summarization**: `Ctrl+Alt+S`
- **Floating Overlay**: `Ctrl+Alt+Q`

### Floating Overlay
Configure overlay behavior:
- **Auto-detection**: Enable/disable text input detection
- **Positioning**: Smart positioning based on cursor location
- **Debounce**: Adjust suggestion timing
- **Themes**: Light/dark mode support

## 🔧 API Reference

### AI Service Interface
```typescript
interface AIService {
  translate(text: string, targetLang: string): Promise<string>
  enhance(text: string): Promise<string>
  summarize(text: string, options?: SummaryOptions): Promise<string>
  complete(text: string, maxLength?: number): Promise<string>
}
```

### Store Interfaces
```typescript
// App Store
interface AppStore {
  currentPage: string
  isOverlayVisible: boolean
  setCurrentPage: (page: string) => void
  showOverlay: (position: OverlayPosition) => void
}

// Settings Store
interface SettingsStore {
  theme: 'light' | 'dark'
  language: string
  hotkeys: HotkeyConfig
  aiProvider: AIProviderConfig
}
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Guidelines
1. **Code Style**: Follow TypeScript and React best practices
2. **Commits**: Use conventional commit messages
3. **Testing**: Add tests for new features
4. **Documentation**: Update docs for API changes

### Reporting Issues
- Use the [Issue Tracker](https://github.com/quillwise/quillwise/issues)
- Provide detailed reproduction steps
- Include system information and logs

## 📋 Roadmap

### Version 0.1.0
- [ ] Enhanced AI model support
- [ ] Plugin system for extensions
- [ ] Cloud sync for settings and prompts
- [ ] Advanced text analysis features

### Version 0.2.0
- [ ] Team collaboration features
- [ ] Advanced prompt templates
- [ ] Performance optimizations
- [ ] Mobile companion app

### Future Releases
- [ ] Voice input and commands
- [ ] Real-time collaboration
- [ ] Advanced AI fine-tuning
- [ ] Enterprise features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Wiki](https://github.com/quillwise/quillwise/wiki)
- **Issues**: [GitHub Issues](https://github.com/quillwise/quillwise/issues)
- **Discussions**: [GitHub Discussions](https://github.com/quillwise/quillwise/discussions)
- **Email**: [contact@quillwise.com](mailto:contact@quillwise.com)

## 🙏 Acknowledgments

- [Electron](https://www.electronjs.org/) - Cross-platform desktop framework
- [React](https://reactjs.org/) - UI framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [Lucide](https://lucide.dev/) - Icon library

---

<div align="center">

**Made with ❤️ by CriticalRange**

⭐ Star us on GitHub if you find QuillWise useful!

</div>
