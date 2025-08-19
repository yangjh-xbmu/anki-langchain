#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Admin表初始化迁移脚本
创建用户、角色、权限相关表并初始化默认数据
"""

import sys
import os
from datetime import datetime
from werkzeug.security import generate_password_hash

# 添加项目根目录到Python路径
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

from app import create_app, db
from app.admin_models import (
    User, Role, Permission, UserRole, RolePermission, SystemConfig
)


def create_tables():
    """创建所有Admin相关表"""
    print("Creating admin tables...")
    
    # 创建表
    db.create_all()
    print("✓ Tables created successfully")


def create_default_permissions():
    """创建默认权限"""
    print("Creating default permissions...")
    
    permissions = [
        # 用户管理权限
        {
            'name': 'user.create',
            'description': '创建用户',
            'resource': 'user',
            'action': 'create'
        },
        {
            'name': 'user.read',
            'description': '查看用户',
            'resource': 'user',
            'action': 'read'
        },
        {
            'name': 'user.update',
            'description': '更新用户',
            'resource': 'user',
            'action': 'update'
        },
        {
            'name': 'user.delete',
            'description': '删除用户',
            'resource': 'user',
            'action': 'delete'
        },
        {
            'name': 'user.list',
            'description': '用户列表',
            'resource': 'user',
            'action': 'list'
        },
        
        # 角色管理权限
        {
            'name': 'role.create',
            'description': '创建角色',
            'resource': 'role',
            'action': 'create'
        },
        {
            'name': 'role.read',
            'description': '查看角色',
            'resource': 'role',
            'action': 'read'
        },
        {
            'name': 'role.update',
            'description': '更新角色',
            'resource': 'role',
            'action': 'update'
        },
        {
            'name': 'role.delete',
            'description': '删除角色',
            'resource': 'role',
            'action': 'delete'
        },
        {
            'name': 'role.list',
            'description': '角色列表',
            'resource': 'role',
            'action': 'list'
        },
        {
            'name': 'role.assign',
            'description': '分配角色',
            'resource': 'role',
            'action': 'assign'
        },
        
        # 权限管理权限
        {
            'name': 'permission.create',
            'description': '创建权限',
            'resource': 'permission',
            'action': 'create'
        },
        {
            'name': 'permission.read',
            'description': '查看权限',
            'resource': 'permission',
            'action': 'read'
        },
        {
            'name': 'permission.update',
            'description': '更新权限',
            'resource': 'permission',
            'action': 'update'
        },
        {
            'name': 'permission.delete',
            'description': '删除权限',
            'resource': 'permission',
            'action': 'delete'
        },
        {
            'name': 'permission.list',
            'description': '权限列表',
            'resource': 'permission',
            'action': 'list'
        },
        {
            'name': 'permission.assign',
            'description': '分配权限',
            'resource': 'permission',
            'action': 'assign'
        },
        
        # 单词管理权限
        {
            'name': 'word.create',
            'description': '创建单词',
            'resource': 'word',
            'action': 'create'
        },
        {
            'name': 'word.read',
            'description': '查看单词',
            'resource': 'word',
            'action': 'read'
        },
        {
            'name': 'word.update',
            'description': '更新单词',
            'resource': 'word',
            'action': 'update'
        },
        {
            'name': 'word.delete',
            'description': '删除单词',
            'resource': 'word',
            'action': 'delete'
        },
        {
            'name': 'word.list',
            'description': '单词列表',
            'resource': 'word',
            'action': 'list'
        },
        {
            'name': 'word.import',
            'description': '导入单词',
            'resource': 'word',
            'action': 'import'
        },
        {
            'name': 'word.export',
            'description': '导出单词',
            'resource': 'word',
            'action': 'export'
        },
        
        # 系统管理权限
        {
            'name': 'system.config',
            'description': '系统配置',
            'resource': 'system',
            'action': 'config'
        },
        {
            'name': 'system.audit',
            'description': '审计日志',
            'resource': 'system',
            'action': 'audit'
        },
        {
            'name': 'system.stats',
            'description': '系统统计',
            'resource': 'system',
            'action': 'stats'
        },
        {
            'name': 'system.backup',
            'description': '数据备份',
            'resource': 'system',
            'action': 'backup'
        },
        {
            'name': 'system.restore',
            'description': '数据恢复',
            'resource': 'system',
            'action': 'restore'
        },
        
        # 管理面板权限
        {
            'name': 'admin.access',
            'description': '访问管理面板',
            'resource': 'admin',
            'action': 'access'
        },
        {
            'name': 'admin.dashboard',
            'description': '管理面板仪表盘',
            'resource': 'admin',
            'action': 'dashboard'
        },
    ]
    
    created_count = 0
    for perm_data in permissions:
        existing = Permission.query.filter_by(name=perm_data['name']).first()
        if not existing:
            permission = Permission(**perm_data)
            db.session.add(permission)
            created_count += 1
    
    db.session.commit()
    print(f"✓ Created {created_count} permissions")


def create_default_roles():
    """创建默认角色"""
    print("Creating default roles...")
    
    roles = [
        {
            'name': 'user',
            'display_name': '普通用户',
            'description': '普通用户角色，只能查看自己的数据',
            'permissions': ['word.read', 'word.list']
        },
        {
            'name': 'admin',
            'display_name': '管理员',
            'description': '管理员角色，可以管理用户和单词',
            'permissions': [
                'admin.access', 'admin.dashboard',
                'user.read', 'user.list', 'user.create', 'user.update',
                'word.create', 'word.read', 'word.update', 'word.delete',
                'word.list', 'word.import', 'word.export',
                'system.stats'
            ]
        },
        {
            'name': 'superadmin',
            'display_name': '超级管理员',
            'description': '超级管理员角色，拥有所有权限',
            'permissions': 'all'  # 特殊标记，表示所有权限
        }
    ]
    
    created_count = 0
    for role_data in roles:
        existing = Role.query.filter_by(name=role_data['name']).first()
        if not existing:
            role = Role(
                name=role_data['name'],
                display_name=role_data['display_name'],
                description=role_data['description']
            )
            db.session.add(role)
            db.session.flush()  # 获取role.id
            
            # 分配权限
            if role_data['permissions'] == 'all':
                # 分配所有权限
                all_permissions = Permission.query.all()
                for permission in all_permissions:
                    role_perm = RolePermission(
                        role_id=role.id,
                        permission_id=permission.id
                    )
                    db.session.add(role_perm)
            else:
                # 分配指定权限
                for perm_name in role_data['permissions']:
                    permission = Permission.query.filter_by(
                        name=perm_name
                    ).first()
                    if permission:
                        role_perm = RolePermission(
                            role_id=role.id,
                            permission_id=permission.id
                        )
                        db.session.add(role_perm)
            
            created_count += 1
    
    db.session.commit()
    print(f"✓ Created {created_count} roles")


def create_default_admin_user():
    """创建默认管理员用户"""
    print("Creating default admin user...")
    
    # 检查是否已存在管理员用户
    existing_admin = User.query.filter_by(username='admin').first()
    if existing_admin:
        print("✓ Admin user already exists")
        return
    
    # 创建超级管理员用户
    admin_user = User(
        username='admin',
        email='admin@example.com',
        password_hash=generate_password_hash('admin123'),
        is_active=True,
        is_verified=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.session.add(admin_user)
    db.session.flush()  # 获取user.id
    
    # 分配超级管理员角色
    superadmin_role = Role.query.filter_by(name='superadmin').first()
    if superadmin_role:
        user_role = UserRole(
            user_id=admin_user.id,
            role_id=superadmin_role.id
        )
        db.session.add(user_role)
    
    db.session.commit()
    print("✓ Created default admin user (username: admin, password: admin123)")


def create_default_system_configs():
    """创建默认系统配置"""
    print("Creating default system configurations...")
    
    configs = [
        {
            'key': 'site_name',
            'value': 'Anki LangChain Admin',
            'description': '网站名称',
            'type': 'string'
        },
        {
            'key': 'site_description',
            'value': 'AI驱动的英语学习管理系统',
            'description': '网站描述',
            'type': 'string'
        },
        {
            'key': 'max_users',
            'value': '1000',
            'description': '最大用户数量',
            'type': 'integer'
        },
        {
            'key': 'session_timeout',
            'value': '3600',
            'description': '会话超时时间（秒）',
            'type': 'integer'
        },
        {
            'key': 'enable_registration',
            'value': 'true',
            'description': '是否允许用户注册',
            'type': 'boolean'
        },
        {
            'key': 'enable_email_verification',
            'value': 'false',
            'description': '是否启用邮箱验证',
            'type': 'boolean'
        },
        {
            'key': 'default_user_role',
            'value': 'user',
            'description': '默认用户角色',
            'type': 'string'
        },
        {
            'key': 'audit_log_retention_days',
            'value': '90',
            'description': '审计日志保留天数',
            'type': 'integer'
        }
    ]
    
    created_count = 0
    for config_data in configs:
        existing = SystemConfig.query.filter_by(
            key=config_data['key']
        ).first()
        if not existing:
            config = SystemConfig(**config_data)
            db.session.add(config)
            created_count += 1
    
    db.session.commit()
    print(f"✓ Created {created_count} system configurations")


def main():
    """主函数"""
    print("Starting Admin tables initialization...")
    
    app = create_app()
    
    with app.app_context():
        try:
            # 1. 创建表
            create_tables()
            
            # 2. 创建默认权限
            create_default_permissions()
            
            # 3. 创建默认角色
            create_default_roles()
            
            # 4. 创建默认管理员用户
            create_default_admin_user()
            
            # 5. 创建默认系统配置
            create_default_system_configs()
            
            print("\n✅ Admin tables initialization completed successfully!")
            print("\n📋 Default credentials:")
            print("   Username: admin")
            print("   Password: admin123")
            print("   Email: admin@example.com")
            print("\n⚠️  Please change the default password after first login!")
            
        except Exception as e:
            print(f"\n❌ Error during initialization: {str(e)}")
            db.session.rollback()
            raise


if __name__ == '__main__':
    main()