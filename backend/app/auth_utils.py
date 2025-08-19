#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
JWT认证工具模块
提供JWT token生成、验证、刷新等功能
"""

import jwt
import secrets
from datetime import datetime, timedelta
from functools import wraps
from flask import current_app, request, jsonify
from werkzeug.security import check_password_hash

from .admin_models import User, RefreshToken, AuditLog
from . import db


class JWTManager:
    """JWT管理器"""
    
    @staticmethod
    def generate_tokens(user):
        """生成访问令牌和刷新令牌"""
        # 访问令牌 (15分钟)
        access_payload = {
            'user_id': user.id,
            'username': user.username,
            'email': user.email,
            'roles': [role.name for role in user.get_roles()],
            'permissions': user.get_permissions(),
            'exp': datetime.utcnow() + timedelta(minutes=15),
            'iat': datetime.utcnow(),
            'type': 'access'
        }
        
        access_token = jwt.encode(
            access_payload,
            current_app.config['JWT_SECRET_KEY'],
            algorithm='HS256'
        )
        
        # 刷新令牌 (7天)
        refresh_payload = {
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(days=7),
            'iat': datetime.utcnow(),
            'type': 'refresh',
            'jti': secrets.token_urlsafe(32)  # JWT ID
        }
        
        refresh_token = jwt.encode(
            refresh_payload,
            current_app.config['JWT_SECRET_KEY'],
            algorithm='HS256'
        )
        
        # 保存刷新令牌到数据库
        refresh_token_record = RefreshToken(
            user_id=user.id,
            token=refresh_payload['jti'],
            expires_at=refresh_payload['exp']
        )
        db.session.add(refresh_token_record)
        db.session.commit()
        
        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'expires_in': 900,  # 15分钟
            'token_type': 'Bearer'
        }
    
    @staticmethod
    def verify_token(token, token_type='access'):
        """验证JWT令牌"""
        try:
            payload = jwt.decode(
                token,
                current_app.config['JWT_SECRET_KEY'],
                algorithms=['HS256']
            )
            
            if payload.get('type') != token_type:
                return None
            
            # 检查用户是否存在且活跃
            user = User.query.get(payload['user_id'])
            if not user or not user.is_active:
                return None
            
            # 如果是刷新令牌，检查是否在数据库中
            if token_type == 'refresh':
                refresh_record = RefreshToken.query.filter_by(
                    user_id=user.id,
                    token=payload['jti'],
                    is_revoked=False
                ).first()
                
                if not refresh_record:
                    return None
                
                # 检查是否过期
                if refresh_record.expires_at < datetime.utcnow():
                    refresh_record.is_revoked = True
                    db.session.commit()
                    return None
            
            return payload
            
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    @staticmethod
    def refresh_access_token(refresh_token):
        """使用刷新令牌生成新的访问令牌"""
        payload = JWTManager.verify_token(refresh_token, 'refresh')
        if not payload:
            return None
        
        user = User.query.get(payload['user_id'])
        if not user:
            return None
        
        # 生成新的访问令牌
        access_payload = {
            'user_id': user.id,
            'username': user.username,
            'email': user.email,
            'roles': [role.name for role in user.get_roles()],
            'permissions': user.get_permissions(),
            'exp': datetime.utcnow() + timedelta(minutes=15),
            'iat': datetime.utcnow(),
            'type': 'access'
        }
        
        access_token = jwt.encode(
            access_payload,
            current_app.config['JWT_SECRET_KEY'],
            algorithm='HS256'
        )
        
        return {
            'access_token': access_token,
            'expires_in': 900,
            'token_type': 'Bearer'
        }
    
    @staticmethod
    def revoke_refresh_token(refresh_token):
        """撤销刷新令牌"""
        try:
            payload = jwt.decode(
                refresh_token,
                current_app.config['JWT_SECRET_KEY'],
                algorithms=['HS256']
            )
            
            if payload.get('type') != 'refresh':
                return False
            
            refresh_record = RefreshToken.query.filter_by(
                user_id=payload['user_id'],
                token=payload['jti']
            ).first()
            
            if refresh_record:
                refresh_record.is_revoked = True
                db.session.commit()
                return True
            
            return False
            
        except jwt.InvalidTokenError:
            return False
    
    @staticmethod
    def revoke_all_user_tokens(user_id):
        """撤销用户的所有刷新令牌"""
        RefreshToken.query.filter_by(
            user_id=user_id,
            is_revoked=False
        ).update({'is_revoked': True})
        db.session.commit()


def get_current_user():
    """获取当前用户"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return None
    
    try:
        token = auth_header.split(' ')[1]  # Bearer <token>
        payload = JWTManager.verify_token(token)
        if payload:
            return User.query.get(payload['user_id'])
    except (IndexError, AttributeError):
        pass
    
    return None


