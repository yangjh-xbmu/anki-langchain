import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType, SQLAlchemyConnectionField
from datetime import datetime, date
from .models import (
    db, Word, WordMemory, PracticeSession, 
    UserLearningProfile, DailyPracticeRecommendation, LearningSession,
    User, Role, Permission, UserRole,
    RolePermission, RefreshToken, AuditLog,
    SystemConfig
)
from .services.system_config_service import SystemConfigService
from .services.audit_log_service import AuditLogService
from .exceptions import (
    ValidationError, ConfigurationError, NotFoundError,
    DatabaseError, ReadOnlyError
)
import json


# GraphQL Types
class WordType(SQLAlchemyObjectType):
    """单词GraphQL类型"""
    class Meta:
        model = Word
        interfaces = (relay.Node, )


class WordMemoryType(SQLAlchemyObjectType):
    """单词记忆状态GraphQL类型"""
    class Meta:
        model = WordMemory
        interfaces = (relay.Node, )


class PracticeSessionType(SQLAlchemyObjectType):
    """练习会话GraphQL类型"""
    class Meta:
        model = PracticeSession
        interfaces = (relay.Node, )


class UserLearningProfileType(SQLAlchemyObjectType):
    """用户学习画像GraphQL类型"""
    class Meta:
        model = UserLearningProfile
        interfaces = (relay.Node, )


class DailyPracticeRecommendationType(SQLAlchemyObjectType):
    """每日练习推荐GraphQL类型"""
    class Meta:
        model = DailyPracticeRecommendation
        interfaces = (relay.Node, )


class LearningSessionType(SQLAlchemyObjectType):
    """学习会话GraphQL类型"""
    class Meta:
        model = LearningSession
        interfaces = (relay.Node, )


# Admin GraphQL Types
class UserType(SQLAlchemyObjectType):
    """用户GraphQL类型"""
    class Meta:
        model = User
        interfaces = (relay.Node, )
        exclude_fields = ('password_hash',)
    
    roles = graphene.List(lambda: RoleType)
    permissions = graphene.List(graphene.String)
    
    def resolve_roles(self, info):
        return self.get_roles()
    
    def resolve_permissions(self, info):
        return self.get_permissions()


class RoleType(SQLAlchemyObjectType):
    """角色GraphQL类型"""
    class Meta:
        model = Role
        interfaces = (relay.Node, )
    
    permissions = graphene.List(lambda: PermissionType)
    user_count = graphene.Int()
    
    def resolve_permissions(self, info):
        return self.get_permissions()
    
    def resolve_user_count(self, info):
        return self.get_user_count()


class PermissionType(SQLAlchemyObjectType):
    """权限GraphQL类型"""
    class Meta:
        model = Permission
        interfaces = (relay.Node, )
    
    name = graphene.String()
    
    def resolve_name(self, info):
        return self.name


class UserRoleType(SQLAlchemyObjectType):
    """用户角色关联GraphQL类型"""
    class Meta:
        model = UserRole
        interfaces = (relay.Node, )


class RolePermissionType(SQLAlchemyObjectType):
    """角色权限关联GraphQL类型"""
    class Meta:
        model = RolePermission
        interfaces = (relay.Node, )


class RefreshTokenType(SQLAlchemyObjectType):
    """刷新令牌GraphQL类型"""
    class Meta:
        model = RefreshToken
        interfaces = (relay.Node, )
        exclude_fields = ('token',)


class AuditLogType(SQLAlchemyObjectType):
    """审计日志GraphQL类型"""
    class Meta:
        model = AuditLog
        interfaces = (relay.Node, )
    
    details_json = graphene.JSONString()
    old_values_json = graphene.JSONString()
    new_values_json = graphene.JSONString()
    
    def resolve_details_json(self, info):
        return json.loads(self.details) if self.details else None
    
    def resolve_old_values_json(self, info):
        return json.loads(self.old_values) if self.old_values else None
    
    def resolve_new_values_json(self, info):
        return json.loads(self.new_values) if self.new_values else None


class SystemConfigType(SQLAlchemyObjectType):
    """系统配置GraphQL类型"""
    class Meta:
        model = SystemConfig
        interfaces = (relay.Node, )
    
    typed_value = graphene.JSONString()
    validation_rule_json = graphene.JSONString()
    
    def resolve_typed_value(self, info):
        return self.get_typed_value()
    
    def resolve_validation_rule_json(self, info):
        return (json.loads(self.validation_rule)
                if self.validation_rule else None)


# Input Types
class WordInput(graphene.InputObjectType):
    """单词输入类型"""
    anki_card_id = graphene.Int(required=True)
    word = graphene.String(required=True)
    meaning = graphene.String()
    deck_name = graphene.String()
    image_url = graphene.String()
    audio_url = graphene.String()
    phonetic = graphene.String()
    etymology = graphene.String()
    exam_frequency = graphene.Int()
    star_level = graphene.Int()
    example_sentence = graphene.String()
    example_translation = graphene.String()
    related_words = graphene.String()


# Admin Input Types
class UserInput(graphene.InputObjectType):
    """用户输入类型"""
    username = graphene.String(required=True)
    email = graphene.String(required=True)
    password = graphene.String(required=True)
    display_name = graphene.String()
    is_active = graphene.Boolean()
    is_verified = graphene.Boolean()


class UserUpdateInput(graphene.InputObjectType):
    """用户更新输入类型"""
    username = graphene.String()
    email = graphene.String()
    display_name = graphene.String()
    is_active = graphene.Boolean()
    is_verified = graphene.Boolean()


class RoleInput(graphene.InputObjectType):
    """角色输入类型"""
    name = graphene.String(required=True)
    description = graphene.String()
    is_active = graphene.Boolean()


class PermissionInput(graphene.InputObjectType):
    """权限输入类型"""
    resource = graphene.String(required=True)
    action = graphene.String(required=True)
    description = graphene.String()
    is_active = graphene.Boolean()


class SystemConfigInput(graphene.InputObjectType):
    """系统配置输入类型"""
    key = graphene.String(required=True)
    value = graphene.String(required=True)
    description = graphene.String()
    config_type = graphene.String()
    is_public = graphene.Boolean()
    is_readonly = graphene.Boolean()
    validation_rule = graphene.String()


