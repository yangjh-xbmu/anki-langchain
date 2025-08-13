# Anki LangChain 智能单词学习系统

一个结合 Anki 和 LangChain 的现代化单词学习应用，使用 Google Gemini AI 模型提供智能定义生成，支持从 Anki 卡片中提取已有图片和离线语音合成，打造完整的单词学习生态系统。

## ✨ 核心特性

- 🤖 **Google Gemini AI**: 使用最新的 Gemini-2.0-Flash 模型生成准确的单词定义
- 🃏 **Anki 深度集成**: 智能提取 Anki 卡片中的单词、释义和已有图片
- 🔊 **智能音频播放**: 支持自动播放和手动播放，单词载入后延迟1秒自动播放音频
- 🎯 **智能输入体验**: 单词加载完成后自动聚焦到输入框，优化输入法设置
- 🎵 **离线语音合成**: 使用 pyttsx3 实现完全离线的文本转语音功能
- 🖼️ **智能图片处理**: 支持 Base64、URL 和 Anki 媒体文件等多种图片格式
- 💰 **成本优化**: 避免 AI 图片生成和付费 TTS 服务，大幅降低使用成本
- 🌐 **现代化界面**: 基于 Next.js 和 Tailwind CSS 的响应式前端
- 🔧 **开发友好**: 完整的 VSCode 开发环境和调试配置

## 🏗️ 项目架构

```
anki-langchain/
├── backend/                    # Flask 后端服务
│   ├── app/                   # 核心应用模块
│   │   ├── __init__.py        # Flask 应用工厂
│   │   ├── models.py          # SQLAlchemy 数据模型
│   │   ├── routes.py          # RESTful API 路由
│   │   ├── anki_service.py    # Anki 连接与数据提取
│   │   └── langchain_service.py # Gemini AI 集成服务
│   ├── static/audio/          # 生成的音频文件存储
│   ├── instance/              # SQLite 数据库文件
│   ├── requirements.txt       # Python 依赖包
│   ├── run.py                # 应用启动入口
│   └── venv/                 # Python 虚拟环境
├── frontend/                  # Next.js 前端应用
│   ├── pages/                # Next.js 页面路由
│   │   ├── index.tsx         # 主学习界面
│   │   └── _app.js           # 应用根组件
│   ├── src/components/       # React 组件库
│   ├── styles/               # Tailwind CSS 样式
│   ├── public/               # 静态资源文件
│   └── package.json          # Node.js 依赖配置
├── scripts/                   # 开发工具脚本
│   ├── setup_proxy.sh        # 网络代理配置
│   └── auto_proxy.sh         # 自动代理管理
├── .vscode/                   # VSCode 开发配置
│   ├── settings.json         # 编辑器设置
│   ├── launch.json           # 调试配置
│   └── tasks.json            # 构建任务
└── .env                       # 环境变量配置
```

## 🚀 快速开始

### 1. 环境准备

确保已安装以下软件：
- **Python 3.8+**: 后端 Flask 应用运行环境
- **Node.js 16+**: 前端 Next.js 应用构建环境
- **Anki 桌面版**: 需要安装 AnkiConnect 插件（代码：2055492159）
- **Google API Key**: 用于访问 Gemini AI 模型

### 2. 代理配置（可选）

如果需要使用代理访问 OpenAI API：

```bash
# 交互式代理管理
./scripts/setup_proxy.sh

# 快速设置所有代理
./scripts/setup_proxy.sh set

# 取消所有代理
./scripts/setup_proxy.sh unset

# 查看代理状态
./scripts/setup_proxy.sh status
```

### 3. VSCode 开发环境

本项目已配置 VSCode 开发环境：

- **自动代理**: 终端启动时自动配置代理（127.0.0.1:10808）
- **虚拟环境**: 自动激活 Python 虚拟环境
- **调试配置**: 支持 Flask 和 React 应用调试
- **推荐扩展**: 自动推荐必要的开发扩展

#### 终端配置

- `zsh-with-proxy`: 默认终端，自动配置代理
- `zsh-no-proxy`: 无代理终端

可以通过 VSCode 终端选择器切换不同的终端配置。

### 4. 后端设置

```bash
# 进入后端目录
cd backend

# 激活虚拟环境
source venv/bin/activate

# 安装依赖（包含 Gemini AI 和离线 TTS 支持）
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入你的 Google API Key
# GOOGLE_API_KEY=your-google-api-key-here

# 创建音频文件存储目录
mkdir -p static/audio

# 启动后端服务（默认端口 5001）
python run.py
```

