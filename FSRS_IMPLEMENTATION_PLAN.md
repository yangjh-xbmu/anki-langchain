# FSRS算法实施计划

## 概述
本计划基于用户选择的方案三（FSRS算法）对单词练习系统进行优化，提供更科学、高效的单词记忆体验。

## FSRS算法简介

FSRS（Free Spaced Repetition Scheduler）是Anki 23.10版本引入的新一代间隔重复算法，相比传统的SM-2算法具有以下优势：

- **更准确的记忆预测**：基于现代记忆科学理论
- **自适应学习**：根据用户实际表现动态调整
- **参数优化**：支持个性化参数调优
- **更好的长期记忆效果**：减少过度复习和遗忘

## 实施阶段

### 阶段一：数据模型扩展（1-2天）

#### 1.1 数据库模型设计

**新增WordMemory模型**：
```python
class WordMemory(Base):
    __tablename__ = 'word_memories'
    
    id = Column(Integer, primary_key=True)
    word_id = Column(Integer, ForeignKey('words.id'), nullable=False)
    
    # FSRS核心参数
    stability = Column(Float, default=0.0)  # 记忆稳定性
    difficulty = Column(Float, default=0.0)  # 记忆难度
    
    # 复习状态
    last_review = Column(DateTime, nullable=True)
    next_review = Column(DateTime, nullable=True)
    review_count = Column(Integer, default=0)
    
    # 学习历史
    consecutive_correct = Column(Integer, default=0)
    total_reviews = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

#### 1.2 迁移脚本

```python
# scripts/migrate_fsrs.py
from alembic import op
import sqlalchemy as sa

