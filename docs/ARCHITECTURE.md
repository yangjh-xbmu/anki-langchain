# Anki-LangChain 技术架构文档

## 🏗️ 系统架构概览

### 整体架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   External      │
│   (Next.js)     │◄──►│   (Flask)       │◄──►│   Services      │
│                 │    │                 │    │                 │
│ • React/TypeScript │  │ • Python/Flask  │    │ • Anki Desktop  │
│ • Tailwind CSS │    │ • SQLAlchemy    │    │ • Google Gemini │
│ • Audio Player │    │ • AnkiConnect   │    │ • 有道API       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 技术栈选择

| 层级 | 技术选择 | 版本 | 选择原因 |
|------|----------|------|----------|
| 前端框架 | Next.js | 14.0.4 | React生态，SSR支持，开发效率高 |
| 前端语言 | TypeScript | 最新 | 类型安全，开发体验好 |
| 前端样式 | Tailwind CSS | ^3.4.17 | 快速开发，一致性好 |
| 后端框架 | Flask | 2.3.3 | 轻量级，Python生态丰富 |
| 数据库 | SQLite | 3.x | 轻量级，无需额外配置 |
| ORM | SQLAlchemy | 2.0.23 | Python标准ORM，功能完善 |
| AI模型 | Google Gemini | 2.0-Flash | 成本低，性能好，支持中文 |

## 📊 数据模型设计

### 核心数据模型

```python
class Word(db.Model):
    """单词模型"""
    id = db.Column(db.Integer, primary_key=True)
    anki_card_id = db.Column(db.Integer, unique=True, nullable=False)
    word = db.Column(db.String(100), nullable=False)        # 单词
    meaning = db.Column(db.Text)                            # 含义
    deck_name = db.Column(db.String(100))                   # 牌组名称
    image_url = db.Column(db.String(500))                   # 图片URL
    audio_url = db.Column(db.String(500))                   # 音频URL
    
    # 扩展字段
    phonetic = db.Column(db.String(100))                    # 音标
    etymology = db.Column(db.Text)                          # 词源
    exam_frequency = db.Column(db.Integer)                  # 考试频率
    star_level = db.Column(db.Integer)                      # 星级
    example_sentence = db.Column(db.Text)                   # 真题例句
    example_translation = db.Column(db.Text)                # 例句释义
    related_words = db.Column(db.Text)                      # 相关词
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

### 数据流设计

```
Anki Desktop ──► AnkiConnect API ──► Backend Service ──► Database
     │                                      │
     └── 卡片数据                          └── 处理&存储
     └── 媒体文件                          └── AI增强

Database ──► Backend API ──► Frontend ──► User Interface
    │              │              │
    └── 查询       └── JSON       └── 渲染显示
    └── 更新       └── RESTful    └── 交互操作
```

## 🔧 核心服务设计

### 1. AnkiService - Anki集成服务

**职责：**

- 连接Anki Desktop（通过AnkiConnect）
- 获取卡片数据和媒体文件
- 处理Anki数据格式

**核心方法：**

```python
class AnkiService:
    def get_cards(self) -> List[Dict]           # 获取卡片列表
    def get_media_file(self, filename: str)     # 获取媒体文件
    def _request(self, action: str, params)     # AnkiConnect请求
```

### 2. LangChainService - AI增强服务

**职责：**

- Google Gemini AI集成
- 音频URL处理和生成
- 内容增强和优化

**核心方法：**

```python
class LangChainService:
    def process_audio_url(self, word, audio_info=None)  # 音频处理入口
    def _process_anki_audio(self, audio_info)           # Anki音频处理
    def _get_anki_audio_url(self, filename)             # 媒体文件处理
    def generate_audio(self, word)                      # 本地TTS生成
    def _extract_field(self, fields, field_names)       # 字段提取
```

### 3. 音频处理架构

**音频源优先级：**

```
1. Anki有道API音频 (最高优先级)
   ├── 格式: http://dict.youdao.com/dictvoice?type=1&audio={word}
   └── 处理: _process_anki_audio() 中的 youdao_url 类型

2. Anki媒体文件音频
   ├── 通过AnkiConnect API获取
   └── 处理: _get_anki_audio_url()

3. 本地TTS生成 (最低优先级)
   ├── 仅在前两种都不可用时使用
   └── 处理: generate_audio()
```

**前端音频播放架构：**

```typescript
// 自动播放机制
useEffect(() => {
  if (currentWord?.audio_url) {
    const timer = setTimeout(() => {
      playAudio(currentWord.audio_url!);
    }, 1000); // 延迟1秒播放
    
    return () => clearTimeout(timer);
  }
}, [currentWord]);

