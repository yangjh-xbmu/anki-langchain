from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class Word(db.Model):
    """单词模型"""
    id = db.Column(db.Integer, primary_key=True)
    anki_card_id = db.Column(db.Integer, unique=True, nullable=False)
    word = db.Column(db.String(100), nullable=False)
    meaning = db.Column(db.Text)
    deck_name = db.Column(db.String(100))
    image_url = db.Column(db.String(500))
    audio_url = db.Column(db.String(500))
    # 新增字段
    phonetic = db.Column(db.String(100))  # 音标
    etymology = db.Column(db.Text)  # 词源
    exam_frequency = db.Column(db.Integer)  # 考试频率
    star_level = db.Column(db.Integer)  # 星级
    example_sentence = db.Column(db.Text)  # 真题例句
    example_translation = db.Column(db.Text)  # 例句释义
    related_words = db.Column(db.Text)  # 相关词
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow,
                            onupdate=datetime.utcnow)
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'anki_card_id': self.anki_card_id,
            'word': self.word,
            'meaning': self.meaning,
            'deck_name': self.deck_name,
            'image_url': self.image_url,
            'audio_url': self.audio_url,
            'phonetic': self.phonetic,
            'etymology': self.etymology,
            'exam_frequency': self.exam_frequency,
            'star_level': self.star_level,
            'example_sentence': self.example_sentence,
            'example_translation': self.example_translation,
            'related_words': self.related_words,
            'created_at': (self.created_at.isoformat()
                            if self.created_at else None),
            'updated_at': (self.updated_at.isoformat()
                            if self.updated_at else None)
        }
    
    def __repr__(self):
        return f'<Word {self.word}>'


class PracticeSession(db.Model):
    """练习会话模型"""
    id = db.Column(db.Integer, primary_key=True)
    word_id = db.Column(db.Integer, db.ForeignKey('word.id'),
                        nullable=False)
    user_input = db.Column(db.String(100), nullable=False)
    is_correct = db.Column(db.Boolean, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    word = db.relationship('Word',
                           backref=db.backref('practice_sessions',
                                              lazy=True))
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'word_id': self.word_id,
            'user_input': self.user_input,
            'is_correct': self.is_correct,
            'created_at': (self.created_at.isoformat()
                           if self.created_at else None)
        }
    
    def __repr__(self):
        return f'<PracticeSession {self.word.word}: {self.is_correct}>'


class WordMemory(db.Model):
    """单词记忆状态模型（支持FSRS算法）"""
    id = db.Column(db.Integer, primary_key=True)
    word_id = db.Column(db.Integer, db.ForeignKey('word.id'),
                        nullable=False, unique=True)
    
    # FSRS核心参数
    stability = db.Column(db.Float, default=0.0, nullable=False)
    difficulty = db.Column(db.Float, default=0.0, nullable=False)
    
    # 复习状态
    last_review = db.Column(db.DateTime, nullable=True)
    next_review = db.Column(db.DateTime, nullable=True, index=True)
    review_count = db.Column(db.Integer, default=0, nullable=False)
    consecutive_correct = db.Column(db.Integer, default=0, nullable=False)
    total_reviews = db.Column(db.Integer, default=0, nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow,
                           onupdate=datetime.utcnow)
    
    word = db.relationship('Word',
                           backref=db.backref('memory', uselist=False))
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'word_id': self.word_id,
            'stability': self.stability,
            'difficulty': self.difficulty,
            'last_review': (self.last_review.isoformat()
                           if self.last_review else None),
            'next_review': (self.next_review.isoformat()
                           if self.next_review else None),
            'review_count': self.review_count,
            'consecutive_correct': self.consecutive_correct,
            'total_reviews': self.total_reviews,
            'created_at': (self.created_at.isoformat()
                           if self.created_at else None),
            'updated_at': (self.updated_at.isoformat()
                           if self.updated_at else None)
        }
    
    def __repr__(self):
        return (
            f'<WordMemory {self.word.word} '
            f'stability={self.stability:.2f} '
            f'difficulty={self.difficulty:.2f}>'
        )