def upgrade():
    # 创建word_memories表
    op.create_table('word_memories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('word_id', sa.Integer(), nullable=False),
        sa.Column('stability', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('difficulty', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('last_review', sa.DateTime(), nullable=True),
        sa.Column('next_review', sa.DateTime(), nullable=True),
        sa.Column('review_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('consecutive_correct', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_reviews', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['word_id'], ['words.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('word_id')
    )
    
    # 创建索引
    op.create_index('idx_word_memory_next_review', 'word_memories', ['next_review'])
    op.create_index('idx_word_memory_word_id', 'word_memories', ['word_id'])

```

### 阶段二：FSRS算法实现（2-3天）

#### 2.1 FSRS核心算法

**backend/app/fsrs_service.py**:
```python
import math
from datetime import datetime, timedelta
from typing import Dict, Tuple

class FSRSService:
    """FSRS算法服务"""
    
    def __init__(self):
        # FSRS默认参数（可根据用户数据优化）
        self.w = [
            0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01,
            1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29,
            2.61
        ]
        
    def calculate_intervals(self, stability: float, difficulty: float) -> float:
        """计算下一次复习间隔"""
        return stability * (math.exp((1 - difficulty) * self.w[4]) * 
                           math.log(difficulty + 2) * self.w[5])
    
    def update_memory_state(self, 
                           stability: float, 
                           difficulty: float, 
                           rating: int) -> Tuple[float, float]:
        """
        更新记忆状态
        rating: 1-4分，1=完全忘记，4=完全记住
        """
        if rating == 1:  # 完全忘记
            new_stability = self.w[0]
            new_difficulty = difficulty + self.w[2] * (rating - 3)
        else:
            # 计算新的稳定性
            retrievability = math.exp(math.log(0.9) * (1 / stability))
            new_stability = stability * (1 + math.exp(self.w[8]) * 
                                       (11 - difficulty) * math.pow(stability, -self.w[9]) * 
                                       (math.exp((1 - retrievability) * self.w[10]) - 1))
            
            # 计算新的难度
            new_difficulty = difficulty + self.w[2] * (rating - 3)
            
        # 限制范围
        new_difficulty = max(0, min(10, new_difficulty))
        
        return new_stability, new_difficulty
    
    def get_next_word(self, user_id: int) -> Dict:
        """获取下一个要复习的单词"""
        from sqlalchemy.orm import Session
        from app.models import Word, WordMemory
        
        # 获取到期的单词
        now = datetime.utcnow()
        due_words = db.query(Word).join(WordMemory).filter(
            WordMemory.next_review <= now
        ).order_by(WordMemory.next_review.asc()).all()
        
        if due_words:
            return due_words[0]
        
        # 如果没有到期的，获取新单词
        new_words = db.query(Word).outerjoin(WordMemory).filter(
            WordMemory.id == None
        ).limit(10).all()
        
        if new_words:
            return new_words[0]
            
        # 如果没有新单词，随机选择一个
        return db.query(Word).order_by(func.random()).first()

```

#### 2.2 API接口设计

**新增API端点**:

```python
# backend/app/routes.py

@app.route('/api/words/next', methods=['GET'])
def get_next_word():
    """获取下一个要复习的单词"""
    try:
        fsrs_service = FSRSService()
        next_word = fsrs_service.get_next_word(current_user.id)
        
        if not next_word:
            return jsonify({'error': 'No words available'}), 404
            
        return jsonify({
            'word': next_word.word,
            'meaning': next_word.meaning,
            'phonetic': next_word.phonetic,
            'example_sentence': next_word.example_sentence,
            'audio_url': next_word.audio_url
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/words/<int:word_id>/review', methods=['POST'])
def review_word(word_id):
    """记录单词复习结果"""
    try:
        data = request.get_json()
        rating = data.get('rating')  # 1-4分
        
        if not rating or rating not in [1, 2, 3, 4]:
            return jsonify({'error': 'Invalid rating'}), 400
            
        word_memory = WordMemory.query.filter_by(word_id=word_id).first()
        if not word_memory:
            word_memory = WordMemory(word_id=word_id)
            db.session.add(word_memory)
            
        fsrs_service = FSRSService()
        
        # 更新记忆状态
        new_stability, new_difficulty = fsrs_service.update_memory_state(
            word_memory.stability or 0.0,
            word_memory.difficulty or 0.0,
            rating
        )
        
        word_memory.stability = new_stability
        word_memory.difficulty = new_difficulty
        word_memory.last_review = datetime.utcnow()
        word_memory.next_review = datetime.utcnow() + timedelta(
            days=fsrs_service.calculate_intervals(new_stability, new_difficulty)
        )
        word_memory.review_count += 1
        word_memory.total_reviews += 1
        
        if rating >= 3:
            word_memory.consecutive_correct += 1
        else:
            word_memory.consecutive_correct = 0
            
        db.session.commit()
        
        return jsonify({
            'success': True,
            'next_review': word_memory.next_review.isoformat(),
            'stability': new_stability,
            'difficulty': new_difficulty
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

```

### 阶段三：前端集成（2天）

#### 3.1 前端API集成

**frontend/src/services/fsrsService.js**:
```javascript
import axios from 'axios';

class FSRSService {
  async getNextWord() {
    try {
      const response = await axios.get('/api/words/next');
      return response.data;
    } catch (error) {
      console.error('Error getting next word:', error);
      throw error;
    }
  }

  async reviewWord(wordId, rating) {
    try {
      const response = await axios.post(`/api/words/${wordId}/review`, {
        rating
      });
      return response.data;
    } catch (error) {
      console.error('Error reviewing word:', error);
      throw error;
    }
  }

  async getReviewStats() {
    try {
      const response = await axios.get('/api/review-stats');
      return response.data;
    } catch (error) {
      console.error('Error getting review stats:', error);
      throw error;
    }
  }
}

export default new FSRSService();
```

#### 3.2 前端UI组件更新

**frontend/src/components/WordPractice.js**:
```javascript
import React, { useState, useEffect } from 'react';
import FSRSService from '../services/fsrsService';

const WordPractice = () => {
  const [currentWord, setCurrentWord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [reviewStats, setReviewStats] = useState(null);

  useEffect(() => {
    loadNextWord();
    loadReviewStats();
  }, []);

  const loadNextWord = async () => {
    setLoading(true);
    try {
      const word = await FSRSService.getNextWord();
      setCurrentWord(word);
      setShowResult(false);
    } catch (error) {
      console.error('Failed to load next word:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (rating) => {
    if (!currentWord) return;

    try {
      const result = await FSRSService.reviewWord(currentWord.id, rating);
      setReviewStats(result);
      
      // 显示复习结果
      setShowResult(true);
      
      // 2秒后加载下一个单词
      setTimeout(() => {
        loadNextWord();
      }, 2000);
      
    } catch (error) {
      console.error('Failed to review word:', error);
    }
  };

  const loadReviewStats = async () => {
    try {
      const stats = await FSRSService.getReviewStats();
      setReviewStats(stats);
    } catch (error) {
      console.error('Failed to load review stats:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">加载中...</div>;
  }

  if (!currentWord) {
    return <div className="text-center py-8">没有可用的单词</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* 复习统计 */}
      {reviewStats && (
        <div className="mb-6 bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">复习统计</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {reviewStats.due_today}
              </div>
              <div className="text-sm text-gray-600">今日到期</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {reviewStats.completed_today}
              </div>
              <div className="text-sm text-gray-600">今日完成</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {reviewStats.streak}
              </div>
              <div className="text-sm text-gray-600">连续天数</div>
            </div>
          </div>
        </div>
      )}

      {/* 单词卡片 */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">{currentWord.word}</h2>
          <p className="text-xl text-gray-600 mb-2">{currentWord.phonetic}</p>
          <p className="text-lg text-gray-800 mb-4">{currentWord.meaning}</p>
          
          {currentWord.example_sentence && (
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-gray-700 italic">{currentWord.example_sentence}</p>
            </div>
          )}
        </div>
      </div>

      {/* 复习按钮 */}
      {!showResult && (
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => handleReview(1)}
            className="bg-red-500 text-white py-3 px-4 rounded hover:bg-red-600"
          >
            完全忘记
          </button>
          <button
            onClick={() => handleReview(2)}
            className="bg-orange-500 text-white py-3 px-4 rounded hover:bg-orange-600"
          >
            有点困难
          </button>
          <button
            onClick={() => handleReview(3)}
            className="bg-yellow-500 text-white py-3 px-4 rounded hover:bg-yellow-600"
          >
            记得清楚
          </button>
          <button
            onClick={() => handleReview(4)}
            className="bg-green-500 text-white py-3 px-4 rounded hover:bg-green-600"
          >
            完全记住
          </button>
        </div>
      )}

      {showResult && (
        <div className="text-center">
          <div className="text-green-600 text-lg mb-4">复习记录已保存！</div>
          <button
            onClick={loadNextWord}
            className="bg-blue-500 text-white py-2 px-6 rounded hover:bg-blue-600"
          >
            下一个单词
          </button>
        </div>
      )}
    </div>
  );
};

export default WordPractice;
```

### 阶段四：测试与优化（1-2天）

#### 4.1 测试用例

**测试文件：backend/tests/test_fsrs.py**:
```python
import pytest
from datetime import datetime, timedelta
from app.fsrs_service import FSRSService

class TestFSRSService:
    
    def test_initial_review(self):
        """测试首次复习"""
        service = FSRSService()
        stability, difficulty = service.update_memory_state(0.0, 0.0, 4)
        
        assert stability > 0
        assert difficulty > 0
        
    def test_forgetting_review(self):
        """测试遗忘后的复习"""
        service = FSRSService()
        stability, difficulty = service.update_memory_state(1.0, 3.0, 1)
        
        assert stability == service.w[0]  # 重置为初始值
        assert difficulty > 3.0  # 难度增加
        
    def test_interval_calculation(self):
        """测试间隔计算"""
        service = FSRSService()
        interval = service.calculate_intervals(1.0, 3.0)
        
        assert interval > 0
        assert isinstance(interval, float)

```

#### 4.2 性能优化

**数据库优化**：
- 为next_review字段添加索引
- 使用批量查询减少数据库访问
- 实现缓存机制减少重复计算

**前端优化**：
- 实现单词预加载
- 添加离线模式支持
- 优化响应速度

## 部署计划

### 第1天：环境准备
- [ ] 更新数据库模型
- [ ] 运行数据库迁移
- [ ] 部署FSRS服务代码

### 第2-3天：功能测试
- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 用户验收测试

### 第4天：灰度发布
- [ ] 小范围用户测试
- [ ] 收集用户反馈
- [ ] 性能监控

### 第5天：全量发布
- [ ] 正式环境部署
- [ ] 监控运行状态
- [ ] 用户通知

## 监控与维护

### 关键指标监控
- 复习完成率
- 记忆保持率
- 用户满意度
- 系统响应时间

### 定期优化
- 每月分析用户数据
- 调整FSRS参数
- 优化算法性能

## 风险评估与应对

### 技术风险
- **数据迁移失败**：准备回滚方案
- **性能问题**：提前进行压力测试
- **兼容性问题**：多环境测试

### 用户体验风险
- **学习曲线**：提供用户引导
- **习惯改变**：渐进式更新
- **反馈收集**：建立反馈渠道

## 预期效果

### 学习效果提升
- 记忆保持率提升30-50%
- 复习时间减少20-30%
- 长期记忆效果显著改善

### 用户体验改善
- 更智能的复习安排
- 个性化学习体验
- 减少重复和无效复习

通过实施FSRS算法，我们将为用户提供更科学、高效的单词学习体验，显著提升学习效果和用户满意度。