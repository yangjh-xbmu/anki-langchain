# Admin面板API接口规范

## 概述

本文档定义了Admin面板的GraphQL API接口规范，包括所有查询、变更操作和数据类型定义。

## 认证与授权

### JWT令牌格式

```json
{
  "user_id": 1,
  "username": "admin",
  "roles": ["admin", "superadmin"],
  "permissions": ["users.read", "users.write", "words.manage"],
  "exp": 1640995200,
  "iat": 1640908800,
  "type": "access"
}
```

### 请求头格式

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

## 数据类型定义

### 用户相关类型

```graphql
# 用户类型
type User {
  id: ID!
  username: String!
  email: String!
  displayName: String
  isActive: Boolean!
  lastLoginAt: DateTime
  loginCount: Int!
  createdAt: DateTime!
  updatedAt: DateTime!
  roles: [Role!]!
  permissions: [String!]!
}

# 角色类型
type Role {
  id: ID!
  name: String!
  description: String
  permissions: [Permission!]!
  userCount: Int!
  createdAt: DateTime!
  updatedAt: DateTime!
}

# 权限类型
type Permission {
  id: ID!
  resource: String!
  action: String!
  description: String
  createdAt: DateTime!
}

# 用户输入类型
input CreateUserInput {
  username: String!
  email: String!
  password: String!
  displayName: String
  roleIds: [ID!]
  isActive: Boolean = true
}

input UpdateUserInput {
  username: String
  email: String
  displayName: String
  isActive: Boolean
  roleIds: [ID!]
}

input ChangePasswordInput {
  currentPassword: String!
  newPassword: String!
  confirmPassword: String!
}

# 角色输入类型
input CreateRoleInput {
  name: String!
  description: String
  permissionIds: [ID!]!
}

input UpdateRoleInput {
  name: String
  description: String
  permissionIds: [ID!]
}
```

### 单词相关类型

```graphql
# 单词类型（扩展现有）
type Word {
  id: ID!
  ankiCardId: String
  word: String!
  meaning: String!
  phonetic: String
  etymology: String
  exampleSentence: String
  relatedWords: String
  createdAt: DateTime!
  updatedAt: DateTime!
  # 管理字段
  isActive: Boolean!
  difficulty: Float
  frequency: Int
  tags: [String!]
  createdBy: User
  lastModifiedBy: User
}

# 单词输入类型
input CreateWordInput {
  ankiCardId: String
  word: String!
  meaning: String!
  phonetic: String
  etymology: String
  exampleSentence: String
  relatedWords: String
  difficulty: Float
  tags: [String!]
}

input UpdateWordInput {
  ankiCardId: String
  word: String
  meaning: String
  phonetic: String
  etymology: String
  exampleSentence: String
  relatedWords: String
  isActive: Boolean
  difficulty: Float
  tags: [String!]
}

input WordFilterInput {
  search: String
  isActive: Boolean
  difficulty: FloatRange
  tags: [String!]
  createdBy: ID
  dateRange: DateRange
}
```

### 系统相关类型

```graphql
# 审计日志类型
type AuditLog {
  id: ID!
  userId: ID
  user: User
  action: String!
  resource: String!
  resourceId: String
  details: JSON
  ipAddress: String
  userAgent: String
  createdAt: DateTime!
}

# 系统统计类型
type SystemStats {
  totalUsers: Int!
  activeUsers: Int!
  totalWords: Int!
  activeWords: Int!
  totalSessions: Int!
  todaySessions: Int!
  avgSessionDuration: Float!
  topWords: [WordStats!]!
  userGrowth: [UserGrowthStats!]!
  sessionStats: [SessionStats!]!
}

type WordStats {
  word: Word!
  practiceCount: Int!
  successRate: Float!
  avgDifficulty: Float!
}

type UserGrowthStats {
  date: Date!
  newUsers: Int!
  activeUsers: Int!
  totalUsers: Int!
}

type SessionStats {
  date: Date!
  sessionCount: Int!
  avgDuration: Float!
  avgAccuracy: Float!
}

# 系统配置类型
type SystemConfig {
  key: String!
  value: String!
  description: String
  type: ConfigType!
  isPublic: Boolean!
  updatedAt: DateTime!
  updatedBy: User
}

enum ConfigType {
  STRING
  INTEGER
  FLOAT
  BOOLEAN
  JSON
}

input UpdateConfigInput {
  key: String!
  value: String!
}
```