class PracticeSessionInput(graphene.InputObjectType):
    """练习会话输入类型"""
    word_id = graphene.Int(required=True)
    user_input = graphene.String(required=True)
    is_correct = graphene.Boolean(required=True)


class UserLearningProfileInput(graphene.InputObjectType):
    """用户学习画像输入类型"""
    user_id = graphene.String(required=True)
    learning_speed = graphene.Float()
    memory_retention = graphene.Float()
    accuracy_trend = graphene.Float()
    preferred_session_length = graphene.Int()
    preferred_daily_words = graphene.Int()
    optimal_difficulty = graphene.Float()
    morning_preference = graphene.Float()
    afternoon_preference = graphene.Float()
    evening_preference = graphene.Float()
    motivation_level = graphene.Float()
    autonomy_need = graphene.Float()
    competence_confidence = graphene.Float()


class LearningSessionInput(graphene.InputObjectType):
    """学习会话输入类型"""
    user_id = graphene.String(required=True)
    session_date = graphene.Date(required=True)
    start_time = graphene.DateTime(required=True)
    end_time = graphene.DateTime()
    duration_minutes = graphene.Int()
    total_words = graphene.Int()
    correct_words = graphene.Int()
    accuracy_rate = graphene.Float()
    average_difficulty = graphene.Float()
    difficulty_variance = graphene.Float()
    perceived_difficulty = graphene.Int()
    satisfaction_level = graphene.Int()
    motivation_after = graphene.Int()
    recommendation_id = graphene.Int()
    followed_recommendation = graphene.Boolean()
    interruption_count = graphene.Int()


# Custom Scalars
class DateTime(graphene.Scalar):
    """自定义DateTime标量"""
    @staticmethod
    def serialize(dt):
        if isinstance(dt, datetime):
            return dt.isoformat()
        return dt

    @staticmethod
    def parse_literal(node):
        if isinstance(node.value, str):
            return datetime.fromisoformat(node.value)
        return None

    @staticmethod
    def parse_value(value):
        if isinstance(value, str):
            return datetime.fromisoformat(value)
        return value


class Date(graphene.Scalar):
    """自定义Date标量"""
    @staticmethod
    def serialize(dt):
        if isinstance(dt, date):
            return dt.isoformat()
        return dt

    @staticmethod
    def parse_literal(node):
        if isinstance(node.value, str):
            return datetime.fromisoformat(node.value).date()
        return None

    @staticmethod
    def parse_value(value):
        if isinstance(value, str):
            return datetime.fromisoformat(value).date()
        return value


