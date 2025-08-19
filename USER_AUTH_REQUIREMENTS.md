# 用户认证系统需求文档

## 1. 项目背景

### 1.1 当前状况
Anki LangChain项目目前是一个单用户的英语学习应用，具备以下功能：
- 单词学习和练习系统
- 智能推荐引擎
- 学习分析和统计
- Anki集成
- 基础用户偏好设置

### 1.2 业务需求
为了支持多用户使用和数据管理，需要实现完整的用户认证和管理系统，确保：
- 用户数据安全和隔离
- 管理员能够有效管理用户和系统
- 良好的用户体验和安全性

## 2. 功能需求

### 2.1 用户认证功能

#### 2.1.1 用户注册
**功能描述**：新用户可以创建账户

**输入要求**：
- 用户名：3-20个字符，支持字母、数字、下划线
- 邮箱：有效的邮箱地址格式
- 密码：8-128个字符，包含大小写字母、数字和特殊字符
- 确认密码：与密码一致

**业务规则**：
- 用户名和邮箱必须唯一
- 密码强度检查（至少包含3种字符类型）
- 邮箱验证（可选，后期扩展）

**输出结果**：
- 成功：返回用户信息和JWT令牌
- 失败：返回具体错误信息

#### 2.1.2 用户登录
**功能描述**：已注册用户可以登录系统

**输入要求**：
- 用户名或邮箱
- 密码

**业务规则**：
- 支持用户名或邮箱登录
- 密码错误次数限制（5次/小时）
- 登录状态保持（JWT令牌）

**输出结果**：
- 成功：返回用户信息和JWT令牌
- 失败：返回错误信息和剩余尝试次数

#### 2.1.3 密码重置
**功能描述**：用户可以重置忘记的密码

**流程**：
1. 用户输入邮箱地址
2. 系统发送重置链接到邮箱
3. 用户点击链接设置新密码
4. 系统更新密码并通知用户

**安全措施**：
- 重置链接有效期：1小时
- 一次性使用
- 新密码强度检查

#### 2.1.4 用户登出
**功能描述**：用户可以安全退出系统

**处理逻辑**：
- 清除客户端JWT令牌
- 将令牌加入黑名单（可选）
- 清除用户会话状态

### 2.2 用户管理功能

#### 2.2.1 用户资料管理
**功能描述**：用户可以查看和编辑个人资料

**可编辑字段**：
- 显示名称
- 邮箱地址
- 学习偏好设置
- 头像（可选）

**业务规则**：
- 邮箱修改需要验证
- 敏感操作需要密码确认

#### 2.2.2 账户设置
**功能描述**：用户可以管理账户安全设置

**功能包括**：
- 修改密码
- 查看登录历史
- 管理设备授权
- 账户注销（软删除）

### 2.3 权限管理功能

#### 2.3.1 角色定义
**普通用户（User）**：
- 访问学习功能
- 管理个人数据
- 查看个人统计

**管理员（Admin）**：
- 所有普通用户权限
- 用户管理
- 系统数据管理
- 系统配置管理

**超级管理员（SuperAdmin）**：
- 所有管理员权限
- 管理员账户管理
- 系统维护功能

#### 2.3.2 权限控制
**API级别**：
- 所有API端点需要认证
- 基于角色的访问控制
- 数据级别的权限过滤

**前端级别**：
- 路由保护
- 组件级权限控制
- 功能按钮权限显示

### 2.4 管理后台功能

#### 2.4.1 用户管理
**功能列表**：
- 用户列表查看和搜索
- 用户详细信息查看
- 用户状态管理（激活/禁用）
- 用户角色分配
- 批量操作支持

#### 2.4.2 数据管理
**功能列表**：
- 所有数据模型的CRUD操作
- 数据导入/导出
- 数据统计和报表
- 数据备份管理

#### 2.4.3 系统监控
**功能列表**：
- 用户活动监控
- 系统性能监控
- 错误日志查看
- 安全事件记录

## 3. 非功能需求

### 3.1 安全性需求

#### 3.1.1 认证安全
- JWT令牌过期时间：24小时
- 刷新令牌机制
- 令牌黑名单支持
- 密码哈希：bcrypt算法

#### 3.1.2 传输安全
- HTTPS强制使用
- CSRF保护
- XSS防护
- SQL注入防护

#### 3.1.3 访问控制
- 基于角色的访问控制（RBAC）
- API速率限制
- 登录尝试限制
- 会话管理

### 3.2 性能需求

#### 3.2.1 响应时间
- 登录响应时间：< 2秒
- API响应时间：< 1秒
- 页面加载时间：< 3秒

#### 3.2.2 并发支持
- 同时在线用户：100+
- 数据库连接池：10-50连接
- 缓存策略：Redis（可选）

### 3.3 可用性需求

#### 3.3.1 用户体验
- 直观的登录/注册界面
- 清晰的错误提示
- 响应式设计支持
- 无障碍访问支持

#### 3.3.2 系统稳定性
- 系统可用性：99.5%
- 错误恢复机制
- 数据备份策略

### 3.4 兼容性需求

#### 3.4.1 浏览器支持
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

#### 3.4.2 设备支持
- 桌面端：Windows、macOS、Linux
- 移动端：iOS、Android（响应式）

## 4. 技术规范

### 4.1 后端技术栈

#### 4.1.1 核心框架
- **Flask 2.3.3**：Web框架
- **Flask-Security-Too**：认证和授权
- **Flask-Admin**：管理后台
- **SQLAlchemy 2.0.23**：ORM
- **Flask-SQLAlchemy 3.1.1**：Flask集成