def jwt_required(f):
    """JWT认证装饰器"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({
                'error': 'Authentication required',
                'message': 'Valid JWT token is required'
            }), 401
        
        # 将用户信息添加到请求上下文
        request.current_user = user
        return f(*args, **kwargs)
    
    return decorated_function


def require_permission(permission_name):
    """权限检查装饰器"""
    def decorator(f):
        @wraps(f)
        @jwt_required
        def decorated_function(*args, **kwargs):
            user = request.current_user
            
            if not user.has_permission(permission_name):
                # 记录权限拒绝日志
                audit_log = AuditLog(
                    user_id=user.id,
                    action='permission_denied',
                    resource_type='permission',
                    resource_id=permission_name,
                    details={
                        'permission': permission_name,
                        'endpoint': request.endpoint,
                        'method': request.method
                    }
                )
                db.session.add(audit_log)
                db.session.commit()
                
                return jsonify({
                    'error': 'Permission denied',
                    'message': f'Permission {permission_name} is required'
                }), 403
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator


def require_role(role_name):
    """角色检查装饰器"""
    def decorator(f):
        @wraps(f)
        @jwt_required
        def decorated_function(*args, **kwargs):
            user = request.current_user
            
            if not user.has_role(role_name):
                # 记录角色拒绝日志
                audit_log = AuditLog(
                    user_id=user.id,
                    action='role_denied',
                    resource_type='role',
                    resource_id=role_name,
                    details={
                        'role': role_name,
                        'endpoint': request.endpoint,
                        'method': request.method
                    }
                )
                db.session.add(audit_log)
                db.session.commit()
                
                return jsonify({
                    'error': 'Role required',
                    'message': f'Role {role_name} is required'
                }), 403
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator


def authenticate_user(username, password):
    """用户认证"""
    user = User.query.filter_by(username=username).first()
    
    if not user:
        return None, 'User not found'
    
    if not user.is_active:
        return None, 'User account is disabled'
    
    if not check_password_hash(user.password_hash, password):
        # 记录登录失败
        audit_log = AuditLog(
            user_id=user.id,
            action='login_failed',
            resource_type='user',
            resource_id=str(user.id),
            details={
                'username': username,
                'reason': 'invalid_password',
                'ip_address': request.remote_addr,
                'user_agent': request.headers.get('User-Agent')
            }
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return None, 'Invalid password'
    
    # 更新登录信息
    user.update_login_info(
            request.remote_addr, 
            request.headers.get('User-Agent')
        )
    
    # 记录登录成功
    audit_log = AuditLog(
        user_id=user.id,
        action='login_success',
        resource_type='user',
        resource_id=str(user.id),
        details={
            'username': username,
            'ip_address': request.remote_addr,
            'user_agent': request.headers.get('User-Agent')
        }
    )
    db.session.add(audit_log)
    db.session.commit()
    
    return user, None


def logout_user(refresh_token=None):
    """用户登出"""
    user = get_current_user()
    
    if user:
        if refresh_token:
            # 撤销指定的刷新令牌
            JWTManager.revoke_refresh_token(refresh_token)
        else:
            # 撤销所有刷新令牌
            JWTManager.revoke_all_user_tokens(user.id)
        
        # 记录登出日志
        audit_log = AuditLog(
            user_id=user.id,
            action='logout',
            resource_type='user',
            resource_id=str(user.id),
            details={
                'ip_address': request.remote_addr,
                'user_agent': request.headers.get('User-Agent')
            }
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return True
    
    return False