# Query Class
class Query(graphene.ObjectType):
    """GraphQL查询类"""
    node = relay.Node.Field()
    
    # 单词相关查询
    all_words = SQLAlchemyConnectionField(WordType.connection)
    word = graphene.Field(WordType, id=graphene.Int())
    words_by_deck = graphene.List(
        WordType, deck_name=graphene.String(required=True)
    )
    search_words = graphene.List(
        WordType, query=graphene.String(required=True)
    )
    
    # 单词记忆状态查询
    word_memory = graphene.Field(
        WordMemoryType, word_id=graphene.Int(required=True)
    )
    words_for_review = graphene.List(WordMemoryType, limit=graphene.Int())
    
    # 练习会话查询
    practice_sessions = graphene.List(
        PracticeSessionType, 
        word_id=graphene.Int(),
        limit=graphene.Int()
    )
    
    # 用户学习画像查询
    user_learning_profile = graphene.Field(
        UserLearningProfileType, 
        user_id=graphene.String(required=True)
    )
    
    # 每日推荐查询
    daily_recommendation = graphene.Field(
        DailyPracticeRecommendationType,
        user_id=graphene.String(required=True),
        date=graphene.Date()
    )
    
    # 学习会话查询
    learning_sessions = graphene.List(
        LearningSessionType,
        user_id=graphene.String(required=True),
        start_date=graphene.Date(),
        end_date=graphene.Date(),
        limit=graphene.Int()
    )
    
    # 统计查询
    learning_stats = graphene.Field(
        graphene.JSONString,
        user_id=graphene.String(required=True),
        days=graphene.Int()
    )
    
    # Admin查询
    # 用户管理
    all_users = SQLAlchemyConnectionField(UserType.connection)
    user = graphene.Field(UserType, id=graphene.Int())
    current_user = graphene.Field(UserType)
    
    # 角色管理
    all_roles = SQLAlchemyConnectionField(RoleType.connection)
    role = graphene.Field(RoleType, id=graphene.Int())
    
    # 权限管理
    all_permissions = SQLAlchemyConnectionField(PermissionType.connection)
    permission = graphene.Field(PermissionType, id=graphene.Int())
    
    # 审计日志
    audit_logs = graphene.List(
        AuditLogType,
        user_id=graphene.Int(),
        action=graphene.String(),
        resource=graphene.String(),
        limit=graphene.Int()
    )
    
    # 系统配置
    system_configs = graphene.List(SystemConfigType)
    system_config = graphene.Field(
        SystemConfigType,
        key=graphene.String(required=True)
    )
    
    # 分析和统计查询
    user_statistics = graphene.Field(
        graphene.JSONString,
        description="获取用户统计信息"
    )
    word_statistics = graphene.Field(
        graphene.JSONString,
        description="获取单词统计信息"
    )
    system_statistics = graphene.Field(
        graphene.JSONString,
        description="获取系统统计信息"
    )
    trend_data = graphene.Field(
        graphene.JSONString,
        metric=graphene.String(required=True),
        period=graphene.String(required=True),
        description="获取趋势数据"
    )
    real_time_statistics = graphene.Field(
        graphene.JSONString,
        description="获取实时统计信息"
    )
    analytics_audit_logs = graphene.List(
        AuditLogType,
        start_date=graphene.Date(),
        end_date=graphene.Date(),
        action=graphene.String(),
        limit=graphene.Int(),
        description="获取分析用审计日志"
    )
    
    # 数据管理查询
    users = graphene.List(
        UserType,
        search=graphene.String(),
        role_id=graphene.Int(),
        is_active=graphene.Boolean(),
        limit=graphene.Int(),
        offset=graphene.Int(),
        description="获取用户列表"
    )
    user_by_id = graphene.Field(
        UserType,
        id=graphene.Int(required=True),
        description="根据ID获取用户"
    )
    words = graphene.List(
        WordType,
        search=graphene.String(),
        deck_name=graphene.String(),
        difficulty_min=graphene.Float(),
        difficulty_max=graphene.Float(),
        limit=graphene.Int(),
        offset=graphene.Int(),
        description="获取单词列表"
    )
    word_by_id = graphene.Field(
        WordType,
        id=graphene.Int(required=True),
        description="根据ID获取单词"
    )
    decks = graphene.List(
        graphene.JSONString,
        description="获取牌组列表"
    )
    
    # 系统配置查询字段
    system_configs_list = graphene.List(
        SystemConfigType,
        key=graphene.String(),
        category=graphene.String(),
        is_public=graphene.Boolean(),
        limit=graphene.Int(),
        offset=graphene.Int(),
        description="获取系统配置列表"
    )
    system_config_by_key = graphene.Field(
        SystemConfigType,
        key=graphene.String(required=True),
        description="根据键获取系统配置"
    )
    
    # 审计日志查询字段
    audit_logs_list = graphene.List(
        AuditLogType,
        user_id=graphene.Int(),
        action=graphene.String(),
        resource=graphene.String(),
        start_date=graphene.String(),
        end_date=graphene.String(),
        limit=graphene.Int(),
        offset=graphene.Int(),
        description="获取审计日志列表"
    )
    audit_log_by_id = graphene.Field(
        AuditLogType,
        log_id=graphene.Int(required=True),
        description="根据ID获取审计日志"
    )
    user_activity_summary = graphene.Field(
        graphene.JSONString,
        user_id=graphene.Int(required=True),
        days=graphene.Int(),
        description="获取用户活动摘要"
    )
    system_activity_stats = graphene.Field(
        graphene.JSONString,
        days=graphene.Int(),
        description="获取系统活动统计"
    )
    
    def resolve_word(self, info, id):
        """解析单个单词"""
        return Word.query.get(id)
    
    def resolve_words_by_deck(self, info, deck_name):
        """按卡组查询单词"""
        return Word.query.filter_by(deck_name=deck_name).all()
    
    def resolve_search_words(self, info, query):
        """搜索单词"""
        return Word.query.filter(
            Word.word.contains(query) | 
            Word.meaning.contains(query)
        ).limit(20).all()
    
    def resolve_word_memory(self, info, word_id):
        """解析单词记忆状态"""
        return WordMemory.query.filter_by(word_id=word_id).first()
    
    def resolve_words_for_review(self, info, limit=10):
        """获取待复习单词"""
        now = datetime.utcnow()
        return WordMemory.query.filter(
            WordMemory.next_review <= now
        ).limit(limit).all()
    
    def resolve_practice_sessions(self, info, word_id=None, limit=50):
        """解析练习会话"""
        query = PracticeSession.query
        if word_id:
            query = query.filter_by(word_id=word_id)
        return query.order_by(
            PracticeSession.created_at.desc()
        ).limit(limit).all()
    
    def resolve_user_learning_profile(self, info, user_id):
        """解析用户学习画像"""
        return UserLearningProfile.query.filter_by(user_id=user_id).first()
    
    def resolve_daily_recommendation(self, info, user_id, date=None):
        """解析每日推荐"""
        if not date:
            date = datetime.utcnow().date()
        return DailyPracticeRecommendation.query.filter_by(
            user_id=user_id, date=date
        ).first()
    
    def resolve_learning_sessions(self, info, user_id, start_date=None,
                                  end_date=None, limit=30):
        """解析学习会话"""
        query = LearningSession.query.filter_by(user_id=user_id)
        if start_date:
            query = query.filter(LearningSession.session_date >= start_date)
        if end_date:
            query = query.filter(LearningSession.session_date <= end_date)
        return query.order_by(
            LearningSession.session_date.desc()
        ).limit(limit).all()
    
    def resolve_learning_stats(self, info, user_id, days=30):
        """解析学习统计"""
        from datetime import timedelta
        end_date = datetime.utcnow().date()
        start_date = end_date - timedelta(days=days)
        
        sessions = LearningSession.query.filter(
            LearningSession.user_id == user_id,
            LearningSession.session_date >= start_date,
            LearningSession.session_date <= end_date
        ).all()
        
        if not sessions:
            return {
                'total_sessions': 0,
                'total_words': 0,
                'average_accuracy': 0.0,
                'total_duration': 0,
                'streak_days': 0
            }
        
        total_words = sum(s.total_words for s in sessions)
        total_correct = sum(s.correct_words for s in sessions)
        total_duration = sum(s.duration_minutes for s in sessions)
        
        return {
            'total_sessions': len(sessions),
            'total_words': total_words,
            'average_accuracy': (
                total_correct / total_words if total_words > 0 else 0.0
            ),
            'total_duration': total_duration,
            'streak_days': len(set(s.session_date for s in sessions))
        }
    
    # 数据管理解析器
    def resolve_users(self, info, search=None, role_id=None, 
                      is_active=None, limit=50, offset=0):
        """解析用户列表"""
        from .graphql.resolvers.data_management_resolvers import (
            resolve_users
        )
        return resolve_users(
            self, info, search, role_id, is_active, limit, offset
        )
    
    def resolve_user_by_id(self, info, id):
        """解析单个用户"""
        from .graphql.resolvers.data_management_resolvers import (
            resolve_user_by_id
        )
        return resolve_user_by_id(self, info, id)
    
    def resolve_words(self, info, search=None, deck_name=None,
                      difficulty_min=None, difficulty_max=None,
                      limit=50, offset=0):
        """解析单词列表"""
        from .graphql.resolvers.data_management_resolvers import (
            resolve_words
        )
        return resolve_words(
            self, info, search, deck_name, difficulty_min,
            difficulty_max, limit, offset
        )
    
    def resolve_word_by_id(self, info, id):
        """解析单个单词"""
        from .graphql.resolvers.data_management_resolvers import (
            resolve_word_by_id
        )
        return resolve_word_by_id(self, info, id)
    
    def resolve_decks(self, info):
        """解析牌组列表"""
        from .graphql.resolvers.data_management_resolvers import (
            resolve_decks
        )
        return resolve_decks(self, info)
    
    # 分析统计解析器
    def resolve_user_statistics(self, info):
        """解析用户统计信息"""
        from .graphql.resolvers.analytics_resolvers import (
            resolve_user_statistics
        )
        return resolve_user_statistics(self, info)
    
    def resolve_word_statistics(self, info):
        """解析单词统计信息"""
        from .graphql.resolvers.analytics_resolvers import (
            resolve_word_statistics
        )
        return resolve_word_statistics(self, info)
    
    def resolve_system_statistics(self, info):
        """解析系统统计信息"""
        from .graphql.resolvers.analytics_resolvers import (
            resolve_system_statistics
        )
        return resolve_system_statistics(self, info)
    
    def resolve_trend_data(self, info, metric, period):
        """解析趋势数据"""
        from .graphql.resolvers.analytics_resolvers import (
            resolve_trend_data
        )
        return resolve_trend_data(self, info, metric, period)
    
    def resolve_real_time_statistics(self, info):
        """解析实时统计信息"""
        from .graphql.resolvers.analytics_resolvers import (
            resolve_real_time_statistics
        )
        return resolve_real_time_statistics(self, info)
    
    def resolve_analytics_audit_logs(self, info, start_date=None,
                                     end_date=None, action=None,
                                     limit=100):
        """解析分析审计日志"""
        from .graphql.resolvers.analytics_resolvers import (
            resolve_analytics_audit_logs
        )
        return resolve_analytics_audit_logs(
            self, info, start_date, end_date, action, limit
        )
    
    # 系统配置解析器
    def resolve_system_configs_list(self, info, key=None, category=None,
                                     is_public=None, limit=50, offset=0):
        """解析系统配置列表"""
        query = SystemConfig.query
        if key:
            query = query.filter(SystemConfig.key.contains(key))
        if category:
            query = query.filter_by(category=category)
        if is_public is not None:
            query = query.filter_by(is_public=is_public)
        return query.offset(offset).limit(limit).all()
    
    def resolve_system_config_by_key(self, info, key):
        """解析单个系统配置"""
        return SystemConfig.query.filter_by(key=key).first()
    
    # 审计日志解析器
    def resolve_audit_logs_list(self, info, user_id=None, action=None,
                                 resource=None, start_date=None,
                                 end_date=None, limit=100, offset=0):
        """解析审计日志列表"""
        query = AuditLog.query
        if user_id:
            query = query.filter_by(user_id=user_id)
        if action:
            query = query.filter_by(action=action)
        if resource:
            query = query.filter_by(resource=resource)
        if start_date:
            from datetime import datetime
            start_dt = datetime.fromisoformat(start_date)
            query = query.filter(AuditLog.created_at >= start_dt)
        if end_date:
            from datetime import datetime
            end_dt = datetime.fromisoformat(end_date)
            query = query.filter(AuditLog.created_at <= end_dt)
        return query.order_by(
             AuditLog.created_at.desc()
         ).offset(offset).limit(limit).all()
    
    def resolve_audit_log_by_id(self, info, log_id):
        """解析单个审计日志"""
        return AuditLog.query.get(log_id)
    
    def resolve_user_activity_summary(self, info, user_id, days=30):
        """解析用户活动摘要"""
        from datetime import datetime, timedelta
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        logs = AuditLog.query.filter(
            AuditLog.user_id == user_id,
            AuditLog.created_at >= start_date,
            AuditLog.created_at <= end_date
        ).all()
        
        actions = {}
        for log in logs:
            actions[log.action] = actions.get(log.action, 0) + 1
        
        return {
            'total_activities': len(logs),
            'actions_breakdown': actions,
            'period_days': days,
            'most_active_day': None  # 可以进一步计算
        }
    
    def resolve_system_activity_stats(self, info, days=7):
        """解析系统活动统计"""
        from datetime import datetime, timedelta
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        logs = AuditLog.query.filter(
            AuditLog.created_at >= start_date,
            AuditLog.created_at <= end_date
        ).all()
        
        users_active = set(log.user_id for log in logs if log.user_id)
        actions = {}
        resources = {}
        
        for log in logs:
            actions[log.action] = actions.get(log.action, 0) + 1
            resources[log.resource] = resources.get(log.resource, 0) + 1
        
        return {
            'total_activities': len(logs),
            'active_users': len(users_active),
            'actions_breakdown': actions,
            'resources_breakdown': resources,
            'period_days': days
        }