### 通用类型

```graphql
# 分页信息
type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
  totalCount: Int!
}

# 分页输入
input PaginationInput {
  first: Int
  after: String
  last: Int
  before: String
}

# 排序输入
input SortInput {
  field: String!
  direction: SortDirection!
}

enum SortDirection {
  ASC
  DESC
}

# 日期范围
input DateRange {
  start: Date!
  end: Date!
}

# 数值范围
input FloatRange {
  min: Float
  max: Float
}

# 响应类型
type MutationResponse {
  success: Boolean!
  message: String
  errors: [String!]
}

# 自定义标量类型
scalar DateTime
scalar Date
scalar JSON
```

## 查询操作 (Queries)

### 用户管理查询

```graphql
type Query {
  # 获取当前用户信息
  currentUser: User
  
  # 获取用户列表（分页）
  users(
    pagination: PaginationInput
    filter: UserFilterInput
    sort: SortInput
  ): UserConnection!
  
  # 获取单个用户
  user(id: ID!): User
  
  # 搜索用户
  searchUsers(
    query: String!
    limit: Int = 10
  ): [User!]!
  
  # 获取角色列表
  roles: [Role!]!
  
  # 获取单个角色
  role(id: ID!): Role
  
  # 获取权限列表
  permissions: [Permission!]!
  
  # 获取用户统计
  userStats(
    dateRange: DateRange
  ): UserStatsResponse!
}

# 用户连接类型（分页）
type UserConnection {
  edges: [UserEdge!]!
  pageInfo: PageInfo!
}

type UserEdge {
  node: User!
  cursor: String!
}

# 用户过滤输入
input UserFilterInput {
  search: String
  isActive: Boolean
  roles: [String!]
  dateRange: DateRange
}

# 用户统计响应
type UserStatsResponse {
  totalUsers: Int!
  activeUsers: Int!
  newUsers: Int!
  usersByRole: [RoleUserCount!]!
  userGrowth: [UserGrowthStats!]!
}

type RoleUserCount {
  role: Role!
  count: Int!
}
```

### 单词管理查询

```graphql
extend type Query {
  # 获取单词列表（分页）
  adminWords(
    pagination: PaginationInput
    filter: WordFilterInput
    sort: SortInput
  ): WordConnection!
  
  # 获取单个单词（管理视图）
  adminWord(id: ID!): Word
  
  # 搜索单词
  searchWords(
    query: String!
    limit: Int = 10
  ): [Word!]!
  
  # 获取单词统计
  wordStats(
    dateRange: DateRange
  ): WordStatsResponse!
  
  # 获取单词标签
  wordTags: [String!]!
  
  # 批量验证单词
  validateWords(
    words: [String!]!
  ): [WordValidationResult!]!
}

# 单词连接类型
type WordConnection {
  edges: [WordEdge!]!
  pageInfo: PageInfo!
}

type WordEdge {
  node: Word!
  cursor: String!
}

# 单词统计响应
type WordStatsResponse {
  totalWords: Int!
  activeWords: Int!
  newWords: Int!
  wordsByDifficulty: [DifficultyWordCount!]!
  topPracticedWords: [WordStats!]!
  wordGrowth: [WordGrowthStats!]!
}

type DifficultyWordCount {
  difficulty: Float!
  count: Int!
}

type WordGrowthStats {
  date: Date!
  newWords: Int!
  totalWords: Int!
}

type WordValidationResult {
  word: String!
  isValid: Boolean!
  suggestions: [String!]
  errors: [String!]
}
```

