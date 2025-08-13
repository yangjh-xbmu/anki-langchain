/**
 * FSRS算法前端服务
 * 提供与后端FSRS API的交互接口
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class FSRSService {
  /**
   * 获取下一个待复习的单词
   * @returns {Promise<Object>} 单词对象
   */
  static async getNextWord() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/words/next`);
      return response.data;
    } catch (error) {
      console.error('获取下一个单词失败:', error);
      throw new Error('无法获取下一个单词');
    }
  }

  /**
   * 提交单词复习结果
   * @param {number} wordId - 单词ID
   * @param {number} rating - 复习评分 (1-4)
   * @param {number} timeSpent - 花费时间（秒）
   * @returns {Promise<Object>} 更新后的记忆状态
   */
  static async submitReview(wordId, rating, timeSpent = 0) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/words/${wordId}/review`, {
        rating,
        time_spent: timeSpent
      });
      return response.data;
    } catch (error) {
      console.error('提交复习结果失败:', error);
      throw new Error('无法提交复习结果');
    }
  }

  /**
   * 获取复习统计信息
   * @returns {Promise<Object>} 统计信息
   */
  static async getReviewStats() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/review-stats`);
      return response.data;
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
      const response = await axios.get(`${API_BASE_URL}/api/words/due`);
      return response.data;
    } catch (error) {
      console.error('获取待复习单词失败:', error);
      throw new Error('无法获取待复习单词');
    }
  }

  /**
   * 重置单词记忆状态
   * @param {number} wordId - 单词ID
   * @returns {Promise<Object>} 重置后的记忆状态
   */
  static async resetWordMemory(wordId) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/words/${wordId}/reset-memory`);
      return response.data;
    } catch (error) {
      console.error('重置记忆状态失败:', error);
      throw new Error('无法重置记忆状态');
    }
  }

  /**
   * 批量获取单词记忆状态
   * @param {Array<number>} wordIds - 单词ID列表
   * @returns {Promise<Object>} 记忆状态映射
   */
  static async getWordsMemoryStatus(wordIds) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/words/memory-status`, {
        word_ids: wordIds
      });
      return response.data;
    } catch (error) {
      console.error('获取记忆状态失败:', error);
      throw new Error('无法获取记忆状态');
    }
  }

  /**
   * 获取不同难度的单词分布
   * @returns {Promise<Object>} 难度分布统计
   */
  static async getDifficultyDistribution() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/words/difficulty-distribution`);
      return response.data;
    } catch (error) {
      console.error('获取难度分布失败:', error);
      throw new Error('无法获取难度分布');
    }
  }

  /**
   * 获取学习进度
   * @returns {Promise<Object>} 学习进度信息
   */
  static async getLearningProgress() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/learning-progress`);
      return response.data;
    } catch (error) {
      console.error('获取学习进度失败:', error);
      throw new Error('无法获取学习进度');
    }
  }

  /**
   * 批量提交复习结果（用于离线同步）
   * @param {Array<Object>} reviews - 复习结果数组
   * @returns {Promise<Object>} 同步结果
   */
  static async batchSubmitReviews(reviews) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/reviews/batch`, {
        reviews
      });
      return response.data;
    } catch (error) {
      console.error('批量提交复习结果失败:', error);
      throw new Error('无法批量提交复习结果');
    }
  }

  /**
   * 错误处理工具函数
   * @param {Error} error - 错误对象
   * @returns {string} 用户友好的错误消息
   */
  static getErrorMessage(error) {
    if (error.response) {
      // 服务器返回的错误
      return error.response.data.error || '服务器错误';
    } else if (error.request) {
      // 请求发送失败
      return '网络连接失败，请检查网络';
    } else {
      // 其他错误
      return '发生未知错误';
    }
  }

  /**
   * 检查服务是否可用
   * @returns {Promise<boolean>} 服务状态
   */
  static async checkServiceHealth() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/health`);
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

export default FSRSService;