后端服务启动后将在 `http://localhost:5001` 提供 API 服务。

### 5. 前端设置

```bash
# 进入前端目录
cd frontend

# 安装依赖（Next.js + Tailwind CSS）
npm install

# 启动开发服务器（默认端口 3000）
npm run dev
```

**注意**: 本项目使用 npm 作为包管理工具，已配置 `.npmrc` 和 `package.json` 来确保一致性。

前端应用启动后将在 `http://localhost:3000` 提供用户界面。

### 6. Anki 配置

1. 安装 AnkiConnect 插件：
   - 打开 Anki
   - 工具 → 插件 → 获取插件
   - 输入代码：`2055492159`
   - 重启 Anki

2. 确保 AnkiConnect 正在运行（Anki 打开时自动运行）

## VSCode 任务和调试

### 可用任务（Ctrl/Cmd + Shift + P → Tasks: Run Task）

- `Install Backend Dependencies`: 安装后端依赖
- `Install Frontend Dependencies`: 安装前端依赖
- `Start Backend`: 启动后端服务
- `Start Frontend`: 启动前端服务
- `Setup Project`: 一键安装所有依赖

### 调试配置（F5 启动调试）

- `Flask Backend`: 调试后端 Flask 应用
- `React Frontend`: 调试前端 React 应用
- `Launch Full Stack`: 同时启动前后端

## 代理设置详解

### 自动代理配置

项目配置了自动代理设置，在 VSCode 终端启动时会：

1. 自动设置环境变量代理
2. 配置 Git 代理
3. 测试代理连接
4. 显示代理状态

### 手动代理管理

使用 `scripts/setup_proxy.sh` 脚本可以：

- 设置/取消环境变量代理
- 设置/取消 Git 代理
- 设置/取消 npm 代理
- 设置/取消 pip 代理
- 检查代理连接状态

### 代理配置说明

- **代理地址**: 127.0.0.1:10808
- **支持协议**: HTTP/HTTPS
- **绕过地址**: localhost, 127.0.0.1, ::1

## ⚙️ 环境变量配置

复制 `backend/.env.example` 到 `backend/.env` 并配置：

```env
# Flask 应用配置
FLASK_APP=run.py
FLASK_ENV=development
FLASK_DEBUG=1
SECRET_KEY=dev-secret-key-change-in-production
PORT=5001

# 数据库配置
DATABASE_URL=sqlite:///anki_langchain.db

# Google Gemini AI 配置
GOOGLE_API_KEY=your-google-api-key-here

# AnkiConnect 配置
ANKI_CONNECT_URL=http://localhost:8765

# 开发环境配置
PYTHONPATH=./backend

# 代理配置（如需要）
# HTTP_PROXY=http://proxy.company.com:8080
# HTTPS_PROXY=http://proxy.company.com:8080
# NO_PROXY=localhost,127.0.0.1
```

### 获取 Google API Key

1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 创建新的 API Key
3. 将 API Key 填入 `.env` 文件的 `GOOGLE_API_KEY` 字段

## 🎯 功能特性

### 核心学习功能
- 🃏 **Anki 深度集成**: 自动同步 Anki 卡片，提取单词、释义和图片
- 🤖 **Gemini AI 定义**: 使用 Google Gemini-2.0-Flash 生成准确的单词定义
- 🔊 **智能音频播放**: 
  - **自动播放**: 单词载入后延迟1秒自动播放音频
  - **手动播放**: 支持 Shift+P 快捷键和播放按钮
  - **音频优先级**: Anki有道API > Anki媒体文件 > 本地TTS生成
- 🎵 **离线语音合成**: pyttsx3 实现的完全离线 TTS，支持英语发音
- 🖼️ **智能图片处理**: 支持 Anki 卡片中的 Base64、URL 和媒体文件图片
- 🎯 **交互式学习**: 单词练习、发音播放和即时反馈

### 技术特性
- 💰 **成本优化**: 无需付费 API，大幅降低使用成本
- 🌐 **现代化架构**: Next.js + Flask + SQLAlchemy 技术栈
- 📱 **响应式设计**: Tailwind CSS 实现的美观界面
- 🔧 **开发友好**: 完整的 VSCode 配置和调试支持
- 🚀 **高性能**: 离线处理和智能缓存机制

