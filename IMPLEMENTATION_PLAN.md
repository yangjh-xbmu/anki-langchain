## Stage 1: Project Setup
**Goal**: Create the basic project structure for the Flask backend and React frontend.
**Success Criteria**: A runnable Flask server and a runnable React development server.
**Tests**: N/A
**Status**: Not Started

## Stage 2: Backend - Anki Integration
**Goal**: Connect to Anki, fetch words, and store them in a database.
**Success Criteria**: An API endpoint that returns a list of words from Anki.
**Tests**: Unit tests for AnkiConnect service, API endpoint tests.
**Status**: Not Started

## Stage 3: Frontend - Display Words
**Goal**: Fetch words from the backend and display them to the user.
**Success Criteria**: The application displays a word and an input field.
**Tests**: Component tests for the word display.
**Status**: Not Started

## Stage 4: Frontend - User Interaction
**Goal**: Implement the logic for user input and checking the answer.
**Success Criteria**: The user can type a word and get feedback on whether it's correct.
**Tests**: N/A
**Status**: Not Started

## Stage 5: Backend - Add Multimedia
**Goal**: Use LangChain to generate images and audio for words.
**Success Criteria**: The API can provide image URLs and audio for each word.
**Tests**: N/A
**Status**: Not Started

## Stage 6: Frontend - Display Multimedia
**Goal**: Display the image and play the audio for each word.
**Success Criteria**: The user can see the image and hear the pronunciation of the word.
**Tests**: N/A
**Status**: Not Started

## Stage 7: 智能每日练习量推荐系统
**Goal**: 基于儿童心理学和教育学理论，实现智能的每日练习量推荐功能，提升学生的自主感、胜任感和成就感。
**Success Criteria**: 
- 系统能根据学生历史表现动态推荐每日练习量
- 实现自主感增强机制（选择权、个性化设置）
- 实现胜任感建设机制（适应性难度、成功率维护）
- 实现成就感激励机制（目标设定、进度可视化）
- 提供完整的数据分析和心理支持功能
**Tests**: 
- 推荐算法准确性测试
- 用户体验测试
- 心理效果评估测试
**Status**: Not Started

### 7.1 理论基础与核心机制

#### 自主感增强机制
- **练习量选择权**: 在推荐基础上允许±20%调整
- **个性化设置**: 学习时间偏好、难度偏好配置
- **目标自定义**: 支持短期和长期目标设定
- **学习节奏控制**: 暂停、加速、调整功能

#### 胜任感建设机制
- **适应性难度调整**: 基于正确率动态调整题目难度
- **成功率维护**: 目标正确率70-80%，避免挫败感
- **渐进式挑战**: 螺旋上升的难度曲线设计
- **即时反馈系统**: 正确答案的即时确认和鼓励

#### 成就感激励机制
- **目标设定与达成**: SMART目标框架应用
- **进度可视化**: 学习进度条、成就徽章系统
- **努力-成果关联**: 清晰展示努力与进步的关系
- **社会认可机制**: 学习成果分享和庆祝功能

### 7.2 功能模块设计

#### 7.2.1 智能推荐引擎
- **数据收集模块**: 学习时长、正确率、完成率、学习频率
- **算法核心**: 基于历史数据和心理学原理的推荐算法
- **动态调整**: 实时根据表现调整推荐策略
- **个体差异适应**: 考虑学习能力、时间安排等个体因素

#### 7.2.2 心理支持系统
- **情绪状态监测**: 通过学习行为分析情绪状态
- **激励语言生成**: 个性化的鼓励和指导语言
- **挫折应对机制**: 连续错误时的心理支持策略
- **成功庆祝系统**: 达成目标时的庆祝动画和反馈

#### 7.2.3 数据分析与洞察
- **学习模式分析**: 识别最佳学习时间和频率
- **进步趋势追踪**: 长期学习效果的可视化展示
- **瓶颈识别**: 自动识别学习难点和改进建议
- **个性化报告**: 定期生成学习分析报告

### 7.3 技术实现规划

#### 后端实现
```python
# 新增数据模型
class DailyPracticeRecommendation(db.Model):
    user_id = db.Column(db.Integer, nullable=False)
    date = db.Column(db.Date, nullable=False)
    recommended_count = db.Column(db.Integer, nullable=False)
    actual_count = db.Column(db.Integer)
    completion_rate = db.Column(db.Float)
    accuracy_rate = db.Column(db.Float)
    
class UserLearningProfile(db.Model):
    user_id = db.Column(db.Integer, primary_key=True)
    learning_capacity = db.Column(db.Float)  # 学习能力评估
    preferred_difficulty = db.Column(db.String(20))  # 难度偏好
    optimal_session_length = db.Column(db.Integer)  # 最佳学习时长
    motivation_level = db.Column(db.Float)  # 动机水平
```

#### 前端实现
```typescript
// 新增组件
interface DailyGoalProps {
  recommendedCount: number;
  currentProgress: number;
  onAdjustGoal: (newCount: number) => void;
}

// 推荐算法接口
interface RecommendationEngine {
  calculateDailyGoal(userProfile: UserProfile, recentPerformance: Performance[]): number;
  adjustForMotivation(baseCount: number, motivationFactors: MotivationFactors): number;
  considerTimeConstraints(count: number, availableTime: number): number;
}
```

### 7.4 实施优先级

#### 高优先级 (MVP)
1. 基础推荐算法实现
2. 用户学习数据收集
3. 简单的目标设定界面
4. 基础进度追踪功能

#### 中优先级
1. 高级推荐算法优化
2. 心理支持系统
3. 详细数据分析功能
4. 个性化设置界面

#### 低优先级 (增强功能)
1. 社交功能和分享机制
2. 高级数据可视化
3. AI驱动的个性化建议
4. 跨平台数据同步