### 系统管理查询

```graphql
extend type Query {
  # 获取系统统计
  systemStats(
    dateRange: DateRange
  ): SystemStats!
  
  # 获取审计日志
  auditLogs(
    pagination: PaginationInput
    filter: AuditLogFilterInput
    sort: SortInput
  ): AuditLogConnection!
  
  # 获取系统配置
  systemConfigs: [SystemConfig!]!
  
  # 获取单个配置
  systemConfig(key: String!): SystemConfig
  
  # 获取系统健康状态
  systemHealth: SystemHealthResponse!
  
  # 获取数据库统计
  databaseStats: DatabaseStatsResponse!
}

# 审计日志过滤
input AuditLogFilterInput {
  userId: ID
  action: String
  resource: String
  dateRange: DateRange
}

# 审计日志连接
type AuditLogConnection {
  edges: [AuditLogEdge!]!
  pageInfo: PageInfo!
}

type AuditLogEdge {
  node: AuditLog!
  cursor: String!
}

# 系统健康响应
type SystemHealthResponse {
  status: HealthStatus!
  database: ComponentHealth!
  cache: ComponentHealth!
  storage: ComponentHealth!
  uptime: Int!
  version: String!
  lastCheck: DateTime!
}

enum HealthStatus {
  HEALTHY
  WARNING
  CRITICAL
}

type ComponentHealth {
  status: HealthStatus!
  message: String
  responseTime: Float
  lastCheck: DateTime!
}

# 数据库统计响应
type DatabaseStatsResponse {
  tableStats: [TableStats!]!
  totalSize: String!
  indexSize: String!
  connectionCount: Int!
  slowQueries: [SlowQuery!]!
}

type TableStats {
  tableName: String!
  rowCount: Int!
  size: String!
  lastUpdated: DateTime
}

type SlowQuery {
  query: String!
  duration: Float!
  executedAt: DateTime!
  count: Int!
}
```

## 变更操作 (Mutations)

### 认证相关变更

```graphql
type Mutation {
  # 用户登录
  login(
    username: String!
    password: String!
  ): AuthPayload!
  
  # 刷新令牌
  refreshToken(
    refreshToken: String!
  ): AuthPayload!
  
  # 用户登出
  logout(
    refreshToken: String!
  ): MutationResponse!
  
  # 修改密码
  changePassword(
    input: ChangePasswordInput!
  ): MutationResponse!
}

# 认证响应
type AuthPayload {
  success: Boolean!
  token: String
  refreshToken: String
  user: User
  errors: [String!]
}
```

### 用户管理变更

```graphql
extend type Mutation {
  # 创建用户
  createUser(
    input: CreateUserInput!
  ): UserPayload!
  
  # 更新用户
  updateUser(
    id: ID!
    input: UpdateUserInput!
  ): UserPayload!
  
  # 删除用户
  deleteUser(
    id: ID!
  ): MutationResponse!
  
  # 批量删除用户
  deleteUsers(
    ids: [ID!]!
  ): BatchMutationResponse!
  
  # 激活/禁用用户
  toggleUserStatus(
    id: ID!
    isActive: Boolean!
  ): UserPayload!
  
  # 重置用户密码
  resetUserPassword(
    id: ID!
    newPassword: String!
  ): MutationResponse!
  
  # 分配角色
  assignRoles(
    userId: ID!
    roleIds: [ID!]!
  ): UserPayload!
}

# 用户响应
type UserPayload {
  success: Boolean!
  user: User
  errors: [String!]
}

# 批量操作响应
type BatchMutationResponse {
  success: Boolean!
  successCount: Int!
  failureCount: Int!
  errors: [String!]
}
```

### 角色权限管理变更

