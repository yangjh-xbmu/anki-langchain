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

## 🧠 智能推荐系统架构

### 每日练习量推荐系统

**系统目标：** 基于儿童心理学和教育学理论，通过数据驱动的方式提升学生的自主感、胜任感和成就感。

#### 核心架构组件

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  数据收集层     │───►│  推荐引擎层     │───►│  用户界面层     │
│                 │    │                 │    │                 │
│ • 学习行为数据  │    │ • 算法核心      │    │ • 目标设定UI    │
│ • 性能指标      │    │ • 心理模型      │    │ • 进度可视化    │
│ • 用户偏好      │    │ • 动态调整      │    │ • 反馈系统      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  数据存储层     │    │  分析引擎层     │    │  心理支持层     │
│                 │    │                 │    │                 │
│ • 学习记录      │    │ • 模式识别      │    │ • 情绪监测      │
│ • 用户画像      │    │ • 趋势分析      │    │ • 激励机制      │
│ • 推荐历史      │    │ • 效果评估      │    │ • 庆祝系统      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### 数据模型扩展

```python
# 用户学习画像
class UserLearningProfile(db.Model):
    user_id = db.Column(db.Integer, primary_key=True)
    learning_capacity = db.Column(db.Float)          # 学习能力评估 (0-1)
    preferred_difficulty = db.Column(db.String(20))  # easy/medium/hard
    optimal_session_length = db.Column(db.Integer)   # 最佳学习时长(分钟)
    motivation_level = db.Column(db.Float)           # 动机水平 (0-1)
    autonomy_preference = db.Column(db.Float)        # 自主性偏好 (0-1)
    competence_threshold = db.Column(db.Float)       # 胜任感阈值 (0-1)
    achievement_sensitivity = db.Column(db.Float)    # 成就敏感度 (0-1)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

# 每日练习推荐
class DailyPracticeRecommendation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    date = db.Column(db.Date, nullable=False)
    recommended_count = db.Column(db.Integer, nullable=False)
    actual_count = db.Column(db.Integer, default=0)
    completion_rate = db.Column(db.Float, default=0.0)
    accuracy_rate = db.Column(db.Float, default=0.0)
    adjustment_reason = db.Column(db.String(200))    # 调整原因
    psychological_factors = db.Column(db.JSON)       # 心理因素评估
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# 学习会话记录
class LearningSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    session_date = db.Column(db.DateTime, nullable=False)
    planned_count = db.Column(db.Integer, nullable=False)
    completed_count = db.Column(db.Integer, nullable=False)
    correct_answers = db.Column(db.Integer, nullable=False)
    session_duration = db.Column(db.Integer)         # 会话时长(秒)
    emotional_state = db.Column(db.String(50))       # 情绪状态
    difficulty_rating = db.Column(db.Float)          # 难度评分
    satisfaction_score = db.Column(db.Float)         # 满意度评分
    notes = db.Column(db.Text)                       # 学习笔记
```

#### 推荐算法架构

