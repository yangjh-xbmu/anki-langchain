# Admin面板开发指南

## 概述

本指南提供Admin面板开发的详细步骤、代码示例和最佳实践，帮助开发者快速上手并保持代码质量。

## 开发环境准备

### 1. 依赖安装

#### 后端依赖
```bash
# 进入后端目录
cd backend

# 安装新的依赖包
pip install flask-jwt-extended
pip install flask-caching
pip install bcrypt
pip install python-multipart  # 文件上传支持
pip install openpyxl  # Excel导出支持

# 更新requirements.txt
pip freeze > requirements.txt
```

#### 前端依赖
```bash
# 进入前端目录
cd frontend

# 安装新的依赖包
npm install @headlessui/react  # 无障碍UI组件
npm install @heroicons/react   # 图标库
npm install react-hook-form    # 表单管理
npm install yup               # 表单验证
npm install @hookform/resolvers # 表单验证集成
npm install react-table       # 表格组件
npm install date-fns          # 日期处理
npm install recharts          # 图表库
```

### 2. 环境配置

#### 后端配置
```python
# backend/config.py
import os
from datetime import timedelta

class Config:
    # 现有配置...
    
    # JWT配置
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'your-secret-key-change-in-production'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # 缓存配置
    CACHE_TYPE = 'simple'  # 开发环境使用简单缓存
    CACHE_DEFAULT_TIMEOUT = 300
    
    # 文件上传配置
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
    
    # 管理员配置
    DEFAULT_ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME') or 'admin'
    DEFAULT_ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL') or 'admin@example.com'
    DEFAULT_ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD') or 'admin123456'

class DevelopmentConfig(Config):
    DEBUG = True
    
class ProductionConfig(Config):
    DEBUG = False
    # 生产环境使用Redis缓存
    CACHE_TYPE = 'redis'
    CACHE_REDIS_URL = os.environ.get('REDIS_URL') or 'redis://localhost:6379/0'
```

#### 前端配置
```typescript
// frontend/src/config/admin.ts
export const ADMIN_CONFIG = {
  // 分页配置
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  
  // 权限配置
  ROLES: {
    USER: 'user',
    ADMIN: 'admin',
    SUPER_ADMIN: 'superadmin'
  },
  
  // 资源权限
  RESOURCES: {
    USERS: 'users',
    WORDS: 'words',
    SYSTEM: 'system',
    ANALYTICS: 'analytics'
  },
  
  // 操作权限
  ACTIONS: {
    READ: 'read',
    WRITE: 'write',
    DELETE: 'delete',
    MANAGE: 'manage'
  },
  
  // 路由配置
  ROUTES: {
    DASHBOARD: '/admin',
    USERS: '/admin/users',
    WORDS: '/admin/words',
    ANALYTICS: '/admin/analytics',
    SYSTEM: '/admin/system'
  }
};
```

## 阶段1：基础认证系统开发

### 1.1 数据模型创建

```python
# backend/app/models.py - 添加到现有文件
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from . import db

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    display_name = db.Column(db.String(100))
    is_active = db.Column(db.Boolean, default=True, index=True)
    last_login_at = db.Column(db.DateTime)
    login_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    roles = db.relationship('Role', secondary='user_roles', back_populates='users')
    refresh_tokens = db.relationship('RefreshToken', backref='user', cascade='all, delete-orphan')
    audit_logs = db.relationship('AuditLog', backref='user')
    
    def set_password(self, password: str):
        """设置密码"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password: str) -> bool:
        """验证密码"""
        return check_password_hash(self.password_hash, password)
    
    def has_role(self, role_name: str) -> bool:
        """检查用户是否有指定角色"""
        return any(role.name == role_name for role in self.roles)
    
    def has_permission(self, resource: str, action: str) -> bool:
        """检查用户是否有指定权限"""
        for role in self.roles:
            for permission in role.permissions:
                if permission.resource == resource and permission.action == action:
                    return True
        return False
    
    def get_permissions(self) -> list:
        """获取用户所有权限"""
        permissions = set()
        for role in self.roles:
            for permission in role.permissions:
                permissions.add(f"{permission.resource}.{permission.action}")
        return list(permissions)
    
    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'display_name': self.display_name,
            'is_active': self.is_active,
            'last_login_at': self.last_login_at.isoformat() if self.last_login_at else None,
            'login_count': self.login_count,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'roles': [role.name for role in self.roles]
        }

class Role(db.Model):
    __tablename__ = 'roles'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False, index=True)
    description = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    users = db.relationship('User', secondary='user_roles', back_populates='roles')
    permissions = db.relationship('Permission', secondary='role_permissions', back_populates='roles')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'permissions': [p.to_dict() for p in self.permissions],
            'user_count': len(self.users)
        }

class Permission(db.Model):
    __tablename__ = 'permissions'
    
    id = db.Column(db.Integer, primary_key=True)
    resource = db.Column(db.String(50), nullable=False, index=True)
    action = db.Column(db.String(50), nullable=False, index=True)
    description = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 关系
    roles = db.relationship('Role', secondary='role_permissions', back_populates='permissions')
    
    __table_args__ = (db.UniqueConstraint('resource', 'action', name='uk_resource_action'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'resource': self.resource,
            'action': self.action,
            'description': self.description
        }

# 关联表
user_roles = db.Table('user_roles',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('role_id', db.Integer, db.ForeignKey('roles.id'), primary_key=True),
    db.Column('assigned_at', db.DateTime, default=datetime.utcnow),
    db.Column('assigned_by', db.Integer, db.ForeignKey('users.id'))
)

role_permissions = db.Table('role_permissions',
    db.Column('role_id', db.Integer, db.ForeignKey('roles.id'), primary_key=True),
    db.Column('permission_id', db.Integer, db.ForeignKey('permissions.id'), primary_key=True)
)

class RefreshToken(db.Model):
    __tablename__ = 'refresh_tokens'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    token_hash = db.Column(db.String(255), nullable=False, index=True)
    expires_at = db.Column(db.DateTime, nullable=False, index=True)
    is_revoked = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), index=True)
    action = db.Column(db.String(100), nullable=False, index=True)
    resource = db.Column(db.String(100), nullable=False, index=True)
    resource_id = db.Column(db.String(100), index=True)
    details = db.Column(db.Text)  # JSON格式
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
```

