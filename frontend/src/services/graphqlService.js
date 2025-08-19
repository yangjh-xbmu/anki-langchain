/**
 * GraphQL服务
 * 使用Apollo Client与后端GraphQL API交互
 * 替代原有的REST API调用
 */

import client from './apolloClient';
import {
  GET_ALL_WORDS,
  GET_DUE_WORDS,
  GET_WORD_BY_ID,
  GET_WORD_MEMORY,
  GET_LEARNING_STATS,
  GET_USER_LEARNING_PROFILE,
  GET_DAILY_RECOMMENDATION,
  CREATE_WORD,
  UPDATE_WORD,
  SUBMIT_PRACTICE_SESSION,
  UPDATE_USER_PROFILE,
  RECORD_LEARNING_SESSION,
  RESET_WORD_MEMORY,
} from './graphqlQueries';

class GraphQLService {
  /**
   * 获取下一个待复习的单词
   * @returns {Promise<Object>} 单词对象
   */
  static async getNextWord() {
    try {
      const { data } = await client.query({
        query: GET_DUE_WORDS,
        fetchPolicy: 'cache-first',
      });
      
      // 返回第一个待复习的单词
      return data.dueWords && data.dueWords.length > 0 
        ? data.dueWords[0] 
        : null;
    } catch (error) {
      console.error('获取下一个单词失败:', error);
      throw new Error('无法获取下一个单词');
    }
  }

  /**
   * 提交单词复习结果
   * @param {string} wordId - 单词ID
   * @param {number} rating - 复习评分 (1-4)
   * @param {number} timeSpent - 花费时间（秒）
   * @returns {Promise<Object>} 更新后的记忆状态
   */
  static async submitReview(wordId, rating, timeSpent = 0) {
    try {
      const { data } = await client.mutate({
        mutation: SUBMIT_PRACTICE_SESSION,
        variables: {
          sessionData: {
            wordId,
            rating,
            timeSpent,
          },
        },
      });
      
      if (!data.submitPracticeSession.success) {
        throw new Error(data.submitPracticeSession.message);
      }
      
      return data.submitPracticeSession.session;
    } catch (error) {
      console.error('提交复习结果失败:', error);
      throw new Error('无法提交复习结果');
    }
  }

  /**
   * 获取复习统计信息
   * @param {string} userId - 用户ID
   * @param {Date} startDate - 开始日期
   * @param {Date} endDate - 结束日期
   * @returns {Promise<Object>} 统计信息
   */
  static async getReviewStats(userId = 'default', startDate = undefined, endDate = undefined) {
    try {
      const { data } = await client.query({
        query: GET_LEARNING_STATS,
        variables: {
          userId,
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
        },
        fetchPolicy: 'cache-first',
      });
      
      return data.learningStats;
    } catch (error) {
      console.error('获取复习统计失败:', error);
      throw new Error('无法获取复习统计');
    }
  }

  /**
   * 获取所有待复习的单词
   * @returns {Promise<Array>} 待复习单词列表
   */
  static async getDueWords() {
    try {
      const { data } = await client.query({
        query: GET_DUE_WORDS,
        fetchPolicy: 'cache-first',
      });
      
      return data.dueWords || [];
    } catch (error) {
      console.error('获取待复习单词失败:', error);
      throw new Error('无法获取待复习单词');
    }
  }

  /**
   * 重置单词记忆状态
   * @param {string} wordId - 单词ID
   * @returns {Promise<Object>} 重置后的记忆状态
   */
  static async resetWordMemory(wordId) {
    try {
      const { data } = await client.mutate({
        mutation: RESET_WORD_MEMORY,
        variables: { wordId },
      });
      
      if (!data.resetWordMemory.success) {
        throw new Error(data.resetWordMemory.message);
      }
      
      return data.resetWordMemory.wordMemory;
    } catch (error) {
      console.error('重置记忆状态失败:', error);
      throw new Error('无法重置记忆状态');
    }
  }

  /**
   * 批量获取单词记忆状态
   * @param {Array<string>} wordIds - 单词ID列表
   * @returns {Promise<Object>} 记忆状态映射
   */
  static async getWordsMemoryStatus(wordIds) {
    try {
      const promises = wordIds.map(wordId => 
        client.query({
          query: GET_WORD_MEMORY,
          variables: { wordId },
          fetchPolicy: 'cache-first',
        })
      );
      
      const results = await Promise.all(promises);
      const memoryStatus = {};
      
      results.forEach((result, index) => {
        const wordId = wordIds[index];
        memoryStatus[wordId] = result.data.wordMemory;
      });
      
      return memoryStatus;
    } catch (error) {
      console.error('获取记忆状态失败:', error);
      throw new Error('无法获取记忆状态');
    }
  }

