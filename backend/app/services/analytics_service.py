from datetime import datetime, timedelta
from sqlalchemy import func
from ..models import (
    User, Word, PracticeSession, WordMemory, db
)
from typing import Dict, List, Optional, Any
import json


class AnalyticsService:
    """数据分析服务类"""
    
    @staticmethod
    def get_user_statistics(user_id: Optional[int] = None) -> Dict[str, Any]:
        """获取用户统计数据"""
        query = db.session.query(User)
        if user_id:
            query = query.filter(User.id == user_id)
        
        total_users = query.count()
        
        # 活跃用户（最近7天有练习记录）
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        active_users = db.session.query(User.id).join(
            PracticeSession
        ).filter(
            PracticeSession.created_at >= seven_days_ago
        ).distinct().count()
        
        # 新用户（最近30天注册）
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        new_users = query.filter(
            User.created_at >= thirty_days_ago
        ).count()
        
        return {
            'total_users': total_users,
            'active_users': active_users,
            'new_users': new_users,
            'retention_rate': round(
                (active_users / total_users * 100) if total_users > 0 else 0,
                2
            )
        }
    
    @staticmethod
    def get_word_statistics() -> Dict[str, Any]:
        """获取单词统计数据"""
        total_words = db.session.query(Word).count()
        
        # 按难度分组统计
        difficulty_stats = db.session.query(
            WordMemory.difficulty,
            func.count(WordMemory.id).label('count')
        ).group_by(WordMemory.difficulty).all()
        
        difficulty_distribution = {
            str(stat.difficulty): stat.count 
            for stat in difficulty_stats
        }
        
        # 按卡组统计
        deck_stats = db.session.query(
            Word.deck_name,
            func.count(Word.id).label('count')
        ).group_by(Word.deck_name).all()
        
        deck_distribution = {
            stat.deck_name or 'Default': stat.count 
            for stat in deck_stats
        }
        
        # 学习进度统计
        mastered_words = db.session.query(WordMemory).filter(
            WordMemory.difficulty < 1.3  # FSRS中难度<1.3认为已掌握
        ).count()
        
        return {
            'total_words': total_words,
            'mastered_words': mastered_words,
            'mastery_rate': round(
                (mastered_words / total_words * 100) if total_words > 0 else 0,
                2
            ),
            'difficulty_distribution': difficulty_distribution,
            'deck_distribution': deck_distribution
        }
    
    @staticmethod
    def get_system_statistics() -> Dict[str, Any]:
        """获取系统统计数据"""
        # 总练习次数
        total_practices = db.session.query(PracticeSession).count()
        
        # 今日练习次数
        today = datetime.utcnow().date()
        today_practices = db.session.query(PracticeSession).filter(
            func.date(PracticeSession.created_at) == today
        ).count()
        
        # 平均准确率
        avg_accuracy = db.session.query(
            func.avg(PracticeSession.accuracy)
        ).scalar() or 0
        
        # 系统负载（模拟数据）
        system_load = {
            'cpu_usage': 45.2,
            'memory_usage': 62.8,
            'disk_usage': 38.5,
            'active_connections': 127
        }
        
        return {
            'total_practices': total_practices,
            'today_practices': today_practices,
            'average_accuracy': round(avg_accuracy, 2),
            'system_load': system_load
        }
    
    @staticmethod
    def get_trend_data(
        metric: str, 
        period: str = '7d',
        user_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """获取趋势数据"""
        # 计算时间范围
        if period == '7d':
            days = 7
            date_format = '%Y-%m-%d'
        elif period == '30d':
            days = 30
            date_format = '%Y-%m-%d'
        elif period == '90d':
            days = 90
            date_format = '%Y-%m-%d'
        else:
            days = 7
            date_format = '%Y-%m-%d'
        
        start_date = datetime.utcnow() - timedelta(days=days)
        
        if metric == 'practice_count':
            return AnalyticsService._get_practice_trend(
                start_date, date_format, user_id
            )
        elif metric == 'accuracy':
            return AnalyticsService._get_accuracy_trend(
                start_date, date_format, user_id
            )
        elif metric == 'new_words':
            return AnalyticsService._get_new_words_trend(
                start_date, date_format, user_id
            )
        elif metric == 'active_users':
            return AnalyticsService._get_active_users_trend(
                start_date, date_format
            )
        else:
            return []
    
    @staticmethod
    def _get_practice_trend(
        start_date: datetime, 
        date_format: str,
        user_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """获取练习次数趋势"""
        query = db.session.query(
            func.date(PracticeSession.created_at).label('date'),
            func.count(PracticeSession.id).label('count')
        ).filter(
            PracticeSession.created_at >= start_date
        )
        
        if user_id:
            query = query.filter(PracticeSession.user_id == user_id)
        
        results = query.group_by(
            func.date(PracticeSession.created_at)
        ).all()
        
        return [
            {
                'date': result.date.strftime(date_format),
                'value': result.count
            }
            for result in results
        ]
    
    @staticmethod
    def _get_accuracy_trend(
        start_date: datetime,
        date_format: str,
        user_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """获取准确率趋势"""
        query = db.session.query(
            func.date(PracticeSession.created_at).label('date'),
            func.avg(PracticeSession.accuracy).label('avg_accuracy')
        ).filter(
            PracticeSession.created_at >= start_date
        )
        
        if user_id:
            query = query.filter(PracticeSession.user_id == user_id)
        
        results = query.group_by(
            func.date(PracticeSession.created_at)
        ).all()
        
        return [
            {
                'date': result.date.strftime(date_format),
                'value': round(result.avg_accuracy or 0, 2)
            }
            for result in results
        ]
    
    @staticmethod
    def _get_new_words_trend(
        start_date: datetime,
        date_format: str,
        user_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """获取新单词学习趋势"""
        query = db.session.query(
            func.date(WordMemory.created_at).label('date'),
            func.count(WordMemory.id).label('count')
        ).filter(
            WordMemory.created_at >= start_date
        )
        
        if user_id:
            query = query.filter(WordMemory.user_id == user_id)
        
        results = query.group_by(
            func.date(WordMemory.created_at)
        ).all()
        
        return [
            {
                'date': result.date.strftime(date_format),
                'value': result.count
            }
            for result in results
        ]
    
    @staticmethod
    def _get_active_users_trend(
        start_date: datetime,
        date_format: str
    ) -> List[Dict[str, Any]]:
        """获取活跃用户趋势"""
        results = db.session.query(
            func.date(PracticeSession.created_at).label('date'),
            func.count(func.distinct(PracticeSession.user_id)).label('count')
        ).filter(
            PracticeSession.created_at >= start_date
        ).group_by(
            func.date(PracticeSession.created_at)
        ).all()
        
        return [
            {
                'date': result.date.strftime(date_format),
                'value': result.count
            }
            for result in results
        ]
    
    @staticmethod
    def get_real_time_statistics() -> Dict[str, Any]:
        """获取实时统计数据"""
        # 当前在线用户（模拟数据）
        online_users = 23
        
        # 最近1小时的活动
        one_hour_ago = datetime.utcnow() - timedelta(hours=1)
        recent_practices = db.session.query(PracticeSession).filter(
            PracticeSession.created_at >= one_hour_ago
        ).count()
        
        # 最近练习的单词
        recent_words = db.session.query(
            Word.word,
            Word.meaning,
            PracticeSession.created_at
        ).join(
            PracticeSession, Word.id == PracticeSession.word_id
        ).order_by(
            PracticeSession.created_at.desc()
        ).limit(5).all()
        
        recent_word_list = [
            {
                'word': word.word,
                'meaning': word.meaning,
                'practiced_at': word.created_at.isoformat()
            }
            for word in recent_words
        ]
        
        # 系统状态
        system_status = {
            'status': 'healthy',
            'uptime': '15d 8h 32m',
            'response_time': 145,  # ms
            'error_rate': 0.02  # %
        }
        
        return {
            'online_users': online_users,
            'recent_practices': recent_practices,
            'recent_words': recent_word_list,
            'system_status': system_status
        }
    
    @staticmethod
    def get_analytics_audit_logs(
        limit: int = 50,
        offset: int = 0,
        action_filter: Optional[str] = None,
        user_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """获取分析相关的审计日志"""
        # 模拟审计日志数据
        # 在实际项目中，这些数据应该来自专门的审计日志表
        
        logs = [
            {
                'id': f'log_{i}',
                'action': 'view_analytics',
                'user_id': (i % 5) + 1,
                'resource': 'user_statistics',
                'timestamp': (
                    datetime.utcnow() - timedelta(hours=i)
                ).isoformat(),
                'ip_address': f'192.168.1.{100 + (i % 50)}',
                'user_agent': 'Mozilla/5.0 (compatible; Analytics/1.0)',
                'status': 'success' if i % 10 != 0 else 'failed',
                'details': json.dumps({
                    'query_type': 'user_statistics',
                    'filters': {'period': '7d'},
                    'execution_time': f'{50 + (i % 100)}ms'
                })
            }
            for i in range(offset, offset + limit)
        ]
        
        # 应用过滤器
        if action_filter:
            logs = [
                log for log in logs 
                if action_filter.lower() in log['action'].lower()
            ]
        
        if user_id:
            logs = [log for log in logs if log['user_id'] == user_id]
        
        return logs