### 1.2 数据库迁移脚本

```python
# backend/migrations/create_admin_tables.py
from flask import current_app
from app import db
from app.models import User, Role, Permission, user_roles, role_permissions
from werkzeug.security import generate_password_hash

def create_admin_tables():
    """创建管理相关表"""
    # 创建所有表
    db.create_all()
    
    # 初始化默认权限
    permissions_data = [
        # 用户管理权限
        {'resource': 'users', 'action': 'read', 'description': '查看用户信息'},
        {'resource': 'users', 'action': 'write', 'description': '编辑用户信息'},
        {'resource': 'users', 'action': 'delete', 'description': '删除用户'},
        {'resource': 'users', 'action': 'manage', 'description': '管理用户角色'},
        
        # 单词管理权限
        {'resource': 'words', 'action': 'read', 'description': '查看单词数据'},
        {'resource': 'words', 'action': 'write', 'description': '编辑单词数据'},
        {'resource': 'words', 'action': 'delete', 'description': '删除单词数据'},
        {'resource': 'words', 'action': 'manage', 'description': '批量管理单词'},
        
        # 系统管理权限
        {'resource': 'system', 'action': 'read', 'description': '查看系统信息'},
        {'resource': 'system', 'action': 'write', 'description': '修改系统配置'},
        {'resource': 'system', 'action': 'manage', 'description': '系统维护操作'},
        
        # 分析权限
        {'resource': 'analytics', 'action': 'read', 'description': '查看数据分析'},
        {'resource': 'analytics', 'action': 'manage', 'description': '管理分析报表'}
    ]
    
    # 创建权限
    permissions = {}
    for perm_data in permissions_data:
        permission = Permission.query.filter_by(
            resource=perm_data['resource'],
            action=perm_data['action']
        ).first()
        
        if not permission:
            permission = Permission(**perm_data)
            db.session.add(permission)
            
        permissions[f"{perm_data['resource']}.{perm_data['action']}"] = permission
    
    # 创建默认角色
    roles_data = [
        {
            'name': 'user',
            'description': '普通用户',
            'permissions': ['words.read']
        },
        {
            'name': 'admin',
            'description': '管理员',
            'permissions': [
                'users.read', 'users.write', 'users.delete', 'users.manage',
                'words.read', 'words.write', 'words.delete', 'words.manage',
                'analytics.read', 'analytics.manage'
            ]
        },
        {
            'name': 'superadmin',
            'description': '超级管理员',
            'permissions': list(permissions.keys())  # 所有权限
        }
    ]
    
    roles = {}
    for role_data in roles_data:
        role = Role.query.filter_by(name=role_data['name']).first()
        
        if not role:
            role = Role(
                name=role_data['name'],
                description=role_data['description']
            )
            db.session.add(role)
            
            # 分配权限
            for perm_key in role_data['permissions']:
                if perm_key in permissions:
                    role.permissions.append(permissions[perm_key])
        
        roles[role_data['name']] = role
    
    # 创建默认管理员用户
    admin_user = User.query.filter_by(username=current_app.config['DEFAULT_ADMIN_USERNAME']).first()
    
    if not admin_user:
        admin_user = User(
            username=current_app.config['DEFAULT_ADMIN_USERNAME'],
            email=current_app.config['DEFAULT_ADMIN_EMAIL'],
            display_name='系统管理员',
            is_active=True
        )
        admin_user.set_password(current_app.config['DEFAULT_ADMIN_PASSWORD'])
        
        # 分配超级管理员角色
        admin_user.roles.append(roles['superadmin'])
        
        db.session.add(admin_user)
    
    # 提交所有更改
    db.session.commit()
    
    print("Admin tables created successfully!")
    print(f"Default admin user: {current_app.config['DEFAULT_ADMIN_USERNAME']}")
    print(f"Default admin password: {current_app.config['DEFAULT_ADMIN_PASSWORD']}")

if __name__ == '__main__':
    from app import create_app
    
    app = create_app()
    with app.app_context():
        create_admin_tables()
```

