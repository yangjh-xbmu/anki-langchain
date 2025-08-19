# GraphQL Schema 设计文档

## 项目概述

本文档定义了Anki-LangChain项目的GraphQL Schema设计，用于替换现有的REST API架构。基于对现有API的分析，设计了统一的GraphQL接口来提供更高效的数据查询和操作。

## 核心类型定义

### 1. Word 类型

```graphql
type Word {
  id: ID!
  word: String!
  definition: String
  pronunciation: String
  audioUrl: String
  difficulty: DifficultyLevel
  createdAt: DateTime!
  updatedAt: DateTime!
  
  # 关联数据
  memory: WordMemory
  practiceHistory: [PracticeSession!]!
  
  # 计算字段
  nextReviewDate: DateTime
  reviewCount: Int!
  successRate: Float!
}

enum DifficultyLevel {
  EASY
  MEDIUM
  HARD
}
```

### 2. WordMemory 类型

```graphql
type WordMemory {
  id: ID!
  wordId: ID!
  userId: String!
  stability: Float!
  difficulty: Float!
  elapsedDays: Int!
  scheduledDays: Int!
  reps: Int!
  lapses: Int!
  state: MemoryState!
  lastReview: DateTime
  nextReview: DateTime!
  createdAt: DateTime!
  updatedAt: DateTime!
}

enum MemoryState {
  NEW
  LEARNING
  REVIEW
  RELEARNING
}
```

### 3. PracticeSession 类型

```graphql
type PracticeSession {
  id: ID!
  userId: String!
  wordId: ID!
  rating: Int!
  timeSpent: Int!
  sessionType: SessionType!
  createdAt: DateTime!
  
  # 关联数据
  word: Word!
}

enum SessionType {
  REVIEW
  LEARNING
  RELEARNING
}
```

### 4. UserLearningProfile 类型

```graphql
type UserLearningProfile {
  id: ID!
  userId: String!
  learningStyle: LearningStyle!
  difficultyPreference: DifficultyLevel!
  dailyGoal: Int!
  motivationLevel: Float!
  attentionSpan: Int!
  peakPerformanceTime: TimeOfDay!
  createdAt: DateTime!
  updatedAt: DateTime!
  
  # 计算字段
  currentStreak: Int!
  totalWordsLearned: Int!
  averageAccuracy: Float!
}

enum LearningStyle {
  VISUAL
  AUDITORY
  KINESTHETIC
  BALANCED
}

enum TimeOfDay {
  MORNING
  AFTERNOON
  EVENING
  NIGHT
}
```

### 5. LearningSession 类型

```graphql
type LearningSession {
  id: ID!
  userId: String!
  sessionType: String!
  wordsPracticed: Int!
  correctAnswers: Int!
  sessionDuration: Int!
  difficultyLevel: DifficultyLevel!
  engagementScore: Float!
  fatigueLevel: Float!
  createdAt: DateTime!
  
  # 计算字段
  accuracy: Float!
  wordsPerMinute: Float!
}
```

### 6. DailyRecommendation 类型

```graphql
type DailyRecommendation {
  userId: String!
  recommendedWords: [Word!]!
  targetCount: Int!
  estimatedDuration: Int!
  difficultyDistribution: DifficultyDistribution!
  motivationalMessage: String
  generatedAt: DateTime!
}

type DifficultyDistribution {
  easy: Int!
  medium: Int!
  hard: Int!
}
```

### 7. Analytics 类型

```graphql
type LearningAnalytics {
  userId: String!
  totalWords: Int!
  wordsLearned: Int!
  currentStreak: Int!
  longestStreak: Int!
  averageAccuracy: Float!
  totalStudyTime: Int!
  
  # 时间序列数据
  dailyProgress: [DailyProgress!]!
  weeklyStats: [WeeklyStats!]!
  
  # 性能洞察
  strongestTimeOfDay: TimeOfDay
  preferredDifficulty: DifficultyLevel
  learningVelocity: Float!
}

type DailyProgress {
  date: Date!
  wordsReviewed: Int!
  accuracy: Float!
  studyTime: Int!
}

type WeeklyStats {
  weekStart: Date!
  totalWords: Int!
  averageAccuracy: Float!
  totalTime: Int!
}
```

### 8. 用户偏好和目标

