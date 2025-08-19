# 用户认证系统数据库模式设计

## 1. 概述

本文档定义了用户认证系统的数据库模式设计，包括新增的用户认证表和对现有表的修改。设计遵循以下原则：

- **数据完整性**：确保数据的一致性和完整性
- **安全性**：敏感数据加密存储，权限控制严格
- **可扩展性**：支持未来功能扩展
- **性能优化**：合理的索引设计
- **向后兼容**：最小化对现有数据的影响

## 2. 新增表结构

### 2.1 用户表 (users)

**表名**：`users`
**描述**：存储用户基本信息和认证数据

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(50),
    avatar_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    is_confirmed BOOLEAN DEFAULT FALSE,
    confirmation_token VARCHAR(255),
    confirmation_sent_at DATETIME,
    reset_password_token VARCHAR(255),
    reset_password_sent_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login_at DATETIME,
    login_count INTEGER DEFAULT 0,
    failed_login_count INTEGER DEFAULT 0,
    locked_until DATETIME
);

-- 索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_confirmation_token ON users(confirmation_token);
CREATE INDEX idx_users_reset_token ON users(reset_password_token);
```

**字段说明**：
- `id`: 主键，自增整数
- `username`: 用户名，3-20字符，唯一
- `email`: 邮箱地址，唯一
- `password_hash`: 密码哈希值（bcrypt）
- `display_name`: 显示名称，可为空
- `avatar_url`: 头像URL，可为空
- `is_active`: 账户是否激活
- `is_confirmed`: 邮箱是否已确认
- `confirmation_token`: 邮箱确认令牌
- `confirmation_sent_at`: 确认邮件发送时间
- `reset_password_token`: 密码重置令牌
- `reset_password_sent_at`: 重置邮件发送时间
- `created_at`: 创建时间
- `updated_at`: 更新时间
- `last_login_at`: 最后登录时间
- `login_count`: 登录次数
- `failed_login_count`: 失败登录次数
- `locked_until`: 账户锁定到期时间

### 2.2 角色表 (roles)

**表名**：`roles`
**描述**：定义系统角色

```sql
CREATE TABLE roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255),
    is_default BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_roles_name ON roles(name);

-- 初始数据
INSERT INTO roles (name, description, is_default) VALUES 
('user', '普通用户', TRUE),
('admin', '管理员', FALSE),
('superadmin', '超级管理员', FALSE);
```

**字段说明**：
- `id`: 主键，自增整数
- `name`: 角色名称，唯一
- `description`: 角色描述
- `is_default`: 是否为默认角色（新用户自动分配）
- `created_at`: 创建时间
- `updated_at`: 更新时间

### 2.3 用户角色关联表 (user_roles)

**表名**：`user_roles`
**描述**：用户和角色的多对多关系

```sql
CREATE TABLE user_roles (
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    assigned_by INTEGER,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id)
);

-- 索引
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
```

**字段说明**：
- `user_id`: 用户ID，外键
- `role_id`: 角色ID，外键
- `assigned_at`: 分配时间
- `assigned_by`: 分配者ID，外键

### 2.4 权限表 (permissions)

**表名**：`permissions`
**描述**：定义系统权限（可选，用于细粒度权限控制）

```sql
CREATE TABLE permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(255),
    resource VARCHAR(50),
    action VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_permissions_name ON permissions(name);
CREATE INDEX idx_permissions_resource ON permissions(resource);
```

### 2.5 角色权限关联表 (role_permissions)

**表名**：`role_permissions`
**描述**：角色和权限的多对多关系（可选）

```sql
CREATE TABLE role_permissions (
    role_id INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);
```

### 2.6 用户会话表 (user_sessions)

**表名**：`user_sessions`
**描述**：跟踪用户会话和JWT令牌

```sql
CREATE TABLE user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,
    device_info VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_refresh ON user_sessions(refresh_token);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_sessions_active ON user_sessions(is_active);
```

### 2.7 审计日志表 (audit_logs)

**表名**：`audit_logs`
**描述**：记录重要操作的审计日志

```sql
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id INTEGER,
    old_values TEXT,
    new_values TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 索引
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
```

## 3. 现有表修改

### 3.1 单词表 (words)

**修改内容**：添加用户关联

```sql
-- 添加用户ID字段
ALTER TABLE words ADD COLUMN user_id INTEGER;

-- 添加外键约束
ALTER TABLE words ADD CONSTRAINT fk_words_user 
    FOREIGN KEY (user_id) REFERENCES users(id);

-- 添加索引
CREATE INDEX idx_words_user ON words(user_id);

-- 为现有数据设置默认用户（迁移时处理）
-- UPDATE words SET user_id = 1 WHERE user_id IS NULL;
```

### 3.2 练习会话表 (practice_sessions)

**修改内容**：添加用户关联

```sql
-- 添加用户ID字段
ALTER TABLE practice_sessions ADD COLUMN user_id INTEGER;

-- 添加外键约束
ALTER TABLE practice_sessions ADD CONSTRAINT fk_practice_sessions_user 
    FOREIGN KEY (user_id) REFERENCES users(id);

-- 添加索引
CREATE INDEX idx_practice_sessions_user ON practice_sessions(user_id);
```

### 3.3 用户学习画像表 (user_learning_profiles)

**修改内容**：关联到新的用户表

```sql
-- 修改user_id字段为外键
ALTER TABLE user_learning_profiles ADD CONSTRAINT fk_learning_profiles_user 
    FOREIGN KEY (user_id) REFERENCES users(id);