### 1.3 JWT认证实现

```python
# backend/app/auth/__init__.py
from flask import Blueprint

auth_bp = Blueprint('auth', __name__)

from . import routes, jwt_manager
```

```python
# backend/app/auth/jwt_manager.py
import jwt
import hashlib
from datetime import datetime, timedelta
from flask import current_app
from typing import Dict, Any, Optional
from ..models import User, RefreshToken
from .. import db

class JWTManager:
    @staticmethod
    def generate_access_token(user: User) -> str:
        """生成访问令牌"""
        payload = {
            'user_id': user.id,
            'username': user.username,
            'roles': [role.name for role in user.roles],
            'permissions': user.get_permissions(),
            'exp': datetime.utcnow() + current_app.config['JWT_ACCESS_TOKEN_EXPIRES'],
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
        payload = {
            'user_id': user.id,
            'exp': datetime.utcnow() + current_app.config['JWT_REFRESH_TOKEN_EXPIRES'],
            'iat': datetime.utcnow(),
            'type': 'refresh'
        }
        
        token = jwt.encode(
            payload,
            current_app.config['JWT_SECRET_KEY'],
            algorithm='HS256'
        )
        
        # 存储刷新令牌哈希
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        refresh_token = RefreshToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=datetime.utcnow() + current_app.config['JWT_REFRESH_TOKEN_EXPIRES']
        )
        
        db.session.add(refresh_token)
        db.session.commit()
        
        return token
    
    @staticmethod
    def verify_token(token: str) -> Dict[str, Any]:
        """验证令牌"""
        try:
            payload = jwt.decode(
                token,
                current_app.config['JWT_SECRET_KEY'],
                algorithms=['HS256']
            )
            return payload
        except jwt.ExpiredSignatureError:
            raise ValueError("令牌已过期")
        except jwt.InvalidTokenError:
            raise ValueError("无效令牌")
    
    @staticmethod
    def refresh_access_token(refresh_token: str) -> Optional[str]:
        """使用刷新令牌生成新的访问令牌"""
        try:
            payload = JWTManager.verify_token(refresh_token)
            
            if payload.get('type') != 'refresh':
                raise ValueError("无效的刷新令牌")
            
            # 验证刷新令牌是否存在且未被撤销
            token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
            stored_token = RefreshToken.query.filter_by(
                token_hash=token_hash,
                is_revoked=False
            ).first()
            
            if not stored_token or stored_token.expires_at < datetime.utcnow():
                raise ValueError("刷新令牌已过期或被撤销")
            
            # 获取用户并生成新的访问令牌
            user = User.query.get(payload['user_id'])
            if not user or not user.is_active:
                raise ValueError("用户不存在或已被禁用")
            
            return JWTManager.generate_access_token(user)
            
        except Exception as e:
            raise ValueError(f"刷新令牌失败: {str(e)}")
    
    @staticmethod
    def revoke_refresh_token(refresh_token: str) -> bool:
        """撤销刷新令牌"""
        try:
            token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
            stored_token = RefreshToken.query.filter_by(token_hash=token_hash).first()
            
            if stored_token:
                stored_token.is_revoked = True
                db.session.commit()
                return True
            
            return False
        except Exception:
            return False
```

### 1.4 GraphQL认证扩展

```python
# backend/app/auth/graphql_types.py
import graphene
from graphene import ObjectType, String, Boolean, List, Field, Mutation, Argument
from graphene_sqlalchemy import SQLAlchemyObjectType
from ..models import User as UserModel, Role as RoleModel, Permission as PermissionModel

class User(SQLAlchemyObjectType):
    class Meta:
        model = UserModel
        exclude_fields = ('password_hash',)
    
    roles = List(lambda: Role)
    permissions = List(String)
    
    def resolve_permissions(self, info):
        return self.get_permissions()

class Role(SQLAlchemyObjectType):
    class Meta:
        model = RoleModel
    
    permissions = List(lambda: Permission)
    user_count = graphene.Int()
    
    def resolve_user_count(self, info):
        return len(self.users)

class Permission(SQLAlchemyObjectType):
    class Meta:
        model = PermissionModel

class AuthPayload(ObjectType):
    success = Boolean()
    token = String()
    refresh_token = String()
    user = Field(User)
    errors = List(String)

class UserPayload(ObjectType):
    success = Boolean()
    user = Field(User)
    errors = List(String)

# 输入类型
class CreateUserInput(graphene.InputObjectType):
    username = String(required=True)
    email = String(required=True)
    password = String(required=True)
    display_name = String()
    role_ids = List(graphene.ID)
    is_active = Boolean(default_value=True)

class UpdateUserInput(graphene.InputObjectType):
    username = String()
    email = String()
    display_name = String()
    is_active = Boolean()
    role_ids = List(graphene.ID)
```

