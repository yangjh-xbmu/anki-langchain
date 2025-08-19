/**
 * GraphQL查询和变更定义
 * 包含所有与后端GraphQL API交互的查询和变更操作
 */

import { gql } from '@apollo/client';

// ========== 查询定义 ==========

/**
 * 获取所有单词
 */
export const GET_ALL_WORDS = gql`
  query GetAllWords($limit: Int, $offset: Int) {
    allWords(limit: $limit, offset: $offset) {
      id
      ankiCardId
      word
      definition
      pronunciation
      exampleSentence
      difficulty
      createdAt
      updatedAt
      wordMemory {
        id
        stability
        difficulty
        lastReview
        nextReview
        consecutiveCorrect
        totalReviews
      }
    }
  }
`;

/**
 * 获取待复习单词
 */
export const GET_DUE_WORDS = gql`
  query GetDueWords {
    wordsForReview {
      id
      wordId
      stability
      difficulty
      lastReview
      nextReview
      consecutiveCorrect
      totalReviews
    }
  }
`;

/**
 * 获取单个单词详情
 */
export const GET_WORD_BY_ID = gql`
  query GetWordById($wordId: String!) {
    wordById(wordId: $wordId) {
      id
      ankiCardId
      word
      definition
      pronunciation
      exampleSentence
      difficulty
      createdAt
      updatedAt
      wordMemory {
        id
        stability
        difficulty
        lastReview
        nextReview
        consecutiveCorrect
        totalReviews
      }
    }
  }
`;

/**
 * 获取单词记忆状态
 */
export const GET_WORD_MEMORY = gql`
  query GetWordMemory($wordId: String!) {
    wordMemory(wordId: $wordId) {
      id
      wordId
      stability
      difficulty
      lastReview
      nextReview
      consecutiveCorrect
      totalReviews
    }
  }
`;

/**
 * 获取学习统计
 */
export const GET_LEARNING_STATS = gql`
  query GetLearningStats($userId: String!, $days: Int) {
    learningStats(userId: $userId, days: $days)
  }
`;

/**
 * 获取用户学习档案
 */
export const GET_USER_LEARNING_PROFILE = gql`
  query GetUserLearningProfile($userId: String!) {
    userLearningProfile(userId: $userId) {
      id
      userId
      totalWords
      masteredWords
      currentStreak
      longestStreak
      averageAccuracy
      totalStudyTime
      preferredDifficulty
      dailyGoal
      createdAt
      updatedAt
    }
  }
`;

/**
 * 获取每日推荐
 */
export const GET_DAILY_RECOMMENDATION = gql`
  query GetDailyRecommendation($userId: String!, $date: Date) {
    dailyRecommendation(userId: $userId, date: $date) {
      id
      userId
      date
      recommendedWords
      targetAccuracy
      estimatedTime
      createdAt
    }
  }
`;

// ========== 变更定义 ==========

/**
 * 创建新单词
 */
export const CREATE_WORD = gql`
  mutation CreateWord($wordData: WordInput!) {
    createWord(wordData: $wordData) {
      success
      message
      word {
        id
        ankiCardId
        word
        definition
        pronunciation
        exampleSentence
        difficulty
      }
    }
  }
`;

/**
 * 更新单词信息
 */
export const UPDATE_WORD = gql`
  mutation UpdateWord($wordId: String!, $wordData: WordInput!) {
    updateWord(wordId: $wordId, wordData: $wordData) {
      success
      message
      word {
        id
        ankiCardId
        word
        definition
        pronunciation
        exampleSentence
        difficulty
        updatedAt
      }
    }
  }
`;

/**
 * 提交练习会话
 */
export const SUBMIT_PRACTICE_SESSION = gql`
  mutation SubmitPracticeSession($sessionData: PracticeSessionInput!) {
    submitPracticeSession(sessionData: $sessionData) {
      success
      message
      session {
        id
        wordId
        rating
        timeSpent
        createdAt
      }
    }
  }
`;

/**
 * 更新用户档案
 */
export const UPDATE_USER_PROFILE = gql`
  mutation UpdateUserProfile($profileData: UserLearningProfileInput!) {
    updateUserProfile(profileData: $profileData) {
      success
      message
      profile {
        id
        userId
        totalWords
        masteredWords
        currentStreak
        averageAccuracy
        dailyGoal
        updatedAt
      }
    }
  }
`;

/**
 * 记录学习会话
 */
export const RECORD_LEARNING_SESSION = gql`
  mutation RecordLearningSession($sessionData: LearningSessionInput!) {
    recordLearningSession(sessionData: $sessionData) {
      success
      message
      session {
        id
        userId
        startTime
        endTime
        totalWords
        correctWords
        accuracyRate
        durationMinutes
      }
    }
  }
`;

/**
 * 重置单词记忆
 */
export const RESET_WORD_MEMORY = gql`
  mutation ResetWordMemory($wordId: String!) {
    resetWordMemory(wordId: $wordId) {
      success
      message
      wordMemory {
        id
        wordId
        stability
        difficulty
        lastReview
        nextReview
        consecutiveCorrect
        totalReviews
      }
    }
  }
`;