# Mutation Classes
class CreateWord(graphene.Mutation):
    """创建单词变更"""
    class Arguments:
        word_data = WordInput(required=True)
    
    word = graphene.Field(WordType)
    success = graphene.Boolean()
    message = graphene.String()
    
    def mutate(self, info, word_data):
        try:
            # 检查是否已存在相同的anki_card_id
            existing_word = Word.query.filter_by(
                anki_card_id=word_data.anki_card_id
            ).first()
            if existing_word:
                return CreateWord(
                    word=existing_word,
                    success=False,
                    message="Word with this Anki card ID already exists"
                )
            
            word = Word(**word_data)
            db.session.add(word)
            db.session.commit()
            
            return CreateWord(
                word=word,
                success=True,
                message="Word created successfully"
            )
        except Exception as e:
            db.session.rollback()
            return CreateWord(
                word=None,
                success=False,
                message=f"Error creating word: {str(e)}"
            )


class UpdateWord(graphene.Mutation):
    """更新单词变更"""
    class Arguments:
        id = graphene.Int(required=True)
        word_data = WordInput(required=True)
    
    word = graphene.Field(WordType)
    success = graphene.Boolean()
    message = graphene.String()
    
    def mutate(self, info, id, word_data):
        try:
            word = Word.query.get(id)
            if not word:
                return UpdateWord(
                    word=None,
                    success=False,
                    message="Word not found"
                )
            
            for key, value in word_data.items():
                if hasattr(word, key) and value is not None:
                    setattr(word, key, value)
            
            word.updated_at = datetime.utcnow()
            db.session.commit()
            
            return UpdateWord(
                word=word,
                success=True,
                message="Word updated successfully"
            )
        except Exception as e:
            db.session.rollback()
            return UpdateWord(
                word=None,
                success=False,
                message=f"Error updating word: {str(e)}"
            )