```python
# backend/app/auth/mutations.py
import graphene
from flask import request
from graphql import GraphQLError
from .graphql_types import AuthPayload, UserPayload, CreateUserInput, UpdateUserInput
from .jwt_manager import JWTManager
from .decorators import require_permission
from ..models import User, Role, AuditLog
from ..utils.validators import InputValidator
from ..utils.audit import log_audit_event
from .. import db

class Login(graphene.Mutation):
    class Arguments:
        username = graphene.String(required=True)
        password = graphene.String(required=True)
    
    Output = AuthPayload
    
    def mutate(self, info, username, password):
        try:
            # 验证输入
            username = InputValidator.validate_username(username)
            
            # 查找用户
            user = User.query.filter_by(username=username).first()
            if not user or not user.check_password(password):
                # 记录登录失败
                log_audit_event(
                    action='LOGIN_FAILED',
                    resource='auth',
                    details={'username': username, 'reason': 'invalid_credentials'},
                    request=request
                )
                return AuthPayload(
                    success=False,
                    errors=["用户名或密码错误"]
                )
            
            if not user.is_active:
                log_audit_event(
                    user_id=user.id,
                    action='LOGIN_FAILED',
                    resource='auth',
                    details={'reason': 'account_disabled'},
                    request=request
                )
                return AuthPayload(
                    success=False,
                    errors=["账户已被禁用"]
                )
            
            # 更新登录信息
            user.last_login_at = datetime.utcnow()
            user.login_count += 1
            db.session.commit()
            
            # 生成令牌
            access_token = JWTManager.generate_access_token(user)
            refresh_token = JWTManager.generate_refresh_token(user)
            
            # 记录成功登录
            log_audit_event(
                user_id=user.id,
                action='LOGIN_SUCCESS',
                resource='auth',
                request=request
            )
            
            return AuthPayload(
                success=True,
                token=access_token,
                refresh_token=refresh_token,
                user=user
            )
            
        except Exception as e:
            return AuthPayload(
                success=False,
                errors=[str(e)]
            )

class RefreshToken(graphene.Mutation):
    class Arguments:
        refresh_token = graphene.String(required=True)
    
    Output = AuthPayload
    
    def mutate(self, info, refresh_token):
        try:
            new_token = JWTManager.refresh_access_token(refresh_token)
            
            # 获取用户信息
            payload = JWTManager.verify_token(refresh_token)
            user = User.query.get(payload['user_id'])
            
            return AuthPayload(
                success=True,
                token=new_token,
                user=user
            )
            
        except Exception as e:
            return AuthPayload(
                success=False,
                errors=[str(e)]
            )

class CreateUser(graphene.Mutation):
    class Arguments:
        input = CreateUserInput(required=True)
    
    Output = UserPayload
    
    @require_permission('users', 'write')
    def mutate(self, info, input):
        try:
            # 验证输入
            username = InputValidator.validate_username(input.username)
            email = InputValidator.validate_email(input.email)
            InputValidator.validate_password(input.password)
            
            # 检查用户名和邮箱是否已存在
            if User.query.filter_by(username=username).first():
                return UserPayload(
                    success=False,
                    errors=["用户名已存在"]
                )
            
            if User.query.filter_by(email=email).first():
                return UserPayload(
                    success=False,
                    errors=["邮箱已存在"]
                )
            
            # 创建用户
            user = User(
                username=username,
                email=email,
                display_name=input.display_name,
                is_active=input.is_active
            )
            user.set_password(input.password)
            
            # 分配角色
            if input.role_ids:
                roles = Role.query.filter(Role.id.in_(input.role_ids)).all()
                user.roles.extend(roles)
            
            db.session.add(user)
            db.session.commit()
            
            # 记录审计日志
            current_user = info.context.get('current_user')
            log_audit_event(
                user_id=current_user.id if current_user else None,
                action='CREATE_USER',
                resource='users',
                resource_id=str(user.id),
                details={'created_user': user.username},
                request=request
            )
            
            return UserPayload(
                success=True,
                user=user
            )
            
        except Exception as e:
            db.session.rollback()
            return UserPayload(
                success=False,
                errors=[str(e)]
            )
```

### 1.5 权限装饰器

```python
# backend/app/auth/decorators.py
from functools import wraps
from flask import request, g
from graphql import GraphQLError
from .jwt_manager import JWTManager
from ..models import User

def jwt_required(f):
    """JWT认证装饰器"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # 从请求头获取令牌
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            raise GraphQLError("缺少认证令牌")
        
        token = auth_header.split(' ')[1]
        
        try:
            payload = JWTManager.verify_token(token)
            
            if payload.get('type') != 'access':
                raise GraphQLError("无效的令牌类型")
            
            # 获取用户信息
            user = User.query.get(payload['user_id'])
            if not user or not user.is_active:
                raise GraphQLError("用户不存在或已被禁用")
            
            # 将用户信息存储到上下文
            g.current_user = user
            
            return f(*args, **kwargs)
            
        except ValueError as e:
            raise GraphQLError(str(e))
        except Exception as e:
            raise GraphQLError("认证失败")
    
    return decorated_function

def require_permission(resource: str, action: str):
    """权限检查装饰器"""
    def decorator(f):
        @wraps(f)
        @jwt_required
        def decorated_function(*args, **kwargs):
            user = g.current_user
            
            if not user.has_permission(resource, action):
                # 记录权限违规
                from ..utils.audit import log_audit_event
                log_audit_event(
                    user_id=user.id,
                    action='PERMISSION_DENIED',
                    resource=resource,
                    details={
                        'required_permission': f"{resource}.{action}",
                        'user_permissions': user.get_permissions()
                    },
                    request=request
                )
                
                raise GraphQLError(f"权限不足：需要{resource}.{action}权限")
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def require_role(role_name: str):
    """角色检查装饰器"""
    def decorator(f):
        @wraps(f)
        @jwt_required
        def decorated_function(*args, **kwargs):
            user = g.current_user
            
            if not user.has_role(role_name):
                raise GraphQLError(f"权限不足：需要{role_name}角色")
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator
```

