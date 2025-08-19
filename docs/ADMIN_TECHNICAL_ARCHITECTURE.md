# Admin面板技术架构文档

## 概述

本文档详细描述Admin面板的技术架构设计，包括GraphQL Schema扩展、数据库设计、API接口规范和前端组件架构。

## 1. GraphQL Schema设计

### 1.1 核心类型定义

```graphql
# 用户类型
type User {
  id: ID!
  username: String!
  email: String!
  displayName: String
  isActive: Boolean!
  roles: [Role!]!
  createdAt: DateTime!
  updatedAt: DateTime!
  lastLoginAt: DateTime
  loginCount: Int!
  learningProfile: UserLearningProfile
  practiceStats: UserPracticeStats
}

# 角色类型
type Role {
  id: ID!
  name: String!
  description: String
  permissions: [Permission!]!
  userCount: Int!
  createdAt: DateTime!
}

# 权限类型
type Permission {
  id: ID!
  resource: String!  # users, words, system, analytics
  action: String!    # read, write, delete, manage
  description: String
}

# 用户连接类型（分页）
type UserConnection {
  edges: [UserEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type UserEdge {
  node: User!
  cursor: String!
}

# 分页信息
type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

# 用户统计
type UserStats {
  totalUsers: Int!
  activeUsers: Int!
  newUsersToday: Int!
  newUsersThisWeek: Int!
  newUsersThisMonth: Int!
  usersByRole: [RoleUserCount!]!
}

type RoleUserCount {
  role: Role!
  count: Int!
}

# 系统统计
type SystemStats {
  totalWords: Int!
  totalPracticeSessions: Int!
  averageAccuracy: Float!
  dailyActiveUsers: Int!
  systemUptime: String!
  databaseSize: String!
}

# 操作日志
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

type AuditLogConnection {
  edges: [AuditLogEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type AuditLogEdge {
  node: AuditLog!
  cursor: String!
}
```

### 1.2 输入类型定义

```graphql
# 用户创建输入
input CreateUserInput {
  username: String!
  email: String!
  password: String!
  displayName: String
  roleIds: [ID!]
  isActive: Boolean = true
}

# 用户更新输入
input UpdateUserInput {
  username: String
  email: String
  displayName: String
  isActive: Boolean
  roleIds: [ID!]
}

# 用户筛选输入
input UserFilterInput {
  search: String
  roleId: ID
  isActive: Boolean
  createdAfter: DateTime
  createdBefore: DateTime
}

# 角色创建输入
input CreateRoleInput {
  name: String!
  description: String
  permissionIds: [ID!]!
}

# 角色更新输入
input UpdateRoleInput {
  name: String
  description: String
  permissionIds: [ID!]
}

# 审计日志筛选
input AuditLogFilterInput {
  userId: ID
  action: String
  resource: String
  dateFrom: DateTime
  dateTo: DateTime
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
```

### 1.3 查询定义

```graphql
type Query {
  # 用户管理查询
  users(
    first: Int
    after: String
    filter: UserFilterInput
    sort: SortInput
  ): UserConnection!
  
  user(id: ID!): User
  
  currentUser: User
  
  # 角色和权限查询
  roles: [Role!]!
  
  role(id: ID!): Role
  
  permissions: [Permission!]!
  
  # 统计查询
  userStats: UserStats!
  
  systemStats: SystemStats!
  
  # 审计日志查询
  auditLogs(
    first: Int
    after: String
    filter: AuditLogFilterInput
    sort: SortInput
  ): AuditLogConnection!
  
  # 数据导出查询
  exportUsers(format: ExportFormat!): ExportResult!
  
  exportWords(format: ExportFormat!): ExportResult!
}

enum ExportFormat {
  CSV
  JSON
  XLSX
}

type ExportResult {
  url: String!
  filename: String!
  size: Int!
  expiresAt: DateTime!
}
```

### 1.4 变更定义