#### 4.1.2 认证相关
- **PyJWT**：JWT令牌处理
- **bcrypt**：密码哈希
- **Flask-Login**：会话管理
- **Flask-Principal**：权限管理

#### 4.1.3 其他依赖
- **Flask-CORS**：跨域支持
- **Flask-Mail**：邮件发送
- **python-dotenv**：环境变量
- **Marshmallow**：数据序列化

### 4.2 前端技术栈

#### 4.2.1 核心框架
- **React 18.3.1**：UI框架
- **Next.js 14.0.4**：React框架
- **TypeScript**：类型安全

#### 4.2.2 状态管理
- **React Context**：全局状态
- **React Hook Form**：表单处理
- **SWR**：数据获取（可选）

#### 4.2.3 UI组件
- **Tailwind CSS**：样式框架
- **DaisyUI**：组件库
- **Heroicons**：图标库

#### 4.2.4 HTTP客户端
- **Axios**：HTTP请求
- **JWT解码**：令牌处理

### 4.3 数据库设计

#### 4.3.1 新增表结构

**users表**：
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    is_confirmed BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login_at DATETIME,
    login_count INTEGER DEFAULT 0
);
```

**roles表**：
```sql
CREATE TABLE roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**user_roles表**：
```sql
CREATE TABLE user_roles (
    user_id INTEGER,
    role_id INTEGER,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (role_id) REFERENCES roles(id)
);
```

#### 4.3.2 现有表修改
为所有现有表添加user_id外键：
- words表：添加user_id字段
- practice_sessions表：添加user_id字段
- word_memory表：通过word关联用户
- user_learning_profiles表：关联到users表
- learning_sessions表：添加user_id字段

### 4.4 API设计

#### 4.4.1 认证端点
```
POST /api/auth/register     # 用户注册
POST /api/auth/login        # 用户登录
POST /api/auth/logout       # 用户登出
POST /api/auth/refresh      # 刷新令牌
POST /api/auth/reset-password-request  # 请求密码重置
POST /api/auth/reset-password         # 重置密码
```

#### 4.4.2 用户管理端点
```
GET    /api/users/profile   # 获取用户资料
PUT    /api/users/profile   # 更新用户资料
PUT    /api/users/password  # 修改密码
DELETE /api/users/account   # 注销账户
```

#### 4.4.3 管理员端点
```
GET    /api/admin/users     # 用户列表
GET    /api/admin/users/:id # 用户详情
PUT    /api/admin/users/:id # 更新用户
DELETE /api/admin/users/:id # 删除用户
POST   /api/admin/users/:id/roles  # 分配角色
```

## 5. 实施计划

### 5.1 开发阶段
参考IMPLEMENTATION_PLAN.md中的Stage 8-12

### 5.2 测试计划

#### 5.2.1 单元测试
- 认证功能测试覆盖率：90%+
- 权限控制测试覆盖率：95%+
- 数据模型测试覆盖率：85%+

#### 5.2.2 集成测试
- API端点完整性测试
- 前后端集成测试
- 数据库迁移测试

#### 5.2.3 安全测试
- 认证绕过测试
- 权限提升测试
- 注入攻击测试
- 会话管理测试

### 5.3 部署要求

#### 5.3.1 环境变量
```
SECRET_KEY=<强随机密钥>
DATABASE_URL=<数据库连接字符串>
JWT_SECRET_KEY=<JWT密钥>
MAIL_SERVER=<邮件服务器>
MAIL_USERNAME=<邮件用户名>
MAIL_PASSWORD=<邮件密码>
```

#### 5.3.2 安全配置
- HTTPS证书配置
- 防火墙规则设置
- 数据库访问限制
- 日志记录配置

## 6. 验收标准

### 6.1 功能验收
- [ ] 用户可以成功注册和登录
- [ ] 密码重置功能正常工作
- [ ] 用户资料管理功能完整
- [ ] 权限控制准确有效
- [ ] 管理后台功能完善
- [ ] 数据隔离完全有效

### 6.2 性能验收
- [ ] 登录响应时间 < 2秒
- [ ] API响应时间 < 1秒
- [ ] 支持100+并发用户
- [ ] 系统可用性 > 99.5%

### 6.3 安全验收
- [ ] 通过基础安全测试
- [ ] 密码安全存储
- [ ] 会话管理安全
- [ ] 权限控制无漏洞

### 6.4 用户体验验收
- [ ] 界面美观易用
- [ ] 错误提示清晰
- [ ] 响应式设计良好
- [ ] 无障碍访问支持

## 7. 风险评估与应对

### 7.1 技术风险
**风险**：数据迁移可能导致数据丢失
**应对**：
- 完整的数据备份策略
- 分步骤迁移方案
- 回滚机制准备

**风险**：认证系统集成复杂
**应对**：
- 详细的技术调研
- 原型验证
- 分阶段实施

### 7.2 安全风险
**风险**：认证绕过漏洞
**应对**：
- 安全代码审查
- 渗透测试
- 安全框架使用

**风险**：用户数据泄露
**应对**：
- 数据加密存储
- 访问日志记录
- 权限最小化原则

### 7.3 业务风险
**风险**：用户体验下降
**应对**：
- 用户测试反馈
- 渐进式发布
- 快速响应机制

## 8. 后续扩展规划

### 8.1 短期扩展（3个月内）
- 邮箱验证功能
- 双因素认证
- 用户行为分析

### 8.2 中期扩展（6个月内）
- 社交登录集成
- 高级权限管理
- 审计日志系统

### 8.3 长期扩展（1年内）
- 多租户支持
- 单点登录（SSO）
- 企业级功能