```python
class RecommendationEngine:
    """智能推荐引擎核心"""
    
    def calculate_daily_goal(self, user_profile: UserLearningProfile, 
                           recent_sessions: List[LearningSession]) -> int:
        """计算每日学习目标"""
        base_count = self._calculate_base_count(user_profile)
        motivation_factor = self._assess_motivation(recent_sessions)
        competence_factor = self._assess_competence(recent_sessions)
        autonomy_factor = self._assess_autonomy_needs(user_profile)
        
        adjusted_count = base_count * motivation_factor * competence_factor
        return self._apply_autonomy_constraints(adjusted_count, autonomy_factor)
    
    def _calculate_base_count(self, profile: UserLearningProfile) -> int:
        """基础推荐量计算"""
        # 基于学习能力和时间约束的基础计算
        capacity_factor = profile.learning_capacity
        time_factor = profile.optimal_session_length / 30  # 标准化到30分钟
        return int(10 * capacity_factor * time_factor)  # 基础10题
    
    def _assess_motivation(self, sessions: List[LearningSession]) -> float:
        """动机水平评估"""
        if not sessions:
            return 1.0
        
        # 分析完成率趋势、连续性等
        completion_trend = self._calculate_completion_trend(sessions)
        consistency_score = self._calculate_consistency_score(sessions)
        
        return (completion_trend + consistency_score) / 2
    
    def _assess_competence(self, sessions: List[LearningSession]) -> float:
        """胜任感评估"""
        if not sessions:
            return 1.0
        
        recent_accuracy = sum(s.correct_answers / s.completed_count 
                            for s in sessions[-5:]) / len(sessions[-5:])
        
        # 目标正确率70-80%，超出或不足都需要调整
        if 0.7 <= recent_accuracy <= 0.8:
            return 1.0  # 理想状态
        elif recent_accuracy < 0.7:
            return 0.8  # 降低难度/数量
        else:
            return 1.2  # 可以适当增加挑战
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

#### 基础功能API
| 方法 | 端点 | 功能 | 参数 |
|------|------|------|------|
| GET | `/api/words` | 获取单词列表 | limit, offset |
| POST | `/api/sync-anki` | 同步Anki数据 | - |
| GET | `/api/words/{id}` | 获取单词详情 | id |
| PUT | `/api/words/{id}` | 更新单词信息 | id, 更新字段 |

#### 智能推荐系统API
| 方法 | 端点 | 功能 | 参数 |
|------|------|------|------|
| GET | `/api/recommendation/daily-goal` | 获取每日推荐练习量 | user_id, date |
| POST | `/api/recommendation/daily-goal` | 设置每日目标 | user_id, target_count, date |
| PUT | `/api/recommendation/adjust-goal` | 调整当日目标 | user_id, new_count, reason |
| GET | `/api/user/learning-profile` | 获取用户学习画像 | user_id |
| PUT | `/api/user/learning-profile` | 更新学习偏好 | user_id, preferences |
| POST | `/api/learning/session-start` | 开始学习会话 | user_id, planned_count |
| PUT | `/api/learning/session-update` | 更新学习进度 | session_id, progress |
| POST | `/api/learning/session-end` | 结束学习会话 | session_id, results |
| GET | `/api/analytics/learning-trends` | 获取学习趋势分析 | user_id, period |
| GET | `/api/analytics/performance-report` | 获取学习报告 | user_id, start_date, end_date |

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
├── KeyboardShortcuts/        # 快捷键处理组件
├── Recommendation/           # 智能推荐系统组件
│   ├── DailyGoalSetter/      # 每日目标设定组件
│   ├── ProgressTracker/      # 进度追踪组件
│   ├── MotivationPanel/      # 动机激励面板
│   └── LearningAnalytics/    # 学习分析组件
├── UserProfile/              # 用户画像管理
│   ├── PreferenceSettings/   # 偏好设置组件
│   ├── LearningHistory/      # 学习历史组件
│   └── PerformanceChart/     # 性能图表组件
└── PsychologicalSupport/     # 心理支持系统
    ├── EmotionTracker/       # 情绪追踪组件
    ├── EncouragementSystem/  # 鼓励系统组件
    └── CelebrationEffect/    # 庆祝效果组件（已存在，需扩展）
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

// 智能推荐系统状态
interface RecommendationState {
  dailyGoal: DailyGoal | null           # 每日目标
  currentProgress: LearningProgress     # 当前进度
  userProfile: UserLearningProfile      # 用户学习画像
  learningSession: LearningSession | null  # 当前学习会话
  motivationLevel: number               # 动机水平
  competenceScore: number               # 胜任感评分
  autonomyPreference: number            # 自主性偏好
}

// 每日目标接口
interface DailyGoal {
  id: string;
  date: string;
  recommendedCount: number;
  userAdjustedCount?: number;
  currentProgress: number;
  completionRate: number;
  accuracyRate: number;
  isCompleted: boolean;
  adjustmentReason?: string;
}

// 学习进度接口
interface LearningProgress {
  totalQuestions: number;
  completedQuestions: number;
  correctAnswers: number;
  sessionStartTime: Date;
  estimatedTimeRemaining: number;
  difficultyLevel: 'easy' | 'medium' | 'hard';
  emotionalState: 'positive' | 'neutral' | 'frustrated';
}

// 用户画像接口
interface UserLearningProfile {
  userId: string;
  learningCapacity: number;        # 0-1
  preferredDifficulty: string;
  optimalSessionLength: number;    # 分钟
  motivationLevel: number;         # 0-1
  autonomyPreference: number;      # 0-1
  competenceThreshold: number;     # 0-1
  achievementSensitivity: number;  # 0-1
  learningStyle: 'visual' | 'auditory' | 'kinesthetic';
  timePreferences: {
    morningProductivity: number;
    afternoonProductivity: number;
    eveningProductivity: number;
  };
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

#### 本地开发模式

```
├── Backend: http://localhost:5001
├── Frontend: http://localhost:3000
├── Database: SQLite本地文件
└── Anki: 本地AnkiConnect (端口8765)
```

#### 局域网访问模式

当需要在同一WiFi网络的其他设备上访问应用时：

```
├── Backend: http://0.0.0.0:5001 (绑定所有网络接口)
├── Frontend: http://0.0.0.0:3000 (Next.js -H 0.0.0.0)
├── 访问地址: http://192.168.x.x:3000
└── API路由: 通过环境变量BACKEND_HOST动态配置
```

**网络配置架构：**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   移动设备      │    │   开发主机      │    │   局域网路由器  │
│                 │    │                 │    │                 │
│ 192.168.2.100   │◄──►│ 192.168.2.63    │◄──►│ 192.168.2.1     │
│                 │    │                 │    │                 │
│ 访问:3000端口   │    │ 前端:0.0.0.0:3000│    │ WiFi网络        │
│ API:5001端口    │    │ 后端:0.0.0.0:5001│    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**配置要点：**

1. **前端配置**：
   - `package.json`: `"dev": "next dev -H 0.0.0.0"`
   - 绑定所有网络接口，允许外部访问

2. **后端配置**：
   - `run.py`: `app.run(host='0.0.0.0', port=5001)`
   - 默认已配置为监听所有接口

3. **API路由配置**：
   - `next.config.js`: 使用环境变量`BACKEND_HOST`动态配置后端地址
   - `pages/index.tsx`: 使用相对路径调用API，通过Next.js rewrite功能路由

4. **启动方式**：

   ```bash
   # 获取本机IP
   ifconfig | grep 'inet ' | grep -v '127.0.0.1' | awk '{print $2}' | head -1
   
   # 设置环境变量启动
   BACKEND_HOST=192.168.x.x ./start.sh
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