```graphql
extend type Mutation {
  # 创建角色
  createRole(
    input: CreateRoleInput!
  ): RolePayload!
  
  # 更新角色
  updateRole(
    id: ID!
    input: UpdateRoleInput!
  ): RolePayload!
  
  # 删除角色
  deleteRole(
    id: ID!
  ): MutationResponse!
  
  # 分配权限给角色
  assignPermissions(
    roleId: ID!
    permissionIds: [ID!]!
  ): RolePayload!
}

# 角色响应
type RolePayload {
  success: Boolean!
  role: Role
  errors: [String!]
}
```

### 单词管理变更

```graphql
extend type Mutation {
  # 创建单词
  createWord(
    input: CreateWordInput!
  ): WordPayload!
  
  # 更新单词
  updateWord(
    id: ID!
    input: UpdateWordInput!
  ): WordPayload!
  
  # 删除单词
  deleteWord(
    id: ID!
  ): MutationResponse!
  
  # 批量删除单词
  deleteWords(
    ids: [ID!]!
  ): BatchMutationResponse!
  
  # 批量导入单词
  importWords(
    words: [CreateWordInput!]!
    overwrite: Boolean = false
  ): ImportWordsResponse!
  
  # 批量更新单词状态
  updateWordsStatus(
    ids: [ID!]!
    isActive: Boolean!
  ): BatchMutationResponse!
  
  # 同步Anki单词
  syncAnkiWords: SyncResponse!
}

# 单词响应
type WordPayload {
  success: Boolean!
  word: Word
  errors: [String!]
}

# 导入响应
type ImportWordsResponse {
  success: Boolean!
  importedCount: Int!
  skippedCount: Int!
  errorCount: Int!
  errors: [ImportError!]
}

type ImportError {
  row: Int!
  word: String
  error: String!
}

# 同步响应
type SyncResponse {
  success: Boolean!
  syncedCount: Int!
  newCount: Int!
  updatedCount: Int!
  errors: [String!]
}
```

### 系统管理变更

```graphql
extend type Mutation {
  # 更新系统配置
  updateSystemConfig(
    input: UpdateConfigInput!
  ): SystemConfigPayload!
  
  # 批量更新配置
  updateSystemConfigs(
    inputs: [UpdateConfigInput!]!
  ): BatchConfigResponse!
  
  # 清理审计日志
  cleanupAuditLogs(
    olderThan: DateTime!
  ): MutationResponse!
  
  # 备份数据
  backupData(
    includeUserData: Boolean = true
    includeWordData: Boolean = true
  ): BackupResponse!
  
  # 恢复数据
  restoreData(
    backupId: String!
  ): MutationResponse!
}

# 系统配置响应
type SystemConfigPayload {
  success: Boolean!
  config: SystemConfig
  errors: [String!]
}

# 批量配置响应
type BatchConfigResponse {
  success: Boolean!
  updatedCount: Int!
  errors: [String!]
}

# 备份响应
type BackupResponse {
  success: Boolean!
  backupId: String
  backupSize: String
  createdAt: DateTime
  errors: [String!]
}
```

## 订阅操作 (Subscriptions)

```graphql
type Subscription {
  # 用户状态变化
  userStatusChanged(
    userId: ID
  ): UserStatusEvent!
  
  # 系统统计更新
  systemStatsUpdated: SystemStats!
  
  # 审计日志新增
  auditLogAdded(
    userId: ID
    resource: String
  ): AuditLog!
  
  # 单词同步状态
  wordSyncStatus: SyncStatusEvent!
}

# 用户状态事件
type UserStatusEvent {
  user: User!
  action: UserAction!
  timestamp: DateTime!
}

enum UserAction {
  CREATED
  UPDATED
  DELETED
  ACTIVATED
  DEACTIVATED
  LOGIN
  LOGOUT
}

# 同步状态事件
type SyncStatusEvent {
  status: SyncStatus!
  progress: Float
  message: String
  timestamp: DateTime!
}

enum SyncStatus {
  STARTED
  IN_PROGRESS
  COMPLETED
  FAILED
}
```

## 错误处理

### 错误代码定义