// 音频播放函数
const playAudio = async (audioUrl: string) => {
  try {
    const audio = new Audio(audioUrl);
    await audio.play();
  } catch (error) {
    console.error("播放音频失败:", error);
  }
};
```

**播放方式：**

- 自动播放：单词载入后1秒自动播放
- 手动播放：Shift+P快捷键或点击播放按钮
- 错误处理：播放失败时控制台输出错误信息

## 🌐 API设计

### RESTful API端点

| 方法 | 端点 | 功能 | 参数 |
|------|------|------|------|
| GET | `/api/words` | 获取单词列表 | limit, offset |
| POST | `/api/sync-anki` | 同步Anki数据 | - |
| GET | `/api/words/{id}` | 获取单词详情 | id |
| PUT | `/api/words/{id}` | 更新单词信息 | id, 更新字段 |

### 数据格式

**单词数据格式：**

```json
{
  "id": 1,
  "anki_card_id": 1234567890,
  "word": "shape",
  "meaning": "n. 形状，外形；形态，特征...",
  "deck_name": "英语单词学习",
  "image_url": "data:image/jpeg;base64,...",
  "audio_url": "http://dict.youdao.com/dictvoice?type=1&audio=shape",
  "phonetic": "[ʃeɪp]",
  "etymology": "来自词根...",
  "exam_frequency": 27,
  "star_level": 2,
  "example_sentence": "Sometimes that really needs more courage.",
  "example_translation": "有时这真的需要更多勇气。",
  "related_words": "mould：通常指...",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

## 🎨 前端架构

### 组件结构

```
pages/
├── index.tsx                 # 主学习页面
└── _app.js                   # 应用根组件

src/components/
├── WordDisplay/              # 单词显示组件
├── AudioPlayer/              # 音频播放组件
├── DebugPanel/               # 调试面板组件
└── KeyboardShortcuts/        # 快捷键处理组件
```

### 状态管理

```typescript
// 主要状态
interface AppState {
  words: Word[]                 # 单词列表
  currentWordIndex: number      # 当前单词索引
  currentWord: Word | null      # 当前单词
  userInput: string            # 用户输入
  feedback: string             # 反馈信息
  isLoading: boolean           # 加载状态
}

// 音频状态
interface AudioState {
  audioRef: HTMLAudioElement   # 音频元素引用
  isPlaying: boolean           # 播放状态
  canAutoPlay: boolean         # 自动播放权限
}
```

### 键盘快捷键设计

| 快捷键 | 功能 | 实现位置 |
|--------|------|----------|
| Shift+P | 播放音频 | handleGlobalKeyPress |
| Enter | 提交答案 | handleKeyPress |
| Space | 下一个单词 | handleKeyPress |
| Escape | 清空输入 | handleKeyPress |

## 🔒 安全考虑

### 数据安全

- 环境变量管理（.env文件）
- API密钥保护
- 输入验证和清理
- SQL注入防护（SQLAlchemy ORM）

### 网络安全

- CORS配置
- 请求频率限制
- 错误信息脱敏

## 📈 性能优化

### 后端优化

- 数据库查询优化
- 音频文件缓存
- API响应压缩
- 连接池管理

### 前端优化

- 组件懒加载
- 音频预加载
- 状态更新优化
- 响应式设计

## 🚀 部署架构

### 开发环境

```
├── Backend: http://localhost:5001
├── Frontend: http://localhost:3000
├── Database: SQLite本地文件
└── Anki: 本地AnkiConnect (端口8765)
```

### 生产环境建议

```
├── Backend: Flask + Gunicorn
├── Frontend: Next.js静态导出
├── Database: PostgreSQL/MySQL
├── 反向代理: Nginx
└── 容器化: Docker
```

## 🔄 扩展性设计

### 水平扩展

- 微服务架构拆分
- 数据库读写分离
- 缓存层引入（Redis）
- 负载均衡

### 功能扩展

- 多语言支持
- 用户系统
- 学习进度跟踪
- 个性化推荐

## 📋 技术债务

### 已知问题

- 调试面板需要优化为正式功能
- 音频播放依赖外部API（有道）
- 错误处理可以更完善
- 缺少单元测试覆盖

### 改进计划

- 引入测试框架
- 完善错误处理
- 优化性能监控
- 建立CI/CD流程

---

**文档版本：** v1.0  
**创建时间：** 2025年1月  
**维护者：** 开发团队  
**更新频率：** 重大架构变更时更新