## 阶段2：前端认证组件开发

### 2.1 认证Context

```typescript
// frontend/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_CURRENT_USER, LOGIN_MUTATION, REFRESH_TOKEN_MUTATION } from '@/graphql/auth';
import { User, AuthContextType } from '@/types/auth';

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // 获取当前用户信息
  const { data, loading, error, refetch } = useQuery(GET_CURRENT_USER, {
    skip: !token,
    errorPolicy: 'ignore',
    context: {
      headers: {
        authorization: token ? `Bearer ${token}` : ''
      }
    }
  });
  
  // 登录mutation
  const [loginMutation] = useMutation(LOGIN_MUTATION);
  
  // 刷新令牌mutation
  const [refreshTokenMutation] = useMutation(REFRESH_TOKEN_MUTATION);
  
  // 初始化时从localStorage获取令牌
  useEffect(() => {
    const savedToken = localStorage.getItem('auth-token');
    const savedRefreshToken = localStorage.getItem('refresh-token');
    
    if (savedToken) {
      setToken(savedToken);
    }
    
    if (savedRefreshToken) {
      setRefreshToken(savedRefreshToken);
    }
    
    setIsInitialized(true);
  }, []);
  
  // 自动刷新令牌
  useEffect(() => {
    if (!token || !refreshToken) return;
    
    const refreshInterval = setInterval(async () => {
      try {
        const { data } = await refreshTokenMutation({
          variables: { refreshToken }
        });
        
        if (data?.refreshToken?.success) {
          const newToken = data.refreshToken.token;
          setToken(newToken);
          localStorage.setItem('auth-token', newToken);
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        logout();
      }
    }, 23 * 60 * 1000); // 23分钟刷新一次
    
    return () => clearInterval(refreshInterval);
  }, [token, refreshToken, refreshTokenMutation]);
  
  const login = async (username: string, password: string): Promise<{ success: boolean; errors?: string[] }> => {
    try {
      const { data } = await loginMutation({
        variables: { username, password }
      });
      
      if (data?.login?.success) {
        const { token: newToken, refreshToken: newRefreshToken, user } = data.login;
        
        setToken(newToken);
        setRefreshToken(newRefreshToken);
        
        localStorage.setItem('auth-token', newToken);
        localStorage.setItem('refresh-token', newRefreshToken);
        
        // 重新获取用户信息
        await refetch();
        
        return { success: true };
      } else {
        return {
          success: false,
          errors: data?.login?.errors || ['登录失败']
        };
      }
    } catch (error) {
      return {
        success: false,
        errors: ['网络错误，请稍后重试']
      };
    }
  };
  
  const logout = () => {
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem('auth-token');
    localStorage.removeItem('refresh-token');
    
    // 清除Apollo缓存
    window.location.href = '/login';
  };
  
  const hasRole = (role: string): boolean => {
    return data?.currentUser?.roles?.some((r: any) => r.name === role) || false;
  };
  
  const hasPermission = (resource: string, action: string): boolean => {
    const permissions = data?.currentUser?.permissions || [];
    return permissions.includes(`${resource}.${action}`);
  };
  
  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some(role => hasRole(role));
  };
  
  const hasAllPermissions = (permissions: Array<{ resource: string; action: string }>): boolean => {
    return permissions.every(({ resource, action }) => hasPermission(resource, action));
  };
  
  const value: AuthContextType = {
    user: data?.currentUser || null,
    loading: loading || !isInitialized,
    isAuthenticated: !!token && !!data?.currentUser,
    hasRole,
    hasPermission,
    hasAnyRole,
    hasAllPermissions,
    login,
    logout
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### 2.2 登录页面

```typescript
// frontend/src/pages/login.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '@/contexts/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface LoginFormData {
  username: string;
  password: string;
  rememberMe: boolean;
}