```graphql
type Mutation {
  # 认证相关
  login(username: String!, password: String!): AuthPayload!
  
  logout: Boolean!
  
  refreshToken: AuthPayload!
  
  # 用户管理
  createUser(input: CreateUserInput!): UserPayload!
  
  updateUser(id: ID!, input: UpdateUserInput!): UserPayload!
  
  deleteUser(id: ID!): DeletePayload!
  
  deleteUsers(ids: [ID!]!): BatchDeletePayload!
  
  activateUser(id: ID!): UserPayload!
  
  deactivateUser(id: ID!): UserPayload!
  
  resetUserPassword(id: ID!, newPassword: String!): UserPayload!
  
  # 角色管理
  createRole(input: CreateRoleInput!): RolePayload!
  
  updateRole(id: ID!, input: UpdateRoleInput!): RolePayload!
  
  deleteRole(id: ID!): DeletePayload!
  
  assignRole(userId: ID!, roleId: ID!): UserPayload!
  
  removeRole(userId: ID!, roleId: ID!): UserPayload!
  
  # 数据管理
  importWords(file: Upload!): ImportResult!
  
  bulkUpdateWords(updates: [WordUpdateInput!]!): BulkUpdateResult!
  
  # 系统管理
  clearAuditLogs(olderThan: DateTime!): DeletePayload!
  
  backupDatabase: BackupResult!
  
  restoreDatabase(backupId: ID!): RestoreResult!
}

# 响应类型
type AuthPayload {
  success: Boolean!
  token: String
  refreshToken: String
  user: User
  errors: [Error!]
}

type UserPayload {
  success: Boolean!
  user: User
  errors: [Error!]
}

type RolePayload {
  success: Boolean!
  role: Role
  errors: [Error!]
}

type DeletePayload {
  success: Boolean!
  deletedId: ID
  errors: [Error!]
}

type BatchDeletePayload {
  success: Boolean!
  deletedIds: [ID!]!
  failedIds: [ID!]!
  errors: [Error!]
}

type ImportResult {
  success: Boolean!
  importedCount: Int!
  failedCount: Int!
  errors: [Error!]
}

type BulkUpdateResult {
  success: Boolean!
  updatedCount: Int!
  failedCount: Int!
  errors: [Error!]
}

type BackupResult {
  success: Boolean!
  backupId: ID!
  filename: String!
  size: Int!
  errors: [Error!]
}

type RestoreResult {
  success: Boolean!
  restoredAt: DateTime!
  errors: [Error!]
}

type Error {
  field: String
  message: String!
  code: String
}
```

## 2. 数据库设计

### 2.1 用户相关表

```sql
-- 用户表
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at DATETIME,
    login_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- 索引
    INDEX idx_users_username (username),
    INDEX idx_users_email (email),
    INDEX idx_users_active (is_active),
    INDEX idx_users_created (created_at)
);

-- 角色表
CREATE TABLE roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_roles_name (name)
);

-- 权限表
CREATE TABLE permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resource VARCHAR(50) NOT NULL,  -- users, words, system, analytics
    action VARCHAR(50) NOT NULL,    -- read, write, delete, manage
    description VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_permissions_resource_action (resource, action),
    INDEX idx_permissions_resource (resource)
);

-- 用户角色关联表
CREATE TABLE user_roles (
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    assigned_by INTEGER,  -- 分配者用户ID
    
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 角色权限关联表
CREATE TABLE role_permissions (
    role_id INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);
```

### 2.2 审计日志表

```sql
-- 操作日志表
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action VARCHAR(100) NOT NULL,     -- CREATE, UPDATE, DELETE, LOGIN, LOGOUT
    resource VARCHAR(100) NOT NULL,   -- users, words, roles, system
    resource_id VARCHAR(100),         -- 资源ID
    details TEXT,                     -- JSON格式的详细信息
    ip_address VARCHAR(45),           -- 支持IPv6
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_audit_logs_user (user_id),
    INDEX idx_audit_logs_action (action),
    INDEX idx_audit_logs_resource (resource),
    INDEX idx_audit_logs_created (created_at)
);
```

### 2.3 会话管理表

```sql
-- JWT刷新令牌表
CREATE TABLE refresh_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_refresh_tokens_user (user_id),
    INDEX idx_refresh_tokens_hash (token_hash),
    INDEX idx_refresh_tokens_expires (expires_at)
);
```

