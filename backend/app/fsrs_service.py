"""
FSRS (Free Spaced Repetition Scheduler) 算法服务
基于现代记忆科学理论的间隔重复算法
"""

import math
from datetime import datetime, timedelta
from typing import Dict, Tuple, Optional
from sqlalchemy import func
from app.models import db, Word, WordMemory


class FSRSService:
    """FSRS算法服务实现"""
    
    def __init__(self):
        # FSRS默认权重参数（可根据用户数据优化）
        # 这些参数基于大量用户数据训练得出
        self.w = [
            0.4,    # 初始稳定性
            0.6,    # 初始难度权重
            2.4,    # 难度调整系数
            5.8,    # 稳定性增长系数
            4.93,   # 稳定性指数
            0.94,   # 稳定性衰减
            0.86,   # 难度衰减
            0.01,   # 最小间隔
            1.49,   # 稳定性增长指数
            0.14,   # 稳定性衰减指数
            0.94,   # 遗忘衰减
            2.18,   # 难度调整
            0.05,   # 最小难度
            0.34,   # 难度调整系数
            1.26,   # 稳定性调整
            0.29,   # 难度调整
            2.61    # 最大稳定性
        ]
    
    def calculate_retrievability(self, stability: float, days_since_review: float) -> float:
        """
        计算记忆可提取性（R值）
        
        Args:
            stability: 记忆稳定性
            days_since_review: 距离上次复习的天数
            
        Returns:
            记忆可提取性（0-1之间）
        """
        return math.exp(math.log(0.9) * days_since_review / stability)
    
    def calculate_intervals(self, stability: float, difficulty: float) -> float:
        """
        计算下一次复习间隔

        Args:
            stability: 记忆稳定性
            difficulty: 记忆难度

        Returns:
            下一次复习间隔（天数）
        """
        if stability <= 0:
            return 1.0

        return (
            stability
            * math.exp((1 - difficulty) * self.w[4])
            * math.log(difficulty + 2)
            * self.w[5]
        )
    
    def update_memory_state(self, 
                           stability: float, 
                           difficulty: float, 
                           rating: int) -> Tuple[float, float]:
        """
        根据复习结果更新记忆状态
        
        Args:
            stability: 当前记忆稳定性
            difficulty: 当前记忆难度
            rating: 复习评分（1-4分）
                   1: 完全忘记
                   2: 很难回忆
                   3: 有些困难
                   4: 轻松回忆
                   
        Returns:
            (new_stability, new_difficulty) 新的记忆状态
        """
        if rating < 1 or rating > 4:
            raise ValueError("Rating must be between 1 and 4")
        
        if rating == 1:  # 完全忘记
            new_stability = self.w[0]
            new_difficulty = max(0, min(10, difficulty + self.w[2] * (rating - 3)))
        else:
            # 计算新的稳定性
            retrievability = 1.0  # 假设刚复习完，R=1
            
            # 稳定性增长
            stability_growth = (
                math.exp(self.w[8])
                * (11 - difficulty)
                * math.pow(stability, -self.w[9])
                * (math.exp((1 - retrievability) * self.w[10]) - 1)
            )
            new_stability = stability * (1 + stability_growth)
            
            # 计算新的难度
            new_difficulty = max(0, min(10, difficulty + self.w[2] * (rating - 3)))
        
        # 限制范围
        new_stability = max(0.1, min(36500, new_stability))  # 限制在0.1天到100年之间
        new_difficulty = max(0, min(10, new_difficulty))
        
        return new_stability, new_difficulty
    
    def get_next_word(self, user_id: Optional[int] = None) -> Optional[Word]:
        """
        获取下一个要复习的单词
        
        Args:
            user_id: 用户ID（可选）
            
        Returns:
            下一个要复习的单词，如果没有则返回None
        """
        now = datetime.utcnow()
        
        # 1. 获取到期的单词
        due_words = db.session.query(Word).join(WordMemory).filter(
            WordMemory.next_review <= now
        ).order_by(WordMemory.next_review.asc()).limit(10).all()
        
        if due_words:
            return due_words[0]
        
        # 2. 获取新单词（没有记忆记录的单词）
        new_words = db.session.query(Word).outerjoin(WordMemory).filter(
            WordMemory.id == None
        ).order_by(func.random()).limit(1).all()
        
        if new_words:
            return new_words[0]
        
        # 3. 如果没有新单词，获取最早需要复习的单词
        earliest_words = db.session.query(Word).join(WordMemory).order_by(
            WordMemory.next_review.asc()
        ).limit(1).all()
        
        return earliest_words[0] if earliest_words else None
    
    def get_review_stats(self, user_id: Optional[int] = None) -> Dict:
        """
        获取复习统计信息
        
        Args:
            user_id: 用户ID（可选）
            
        Returns:
            复习统计信息字典
        """
        now = datetime.utcnow()
        tomorrow = now + timedelta(days=1)
        
        # 今日到期
        due_today = db.session.query(
            func.count(WordMemory.id)
        ).filter(
            WordMemory.next_review <= tomorrow.date()
        ).scalar() or 0
        
        # 已完成复习
        completed_today = db.session.query(
            func.count(WordMemory.id)
        ).filter(
            func.date(WordMemory.last_review) == now.date()
        ).scalar() or 0
        
        # 总单词数
        total_words = db.session.query(
            func.count(Word.id)
        ).scalar() or 0

        # 有记忆记录的单词数
        memorized_words = db.session.query(
            func.count(WordMemory.id)
        ).scalar() or 0

        # 平均稳定性
        avg_stability = db.session.query(
            func.avg(WordMemory.stability)
        ).scalar() or 0

        # 平均难度
        avg_difficulty = db.session.query(
            func.avg(WordMemory.difficulty)
        ).scalar() or 0
        
        return {
            'due_today': due_today,
            'completed_today': completed_today,
            'total_words': total_words,
            'memorized_words': memorized_words,
            'avg_stability': float(avg_stability),
            'avg_difficulty': float(avg_difficulty),
            'memorization_rate': memorized_words / total_words if total_words > 0 else 0
        }
    
    def review_word(self, word_id: int, rating: int) -> Dict:
        """
        记录单词复习结果
        
        Args:
            word_id: 单词ID
            rating: 复习评分（1-4分）
            
        Returns:
            复习结果信息
        """
        word_memory = WordMemory.query.filter_by(word_id=word_id).first()
        
        if not word_memory:
            # 创建新的记忆记录
            word_memory = WordMemory(word_id=word_id)
            db.session.add(word_memory)
            db.session.flush()  # 确保获取ID
        
        # 更新记忆状态
        new_stability, new_difficulty = self.update_memory_state(
            word_memory.stability or 0.0,
            word_memory.difficulty or 0.0,
            rating
        )
        
        word_memory.stability = new_stability
        word_memory.difficulty = new_difficulty
        word_memory.last_review = datetime.utcnow()
        
        # 计算下一次复习时间
        interval_days = self.calculate_intervals(new_stability, new_difficulty)
        word_memory.next_review = datetime.utcnow() + timedelta(days=interval_days)
        
        word_memory.review_count += 1
        word_memory.total_reviews += 1
        
        if rating >= 3:
            word_memory.consecutive_correct += 1
        else:
            word_memory.consecutive_correct = 0
        
        try:
            db.session.commit()
            
            return {
                'success': True,
                'next_review': word_memory.next_review.isoformat(),
                'stability': new_stability,
                'difficulty': new_difficulty,
                'interval_days': interval_days,
                'review_count': word_memory.review_count
            }
        except Exception as e:
            db.session.rollback()
            raise e
    
    def reset_word_memory(self, word_id: int) -> bool:
        """
        重置单词记忆状态
        
        Args:
            word_id: 单词ID
            
        Returns:
            是否成功重置
        """
        word_memory = WordMemory.query.filter_by(word_id=word_id).first()
        if word_memory:
            db.session.delete(word_memory)
            db.session.commit()
            return True
        return False
    
    def get_words_by_difficulty(self, difficulty_range: Tuple[float, float], limit: int = 10) -> list:
        """
        根据难度范围获取单词
        
        Args:
            difficulty_range: 难度范围元组 (min, max)
            limit: 返回单词数量限制
            
        Returns:
            单词列表
        """
        min_diff, max_diff = difficulty_range
        
        words = db.session.query(Word).join(WordMemory).filter(
            WordMemory.difficulty >= min_diff,
            WordMemory.difficulty <= max_diff
        ).order_by(func.random()).limit(limit).all()
        
        return words
    
    def get_due_words(self, limit: int = 50) -> list:
        """
        获取所有到期的单词
        
        Args:
            limit: 返回单词数量限制
            
        Returns:
            到期单词列表
        """
        now = datetime.utcnow()
        
        words = db.session.query(Word).join(WordMemory).filter(
            WordMemory.next_review <= now
        ).order_by(WordMemory.next_review.asc()).limit(limit).all()
        
        return words