const loginSchema = yup.object({
  username: yup
    .string()
    .required('请输入用户名')
    .min(3, '用户名至少需要3个字符'),
  password: yup
    .string()
    .required('请输入密码')
    .min(6, '密码至少需要6个字符'),
  rememberMe: yup.boolean()
});

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string[]>([]);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setFocus
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      rememberMe: false
    }
  });
  
  // 如果已登录，重定向到管理面板
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      const redirectTo = (router.query.redirect as string) || '/admin';
      router.replace(redirectTo);
    }
  }, [isAuthenticated, authLoading, router]);
  
  // 自动聚焦用户名输入框
  useEffect(() => {
    setFocus('username');
  }, [setFocus]);
  
  const onSubmit = async (data: LoginFormData) => {
    setLoginError([]);
    
    const result = await login(data.username, data.password);
    
    if (result.success) {
      const redirectTo = (router.query.redirect as string) || '/admin';
      router.push(redirectTo);
    } else {
      setLoginError(result.errors || ['登录失败']);
    }
  };
  
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            管理员登录
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            请使用管理员账户登录系统
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {/* 错误提示 */}
          {loginError.length > 0 && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">
                {loginError.map((error, index) => (
                  <div key={index}>{error}</div>
                ))}
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            {/* 用户名输入 */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                用户名
              </label>
              <input
                {...register('username')}
                type="text"
                autoComplete="username"
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  errors.username ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="请输入用户名"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>
            
            {/* 密码输入 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密码
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`appearance-none relative block w-full px-3 py-2 pr-10 border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                  placeholder="请输入密码"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
            
            {/* 记住我 */}
            <div className="flex items-center">
              <input
                {...register('rememberMe')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
                记住我
              </label>
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  登录中...
                </>
              ) : (
                '登录'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### 2.3 权限保护组件

```typescript
// frontend/src/components/auth/PermissionGuard.tsx
import React, { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface PermissionGuardProps {
  resource: string;
  action: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export default function PermissionGuard({
  resource,
  action,
  children,
  fallback = null
}: PermissionGuardProps) {
  const { hasPermission, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="animate-pulse bg-gray-200 h-4 rounded w-full"></div>
    );
  }
  
  if (!hasPermission(resource, action)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

// 角色保护组件
interface RoleGuardProps {
  roles: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
  requireAll?: boolean;
}

export function RoleGuard({
  roles,
  children,
  fallback = null,
  requireAll = false
}: RoleGuardProps) {
  const { hasRole, hasAnyRole, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="animate-pulse bg-gray-200 h-4 rounded w-full"></div>
    );
  }
  
  const roleList = Array.isArray(roles) ? roles : [roles];
  
  const hasAccess = requireAll
    ? roleList.every(role => hasRole(role))
    : hasAnyRole(roleList);
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

// 访问拒绝页面
export function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto h-12 w-12 text-red-400">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h2 className="mt-4 text-lg font-medium text-gray-900">访问被拒绝</h2>
        <p className="mt-2 text-sm text-gray-600">
          您没有权限访问此页面，请联系管理员获取相应权限。
        </p>
        <div className="mt-6">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            返回上一页
          </button>
        </div>
      </div>
    </div>
  );
}
```

## 开发最佳实践

### 1. 代码组织

```
backend/
├── app/
│   ├── auth/              # 认证模块
│   │   ├── __init__.py
│   │   ├── decorators.py   # 权限装饰器
│   │   ├── jwt_manager.py  # JWT管理
│   │   ├── mutations.py    # GraphQL变更
│   │   └── queries.py      # GraphQL查询
│   ├── admin/             # 管理模块
│   │   ├── __init__.py
│   │   ├── user_resolvers.py
│   │   ├── word_resolvers.py
│   │   └── system_resolvers.py
│   ├── utils/             # 工具模块
│   │   ├── validators.py   # 输入验证
│   │   ├── audit.py       # 审计日志
│   │   └── cache.py       # 缓存工具
│   └── models.py          # 数据模型

frontend/
├── src/
│   ├── components/
│   │   ├── auth/          # 认证组件
│   │   ├── admin/         # 管理组件
│   │   └── common/        # 通用组件
│   ├── contexts/          # React Context
│   ├── hooks/             # 自定义Hook
│   ├── pages/
│   │   ├── admin/         # 管理页面
│   │   └── login.tsx      # 登录页面
│   ├── graphql/           # GraphQL查询
│   ├── types/             # TypeScript类型
│   └── utils/             # 工具函数
```

### 2. 错误处理

```python
# backend/app/utils/errors.py
class AdminError(Exception):
    """管理系统基础异常"""
    def __init__(self, message: str, code: str = None):
        self.message = message
        self.code = code
        super().__init__(message)

class AuthenticationError(AdminError):
    """认证异常"""
    pass

class PermissionError(AdminError):
    """权限异常"""
    pass

class ValidationError(AdminError):
    """验证异常"""
    def __init__(self, message: str, field: str = None):
        self.field = field
        super().__init__(message)

# 全局错误处理
def handle_graphql_error(error):
    """处理GraphQL错误"""
    if isinstance(error.original_error, AdminError):
        return {
            'message': error.original_error.message,
            'code': getattr(error.original_error, 'code', 'ADMIN_ERROR'),
            'field': getattr(error.original_error, 'field', None)
        }
    
    # 记录未知错误
    import logging
    logging.error(f"Unexpected error: {error}")
    
    return {
        'message': '系统错误，请稍后重试',
        'code': 'SYSTEM_ERROR'
    }
```

### 3. 测试策略

```python
# tests/test_auth.py
import pytest
from app import create_app, db
from app.models import User, Role, Permission
from app.auth.jwt_manager import JWTManager

@pytest.fixture
def app():
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def admin_user(app):
    with app.app_context():
        # 创建权限
        permission = Permission(
            resource='users',
            action='read',
            description='查看用户'
        )
        db.session.add(permission)
        
        # 创建角色
        role = Role(name='admin', description='管理员')
        role.permissions.append(permission)
        db.session.add(role)
        
        # 创建用户
        user = User(
            username='admin',
            email='admin@test.com',
            display_name='测试管理员'
        )
        user.set_password('password123')
        user.roles.append(role)
        db.session.add(user)
        
        db.session.commit()
        return user

def test_login_success(client, admin_user):
    """测试登录成功"""
    query = '''
    mutation {
        login(username: "admin", password: "password123") {
            success
            token
            user {
                username
                email
            }
            errors
        }
    }
    '''
    
    response = client.post('/graphql', json={'query': query})
    data = response.get_json()['data']['login']
    
    assert data['success'] is True
    assert data['token'] is not None
    assert data['user']['username'] == 'admin'
    assert data['errors'] is None

def test_login_invalid_credentials(client):
    """测试登录失败"""
    query = '''
    mutation {
        login(username: "admin", password: "wrongpassword") {
            success
            errors
        }
    }
    '''
    
    response = client.post('/graphql', json={'query': query})
    data = response.get_json()['data']['login']
    
    assert data['success'] is False
    assert '用户名或密码错误' in data['errors']

def test_permission_check(admin_user):
    """测试权限检查"""
    assert admin_user.has_permission('users', 'read') is True
    assert admin_user.has_permission('users', 'write') is False
    assert admin_user.has_role('admin') is True
    assert admin_user.has_role('user') is False
```

```typescript
// frontend/src/__tests__/auth/AuthContext.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { GET_CURRENT_USER } from '@/graphql/auth';

const mocks = [
  {
    request: {
      query: GET_CURRENT_USER,
    },
    result: {
      data: {
        currentUser: {
          id: '1',
          username: 'admin',
          email: 'admin@test.com',
          roles: [{ name: 'admin' }],
          permissions: ['users.read', 'users.write']
        }
      }
    }
  }
];

function TestComponent() {
  const { user, hasPermission, hasRole } = useAuth();
  
  return (
    <div>
      <div data-testid="username">{user?.username}</div>
      <div data-testid="has-users-read">{hasPermission('users', 'read').toString()}</div>
      <div data-testid="has-admin-role">{hasRole('admin').toString()}</div>
    </div>
  );
}

test('provides user information and permissions', async () => {
  render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    </MockedProvider>
  );
  
  await waitFor(() => {
    expect(screen.getByTestId('username')).toHaveTextContent('admin');
    expect(screen.getByTestId('has-users-read')).toHaveTextContent('true');
    expect(screen.getByTestId('has-admin-role')).toHaveTextContent('true');
  });
});
```

### 4. 性能优化

#### 后端优化

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
            cached_result = cache.get(cache_key)
            
            if cached_result is not None:
                return cached_result
            
            result = f(user_id, *args, **kwargs)
            cache.set(cache_key, result, timeout=timeout)
            return result
        return decorated_function
    return decorator

def invalidate_user_cache(user_id):
    """清除用户相关缓存"""
    cache.delete(f"user_permissions:{user_id}")
    cache.delete(f"user_roles:{user_id}")

# 使用DataLoader批量查询
from promise import Promise
from promise.dataloader import DataLoader

class UserLoader(DataLoader):
    def batch_load_fn(self, user_ids):
        users = User.query.filter(User.id.in_(user_ids)).all()
        user_map = {user.id: user for user in users}
        return Promise.resolve([user_map.get(user_id) for user_id in user_ids])

class RoleLoader(DataLoader):
    def batch_load_fn(self, role_ids):
        roles = Role.query.filter(Role.id.in_(role_ids)).all()
        role_map = {role.id: role for role in roles}
        return Promise.resolve([role_map.get(role_id) for role_id in role_ids])
```

#### 前端优化

```typescript
// frontend/src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

// frontend/src/hooks/usePagination.ts
import { useState, useMemo } from 'react';

interface PaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  totalCount: number;
}

export function usePagination({
  initialPage = 1,
  initialPageSize = 10,
  totalCount
}: PaginationOptions) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  
  const pagination = useMemo(() => {
    const totalPages = Math.ceil(totalCount / pageSize);
    const offset = (currentPage - 1) * pageSize;
    
    return {
      currentPage,
      pageSize,
      totalPages,
      totalCount,
      offset,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1
    };
  }, [currentPage, pageSize, totalCount]);
  
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, pagination.totalPages)));
  };
  
  const nextPage = () => {
    if (pagination.hasNextPage) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const previousPage = () => {
    if (pagination.hasPreviousPage) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  return {
    ...pagination,
    setPageSize,
    goToPage,
    nextPage,
    previousPage
  };
}
```

## 部署配置

### 1. 环境变量配置

```bash
# .env.production
# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/anki_langchain

# JWT配置
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production

# 缓存配置
REDIS_URL=redis://localhost:6379/0

# 管理员配置
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=secure-admin-password

# 安全配置
SECRET_KEY=your-flask-secret-key
SECURITY_PASSWORD_SALT=your-password-salt

# 文件上传
UPLOAD_FOLDER=/var/uploads
MAX_CONTENT_LENGTH=16777216

# 日志配置
LOG_LEVEL=INFO
LOG_FILE=/var/log/anki-admin.log
```

### 2. Docker配置

```dockerfile
# Dockerfile.backend
FROM python:3.9-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# 安装Python依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 创建上传目录
RUN mkdir -p /var/uploads

# 设置环境变量
ENV FLASK_APP=run.py
ENV FLASK_ENV=production

EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "run:app"]
```

```dockerfile
# Dockerfile.frontend
FROM node:16-alpine AS builder

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci --only=production

