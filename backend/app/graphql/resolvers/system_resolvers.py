from datetime import datetime
from ...auth import jwt_required, permission_required
from ...services.system_config_service import SystemConfigService
from ...services.audit_log_service import AuditLogService


# 系统配置解析器
@jwt_required
@permission_required('view_system_config')
def resolve_system_configs(root, info, **kwargs):
    """获取系统配置列表"""
    service = SystemConfigService()
    
    # 获取查询参数
    key_filter = kwargs.get('key')
    category = kwargs.get('category')
    is_public = kwargs.get('is_public')
    limit = kwargs.get('limit', 100)
    offset = kwargs.get('offset', 0)
    
    return service.get_configs(
        key_filter=key_filter,
        category=category,
        is_public=is_public,
        limit=limit,
        offset=offset
    )


@jwt_required
@permission_required('view_system_config')
def resolve_system_config_by_key(root, info, key):
    """根据键获取系统配置"""
    service = SystemConfigService()
    return service.get_config(key)


@jwt_required
@permission_required('manage_system_config')
def resolve_create_system_config(root, info, **kwargs):
    """创建系统配置"""
    service = SystemConfigService()
    audit_service = AuditLogService()
    
    # 获取当前用户信息
    current_user = info.context.get('current_user')
    
    # 创建配置
    config = service.create_config(
        key=kwargs['key'],
        value=kwargs['value'],
        data_type=kwargs.get('data_type', 'string'),
        category=kwargs.get('category', 'general'),
        description=kwargs.get('description'),
        is_public=kwargs.get('is_public', False),
        is_readonly=kwargs.get('is_readonly', False)
    )
    
    if config:
        # 记录审计日志
        audit_service.create_audit_log(
            user_id=current_user['id'],
            action='CREATE',
            resource='system_config',
            resource_id=config['key'],
            details={'key': config['key'], 'category': config['category']},
            new_values=config,
            ip_address=info.context.get('ip_address'),
            user_agent=info.context.get('user_agent')
        )
    
    return config


@jwt_required
@permission_required('manage_system_config')
def resolve_update_system_config(root, info, key, **kwargs):
    """更新系统配置"""
    service = SystemConfigService()
    audit_service = AuditLogService()
    
    # 获取当前用户信息
    current_user = info.context.get('current_user')
    
    # 获取旧值用于审计
    old_config = service.get_config(key)
    
    # 更新配置
    config = service.update_config(
        key=key,
        value=kwargs.get('value'),
        description=kwargs.get('description'),
        is_public=kwargs.get('is_public'),
        is_readonly=kwargs.get('is_readonly')
    )
    
    if config and old_config:
        # 记录审计日志
        audit_service.create_audit_log(
            user_id=current_user['id'],
            action='UPDATE',
            resource='system_config',
            resource_id=key,
            details={'key': key},
            old_values=old_config,
            new_values=config,
            ip_address=info.context.get('ip_address'),
            user_agent=info.context.get('user_agent')
        )
    
    return config


@jwt_required
@permission_required('manage_system_config')
def resolve_delete_system_config(root, info, key):
    """删除系统配置"""
    service = SystemConfigService()
    audit_service = AuditLogService()
    
    # 获取当前用户信息
    current_user = info.context.get('current_user')
    
    # 获取旧值用于审计
    old_config = service.get_config(key)
    
    # 删除配置
    success = service.delete_config(key)
    
    if success and old_config:
        # 记录审计日志
        audit_service.create_audit_log(
            user_id=current_user['id'],
            action='DELETE',
            resource='system_config',
            resource_id=key,
            details={'key': key},
            old_values=old_config,
            ip_address=info.context.get('ip_address'),
            user_agent=info.context.get('user_agent')
        )
    
    return {'success': success, 'key': key}


# 审计日志解析器
@jwt_required
@permission_required('view_audit_logs')
def resolve_audit_logs(root, info, **kwargs):
    """获取审计日志列表"""
    service = AuditLogService()
    
    # 获取查询参数
    user_id = kwargs.get('user_id')
    action = kwargs.get('action')
    resource = kwargs.get('resource')
    start_date = kwargs.get('start_date')
    end_date = kwargs.get('end_date')
    limit = kwargs.get('limit', 100)
    offset = kwargs.get('offset', 0)
    
    # 转换日期字符串为datetime对象
    if start_date:
        start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
    if end_date:
        end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
    
    return service.get_audit_logs(
        user_id=user_id,
        action=action,
        resource=resource,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset
    )


@jwt_required
@permission_required('view_audit_logs')
def resolve_audit_log_by_id(root, info, log_id):
    """根据ID获取审计日志"""
    service = AuditLogService()
    return service.get_audit_log_by_id(log_id)


@jwt_required
@permission_required('view_audit_logs')
def resolve_user_activity_summary(root, info, user_id, days=30):
    """获取用户活动摘要"""
    service = AuditLogService()
    return service.get_user_activity_summary(user_id, days)


@jwt_required
@permission_required('view_audit_logs')
def resolve_system_activity_stats(root, info, days=7):
    """获取系统活动统计"""
    service = AuditLogService()
    return service.get_system_activity_stats(days)


@jwt_required
@permission_required('manage_audit_logs')
def resolve_cleanup_audit_logs(root, info, days_to_keep=90):
    """清理旧的审计日志"""
    service = AuditLogService()
    audit_service = AuditLogService()
    
    # 获取当前用户信息
    current_user = info.context.get('current_user')
    
    # 执行清理
    result = service.cleanup_old_logs(days_to_keep)
    
    # 记录审计日志
    audit_service.create_audit_log(
        user_id=current_user['id'],
        action='CLEANUP',
        resource='audit_logs',
        details={
            'days_to_keep': days_to_keep,
            'deleted_count': result.get('deleted_count', 0)
        },
        ip_address=info.context.get('ip_address'),
        user_agent=info.context.get('user_agent')
    )
    
    return result