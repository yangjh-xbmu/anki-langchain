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
    word_id = db.Column(db.Integer, db.ForeignKey('word.id'), nullable=False)
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