# 构建应用
COPY . .
RUN npm run build

# 生产镜像
FROM nginx:alpine

COPY --from=builder /app/out /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: anki_langchain
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
  
  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
  
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.backend
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/anki_langchain
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - postgres
      - redis
    ports:
      - "5000:5000"
    volumes:
      - upload_data:/var/uploads
  
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
  upload_data:
```

### 3. Nginx配置

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    upstream backend {
        server backend:5000;
    }
    
    server {
        listen 80;
        server_name localhost;
        
        # 前端静态文件
        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
        }
        
        # API代理
        location /api/ {
            proxy_pass http://backend/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # GraphQL代理
        location /graphql {
            proxy_pass http://backend/graphql;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # 文件上传大小限制
        client_max_body_size 16M;
    }
}
```

## 常见问题解决

### 1. 认证问题

**问题**: JWT令牌过期处理
```typescript
// 解决方案：自动刷新令牌
const apolloClient = new ApolloClient({
  uri: '/graphql',
  cache: new InMemoryCache(),
  link: from([
    onError(({ graphQLErrors, networkError, operation, forward }) => {
      if (graphQLErrors) {
        for (let err of graphQLErrors) {
          if (err.extensions?.code === 'UNAUTHENTICATED') {
            // 尝试刷新令牌
            return fromPromise(
              refreshToken().catch(() => {
                // 刷新失败，跳转到登录页
                window.location.href = '/login';
                return;
              })
            ).filter(value => Boolean(value))
             .flatMap(() => forward(operation));
          }
        }
      }
    }),
    authLink,
    httpLink
  ])
});
```