### 2.4 数据迁移脚本

```sql
-- 初始化默认角色和权限
INSERT INTO roles (name, description) VALUES 
('user', '普通用户'),
('admin', '管理员'),
('superadmin', '超级管理员');

INSERT INTO permissions (resource, action, description) VALUES 
-- 用户管理权限
('users', 'read', '查看用户信息'),
('users', 'write', '编辑用户信息'),
('users', 'delete', '删除用户'),
('users', 'manage', '管理用户角色'),

-- 单词管理权限
('words', 'read', '查看单词数据'),
('words', 'write', '编辑单词数据'),
('words', 'delete', '删除单词数据'),
('words', 'manage', '批量管理单词'),

-- 系统管理权限
('system', 'read', '查看系统信息'),
('system', 'write', '修改系统配置'),
('system', 'manage', '系统维护操作'),

-- 分析权限
('analytics', 'read', '查看数据分析'),
('analytics', 'manage', '管理分析报表');

-- 为角色分配权限
-- 普通用户权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'user' AND p.resource IN ('words') AND p.action = 'read';

-- 管理员权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'admin' AND p.resource IN ('users', 'words', 'analytics');

-- 超级管理员权限（所有权限）
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'superadmin';

-- 创建默认管理员用户
INSERT INTO users (username, email, password_hash, display_name, is_active)
VALUES ('admin', 'admin@example.com', '$2b$12$...', '系统管理员', TRUE);

-- 为默认管理员分配超级管理员角色
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r 
WHERE u.username = 'admin' AND r.name = 'superadmin';
```

## 3. API接口规范

### 3.1 认证接口

```python
# backend/app/auth/resolvers.py
class AuthMutation:
    @staticmethod
    def resolve_login(root, info, username, password):
        """用户登录"""
        try:
            user = User.query.filter_by(username=username).first()
            if not user or not user.check_password(password):
                return AuthPayload(
                    success=False,
                    errors=[Error(message="用户名或密码错误")]
                )
            
            if not user.is_active:
                return AuthPayload(
                    success=False,
                    errors=[Error(message="账户已被禁用")]
                )
            
            # 更新登录信息
            user.last_login_at = datetime.utcnow()
            user.login_count += 1
            db.session.commit()
            
            # 生成JWT令牌
            token = generate_jwt_token(user)
            refresh_token = generate_refresh_token(user)
            
            # 记录审计日志
            log_audit_event(
                user_id=user.id,
                action='LOGIN',
                resource='auth',
                ip_address=get_client_ip(info.context),
                user_agent=get_user_agent(info.context)
            )
            
            return AuthPayload(
                success=True,
                token=token,
                refresh_token=refresh_token,
                user=user
            )
            
        except Exception as e:
            return AuthPayload(
                success=False,
                errors=[Error(message=str(e))]
            )
```

### 3.2 用户管理接口

```python
# backend/app/admin/user_resolvers.py
class UserQuery:
    @staticmethod
    @require_permission('users', 'read')
    def resolve_users(root, info, first=10, after=None, filter=None, sort=None):
        """获取用户列表（分页）"""
        query = User.query
        
        # 应用筛选条件
        if filter:
            if filter.get('search'):
                search = f"%{filter['search']}%"
                query = query.filter(
                    or_(
                        User.username.like(search),
                        User.email.like(search),
                        User.display_name.like(search)
                    )
                )
            
            if filter.get('roleId'):
                query = query.join(User.roles).filter(Role.id == filter['roleId'])
            
            if filter.get('isActive') is not None:
                query = query.filter(User.is_active == filter['isActive'])
            
            if filter.get('createdAfter'):
                query = query.filter(User.created_at >= filter['createdAfter'])
            
            if filter.get('createdBefore'):
                query = query.filter(User.created_at <= filter['createdBefore'])
        
        # 应用排序
        if sort:
            field = getattr(User, sort['field'], User.created_at)
            if sort['direction'] == 'DESC':
                query = query.order_by(field.desc())
            else:
                query = query.order_by(field.asc())
        else:
            query = query.order_by(User.created_at.desc())
        
        # 分页处理
        if after:
            cursor_data = decode_cursor(after)
            query = query.filter(User.id > cursor_data['id'])
        
        users = query.limit(first + 1).all()
        
        # 构建连接响应
        has_next_page = len(users) > first
        if has_next_page:
            users = users[:-1]
        
        edges = [
            UserEdge(
                node=user,
                cursor=encode_cursor({'id': user.id})
            )
            for user in users
        ]
        
        page_info = PageInfo(
            has_next_page=has_next_page,
            has_previous_page=after is not None,
            start_cursor=edges[0].cursor if edges else None,
            end_cursor=edges[-1].cursor if edges else None
        )
        
        total_count = User.query.count()
        
        return UserConnection(
            edges=edges,
            page_info=page_info,
            total_count=total_count
        )
    
    @staticmethod
    @require_permission('users', 'read')
    def resolve_user(root, info, id):
        """获取单个用户信息"""
        return User.query.get(id)
```

