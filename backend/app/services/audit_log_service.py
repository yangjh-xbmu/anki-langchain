from datetime import datetime, timedelta
from sqlalchemy import and_, desc
from sqlalchemy.exc import SQLAlchemyError
from ..models import AuditLog, User
from ..database import get_db
from ..exceptions import DatabaseError, ValidationError
import json


class AuditLogService:
    """审计日志服务类"""
    
    def __init__(self):
        self.db = get_db()
    
    def create_audit_log(self, user_id, action, resource, resource_id=None,
                         details=None, old_values=None, new_values=None,
                         ip_address=None, user_agent=None):
        """创建审计日志"""
        try:
            audit_log = AuditLog(
                user_id=user_id,
                action=action,
                resource=resource,
                resource_id=resource_id,
                details=json.dumps(details) if details else None,
                old_values=json.dumps(old_values) if old_values else None,
                new_values=json.dumps(new_values) if new_values else None,
                ip_address=ip_address,
                user_agent=user_agent,
                timestamp=datetime.utcnow()
            )
            
            self.db.add(audit_log)
            self.db.commit()
            
            return self._format_audit_log(audit_log)
            
        except SQLAlchemyError as e:
            self.db.rollback()
            raise DatabaseError(f"Failed to create audit log: {str(e)}")
        except Exception as e:
            self.db.rollback()
            raise ValidationError(f"Invalid audit log data: {str(e)}")
    
    def get_audit_logs(self, user_id=None, action=None, resource=None,
                       start_date=None, end_date=None, limit=100, offset=0):
        """获取审计日志列表"""
        try:
            query = self.db.query(AuditLog).join(
                User, AuditLog.user_id == User.id, isouter=True
            )
            
            # 应用过滤条件
            if user_id:
                query = query.filter(AuditLog.user_id == user_id)
            
            if action:
                query = query.filter(AuditLog.action.ilike(f'%{action}%'))
            
            if resource:
                query = query.filter(AuditLog.resource.ilike(f'%{resource}%'))
            
            if start_date:
                query = query.filter(AuditLog.timestamp >= start_date)
            
            if end_date:
                query = query.filter(AuditLog.timestamp <= end_date)
            
            # 排序和分页
            query = query.order_by(desc(AuditLog.timestamp))
            total_count = query.count()
            
            logs = query.offset(offset).limit(limit).all()
            
            return {
                'logs': [self._format_audit_log(log) for log in logs],
                'total_count': total_count,
                'limit': limit,
                'offset': offset
            }
            
        except SQLAlchemyError as e:
            raise DatabaseError(f"Failed to retrieve audit logs: {str(e)}")
        except Exception as e:
            raise ValidationError(f"Invalid query parameters: {str(e)}")
    
    def get_audit_log_by_id(self, log_id):
        """根据ID获取审计日志"""
        try:
            log = self.db.query(AuditLog).join(
                User, AuditLog.user_id == User.id, isouter=True
            ).filter(AuditLog.id == log_id).first()
            
            if not log:
                return None
            
            return self._format_audit_log(log)
            
        except Exception as e:
            print(f"Error getting audit log by id {log_id}: {e}")
            return None
    
    def get_user_activity_summary(self, user_id, days=30):
        """获取用户活动摘要"""
        try:
            start_date = datetime.utcnow() - timedelta(days=days)
            
            logs = self.db.query(AuditLog).filter(
                and_(
                    AuditLog.user_id == user_id,
                    AuditLog.timestamp >= start_date
                )
            ).all()
            
            # 统计活动
            activity_summary = {
                'total_actions': len(logs),
                'actions_by_type': {},
                'resources_accessed': set(),
                'daily_activity': {},
                'recent_actions': []
            }
            
            for log in logs:
                # 按动作类型统计
                action = log.action
                if action not in activity_summary['actions_by_type']:
                    activity_summary['actions_by_type'][action] = 0
                activity_summary['actions_by_type'][action] += 1
                
                # 记录访问的资源
                if log.resource:
                    activity_summary['resources_accessed'].add(log.resource)
                
                # 按日期统计
                date_key = log.timestamp.date().isoformat()
                if date_key not in activity_summary['daily_activity']:
                    activity_summary['daily_activity'][date_key] = 0
                activity_summary['daily_activity'][date_key] += 1
            
            # 转换set为list以便JSON序列化
            activity_summary['resources_accessed'] = list(
                activity_summary['resources_accessed']
            )
            
            # 获取最近的10个动作
            recent_logs = sorted(
                logs, key=lambda x: x.timestamp, reverse=True
            )[:10]
            activity_summary['recent_actions'] = [
                self._format_audit_log(log) for log in recent_logs
            ]
            
            return activity_summary
            
        except Exception as e:
            print(f"Error getting user activity summary: {e}")
            return {
                'total_actions': 0,
                'actions_by_type': {},
                'resources_accessed': [],
                'daily_activity': {},
                'recent_actions': []
            }
    
    def get_system_activity_stats(self, days=7):
        """获取系统活动统计"""
        try:
            start_date = datetime.utcnow() - timedelta(days=days)
            
            logs = self.db.query(AuditLog).filter(
                AuditLog.timestamp >= start_date
            ).all()
            
            stats = {
                'total_actions': len(logs),
                'unique_users': set(),
                'actions_by_type': {},
                'resources_by_type': {},
                'hourly_activity': {},
                'daily_activity': {}
            }
            
            for log in logs:
                # 统计唯一用户
                if log.user_id:
                    stats['unique_users'].add(log.user_id)
                
                # 按动作类型统计
                action = log.action
                if action not in stats['actions_by_type']:
                    stats['actions_by_type'][action] = 0
                stats['actions_by_type'][action] += 1
                
                # 按资源类型统计
                resource = log.resource
                if resource not in stats['resources_by_type']:
                    stats['resources_by_type'][resource] = 0
                stats['resources_by_type'][resource] += 1
                
                # 按小时统计
                hour_key = log.timestamp.strftime('%Y-%m-%d %H:00')
                if hour_key not in stats['hourly_activity']:
                    stats['hourly_activity'][hour_key] = 0
                stats['hourly_activity'][hour_key] += 1
                
                # 按日期统计
                date_key = log.timestamp.date().isoformat()
                if date_key not in stats['daily_activity']:
                    stats['daily_activity'][date_key] = 0
                stats['daily_activity'][date_key] += 1
            
            # 转换set为数量
            stats['unique_users'] = len(stats['unique_users'])
            
            return stats
            
        except Exception as e:
            print(f"Error getting system activity stats: {e}")
            return {
                'total_actions': 0,
                'unique_users': 0,
                'actions_by_type': {},
                'resources_by_type': {},
                'hourly_activity': {},
                'daily_activity': {}
            }
    
    def cleanup_old_logs(self, days_to_keep=90):
        """清理旧的审计日志"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
            
            deleted_count = self.db.query(AuditLog).filter(
                AuditLog.timestamp < cutoff_date
            ).delete()
            
            self.db.commit()
            
            return {
                'deleted_count': deleted_count,
                'cutoff_date': cutoff_date.isoformat()
            }
            
        except SQLAlchemyError as e:
            self.db.rollback()
            raise DatabaseError(f"Failed to cleanup audit logs: {str(e)}")
        except Exception as e:
            self.db.rollback()
            raise ValidationError(f"Invalid cleanup parameters: {str(e)}")
    
    def _format_audit_log(self, log):
        """格式化审计日志"""
        return {
            'id': log.id,
            'user_id': log.user_id,
            'username': log.user.username if log.user else None,
            'action': log.action,
            'resource': log.resource,
            'resource_id': log.resource_id,
            'details': json.loads(log.details) if log.details else None,
            'old_values': (
                json.loads(log.old_values) if log.old_values else None
            ),
            'new_values': (
                json.loads(log.new_values) if log.new_values else None
            ),
            'ip_address': log.ip_address,
            'user_agent': log.user_agent,
            'timestamp': log.timestamp.isoformat() if log.timestamp else None
        }