**问题**: 权限检查失效
```python
# 解决方案：清除权限缓存
def update_user_roles(user_id, role_ids):
    user = User.query.get(user_id)
    user.roles.clear()
    
    roles = Role.query.filter(Role.id.in_(role_ids)).all()
    user.roles.extend(roles)
    
    db.session.commit()
    
    # 清除缓存
    invalidate_user_cache(user_id)
```

### 2. 性能问题

**问题**: GraphQL N+1查询
```python
# 解决方案：使用DataLoader
class Query(graphene.ObjectType):
    users = graphene.List(User)
    
    def resolve_users(self, info):
        # 预加载关联数据
        return User.query.options(
            joinedload(User.roles).joinedload(Role.permissions)
        ).all()
```

**问题**: 前端渲染性能
```typescript
// 解决方案：使用React.memo和useMemo
const UserListItem = React.memo(({ user }: { user: User }) => {
  const roleNames = useMemo(() => 
    user.roles.map(role => role.name).join(', '),
    [user.roles]
  );
  
  return (
    <div className="user-item">
      <span>{user.username}</span>
      <span>{roleNames}</span>
    </div>
  );
});
```

### 3. 数据一致性问题

**问题**: 并发更新冲突
```python
# 解决方案：乐观锁
class User(db.Model):
    version = db.Column(db.Integer, default=1)
    
    def update_with_version_check(self, **kwargs):
        current_version = self.version
        
        # 更新数据
        for key, value in kwargs.items():
            setattr(self, key, value)
        
        self.version += 1
        
        try:
            # 使用版本号检查
            result = db.session.execute(
                update(User)
                .where(User.id == self.id)
                .where(User.version == current_version)
                .values(**kwargs, version=self.version)
            )
            
            if result.rowcount == 0:
                raise ValueError("数据已被其他用户修改，请刷新后重试")
            
            db.session.commit()
            
        except Exception:
            db.session.rollback()
            raise
```

## 总结

本开发指南提供了Admin面板开发的完整流程，包括：

1. **环境准备**: 依赖安装和配置
2. **认证系统**: JWT认证、权限管理
3. **前端组件**: React组件、权限保护
4. **最佳实践**: 代码组织、错误处理、测试
5. **部署配置**: Docker、Nginx配置
6. **问题解决**: 常见问题和解决方案

遵循本指南可以确保Admin面板的安全性、可维护性和性能。在开发过程中，请注意：

- 始终进行权限检查
- 记录重要操作的审计日志
- 使用缓存提升性能
- 编写充分的测试
- 遵循安全最佳实践

如有问题，请参考项目文档或联系开发团队。