## 🔧 故障排除

### Google API 相关问题

1. **API Key 无效**
   - 检查 `.env` 文件中的 `GOOGLE_API_KEY` 是否正确
   - 确认 API Key 在 Google AI Studio 中有效
   - 检查 API 配额是否已用完

2. **网络连接问题**
   - 如果在国内使用，可能需要配置代理
   - 使用 `./scripts/setup_proxy.sh` 配置网络代理

### 语音合成问题

1. **pyttsx3 初始化失败**
   - macOS: 确保系统语音服务正常
   - Linux: 安装 `espeak` 或 `festival`
   - Windows: 确保 SAPI 服务可用

2. **音频文件生成失败**
   - 检查 `backend/static/audio/` 目录权限
   - 确保有足够的磁盘空间

### Anki 连接问题

1. **AnkiConnect 连接失败**
   - 确保 Anki 桌面版正在运行
   - 确认 AnkiConnect 插件已安装（代码：2055492159）
   - 检查端口 8765 是否被占用

2. **卡片数据提取问题**
   - 确保 Anki 中有学习中的卡片
   - 检查卡片字段格式是否正确

### 依赖安装问题

1. **Python 依赖问题**
   - 确保虚拟环境已激活
   - 升级 pip: `pip install --upgrade pip`
   - 如遇编译错误，安装系统开发工具

2. **Node.js 依赖问题**
   - 清除缓存: `npm cache clean --force`
- 删除 `node_modules` 重新安装: `rm -rf node_modules && npm install`
   - 确保 Node.js 版本 >= 16
   - 确保 npm 版本 >= 8.0.0

## 📚 技术栈

### 后端技术
- **Flask 2.3.3**: Web 框架
- **SQLAlchemy 2.0.23**: ORM 数据库操作
- **LangChain 0.0.350**: AI 应用框架
- **langchain-google-genai 1.0.10**: Google Gemini AI 集成
- **pyttsx3 2.90**: 离线文本转语音
- **requests 2.31.0**: HTTP 客户端

### 前端技术
- **Next.js 14.0.4**: React 全栈框架
- **React 18.2.0**: 用户界面库
- **Tailwind CSS 4.1.11**: 原子化 CSS 框架
- **Axios**: HTTP 客户端
- **TypeScript**: 类型安全的 JavaScript

### 开发工具
- **VSCode**: 集成开发环境
- **Python venv**: 虚拟环境管理
- **npm**: Node.js 官方包管理器

## 📖 API 文档

### 后端 API 端点

#### 单词管理
- `GET /api/words` - 获取所有单词列表
- `POST /api/sync-anki` - 同步 Anki 卡片数据

#### 媒体生成
- `POST /api/generate-media` - 为单词生成图片和音频

### 数据模型

```python
class Word(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    anki_card_id = db.Column(db.Integer, unique=True, nullable=False)
    word = db.Column(db.String(100), nullable=False)
    meaning = db.Column(db.Text)
    deck_name = db.Column(db.String(100))
    image_url = db.Column(db.String(500))
    audio_url = db.Column(db.String(500))
    # 扩展字段
    phonetic = db.Column(db.String(100))  # 音标
    etymology = db.Column(db.Text)  # 词源
    exam_frequency = db.Column(db.Integer)  # 考试频率
    star_level = db.Column(db.Integer)  # 星级
    example_sentence = db.Column(db.Text)  # 真题例句
    example_translation = db.Column(db.Text)  # 例句释义
    related_words = db.Column(db.Text)  # 相关词
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

## 🤝 贡献指南

1. **Fork 项目** - 创建项目的个人副本
2. **创建功能分支** - `git checkout -b feature/amazing-feature`
3. **提交更改** - `git commit -m 'Add amazing feature'`
4. **推送到分支** - `git push origin feature/amazing-feature`
5. **创建 Pull Request** - 提交合并请求

### 开发规范
- 遵循 PEP 8 Python 代码规范
- 使用 TypeScript 进行前端开发
- 编写清晰的提交信息
- 添加必要的测试用例

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [Anki](https://apps.ankiweb.net/) - 强大的记忆卡片软件
- [Google Gemini](https://ai.google.dev/) - 先进的 AI 语言模型
- [LangChain](https://langchain.com/) - AI 应用开发框架
- [pyttsx3](https://pyttsx3.readthedocs.io/) - 离线文本转语音库