### 3.3 权限检查装饰器

```python
# backend/app/auth/decorators.py
from functools import wraps
from flask_jwt_extended import get_jwt_identity, jwt_required
from graphql import GraphQLError

def require_permission(resource: str, action: str):
    """权限检查装饰器"""
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            
            if not user or not user.is_active:
                raise GraphQLError("用户未认证或已被禁用")
            
            if not user.has_permission(resource, action):
                # 记录权限违规日志
                log_audit_event(
                    user_id=user.id,
                    action='PERMISSION_DENIED',
                    resource=resource,
                    details={'required_action': action}
                )
                raise GraphQLError(f"权限不足：需要{resource}.{action}权限")
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def require_role(role_name: str):
    """角色检查装饰器"""
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            
            if not user or not user.is_active:
                raise GraphQLError("用户未认证或已被禁用")
            
            if not user.has_role(role_name):
                raise GraphQLError(f"权限不足：需要{role_name}角色")
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator
```

## 4. 前端组件架构

### 4.1 路由配置

```typescript
// frontend/src/pages/admin/_middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  try {
    const payload = verifyToken(token);
    const userRoles = payload.roles || [];
    
    // 检查是否有管理员权限
    if (!userRoles.some(role => ['admin', 'superadmin'].includes(role))) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    
    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: '/admin/:path*'
};
```

### 4.2 权限管理Hook

```typescript
// frontend/src/hooks/useAuth.ts
import { useContext, createContext, useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_CURRENT_USER } from '@/graphql/queries';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  hasRole: (role: string) => boolean;
  hasPermission: (resource: string, action: string) => boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const { data, loading, error } = useQuery(GET_CURRENT_USER, {
    skip: !token,
    errorPolicy: 'ignore'
  });
  
  useEffect(() => {
    const savedToken = localStorage.getItem('auth-token');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);
  
  const hasRole = (role: string): boolean => {
    return data?.currentUser?.roles?.some(r => r.name === role) || false;
  };
  
  const hasPermission = (resource: string, action: string): boolean => {
    const userRoles = data?.currentUser?.roles || [];
    return userRoles.some(role => 
      role.permissions.some(p => 
        p.resource === resource && p.action === action
      )
    );
  };
  
  const login = (newToken: string) => {
    localStorage.setItem('auth-token', newToken);
    setToken(newToken);
  };
  
  const logout = () => {
    localStorage.removeItem('auth-token');
    setToken(null);
  };
  
  return (
    <AuthContext.Provider value={{
      user: data?.currentUser || null,
      loading,
      hasRole,
      hasPermission,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### 4.3 权限控制组件

```typescript
// frontend/src/components/auth/PermissionGuard.tsx
import { useAuth } from '@/hooks/useAuth';

interface PermissionGuardProps {
  resource: string;
  action: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAll?: boolean; // 是否需要所有权限
}