class UserLearningProfile(db.Model):
    """用户学习画像模型"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(100), unique=True, nullable=False)
    
    # 学习能力评估
    learning_speed = db.Column(db.Float, default=1.0)
    memory_retention = db.Column(db.Float, default=0.7)
    accuracy_trend = db.Column(db.Float, default=0.8)
    
    # 学习偏好
    preferred_session_length = db.Column(db.Integer, default=20)
    preferred_daily_words = db.Column(db.Integer, default=10)
    optimal_difficulty = db.Column(db.Float, default=0.6)
    
    # 时间偏好
    morning_preference = db.Column(db.Float, default=0.5)
    afternoon_preference = db.Column(db.Float, default=0.7)
    evening_preference = db.Column(db.Float, default=0.6)
    
    # 心理状态评估
    motivation_level = db.Column(db.Float, default=0.7)
    autonomy_need = db.Column(db.Float, default=0.8)
    competence_confidence = db.Column(db.Float, default=0.6)
    
    # 统计数据
    total_study_days = db.Column(db.Integer, default=0)
    average_daily_accuracy = db.Column(db.Float, default=0.0)
    longest_streak = db.Column(db.Integer, default=0)
    current_streak = db.Column(db.Integer, default=0)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow,
                           onupdate=datetime.utcnow)
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'learning_speed': self.learning_speed,
            'memory_retention': self.memory_retention,
            'accuracy_trend': self.accuracy_trend,
            'preferred_session_length': self.preferred_session_length,
            'preferred_daily_words': self.preferred_daily_words,
            'optimal_difficulty': self.optimal_difficulty,
            'morning_preference': self.morning_preference,
            'afternoon_preference': self.afternoon_preference,
            'evening_preference': self.evening_preference,
            'motivation_level': self.motivation_level,
            'autonomy_need': self.autonomy_need,
            'competence_confidence': self.competence_confidence,
            'total_study_days': self.total_study_days,
            'average_daily_accuracy': self.average_daily_accuracy,
            'longest_streak': self.longest_streak,
            'current_streak': self.current_streak,
            'created_at': (self.created_at.isoformat()
                           if self.created_at else None),
            'updated_at': (self.updated_at.isoformat()
                           if self.updated_at else None)
        }
    
    def __repr__(self):
        return f'<UserLearningProfile {self.user_id}>'


class DailyPracticeRecommendation(db.Model):
    """每日练习推荐模型"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(100), nullable=False)
    date = db.Column(db.Date, nullable=False)
    
    # 推荐参数
    recommended_word_count = db.Column(db.Integer, nullable=False)
    recommended_session_length = db.Column(db.Integer, nullable=False)
    target_accuracy = db.Column(db.Float, nullable=False)
    difficulty_level = db.Column(db.Float, nullable=False)
    
    # 心理学考量
    autonomy_score = db.Column(db.Float, default=0.0)
    competence_score = db.Column(db.Float, default=0.0)
    motivation_boost = db.Column(db.Float, default=0.0)
    
    # 推荐理由
    reasoning = db.Column(db.Text)
    confidence_level = db.Column(db.Float, default=0.8)
    
    # 执行状态
    is_accepted = db.Column(db.Boolean, default=None)
    actual_word_count = db.Column(db.Integer, default=0)
    actual_accuracy = db.Column(db.Float, default=0.0)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow,
                           onupdate=datetime.utcnow)
    
    # 添加复合索引
    __table_args__ = (db.Index('idx_user_date', 'user_id', 'date'),)
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'date': self.date.isoformat() if self.date else None,
            'recommended_word_count': self.recommended_word_count,
            'recommended_session_length': self.recommended_session_length,
            'target_accuracy': self.target_accuracy,
            'difficulty_level': self.difficulty_level,
            'autonomy_score': self.autonomy_score,
            'competence_score': self.competence_score,
            'motivation_boost': self.motivation_boost,
            'reasoning': self.reasoning,
            'confidence_level': self.confidence_level,
            'is_accepted': self.is_accepted,
            'actual_word_count': self.actual_word_count,
            'actual_accuracy': self.actual_accuracy,
            'created_at': (self.created_at.isoformat()
                           if self.created_at else None),
            'updated_at': (self.updated_at.isoformat()
                           if self.updated_at else None)
        }
    
    def __repr__(self):
        return f'<DailyPracticeRecommendation {self.user_id} {self.date}>'


class LearningSession(db.Model):
    """学习会话模型 - 扩展版本支持推荐系统"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(100), nullable=False)
    session_date = db.Column(db.Date, nullable=False)
    
    # 会话基本信息
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime)
    duration_minutes = db.Column(db.Integer, default=0)
    
    # 学习成果
    total_words = db.Column(db.Integer, default=0)
    correct_words = db.Column(db.Integer, default=0)
    accuracy_rate = db.Column(db.Float, default=0.0)
    
    # 难度分析
    average_difficulty = db.Column(db.Float, default=0.0)
    difficulty_variance = db.Column(db.Float, default=0.0)
    
    # 心理状态评估
    perceived_difficulty = db.Column(db.Integer, default=3)
    satisfaction_level = db.Column(db.Integer, default=3)
    motivation_after = db.Column(db.Integer, default=3)
    
    # 推荐系统相关
    recommendation_id = db.Column(
        db.Integer,
        db.ForeignKey('daily_practice_recommendation.id')
    )
    followed_recommendation = db.Column(db.Boolean, default=False)
    
    # 学习模式分析
    interruption_count = db.Column(db.Integer, default=0)
    peak_performance_time = db.Column(db.Time)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow,
                          onupdate=datetime.utcnow)
    
    # 关系
    recommendation = db.relationship('DailyPracticeRecommendation',
                                     backref='sessions')
    
    # 添加索引
    __table_args__ = (
        db.Index('idx_user_session_date', 'user_id', 'session_date'),
        db.Index('idx_session_start_time', 'start_time'),
    )
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'session_date': (self.session_date.isoformat()
                             if self.session_date else None),
            'start_time': (self.start_time.isoformat()
                           if self.start_time else None),
            'end_time': (self.end_time.isoformat()
                         if self.end_time else None),
            'duration_minutes': self.duration_minutes,
            'total_words': self.total_words,
            'correct_words': self.correct_words,
            'accuracy_rate': self.accuracy_rate,
            'average_difficulty': self.average_difficulty,
            'difficulty_variance': self.difficulty_variance,
            'perceived_difficulty': self.perceived_difficulty,
            'satisfaction_level': self.satisfaction_level,
            'motivation_after': self.motivation_after,
            'recommendation_id': self.recommendation_id,
            'followed_recommendation': self.followed_recommendation,
            'interruption_count': self.interruption_count,
            'peak_performance_time': (
                self.peak_performance_time.isoformat()
                if self.peak_performance_time else None
            ),
            'created_at': (self.created_at.isoformat()
                           if self.created_at else None),
            'updated_at': (self.updated_at.isoformat()
                           if self.updated_at else None)
        }
    
    def __repr__(self):
        return f'<LearningSession {self.user_id} {self.session_date}>'