  /**
   * 获取难度分布统计
   * @returns {Promise<Object>} 难度分布数据
   */
  static async getDifficultyDistribution() {
    try {
      const { data } = await client.query({
        query: GET_ALL_WORDS,
        fetchPolicy: 'cache-first',
      });
      
      // 计算难度分布
      const distribution = { easy: 0, medium: 0, hard: 0 };
      data.allWords.forEach(word => {
        if (word.difficulty <= 0.3) distribution.easy++;
        else if (word.difficulty <= 0.7) distribution.medium++;
        else distribution.hard++;
      });
      
      return distribution;
    } catch (error) {
      console.error('获取难度分布失败:', error);
      throw new Error('无法获取难度分布');
    }
  }

  /**
   * 获取学习进度
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 学习进度数据
   */
  static async getLearningProgress(userId = 'default') {
    try {
      const { data } = await client.query({
        query: GET_USER_LEARNING_PROFILE,
        variables: { userId },
        fetchPolicy: 'cache-first',
      });
      
      return data.userLearningProfile;
    } catch (error) {
      console.error('获取学习进度失败:', error);
      throw new Error('无法获取学习进度');
    }
  }

  /**
   * 批量提交复习结果
   * @param {Array} reviews - 复习结果数组
   * @returns {Promise<Array>} 提交结果
   */
  static async batchSubmitReviews(reviews) {
    try {
      const promises = reviews.map(review => 
        client.mutate({
          mutation: SUBMIT_PRACTICE_SESSION,
          variables: {
            sessionData: {
              wordId: review.wordId,
              rating: review.rating,
              timeSpent: review.timeSpent || 0,
            },
          },
        })
      );
      
      const results = await Promise.all(promises);
      return results.map(result => result.data.submitPracticeSession);
    } catch (error) {
      console.error('批量提交复习失败:', error);
      throw new Error('无法批量提交复习结果');
    }
  }

  /**
   * 获取错误信息
   * @param {Error} error - 错误对象
   * @returns {string} 用户友好的错误信息
   */
  static getErrorMessage(error) {
    // 检查是否为Apollo错误
    if (error && typeof error === 'object') {
      // 使用类型断言处理Apollo错误
      const apolloError = error;
      if (apolloError.networkError) {
        return '网络连接失败，请检查网络设置';
      }
      
      if (apolloError.graphQLErrors && Array.isArray(apolloError.graphQLErrors) && apolloError.graphQLErrors.length > 0) {
        return apolloError.graphQLErrors[0].message;
      }
    }
    
    return error?.message || '发生未知错误';
  }

  /**
   * 检查服务健康状态
   * @returns {Promise<boolean>} 服务是否正常
   */
  static async checkServiceHealth() {
    try {
      await client.query({
        query: GET_DUE_WORDS,
        fetchPolicy: 'network-only',
      });
      return true;
    } catch (error) {
      console.error('服务健康检查失败:', error);
      return false;
    }
  }

  /**
   * 创建新单词
   * @param {Object} wordData - 单词数据
   * @returns {Promise<Object>} 创建结果
   */
  static async createWord(wordData) {
    try {
      const { data } = await client.mutate({
        mutation: CREATE_WORD,
        variables: { wordData },
      });
      
      if (!data.createWord.success) {
        throw new Error(data.createWord.message);
      }
      
      return data.createWord.word;
    } catch (error) {
      console.error('创建单词失败:', error);
      throw new Error('无法创建单词');
    }
  }

  /**
   * 更新单词信息
   * @param {string} wordId - 单词ID
   * @param {Object} wordData - 更新数据
   * @returns {Promise<Object>} 更新结果
   */
  static async updateWord(wordId, wordData) {
    try {
      const { data } = await client.mutate({
        mutation: UPDATE_WORD,
        variables: { wordId, wordData },
      });
      
      if (!data.updateWord.success) {
        throw new Error(data.updateWord.message);
      }
      
      return data.updateWord.word;
    } catch (error) {
      console.error('更新单词失败:', error);
      throw new Error('无法更新单词');
    }
  }

  /**
   * 记录学习会话
   * @param {Object} sessionData - 会话数据
   * @returns {Promise<Object>} 记录结果
   */
  static async recordLearningSession(sessionData) {
    try {
      const { data } = await client.mutate({
        mutation: RECORD_LEARNING_SESSION,
        variables: { sessionData },
      });
      
      if (!data.recordLearningSession.success) {
        throw new Error(data.recordLearningSession.message);
      }
      
      return data.recordLearningSession.session;
    } catch (error) {
      console.error('记录学习会话失败:', error);
      throw new Error('无法记录学习会话');
    }
  }
}

export default GraphQLService;