class SubmitPracticeSession(graphene.Mutation):
    """提交练习会话变更"""
    class Arguments:
        session_data = PracticeSessionInput(required=True)
    
    session = graphene.Field(PracticeSessionType)
    success = graphene.Boolean()
    message = graphene.String()
    
    def mutate(self, info, session_data):
        try:
            session = PracticeSession(**session_data)
            db.session.add(session)
            
            # 更新单词记忆状态
            word_memory = WordMemory.query.filter_by(
                word_id=session_data.word_id
            ).first()
            
            if not word_memory:
                word_memory = WordMemory(word_id=session_data.word_id)
                db.session.add(word_memory)
            
            # 简化的FSRS更新逻辑
            word_memory.last_review = datetime.utcnow()
            word_memory.review_count += 1
            word_memory.total_reviews += 1
            
            if session_data.is_correct:
                word_memory.consecutive_correct += 1
                # 增加稳定性
                word_memory.stability = min(
                    word_memory.stability * 1.5 + 1, 365
                )
            else:
                word_memory.consecutive_correct = 0
                # 重置稳定性
                word_memory.stability = max(word_memory.stability * 0.5, 1)
                # 增加难度
                word_memory.difficulty = min(
                    word_memory.difficulty + 0.1, 1.0
                )
            
            # 计算下次复习时间
            from datetime import timedelta
            word_memory.next_review = datetime.utcnow() + timedelta(
                days=int(word_memory.stability)
            )
            
            db.session.commit()
            
            return SubmitPracticeSession(
                session=session,
                success=True,
                message="Practice session submitted successfully"
            )
        except Exception as e:
            db.session.rollback()
            return SubmitPracticeSession(
                session=None,
                success=False,
                message=f"Error submitting practice session: {str(e)}"
            )


class UpdateUserProfile(graphene.Mutation):
    """更新用户学习画像变更"""
    class Arguments:
        profile_data = UserLearningProfileInput(required=True)
    
    profile = graphene.Field(UserLearningProfileType)
    success = graphene.Boolean()
    message = graphene.String()
    
    def mutate(self, info, profile_data):
        try:
            profile = UserLearningProfile.query.filter_by(
                user_id=profile_data.user_id
            ).first()
            
            if not profile:
                profile = UserLearningProfile(
                    user_id=profile_data.user_id
                )
                db.session.add(profile)
            
            for key, value in profile_data.items():
                if hasattr(profile, key) and value is not None:
                    setattr(profile, key, value)
            
            profile.updated_at = datetime.utcnow()
            db.session.commit()
            
            return UpdateUserProfile(
                profile=profile,
                success=True,
                message="User profile updated successfully"
            )
        except Exception as e:
            db.session.rollback()
            return UpdateUserProfile(
                profile=None,
                success=False,
                message=f"Error updating user profile: {str(e)}"
            )


class RecordLearningSession(graphene.Mutation):
    """记录学习会话变更"""
    class Arguments:
        session_data = LearningSessionInput(required=True)
    
    session = graphene.Field(LearningSessionType)
    success = graphene.Boolean()
    message = graphene.String()
    
    def mutate(self, info, session_data):
        try:
            session = LearningSession(**session_data)
            
            # 计算准确率
            if (session_data.total_words and 
                    session_data.correct_words is not None):
                session.accuracy_rate = (
                    session_data.correct_words / session_data.total_words
                )
            
            # 计算持续时间
            if session_data.start_time and session_data.end_time:
                duration = session_data.end_time - session_data.start_time
                session.duration_minutes = int(
                    duration.total_seconds() / 60
                )
            
            db.session.add(session)
            db.session.commit()
            
            return RecordLearningSession(
                session=session,
                success=True,
                message="Learning session recorded successfully"
            )
        except Exception as e:
            db.session.rollback()
            return RecordLearningSession(
                session=None,
                success=False,
                message=f"Error recording learning session: {str(e)}"
            )


class ResetWordMemory(graphene.Mutation):
    """重置单词记忆状态变更"""
    class Arguments:
        word_id = graphene.Int(required=True)
    
    word_memory = graphene.Field(WordMemoryType)
    success = graphene.Boolean()
    message = graphene.String()
    
    def mutate(self, info, word_id):
        try:
            word_memory = WordMemory.query.filter_by(word_id=word_id).first()
            
            if not word_memory:
                return ResetWordMemory(
                    word_memory=None,
                    success=False,
                    message="Word memory not found"
                )
            
            # 重置记忆状态
            word_memory.stability = 0.0
            word_memory.difficulty = 0.0
            word_memory.last_review = None
            word_memory.next_review = None
            word_memory.review_count = 0
            word_memory.consecutive_correct = 0
            word_memory.total_reviews = 0
            word_memory.updated_at = datetime.utcnow()
            
            db.session.commit()
            
            return ResetWordMemory(
                word_memory=word_memory,
                success=True,
                message="Word memory reset successfully"
            )
        except Exception as e:
            db.session.rollback()
            return ResetWordMemory(
                word_memory=None,
                success=False,
                message=f"Error resetting word memory: {str(e)}"
            )


# Admin Mutation Classes
class CreateUser(graphene.Mutation):
    """创建用户变更"""
    class Arguments:
        user_data = UserInput(required=True)
    
    user = graphene.Field(UserType)
    success = graphene.Boolean()
    message = graphene.String()
    
    def mutate(self, info, user_data):
        try:
            from .admin_models import User
            user = User(**user_data)
            db.session.add(user)
            db.session.commit()
            
            return CreateUser(
                user=user,
                success=True,
                message="User created successfully"
            )
        except Exception as e:
            db.session.rollback()
            return CreateUser(
                user=None,
                success=False,
                message=f"Error creating user: {str(e)}"
            )