## 🎉 祝贺动画系统架构

### 系统组件

```
┌─────────────────────────────────────────────────────────────┐
│                    祝贺动画系统                              │
├─────────────────────────────────────────────────────────────┤
│  CelebrationEffect.tsx     │  audioUtils.ts                 │
│  ┌─────────────────────┐   │  ┌─────────────────────────┐   │
│  │   粒子动画组件      │   │  │     音频工具模块        │   │
│  │                     │   │  │                         │   │
│  │ • 粒子生成与管理    │   │  │ • OGG/MP3文件播放      │   │
│  │ • 动画循环控制      │   │  │ • Web Audio API回退    │   │
│  │ • 性能优化          │   │  │ • 音效状态管理          │   │
│  │ • 响应式适配        │   │  │ • 错误处理              │   │
│  └─────────────────────┘   │  └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   主页面集成                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  index.tsx - 主页面组件                            │   │
│  │                                                     │   │
│  │  • 答案验证逻辑                                     │   │
│  │  • 动画触发控制                                     │   │
│  │  • 用户偏好设置                                     │   │
│  │  • 状态管理                                         │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 核心组件设计

#### CelebrationEffect 组件

**职责：**

- 粒子效果渲染和动画
- 音效播放控制
- 性能优化和响应式适配

**核心接口：**

```typescript
interface CelebrationEffectProps {
  isVisible: boolean;        // 动画显示状态
  onComplete?: () => void;   // 动画完成回调
  playSound?: boolean;       // 音效播放控制
  reducedMotion?: boolean;   // 减少动画选项
}
```

**技术特性：**

- 1秒快速完成动画
- 根据设备性能调整粒子数量
- 使用setInterval优化性能
- 支持用户偏好设置

#### audioUtils 音频工具

**职责：**

- 多格式音频文件支持
- Web Audio API回退机制
- 音效播放状态管理

**核心方法：**

```typescript
playSuccessSound(): void              // 播放成功音效
checkAudioFileExists(path): boolean   // 检查音频文件
checkSuccessAudioExists(): Promise    // 检查成功音效文件
generateSuccessSound(): void          // 生成默认音效
```

**音频支持策略：**

1. 优先加载 `success.ogg` 文件
2. 回退到 `success.mp3` 文件
3. 最终使用 Web Audio API 生成音效

### 集成架构

```
用户答对单词 ──► 主页面验证 ──► 触发祝贺动画
      │              │              │
      │              │              ├── 显示粒子效果
      │              │              ├── 播放成功音效
      │              │              └── 1秒后自动结束
      │              │
      │              └── 状态管理
      │                   ├── showCelebration
      │                   ├── celebrationEnabled
      │                   └── soundEnabled
      │
      └── 用户偏好控制
           ├── 动画开关
           └── 音效开关
```

### 性能优化策略

- **响应式粒子数量**：根据屏幕尺寸和用户偏好调整
- **动画帧率控制**：使用16ms间隔实现60fps
- **内存管理**：动画结束后及时清理资源
- **音效缓存**：避免重复加载音频文件

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
