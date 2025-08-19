from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime
from app.database import get_db
from app.models import (
    User, Role, Word, Deck, UserLearningProfile, LearningSession, 
    PracticeRecord
)
import logging

logger = logging.getLogger(__name__)


class DataManagementService:
    """数据管理服务"""
    
    @staticmethod
    def get_users(
        page: int = 1, page_size: int = 20, search: str = None,
        role_filter: str = None, status_filter: str = None
    ) -> Dict[str, Any]:
        """获取用户列表"""
        try:
            db: Session = next(get_db())
            
            # 构建查询
            query = db.query(User)
            
            # 搜索过滤
            if search:
                query = query.filter(
                    or_(
                        User.username.ilike(f'%{search}%'),
                        User.email.ilike(f'%{search}%'),
                        User.first_name.ilike(f'%{search}%'),
                        User.last_name.ilike(f'%{search}%')
                    )
                )
            
            # 角色过滤
            if role_filter and role_filter != 'all':
                query = query.join(User.roles).filter(
                    Role.name == role_filter
                )
            
            # 状态过滤
            if status_filter and status_filter != 'all':
                if status_filter == 'active':
                    query = query.filter(User.is_active.is_(True))
                elif status_filter == 'inactive':
                    query = query.filter(User.is_active.is_(False))
            
            # 总数
            total = query.count()
            
            # 分页
            offset = (page - 1) * page_size
            users = query.offset(offset).limit(page_size).all()
            
            # 转换为字典格式
            user_list = []
            for user in users:
                user_list.append({
                    'id': str(user.id),
                    'username': user.username,
                    'email': user.email,
                    'firstName': user.first_name,
                    'lastName': user.last_name,
                    'isActive': user.is_active,
                    'createdAt': (
                        user.created_at.isoformat() 
                        if user.created_at else None
                    ),
                    'lastLoginAt': (
                        user.last_login_at.isoformat() 
                        if user.last_login_at else None
                    ),
                    'roles': [role.name for role in user.roles]
                })
            
            return {
                'users': user_list,
                'total': total,
                'page': page,
                'pageSize': page_size,
                'totalPages': (total + page_size - 1) // page_size
            }
            
        except Exception as e:
            logger.error(f"获取用户列表失败: {str(e)}")
            raise
    
    @staticmethod
    def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
        """根据ID获取用户详情"""
        try:
            db: Session = next(get_db())
            user = db.query(User).filter(User.id == user_id).first()
            
            if not user:
                return None
            
            # 获取学习统计
            learning_profile = db.query(UserLearningProfile).filter(
                UserLearningProfile.user_id == user_id
            ).first()
            
            # 获取最近学习记录
            recent_sessions = db.query(LearningSession).filter(
                LearningSession.user_id == user_id
            ).order_by(LearningSession.created_at.desc()).limit(5).all()
            
            return {
                'id': str(user.id),
                'username': user.username,
                'email': user.email,
                'firstName': user.first_name,
                'lastName': user.last_name,
                'isActive': user.is_active,
                'createdAt': (
                    user.created_at.isoformat() if user.created_at else None
                ),
                'lastLoginAt': (
                    user.last_login_at.isoformat() 
                    if user.last_login_at else None
                ),
                'roles': [{
                    'id': str(role.id),
                    'name': role.name,
                    'description': role.description
                } for role in user.roles],
                'learningStats': {
                    'totalWords': (
                        learning_profile.total_words 
                        if learning_profile else 0
                    ),
                    'masteredWords': (
                        learning_profile.mastered_words 
                        if learning_profile else 0
                    ),
                    'studyStreak': (
                        learning_profile.study_streak 
                        if learning_profile else 0
                    ),
                    'totalStudyTime': (
                        learning_profile.total_study_time 
                        if learning_profile else 0
                    )
                },
                'recentSessions': [{
                    'id': str(session.id),
                    'sessionType': session.session_type,
                    'duration': session.duration,
                    'wordsStudied': session.words_studied,
                    'accuracy': session.accuracy,
                    'createdAt': session.created_at.isoformat()
                } for session in recent_sessions]
            }
            
        except Exception as e:
            logger.error(f"获取用户详情失败: {str(e)}")
            raise
    
    @staticmethod
    def update_user(user_id: str, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """更新用户信息"""
        try:
            db: Session = next(get_db())
            user = db.query(User).filter(User.id == user_id).first()
            
            if not user:
                raise ValueError(f"用户不存在: {user_id}")
            
            # 更新基本信息
            if 'username' in user_data:
                user.username = user_data['username']
            if 'email' in user_data:
                user.email = user_data['email']
            if 'firstName' in user_data:
                user.first_name = user_data['firstName']
            if 'lastName' in user_data:
                user.last_name = user_data['lastName']
            if 'isActive' in user_data:
                user.is_active = user_data['isActive']
            
            # 更新角色
            if 'roleIds' in user_data:
                roles = db.query(Role).filter(
                    Role.id.in_(user_data['roleIds'])
                ).all()
                user.roles = roles
            
            user.updated_at = datetime.utcnow()
            db.commit()
            
            return {
                'id': str(user.id),
                'username': user.username,
                'email': user.email,
                'firstName': user.first_name,
                'lastName': user.last_name,
                'isActive': user.is_active,
                'updatedAt': user.updated_at.isoformat()
            }
            
        except Exception as e:
            db.rollback()
            logger.error(f"更新用户失败: {str(e)}")
            raise
    
    @staticmethod
    def get_words(
        page: int = 1, page_size: int = 20, search: str = None,
        deck_filter: str = None, difficulty_filter: str = None
    ) -> Dict[str, Any]:
        """获取单词列表"""
        try:
            db: Session = next(get_db())
            
            # 构建查询
            query = db.query(Word)
            
            # 搜索过滤
            if search:
                query = query.filter(
                    or_(
                        Word.word.ilike(f'%{search}%'),
                        Word.meaning.ilike(f'%{search}%'),
                        Word.pronunciation.ilike(f'%{search}%')
                    )
                )
            
            # 卡组过滤
            if deck_filter and deck_filter != 'all':
                query = query.filter(Word.deck_id == deck_filter)
            
            # 难度过滤
            if difficulty_filter and difficulty_filter != 'all':
                query = query.filter(Word.difficulty == difficulty_filter)
            
            # 总数
            total = query.count()
            
            # 分页
            offset = (page - 1) * page_size
            words = query.offset(offset).limit(page_size).all()
            
            # 转换为字典格式
            word_list = []
            for word in words:
                word_list.append({
                    'id': str(word.id),
                    'word': word.word,
                    'meaning': word.meaning,
                    'pronunciation': word.pronunciation,
                    'difficulty': word.difficulty,
                    'deckId': str(word.deck_id) if word.deck_id else None,
                    'deckName': word.deck.name if word.deck else None,
                    'createdAt': (
                        word.created_at.isoformat() 
                        if word.created_at else None
                    ),
                    'tags': word.tags.split(',') if word.tags else []
                })
            
            return {
                'words': word_list,
                'total': total,
                'page': page,
                'pageSize': page_size,
                'totalPages': (total + page_size - 1) // page_size
            }
            
        except Exception as e:
            logger.error(f"获取单词列表失败: {str(e)}")
            raise
    
    @staticmethod
    def get_word_by_id(word_id: str) -> Optional[Dict[str, Any]]:
        """根据ID获取单词详情"""
        try:
            db: Session = next(get_db())
            word = db.query(Word).filter(Word.id == word_id).first()
            
            if not word:
                return None
            
            # 获取学习统计
            practice_count = db.query(PracticeRecord).filter(
                PracticeRecord.word_id == word_id
            ).count()
            
            correct_count = db.query(PracticeRecord).filter(
                PracticeRecord.word_id == word_id,
                PracticeRecord.is_correct.is_(True)
            ).count()
            
            accuracy = (
                (correct_count / practice_count * 100) 
                if practice_count > 0 else 0
            )
            
            return {
                'id': str(word.id),
                'word': word.word,
                'meaning': word.meaning,
                'pronunciation': word.pronunciation,
                'difficulty': word.difficulty,
                'deckId': str(word.deck_id) if word.deck_id else None,
                'deckName': word.deck.name if word.deck else None,
                'createdAt': (
                    word.created_at.isoformat() if word.created_at else None
                ),
                'tags': word.tags.split(',') if word.tags else [],
                'example': word.example,
                'notes': word.notes,
                'practiceStats': {
                    'practiceCount': practice_count,
                    'correctCount': correct_count,
                    'accuracy': round(accuracy, 2)
                }
            }
            
        except Exception as e:
            logger.error(f"获取单词详情失败: {str(e)}")
            raise
    
    @staticmethod
    def create_word(word_data: Dict[str, Any]) -> Dict[str, Any]:
        """创建新单词"""
        try:
            db: Session = next(get_db())
            
            word = Word(
                word=word_data['word'],
                meaning=word_data['meaning'],
                pronunciation=word_data.get('pronunciation', ''),
                difficulty=word_data.get('difficulty', 'medium'),
                deck_id=word_data.get('deckId'),
                example=word_data.get('example', ''),
                notes=word_data.get('notes', ''),
                tags=','.join(word_data.get('tags', [])),
                created_at=datetime.utcnow()
            )
            
            db.add(word)
            db.commit()
            db.refresh(word)
            
            return {
                'id': str(word.id),
                'word': word.word,
                'meaning': word.meaning,
                'pronunciation': word.pronunciation,
                'difficulty': word.difficulty,
                'createdAt': word.created_at.isoformat()
            }
            
        except Exception as e:
            db.rollback()
            logger.error(f"创建单词失败: {str(e)}")
            raise
    
    @staticmethod
    def update_word(word_id: str, word_data: Dict[str, Any]) -> Dict[str, Any]:
        """更新单词信息"""
        try:
            db: Session = next(get_db())
            word = db.query(Word).filter(Word.id == word_id).first()
            
            if not word:
                raise ValueError(f"单词不存在: {word_id}")
            
            # 更新字段
            if 'word' in word_data:
                word.word = word_data['word']
            if 'meaning' in word_data:
                word.meaning = word_data['meaning']
            if 'pronunciation' in word_data:
                word.pronunciation = word_data['pronunciation']
            if 'difficulty' in word_data:
                word.difficulty = word_data['difficulty']
            if 'deckId' in word_data:
                word.deck_id = word_data['deckId']
            if 'example' in word_data:
                word.example = word_data['example']
            if 'notes' in word_data:
                word.notes = word_data['notes']
            if 'tags' in word_data:
                word.tags = ','.join(word_data['tags'])
            
            word.updated_at = datetime.utcnow()
            db.commit()
            
            return {
                'id': str(word.id),
                'word': word.word,
                'meaning': word.meaning,
                'updatedAt': word.updated_at.isoformat()
            }
            
        except Exception as e:
            db.rollback()
            logger.error(f"更新单词失败: {str(e)}")
            raise
    
    @staticmethod
    def delete_word(word_id: str) -> bool:
        """删除单词"""
        try:
            db: Session = next(get_db())
            word = db.query(Word).filter(Word.id == word_id).first()
            
            if not word:
                raise ValueError(f"单词不存在: {word_id}")
            
            db.delete(word)
            db.commit()
            
            return True
            
        except Exception as e:
            db.rollback()
            logger.error(f"删除单词失败: {str(e)}")
            raise
    
    @staticmethod
    def get_decks() -> List[Dict[str, Any]]:
        """获取所有卡组"""
        try:
            db: Session = next(get_db())
            decks = db.query(Deck).all()
            
            deck_list = []
            for deck in decks:
                word_count = db.query(Word).filter(
                    Word.deck_id == deck.id
                ).count()
                
                deck_list.append({
                    'id': str(deck.id),
                    'name': deck.name,
                    'description': deck.description,
                    'wordCount': word_count,
                    'createdAt': (
                        deck.created_at.isoformat() 
                        if deck.created_at else None
                    )
                })
            
            return deck_list
            
        except Exception as e:
            logger.error(f"获取卡组列表失败: {str(e)}")
            raise