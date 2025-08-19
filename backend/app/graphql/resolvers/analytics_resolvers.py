from typing import Dict, Any, List, Optional
from app.auth_utils import jwt_required, require_permission
# from app.services.analytics_service import AnalyticsService
import logging

logger = logging.getLogger(__name__)


class AnalyticsResolvers:
    """分析统计相关的GraphQL解析器"""
    
    @staticmethod
    @jwt_required
    @require_permission('analytics:read')
    def get_user_statistics(info, **kwargs) -> Dict[str, Any]:
        """获取用户统计数据"""
        try:
            from app.services.analytics_service import AnalyticsService
            return AnalyticsService.get_user_statistics()
        except Exception as e:
            logger.error(f"获取用户统计数据失败: {str(e)}")
            raise Exception(f"获取用户统计数据失败: {str(e)}")
    
    @staticmethod
    @jwt_required
    @require_permission('analytics:read')
    def get_word_statistics(info, **kwargs) -> Dict[str, Any]:
        """获取单词统计数据"""
        try:
            from app.services.analytics_service import AnalyticsService
            return AnalyticsService.get_word_statistics()
        except Exception as e:
            logger.error(f"获取单词统计数据失败: {str(e)}")
            raise Exception(f"获取单词统计数据失败: {str(e)}")
    
    @staticmethod
    @jwt_required
    @require_permission('analytics:read')
    def get_system_statistics(info, **kwargs) -> Dict[str, Any]:
        """获取系统统计数据"""
        try:
            from app.services.analytics_service import AnalyticsService
            return AnalyticsService.get_system_statistics()
        except Exception as e:
            logger.error(f"获取系统统计数据失败: {str(e)}")
            raise Exception(f"获取系统统计数据失败: {str(e)}")
    
    @staticmethod
    @jwt_required
    @require_permission('analytics:read')
    def get_trend_data(
        info, period: str = '7d', metric: str = 'users', **kwargs
    ) -> List[Dict[str, Any]]:
        """获取趋势数据"""
        try:
            from app.services.analytics_service import AnalyticsService
            return AnalyticsService.get_trend_data(metric, period)
        except Exception as e:
            logger.error(f"获取趋势数据失败: {str(e)}")
            raise Exception(f"获取趋势数据失败: {str(e)}")
    
    @staticmethod
    @jwt_required
    @require_permission('analytics:read')
    def get_real_time_stats(info, **kwargs) -> Dict[str, Any]:
        """获取实时统计数据"""
        try:
            from app.services.analytics_service import AnalyticsService
            return AnalyticsService.get_real_time_statistics()
        except Exception as e:
            logger.error(f"获取实时统计数据失败: {str(e)}")
            raise Exception(f"获取实时统计数据失败: {str(e)}")
    
    @staticmethod
    @jwt_required
    @require_permission('analytics:read')
    def get_audit_logs(
        info, page: int = 1, page_size: int = 20,
        search: Optional[str] = None, action: Optional[str] = None,
        status: Optional[str] = None, start_date: Optional[str] = None,
        end_date: Optional[str] = None, **kwargs
    ) -> Dict[str, Any]:
        """获取审计日志"""
        try:
            from app.services.analytics_service import AnalyticsService
            return AnalyticsService.get_audit_logs(
                page, page_size, search, action, status, start_date, end_date
            )
        except Exception as e:
            logger.error(f"获取审计日志失败: {str(e)}")
            raise Exception(f"获取审计日志失败: {str(e)}")


# 导出解析器函数
get_user_statistics = AnalyticsResolvers.get_user_statistics
get_word_statistics = AnalyticsResolvers.get_word_statistics
get_system_statistics = AnalyticsResolvers.get_system_statistics
get_trend_data = AnalyticsResolvers.get_trend_data
get_real_time_stats = AnalyticsResolvers.get_real_time_stats
get_audit_logs = AnalyticsResolvers.get_audit_logs