class UpdateUser(graphene.Mutation):
    """更新用户变更"""
    class Arguments:
        id = graphene.Int(required=True)
        user_data = UserUpdateInput(required=True)
    
    user = graphene.Field(UserType)
    success = graphene.Boolean()
    message = graphene.String()
    
    def mutate(self, info, id, user_data):
        try:
            from .admin_models import User
            user = User.query.get(id)
            if not user:
                return UpdateUser(
                    user=None,
                    success=False,
                    message="User not found"
                )
            
            for key, value in user_data.items():
                if hasattr(user, key) and value is not None:
                    setattr(user, key, value)
            
            user.updated_at = datetime.utcnow()
            db.session.commit()
            
            return UpdateUser(
                user=user,
                success=True,
                message="User updated successfully"
            )
        except Exception as e:
            db.session.rollback()
            return UpdateUser(
                user=None,
                success=False,
                message=f"Error updating user: {str(e)}"
            )


class DeleteUser(graphene.Mutation):
    """删除用户变更"""
    class Arguments:
        id = graphene.Int(required=True)
    
    success = graphene.Boolean()
    message = graphene.String()
    
    def mutate(self, info, id):
        try:
            from .admin_models import User
            user = User.query.get(id)
            if not user:
                return DeleteUser(
                    success=False,
                    message="User not found"
                )
            
            db.session.delete(user)
            db.session.commit()
            
            return DeleteUser(
                success=True,
                message="User deleted successfully"
            )
        except Exception as e:
            db.session.rollback()
            return DeleteUser(
                success=False,
                message=f"Error deleting user: {str(e)}"
            )


class CreateRole(graphene.Mutation):
    """创建角色变更"""
    class Arguments:
        role_data = RoleInput(required=True)
    
    role = graphene.Field(RoleType)
    success = graphene.Boolean()
    message = graphene.String()
    
    def mutate(self, info, role_data):
        try:
            from .admin_models import Role
            role = Role(**role_data)
            db.session.add(role)
            db.session.commit()
            
            return CreateRole(
                role=role,
                success=True,
                message="Role created successfully"
            )
        except Exception as e:
            db.session.rollback()
            return CreateRole(
                role=None,
                success=False,
                message=f"Error creating role: {str(e)}"
            )


class UpdateRole(graphene.Mutation):
    """更新角色变更"""
    class Arguments:
        id = graphene.Int(required=True)
        role_data = RoleInput(required=True)
    
    role = graphene.Field(RoleType)
    success = graphene.Boolean()
    message = graphene.String()
    
    def mutate(self, info, id, role_data):
        try:
            from .admin_models import Role
            role = Role.query.get(id)
            if not role:
                return UpdateRole(
                    role=None,
                    success=False,
                    message="Role not found"
                )
            
            for key, value in role_data.items():
                if hasattr(role, key) and value is not None:
                    setattr(role, key, value)
            
            role.updated_at = datetime.utcnow()
            db.session.commit()
            
            return UpdateRole(
                role=role,
                success=True,
                message="Role updated successfully"
            )
        except Exception as e:
            db.session.rollback()
            return UpdateRole(
                role=None,
                success=False,
                message=f"Error updating role: {str(e)}"
            )


class DeleteRole(graphene.Mutation):
    """删除角色变更"""
    class Arguments:
        id = graphene.Int(required=True)
    
    success = graphene.Boolean()
    message = graphene.String()
    
    def mutate(self, info, id):
        try:
            from .admin_models import Role
            role = Role.query.get(id)
            if not role:
                return DeleteRole(
                    success=False,
                    message="Role not found"
                )
            
            db.session.delete(role)
            db.session.commit()
            
            return DeleteRole(
                success=True,
                message="Role deleted successfully"
            )
        except Exception as e:
            db.session.rollback()
            return DeleteRole(
                success=False,
                message=f"Error deleting role: {str(e)}"
            )


class AssignRoleToUser(graphene.Mutation):
    """为用户分配角色变更"""
    class Arguments:
        user_id = graphene.Int(required=True)
        role_id = graphene.Int(required=True)
    
    success = graphene.Boolean()
    message = graphene.String()
    
    def mutate(self, info, user_id, role_id):
        try:
            from .admin_models import User, Role, UserRole
            user = User.query.get(user_id)
            role = Role.query.get(role_id)
            
            if not user:
                return AssignRoleToUser(
                    success=False,
                    message="User not found"
                )
            
            if not role:
                return AssignRoleToUser(
                    success=False,
                    message="Role not found"
                )
            
            # 检查是否已存在
            existing = UserRole.query.filter_by(
                user_id=user_id, role_id=role_id
            ).first()
            
            if existing:
                return AssignRoleToUser(
                    success=False,
                    message="User already has this role"
                )
            
            user_role = UserRole(user_id=user_id, role_id=role_id)
            db.session.add(user_role)
            db.session.commit()
            
            return AssignRoleToUser(
                success=True,
                message="Role assigned to user successfully"
            )
        except Exception as e:
            db.session.rollback()
            return AssignRoleToUser(
                success=False,
                message=f"Error assigning role to user: {str(e)}"
            )


class RemoveRoleFromUser(graphene.Mutation):
    """从用户移除角色变更"""
    class Arguments:
        user_id = graphene.Int(required=True)
        role_id = graphene.Int(required=True)
    
    success = graphene.Boolean()
    message = graphene.String()
    
    def mutate(self, info, user_id, role_id):
        try:
            from .admin_models import UserRole
            user_role = UserRole.query.filter_by(
                user_id=user_id, role_id=role_id
            ).first()
            
            if not user_role:
                return RemoveRoleFromUser(
                    success=False,
                    message="User role assignment not found"
                )
            
            db.session.delete(user_role)
            db.session.commit()
            
            return RemoveRoleFromUser(
                success=True,
                message="Role removed from user successfully"
            )
        except Exception as e:
            db.session.rollback()
            return RemoveRoleFromUser(
                success=False,
                message=f"Error removing role from user: {str(e)}"
            )


class CreatePermission(graphene.Mutation):
    """创建权限变更"""
    class Arguments:
        permission_data = PermissionInput(required=True)
    
    permission = graphene.Field(PermissionType)
    success = graphene.Boolean()
    message = graphene.String()
    
    def mutate(self, info, permission_data):
        try:
            from .admin_models import Permission
            permission = Permission(**permission_data)
            db.session.add(permission)
            db.session.commit()
            
            return CreatePermission(
                permission=permission,
                success=True,
                message="Permission created successfully"
            )
        except Exception as e:
            db.session.rollback()
            return CreatePermission(
                permission=None,
                success=False,
                message=f"Error creating permission: {str(e)}"
            )