```graphql
type UserPreference {
  id: ID!
  userId: String!
  category: String!
  name: String!
  value: String!
  type: PreferenceType!
}

enum PreferenceType {
  BOOLEAN
  NUMBER
  STRING
  SELECT
}

type LearningGoal {
  id: ID!
  userId: String!
  title: String!
  description: String
  targetValue: Int!
  currentValue: Int!
  deadline: Date
  isCompleted: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
  
  # 计算字段
  progress: Float!
  daysRemaining: Int
}
```

## 查询定义 (Query)

```graphql
type Query {
  # 单词相关查询
  words(limit: Int, offset: Int, difficulty: DifficultyLevel): [Word!]!
  word(id: ID!): Word
  nextWord(userId: String!): Word
  dueWords(userId: String!): [Word!]!
  
  # 用户学习数据
  userProfile(userId: String!): UserLearningProfile
  learningSession(id: ID!): LearningSession
  learningSessions(userId: String!, limit: Int, offset: Int): [LearningSession!]!
  
  # 推荐系统
  dailyRecommendation(userId: String!): DailyRecommendation!
  
  # 统计和分析
  reviewStats(userId: String!): ReviewStats!
  learningAnalytics(userId: String!, timeRange: TimeRange): LearningAnalytics!
  learningPatterns(userId: String!): LearningPatterns!
  performanceInsights(userId: String!): PerformanceInsights!
  
  # 用户偏好和目标
  userPreferences(userId: String!): [UserPreference!]!
  learningGoals(userId: String!): [LearningGoal!]!
  
  # 系统状态
  systemHealth: SystemHealth!
}

type ReviewStats {
  totalReviews: Int!
  correctReviews: Int!
  accuracy: Float!
  averageTime: Float!
  streakDays: Int!
}

type LearningPatterns {
  peakHours: [Int!]!
  preferredDifficulty: DifficultyLevel!
  averageSessionLength: Int!
  consistencyScore: Float!
}

type PerformanceInsights {
  strengths: [String!]!
  improvements: [String!]!
  recommendations: [String!]!
  trendAnalysis: TrendAnalysis!
}

type TrendAnalysis {
  accuracyTrend: TrendDirection!
  speedTrend: TrendDirection!
  consistencyTrend: TrendDirection!
}

enum TrendDirection {
  IMPROVING
  STABLE
  DECLINING
}

enum TimeRange {
  WEEK
  MONTH
  QUARTER
  YEAR
}

type SystemHealth {
  status: String!
  version: String!
  uptime: Int!
  dbConnected: Boolean!
}
```

## 变更定义 (Mutation)

```graphql
type Mutation {
  # 单词操作
  createWord(input: CreateWordInput!): Word!
  updateWord(id: ID!, input: UpdateWordInput!): Word!
  deleteWord(id: ID!): Boolean!
  generateWordMedia(wordId: ID!): Word!
  
  # 复习和练习
  submitReview(input: ReviewInput!): ReviewResult!
  submitPractice(input: PracticeInput!): PracticeResult!
  resetWordMemory(wordId: ID!, userId: String!): WordMemory!
  
  # 用户学习数据
  updateUserProfile(userId: String!, input: UserProfileInput!): UserLearningProfile!
  recordLearningSession(input: LearningSessionInput!): LearningSession!
  
  # 动机评估
  submitMotivationAssessment(input: MotivationInput!): MotivationResult!
  
  # 用户偏好和目标
  updateUserPreference(input: UserPreferenceInput!): UserPreference!
  createLearningGoal(input: LearningGoalInput!): LearningGoal!
  updateLearningGoal(id: ID!, input: UpdateLearningGoalInput!): LearningGoal!
  deleteLearningGoal(id: ID!): Boolean!
  
  # Anki同步
  syncWithAnki(input: AnkiSyncInput!): AnkiSyncResult!
  
  # 系统操作
  clearDatabase: Boolean!
}
```

## 输入类型定义