export default function PermissionGuard({
  resource,
  action,
  children,
  fallback = null,
  requireAll = false
}: PermissionGuardProps) {
  const { hasPermission, loading } = useAuth();
  
  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-4 rounded"></div>;
  }
  
  const permissions = Array.isArray(resource) 
    ? resource.map((r, i) => ({ resource: r, action: action[i] || action }))
    : [{ resource, action }];
  
  const hasAccess = requireAll
    ? permissions.every(p => hasPermission(p.resource, p.action))
    : permissions.some(p => hasPermission(p.resource, p.action));
  
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

// 角色守卫组件
interface RoleGuardProps {
  roles: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAll?: boolean;
}

export function RoleGuard({
  roles,
  children,
  fallback = null,
  requireAll = false
}: RoleGuardProps) {
  const { hasRole, loading } = useAuth();
  
  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-4 rounded"></div>;
  }
  
  const roleList = Array.isArray(roles) ? roles : [roles];
  const hasAccess = requireAll
    ? roleList.every(role => hasRole(role))
    : roleList.some(role => hasRole(role));
  
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
```

## 5. 安全实现

### 5.1 JWT令牌管理

```python
# backend/app/auth/jwt_manager.py
import jwt
from datetime import datetime, timedelta
from flask import current_app
from typing import Dict, Any

class JWTManager:
    @staticmethod
    def generate_token(user: User, expires_delta: timedelta = None) -> str:
        """生成JWT访问令牌"""
        if expires_delta is None:
            expires_delta = timedelta(hours=24)
        
        payload = {
            'user_id': user.id,
            'username': user.username,
            'roles': [role.name for role in user.roles],
            'exp': datetime.utcnow() + expires_delta,
            'iat': datetime.utcnow(),
            'type': 'access'
        }
        
        return jwt.encode(
            payload,
            current_app.config['JWT_SECRET_KEY'],
            algorithm='HS256'
        )
    
    @staticmethod
    def generate_refresh_token(user: User) -> str:
        """生成刷新令牌"""
        expires_delta = timedelta(days=30)
        
        payload = {
            'user_id': user.id,
            'exp': datetime.utcnow() + expires_delta,
            'iat': datetime.utcnow(),
            'type': 'refresh'
        }
        
        token = jwt.encode(
            payload,
            current_app.config['JWT_SECRET_KEY'],
            algorithm='HS256'
        )
        
        # 存储刷新令牌
        refresh_token = RefreshToken(
            user_id=user.id,
            token_hash=hash_token(token),
            expires_at=datetime.utcnow() + expires_delta
        )
        db.session.add(refresh_token)
        db.session.commit()
        
        return token
    
    @staticmethod
    def verify_token(token: str) -> Dict[str, Any]:
        """验证JWT令牌"""
        try:
            payload = jwt.decode(
                token,
                current_app.config['JWT_SECRET_KEY'],
                algorithms=['HS256']
            )
            return payload
        except jwt.ExpiredSignatureError:
            raise AuthenticationError("令牌已过期")
        except jwt.InvalidTokenError:
            raise AuthenticationError("无效令牌")
```

### 5.2 输入验证和清理

```python
# backend/app/utils/validators.py
import re
from typing import List, Dict, Any
from graphql import GraphQLError

class InputValidator:
    @staticmethod
    def validate_username(username: str) -> str:
        """验证用户名"""
        if not username or len(username) < 3:
            raise GraphQLError("用户名至少需要3个字符")
        
        if len(username) > 50:
            raise GraphQLError("用户名不能超过50个字符")
        
        if not re.match(r'^[a-zA-Z0-9_]+$', username):
            raise GraphQLError("用户名只能包含字母、数字和下划线")
        
        return username.strip().lower()
    
    @staticmethod
    def validate_email(email: str) -> str:
        """验证邮箱"""
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        
        if not email or not re.match(email_pattern, email):
            raise GraphQLError("请输入有效的邮箱地址")
        
        if len(email) > 120:
            raise GraphQLError("邮箱地址不能超过120个字符")
        
        return email.strip().lower()
    
    @staticmethod
    def validate_password(password: str) -> None:
        """验证密码强度"""
        if not password or len(password) < 8:
            raise GraphQLError("密码至少需要8个字符")
        
        if len(password) > 128:
            raise GraphQLError("密码不能超过128个字符")
        
        # 检查密码复杂度
        has_upper = re.search(r'[A-Z]', password)
        has_lower = re.search(r'[a-z]', password)
        has_digit = re.search(r'\d', password)
        has_special = re.search(r'[!@#$%^&*(),.?":{}|<>]', password)
        
        if not (has_upper and has_lower and has_digit):
            raise GraphQLError("密码必须包含大写字母、小写字母和数字")
    
    @staticmethod
    def sanitize_input(data: Dict[str, Any]) -> Dict[str, Any]:
        """清理输入数据"""
        sanitized = {}
        
        for key, value in data.items():
            if isinstance(value, str):
                # 移除潜在的XSS攻击代码
                value = re.sub(r'<script[^>]*>.*?</script>', '', value, flags=re.IGNORECASE | re.DOTALL)
                value = re.sub(r'javascript:', '', value, flags=re.IGNORECASE)
                value = value.strip()
            
            sanitized[key] = value
        
        return sanitized