class UpdatePermission(graphene.Mutation):
    """更新权限变更"""
    class Arguments:
        id = graphene.Int(required=True)
        permission_data = PermissionInput(required=True)
    
    permission = graphene.Field(PermissionType)
    success = graphene.Boolean()
    message = graphene.String()
    
    def mutate(self, info, id, permission_data):
        try:
            from .admin_models import Permission
            permission = Permission.query.get(id)
            if not permission:
                return UpdatePermission(
                    permission=None,
                    success=False,
                    message="Permission not found"
                )
            
            for key, value in permission_data.items():
                if hasattr(permission, key) and value is not None:
                    setattr(permission, key, value)
            
            permission.updated_at = datetime.utcnow()
            db.session.commit()
            
            return UpdatePermission(
                permission=permission,
                success=True,
                message="Permission updated successfully"
            )
        except Exception as e:
            db.session.rollback()
            return UpdatePermission(
                permission=None,
                success=False,
                message=f"Error updating permission: {str(e)}"
            )


class DeletePermission(graphene.Mutation):
    """删除权限变更"""
    class Arguments:
        id = graphene.Int(required=True)
    
    success = graphene.Boolean()
    message = graphene.String()
    
    def mutate(self, info, id):
        try:
            from .admin_models import Permission
            permission = Permission.query.get(id)
            if not permission:
                return DeletePermission(
                    success=False,
                    message="Permission not found"
                )
            
            db.session.delete(permission)
            db.session.commit()
            
            return DeletePermission(
                success=True,
                message="Permission deleted successfully"
            )
        except Exception as e:
            db.session.rollback()
            return DeletePermission(
                success=False,
                message=f"Error deleting permission: {str(e)}"
            )


class AssignPermissionToRole(graphene.Mutation):
    """为角色分配权限变更"""
    class Arguments:
        role_id = graphene.Int(required=True)
        permission_id = graphene.Int(required=True)
    
    success = graphene.Boolean()
    message = graphene.String()
    
    def mutate(self, info, role_id, permission_id):
        try:
            from .admin_models import Role, Permission, RolePermission
            role = Role.query.get(role_id)
            permission = Permission.query.get(permission_id)
            
            if not role:
                return AssignPermissionToRole(
                    success=False,
                    message="Role not found"
                )
            
            if not permission:
                return AssignPermissionToRole(
                    success=False,
                    message="Permission not found"
                )
            
            # 检查是否已存在
            existing = RolePermission.query.filter_by(
                role_id=role_id, permission_id=permission_id
            ).first()
            
            if existing:
                return AssignPermissionToRole(
                    success=False,
                    message="Role already has this permission"
                )
            
            role_permission = RolePermission(
                role_id=role_id, permission_id=permission_id
            )
            db.session.add(role_permission)
            db.session.commit()
            
            return AssignPermissionToRole(
                success=True,
                message="Permission assigned to role successfully"
            )
        except Exception as e:
            db.session.rollback()
            return AssignPermissionToRole(
                success=False,
                message=f"Error assigning permission to role: {str(e)}"
            )


class RemovePermissionFromRole(graphene.Mutation):
    """从角色移除权限变更"""
    class Arguments:
        role_id = graphene.Int(required=True)
        permission_id = graphene.Int(required=True)
    
    success = graphene.Boolean()
    message = graphene.String()
    
    def mutate(self, info, role_id, permission_id):
        try:
            from .admin_models import RolePermission
            role_permission = RolePermission.query.filter_by(
                role_id=role_id, permission_id=permission_id
            ).first()
            
            if not role_permission:
                return RemovePermissionFromRole(
                    success=False,
                    message="Role permission assignment not found"
                )
            
            db.session.delete(role_permission)
            db.session.commit()
            
            return RemovePermissionFromRole(
                success=True,
                message="Permission removed from role successfully"
            )
        except Exception as e:
            db.session.rollback()
            return RemovePermissionFromRole(
                success=False,
                message=f"Error removing permission from role: {str(e)}"
            )


class UpdateSystemConfig(graphene.Mutation):
    """更新系统配置变更"""
    class Arguments:
        config_data = SystemConfigInput(required=True)
    
    config = graphene.Field(SystemConfigType)
    success = graphene.Boolean()
    message = graphene.String()
    
    def mutate(self, info, config_data):
        try:
            service = SystemConfigService()
            config = service.create_or_update_config(
                key=config_data.key,
                value=config_data.value,
                description=getattr(config_data, 'description', None),
                config_type=getattr(config_data, 'config_type', 'string'),
                is_public=getattr(config_data, 'is_public', False),
                is_readonly=getattr(config_data, 'is_readonly', False),
                validation_rule=getattr(config_data, 'validation_rule', None)
            )
            
            return UpdateSystemConfig(
                config=config,
                success=True,
                message="System config updated successfully"
            )
        except ValidationError as e:
            return UpdateSystemConfig(
                config=None,
                success=False,
                message=f"Validation error: {str(e)}"
            )
        except ConfigurationError as e:
            return UpdateSystemConfig(
                config=None,
                success=False,
                message=f"Configuration error: {str(e)}"
            )
        except ReadOnlyError as e:
            return UpdateSystemConfig(
                config=None,
                success=False,
                message=f"Read-only error: {str(e)}"
            )
        except DatabaseError as e:
            return UpdateSystemConfig(
                config=None,
                success=False,
                message=f"Database error: {str(e)}"
            )
        except Exception as e:
            return UpdateSystemConfig(
                config=None,
                success=False,
                message=f"Unexpected error: {str(e)}"
            )