```graphql
input CreateWordInput {
  word: String!
  definition: String
  pronunciation: String
  difficulty: DifficultyLevel
}

input UpdateWordInput {
  word: String
  definition: String
  pronunciation: String
  difficulty: DifficultyLevel
}

input ReviewInput {
  wordId: ID!
  userId: String!
  rating: Int!
  timeSpent: Int
}

input PracticeInput {
  userId: String!
  wordId: ID!
  userAnswer: String!
  timeSpent: Int!
}

input UserProfileInput {
  learningStyle: LearningStyle
  difficultyPreference: DifficultyLevel
  dailyGoal: Int
  motivationLevel: Float
  attentionSpan: Int
  peakPerformanceTime: TimeOfDay
}

input LearningSessionInput {
  userId: String!
  sessionType: String!
  wordsPracticed: Int!
  correctAnswers: Int!
  sessionDuration: Int!
  difficultyLevel: DifficultyLevel!
  engagementScore: Float
  fatigueLevel: Float
}

input MotivationInput {
  userId: String!
  motivation: Int!
  stress: Int!
  confidence: Int!
}

input UserPreferenceInput {
  userId: String!
  category: String!
  name: String!
  value: String!
  type: PreferenceType!
}

input LearningGoalInput {
  userId: String!
  title: String!
  description: String
  targetValue: Int!
  deadline: Date
}

input UpdateLearningGoalInput {
  title: String
  description: String
  targetValue: Int
  currentValue: Int
  deadline: Date
  isCompleted: Boolean
}

input AnkiSyncInput {
  deckName: String!
  action: AnkiAction!
}

enum AnkiAction {
  IMPORT
  EXPORT
  SYNC
}
```

## 结果类型定义

```graphql
type ReviewResult {
  success: Boolean!
  message: String
  updatedMemory: WordMemory
  nextWord: Word
}

type PracticeResult {
  success: Boolean!
  correct: Boolean!
  message: String
  explanation: String
  score: Int
}

type MotivationResult {
  success: Boolean!
  recommendations: [String!]!
  encouragementMessage: String!
}

type AnkiSyncResult {
  success: Boolean!
  message: String!
  wordsImported: Int
  wordsExported: Int
  errors: [String!]
}
```

## 订阅定义 (Subscription)

```graphql
type Subscription {
  # 实时学习进度
  learningProgress(userId: String!): LearningProgress!
  
  # 新的推荐更新
  recommendationUpdated(userId: String!): DailyRecommendation!
  
  # 成就解锁
  achievementUnlocked(userId: String!): Achievement!
  
  # 系统通知
  systemNotification: SystemNotification!
}

type LearningProgress {
  userId: String!
  currentSession: LearningSession
  todayStats: DailyProgress!
  streakUpdate: Int
}

type Achievement {
  id: ID!
  title: String!
  description: String!
  icon: String
  unlockedAt: DateTime!
}

type SystemNotification {
  type: NotificationType!
  title: String!
  message: String!
  timestamp: DateTime!
}

enum NotificationType {
  INFO
  WARNING
  ERROR
  SUCCESS
}
```

## 自定义标量类型

```graphql
scalar DateTime
scalar Date
scalar JSON
```

## Schema 特性

### 1. 数据获取优化
- **精确查询**: 客户端只请求需要的字段
- **关联数据**: 一次查询获取相关联的数据
- **计算字段**: 服务端计算复杂逻辑，减少客户端负担

### 2. 类型安全
- **强类型系统**: 所有字段都有明确的类型定义
- **枚举类型**: 限制可选值，提高数据一致性
- **非空约束**: 明确哪些字段是必需的

### 3. 扩展性
- **模块化设计**: 类型定义清晰分离
- **向后兼容**: 新增字段不影响现有查询
- **订阅支持**: 支持实时数据更新

### 4. 性能优化
- **批量操作**: 支持批量查询和变更
- **分页支持**: 大数据集的分页查询
- **缓存友好**: 结构化查询便于缓存

## 实施注意事项

### 1. 数据加载器 (DataLoader)
- 解决 N+1 查询问题
- 批量加载关联数据
- 缓存重复查询

### 2. 权限控制
- 字段级权限控制
- 用户数据隔离
- 操作权限验证

### 3. 错误处理
- 统一错误格式
- 详细错误信息
- 错误分类和编码

### 4. 性能监控
- 查询复杂度分析
- 执行时间监控
- 资源使用统计

## 迁移策略

### 阶段1: 基础类型和查询
- 实现核心数据类型
- 基本的查询操作
- 简单的变更操作

### 阶段2: 高级功能
- 复杂查询和聚合
- 批量操作
- 实时订阅

### 阶段3: 优化和扩展
- 性能优化
- 缓存策略
- 监控和分析

这个GraphQL Schema设计提供了完整的API接口，支持现有功能的同时为未来扩展留出了空间。通过统一的查询语言，前端可以更高效地获取所需数据，减少网络请求次数，提升用户体验。