```typescript
enum ErrorCode {
  // 认证错误
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  // 验证错误
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  
  // 资源错误
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  RESOURCE_LOCKED = 'RESOURCE_LOCKED',
  
  // 系统错误
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  // 业务错误
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED'
}
```

### 错误响应格式

```json
{
  "errors": [
    {
      "message": "用户名已存在",
      "code": "DUPLICATE_ENTRY",
      "path": ["createUser"],
      "extensions": {
        "field": "username",
        "value": "admin"
      }
    }
  ],
  "data": {
    "createUser": null
  }
}
```

## 使用示例

### 用户登录

```graphql
mutation Login {
  login(username: "admin", password: "password123") {
    success
    token
    refreshToken
    user {
      id
      username
      email
      roles {
        name
        permissions {
          resource
          action
        }
      }
    }
    errors
  }
}
```

### 获取用户列表

```graphql
query GetUsers {
  users(
    pagination: { first: 20 }
    filter: { isActive: true }
    sort: { field: "createdAt", direction: DESC }
  ) {
    edges {
      node {
        id
        username
        email
        displayName
        isActive
        lastLoginAt
        roles {
          name
        }
      }
    }
    pageInfo {
      hasNextPage
      totalCount
    }
  }
}
```

### 创建用户

```graphql
mutation CreateUser {
  createUser(
    input: {
      username: "newuser"
      email: "newuser@example.com"
      password: "securepassword"
      displayName: "New User"
      roleIds: ["1", "2"]
    }
  ) {
    success
    user {
      id
      username
      email
      roles {
        name
      }
    }
    errors
  }
}
```

### 获取系统统计

```graphql
query GetSystemStats {
  systemStats(
    dateRange: {
      start: "2024-01-01"
      end: "2024-01-31"
    }
  ) {
    totalUsers
    activeUsers
    totalWords
    todaySessions
    userGrowth {
      date
      newUsers
      activeUsers
    }
    topWords {
      word {
        word
        meaning
      }
      practiceCount
      successRate
    }
  }
}
```

### 批量导入单词

```graphql
mutation ImportWords {
  importWords(
    words: [
      {
        word: "example"
        meaning: "例子"
        phonetic: "/ɪɡˈzæmpəl/"
        difficulty: 3.5
        tags: ["common", "noun"]
      }
    ]
    overwrite: false
  ) {
    success
    importedCount
    skippedCount
    errorCount
    errors {
      row
      word
      error
    }
  }
}
```

## 性能考虑

### 查询优化

1. **分页查询**: 所有列表查询都支持基于游标的分页
2. **字段选择**: 只查询需要的字段，避免过度获取
3. **批量加载**: 使用DataLoader避免N+1查询问题
4. **缓存策略**: 对频繁查询的数据进行缓存

### 限制策略

```graphql
# 查询复杂度限制
directive @cost(
  complexity: Int!
  multipliers: [String!]
) on FIELD_DEFINITION

# 查询深度限制
directive @depth(
  max: Int!
) on FIELD_DEFINITION

# 速率限制
directive @rateLimit(
  max: Int!
  window: String!
) on FIELD_DEFINITION
```

## 版本控制

### API版本策略

- 使用GraphQL的内置版本控制机制
- 通过`@deprecated`指令标记废弃字段
- 新功能通过新字段添加，保持向后兼容
- 重大变更通过新的Schema版本发布

### 变更日志

```markdown
## v1.1.0 (2024-02-01)
### 新增
- 添加批量操作支持
- 新增系统健康检查API
- 支持单词标签管理

### 修改
- 优化用户查询性能
- 增强错误信息详细度

### 废弃
- `user.fullName` 字段（使用 `displayName` 替代）

## v1.0.0 (2024-01-01)
### 初始版本
- 基础用户管理功能
- 角色权限系统
- 单词管理功能
- 系统统计功能
```

本API规范为Admin面板提供了完整的数据操作接口，支持用户管理、权限控制、单词管理和系统监控等核心功能。