class DeleteWord(graphene.Mutation):
    """删除单词变更"""
    class Arguments:
        id = graphene.Int(required=True)
    
    success = graphene.Boolean()
    message = graphene.String()
    
    def mutate(self, info, id):
        try:
            word = Word.query.get(id)
            if not word:
                return DeleteWord(
                    success=False,
                    message="Word not found"
                )
            
            db.session.delete(word)
            db.session.commit()
            
            return DeleteWord(
                success=True,
                message="Word deleted successfully"
            )
        except Exception as e:
            db.session.rollback()
            return DeleteWord(
                success=False,
                message=f"Error deleting word: {str(e)}"
            )


class CreateSystemConfig(graphene.Mutation):
    """创建系统配置变更"""
    class Arguments:
        config_data = SystemConfigInput(required=True)
    
    config = graphene.Field(SystemConfigType)
    success = graphene.Boolean()
    message = graphene.String()
    
    def mutate(self, info, config_data):
        try:
            service = SystemConfigService()
            config = service.create_or_update_config(
                key=config_data.key,
                value=config_data.value,
                description=config_data.description,
                config_type=config_data.config_type,
                is_public=config_data.is_public,
                is_readonly=config_data.is_readonly,
                validation_rule=config_data.validation_rule
            )
            
            return CreateSystemConfig(
                config=config,
                success=True,
                message="System config created successfully"
            )
        except ValidationError as e:
            return CreateSystemConfig(
                success=False,
                message=f"Validation error: {str(e)}"
            )
        except ConfigurationError as e:
            return CreateSystemConfig(
                success=False,
                message=f"Configuration error: {str(e)}"
            )
        except DatabaseError as e:
            return CreateSystemConfig(
                success=False,
                message=f"Database error: {str(e)}"
            )
        except Exception as e:
            return CreateSystemConfig(
                success=False,
                message=f"Unexpected error: {str(e)}"
            )


class DeleteSystemConfig(graphene.Mutation):
    """删除系统配置变更"""
    class Arguments:
        key = graphene.String(required=True)
    
    success = graphene.Boolean()
    message = graphene.String()
    
    def mutate(self, info, key):
        try:
            service = SystemConfigService()
            success = service.delete_config(key)
            
            if success:
                return DeleteSystemConfig(
                    success=True,
                    message="System config deleted successfully"
                )
            else:
                return DeleteSystemConfig(
                    success=False,
                    message="System config not found"
                )
        except NotFoundError as e:
            return DeleteSystemConfig(
                success=False,
                message=f"配置不存在: {str(e)}"
            )
        except ReadOnlyError as e:
            return DeleteSystemConfig(
                success=False,
                message=f"只读配置无法删除: {str(e)}"
            )
        except DatabaseError as e:
            return DeleteSystemConfig(
                success=False,
                message=f"数据库错误: {str(e)}"
            )
        except Exception as e:
            return DeleteSystemConfig(
                success=False,
                message=f"删除系统配置失败: {str(e)}"
            )


class CleanupAuditLogs(graphene.Mutation):
    """清理审计日志变更"""
    class Arguments:
        days = graphene.Int(required=True)
    
    success = graphene.Boolean()
    message = graphene.String()
    deleted_count = graphene.Int()
    
    def mutate(self, info, days):
        try:
            service = AuditLogService()
            deleted_count = service.cleanup_old_logs(days)
            
            return CleanupAuditLogs(
                success=True,
                message=f"Cleaned up {deleted_count} old audit logs",
                deleted_count=deleted_count
            )
        except ValidationError as e:
            return CleanupAuditLogs(
                success=False,
                message=f"参数验证错误: {str(e)}",
                deleted_count=0
            )
        except DatabaseError as e:
            return CleanupAuditLogs(
                success=False,
                message=f"数据库错误: {str(e)}",
                deleted_count=0
            )
        except Exception as e:
            return CleanupAuditLogs(
                success=False,
                message=f"清理审计日志失败: {str(e)}",
                deleted_count=0
            )


# Mutation Class
class Mutation(graphene.ObjectType):
    """GraphQL变更类"""
    create_word = CreateWord.Field()
    update_word = UpdateWord.Field()
    submit_practice_session = SubmitPracticeSession.Field()
    update_user_profile = UpdateUserProfile.Field()
    record_learning_session = RecordLearningSession.Field()
    reset_word_memory = ResetWordMemory.Field()
    
    # Admin mutations
    create_user = CreateUser.Field()
    update_user = UpdateUser.Field()
    delete_user = DeleteUser.Field()
    create_role = CreateRole.Field()
    update_role = UpdateRole.Field()
    delete_role = DeleteRole.Field()
    assign_role_to_user = AssignRoleToUser.Field()
    remove_role_from_user = RemoveRoleFromUser.Field()
    create_permission = CreatePermission.Field()
    update_permission = UpdatePermission.Field()
    delete_permission = DeletePermission.Field()
    assign_permission_to_role = AssignPermissionToRole.Field()
    remove_permission_from_role = RemovePermissionFromRole.Field()
    update_system_config = UpdateSystemConfig.Field()
    
    # Data management mutations
    update_user_data = UpdateUser.Field()
    create_word_data = CreateWord.Field()
    update_word_data = UpdateWord.Field()
    delete_word = DeleteWord.Field()
    
    # System config mutations
    create_system_config = CreateSystemConfig.Field()
    update_system_config_data = UpdateSystemConfig.Field()
    delete_system_config = DeleteSystemConfig.Field()
    
    # Audit log mutations
    cleanup_audit_logs = CleanupAuditLogs.Field()
    
    # Data management resolvers
    def resolve_update_user_data(self, info, **kwargs):
        from .graphql.resolvers.data_management_resolvers import (
            resolve_update_user
        )
        return resolve_update_user(self, info, **kwargs)
    
    def resolve_create_word_data(self, info, **kwargs):
        from .graphql.resolvers.data_management_resolvers import (
            resolve_create_word
        )
        return resolve_create_word(self, info, **kwargs)
    
    def resolve_update_word_data(self, info, **kwargs):
        from .graphql.resolvers.data_management_resolvers import (
            resolve_update_word
        )
        return resolve_update_word(self, info, **kwargs)
    
    def resolve_delete_word(self, info, **kwargs):
        from .graphql.resolvers.data_management_resolvers import (
            resolve_delete_word
        )
        return resolve_delete_word(self, info, **kwargs)


# Schema
schema = graphene.Schema(query=Query, mutation=Mutation)