```

## 6. 性能优化

### 6.1 数据库查询优化

```python
# backend/app/utils/dataloader.py
from aiodataloader import DataLoader
from typing import List, Dict, Any

class UserRoleLoader(DataLoader):
    """用户角色数据加载器"""
    
    async def batch_load_fn(self, user_ids: List[int]) -> List[List[Role]]:
        """批量加载用户角色"""
        # 一次查询获取所有用户的角色
        user_roles = db.session.query(UserRole, Role).join(Role).filter(
            UserRole.user_id.in_(user_ids)
        ).all()
        
        # 按用户ID分组
        roles_by_user = {}
        for user_role, role in user_roles:
            if user_role.user_id not in roles_by_user:
                roles_by_user[user_role.user_id] = []
            roles_by_user[user_role.user_id].append(role)
        
        # 返回按user_ids顺序排列的结果
        return [roles_by_user.get(user_id, []) for user_id in user_ids]

class PermissionLoader(DataLoader):
    """权限数据加载器"""
    
    async def batch_load_fn(self, role_ids: List[int]) -> List[List[Permission]]:
        """批量加载角色权限"""
        role_permissions = db.session.query(RolePermission, Permission).join(Permission).filter(
            RolePermission.role_id.in_(role_ids)
        ).all()
        
        permissions_by_role = {}
        for role_permission, permission in role_permissions:
            if role_permission.role_id not in permissions_by_role:
                permissions_by_role[role_permission.role_id] = []
            permissions_by_role[role_permission.role_id].append(permission)
        
        return [permissions_by_role.get(role_id, []) for role_id in role_ids]
```

### 6.2 缓存策略

```python
# backend/app/utils/cache.py
from flask_caching import Cache
from functools import wraps
import json
import hashlib

cache = Cache()

def cache_user_permissions(timeout=300):
    """缓存用户权限"""
    def decorator(f):
        @wraps(f)
        def decorated_function(user_id, *args, **kwargs):
            cache_key = f"user_permissions:{user_id}"
            
            # 尝试从缓存获取
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # 执行函数并缓存结果
            result = f(user_id, *args, **kwargs)
            cache.set(cache_key, result, timeout=timeout)
            
            return result
        return decorated_function
    return decorator

def invalidate_user_cache(user_id: int):
    """清除用户相关缓存"""
    cache.delete(f"user_permissions:{user_id}")
    cache.delete(f"user_roles:{user_id}")

def cache_query_result(timeout=60):
    """缓存GraphQL查询结果"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # 生成缓存键
            cache_data = {
                'function': f.__name__,
                'args': str(args),
                'kwargs': str(sorted(kwargs.items()))
            }
            cache_key = hashlib.md5(
                json.dumps(cache_data, sort_keys=True).encode()
            ).hexdigest()
            
            # 尝试从缓存获取
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # 执行函数并缓存结果
            result = f(*args, **kwargs)
            cache.set(cache_key, result, timeout=timeout)
            
            return result
        return decorated_function
    return decorator
```

---

**文档版本**: v1.0  
**创建日期**: 2024年1月  
**最后更新**: 2024年1月  
**维护者**: 开发团队