-- 确保user_id唯一（一个用户一个画像）
CREATE UNIQUE INDEX idx_learning_profiles_user ON user_learning_profiles(user_id);
```

### 3.4 学习会话表 (learning_sessions)

**修改内容**：添加用户关联

```sql
-- 添加用户ID字段
ALTER TABLE learning_sessions ADD COLUMN user_id INTEGER;

-- 添加外键约束
ALTER TABLE learning_sessions ADD CONSTRAINT fk_learning_sessions_user 
    FOREIGN KEY (user_id) REFERENCES users(id);

-- 添加索引
CREATE INDEX idx_learning_sessions_user ON learning_sessions(user_id);
```

### 3.5 每日练习推荐表 (daily_practice_recommendations)

**修改内容**：添加用户关联

```sql
-- 添加用户ID字段
ALTER TABLE daily_practice_recommendations ADD COLUMN user_id INTEGER;

-- 添加外键约束
ALTER TABLE daily_practice_recommendations ADD CONSTRAINT fk_daily_recommendations_user 
    FOREIGN KEY (user_id) REFERENCES users(id);

-- 添加索引
CREATE INDEX idx_daily_recommendations_user ON daily_practice_recommendations(user_id);
```

## 4. 数据迁移策略

### 4.1 迁移步骤

1. **备份现有数据**
   ```sql
   -- 创建备份表
   CREATE TABLE words_backup AS SELECT * FROM words;
   CREATE TABLE practice_sessions_backup AS SELECT * FROM practice_sessions;
   -- ... 其他表的备份
   ```

2. **创建新表**
   - 按照上述定义创建所有新表
   - 插入初始角色数据

3. **创建默认管理员用户**
   ```sql
   INSERT INTO users (username, email, password_hash, display_name, is_active, is_confirmed)
   VALUES ('admin', 'admin@example.com', '$2b$12$...', '系统管理员', TRUE, TRUE);
   
   INSERT INTO user_roles (user_id, role_id)
   VALUES (1, 3); -- 分配超级管理员角色
   ```

4. **修改现有表结构**
   - 添加user_id字段到所有相关表
   - 为现有数据分配默认用户ID

5. **数据验证**
   - 检查外键约束
   - 验证数据完整性
   - 测试查询性能

### 4.2 迁移脚本示例

```python
# migration_script.py
from app import db
from app.models import User, Role, Word, PracticeSession
from werkzeug.security import generate_password_hash

def migrate_to_multi_user():
    # 1. 创建默认管理员
    admin_user = User(
        username='admin',
        email='admin@example.com',
        password_hash=generate_password_hash('admin123'),
        display_name='系统管理员',
        is_active=True,
        is_confirmed=True
    )
    db.session.add(admin_user)
    db.session.commit()
    
    # 2. 为现有数据分配用户
    Word.query.update({Word.user_id: admin_user.id})
    PracticeSession.query.update({PracticeSession.user_id: admin_user.id})
    
    db.session.commit()
    print("数据迁移完成")
```

## 5. 性能优化

### 5.1 索引策略

**主要索引**：
- 用户表：username, email, is_active
- 会话表：user_id, session_token, expires_at
- 审计日志：user_id, created_at
- 所有外键字段

**复合索引**：
```sql
-- 用户会话查询优化
CREATE INDEX idx_sessions_user_active ON user_sessions(user_id, is_active);

-- 审计日志查询优化
CREATE INDEX idx_audit_user_date ON audit_logs(user_id, created_at);

-- 用户角色查询优化
CREATE INDEX idx_user_roles_composite ON user_roles(user_id, role_id);
```

### 5.2 查询优化

**用户认证查询**：
```sql
-- 优化登录查询
SELECT u.*, r.name as role_name 
FROM users u 
LEFT JOIN user_roles ur ON u.id = ur.user_id 
LEFT JOIN roles r ON ur.role_id = r.id 
WHERE (u.username = ? OR u.email = ?) AND u.is_active = TRUE;
```

**数据过滤查询**：
```sql
-- 用户数据隔离
SELECT * FROM words WHERE user_id = ?;
SELECT * FROM practice_sessions WHERE user_id = ?;
```

## 6. 安全考虑

### 6.1 数据加密

- **密码**：使用bcrypt哈希，成本因子12+
- **令牌**：使用安全随机生成器
- **敏感字段**：考虑字段级加密

### 6.2 访问控制

- **行级安全**：确保用户只能访问自己的数据
- **角色检查**：API层面的权限验证
- **审计跟踪**：记录所有敏感操作

### 6.3 数据完整性

- **外键约束**：确保引用完整性
- **检查约束**：验证数据格式
- **触发器**：自动更新时间戳

```sql
-- 自动更新时间戳触发器
CREATE TRIGGER update_users_timestamp 
    AFTER UPDATE ON users
    FOR EACH ROW
    BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
```

## 7. 监控和维护

### 7.1 性能监控

- 慢查询日志
- 索引使用统计
- 连接池监控
- 缓存命中率

### 7.2 数据维护

- 定期清理过期会话
- 审计日志归档
- 数据库统计信息更新
- 备份策略执行

```sql
-- 清理过期会话
DELETE FROM user_sessions 
WHERE expires_at < CURRENT_TIMESTAMP OR is_active = FALSE;

-- 清理旧审计日志（保留1年）
DELETE FROM audit_logs 
WHERE created_at < datetime('now', '-1 year');
```

## 8. 扩展规划

### 8.1 短期扩展

- 用户偏好设置表
- 通知设置表
- 设备管理表

### 8.2 长期扩展

- 多租户支持
- 分片策略
- 读写分离
- 缓存层集成

---

**注意事项**：
1. 所有DDL操作都应该在维护窗口执行
2. 大表的ALTER操作可能需要较长时间
3. 建议在测试环境充分验证后再应用到生产环境
4. 保持数据库备份的完整性和可恢复性