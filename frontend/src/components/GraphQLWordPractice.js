/**
 * GraphQL版本的单词练习组件
 * 使用Apollo Client与GraphQL API交互
 */

import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  GET_DUE_WORDS,
  GET_LEARNING_STATS,
  SUBMIT_PRACTICE_SESSION,
} from '../services/graphqlQueries';

function GraphQLWordPractice() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // 获取待复习单词
  const { data: dueWordsData, loading: loadingWords, refetch: refetchWords } = useQuery(GET_DUE_WORDS, {
    onError: (error) => {
      console.error('获取待复习单词失败:', error);
      setFeedback('获取单词失败，请重试');
    }
  });

  // 获取学习统计
  const { data: statsData, refetch: refetchStats } = useQuery(GET_LEARNING_STATS, {
    variables: { userId: 'default', days: 30 },
    onError: (error) => {
      console.error('获取学习统计失败:', error);
    }
  });

  // 提交练习结果
  const [submitPracticeSession, { loading: submitting }] = useMutation(SUBMIT_PRACTICE_SESSION, {
    onCompleted: () => {
      // 刷新数据
      refetchWords();
      refetchStats();
      // 移动到下一个单词
      handleNextWord();
    },
    onError: (error) => {
      console.error('提交练习结果失败:', error);
      setFeedback('提交失败，请重试');
    }
  });

  const dueWords = dueWordsData?.wordsForReview || [];
  const currentWord = dueWords[currentWordIndex];
  const stats = statsData?.learningStats ? JSON.parse(statsData.learningStats) : null;

  const handleCheckAnswer = () => {
    if (!currentWord || !userInput.trim()) return;
    
    const correct = userInput.toLowerCase().trim() === currentWord.word.toLowerCase();
    setIsCorrect(correct);
    setShowAnswer(true);
    
    if (correct) {
      setFeedback('✅ 正确！');
    } else {
      setFeedback(`❌ 错误。正确答案是: ${currentWord.word}`);
    }
  };

  const handleSubmitReview = async (rating) => {
    if (!currentWord) return;
    
    try {
      await submitPracticeSession({
        variables: {
          sessionData: {
            wordId: currentWord.id,
            rating: rating,
            timeSpent: 0,
          }
        }
      });
    } catch (error) {
      console.error('提交评分失败:', error);
    }
  };

  const handleNextWord = () => {
    if (currentWordIndex < dueWords.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
    } else {
      setCurrentWordIndex(0);
    }
    resetWordState();
  };

  const resetWordState = () => {
    setUserInput('');
    setShowAnswer(false);
    setFeedback('');
    setIsCorrect(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!showAnswer) {
      handleCheckAnswer();
    }
  };

  if (loadingWords) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
        <span className="ml-2">加载中...</span>
      </div>
    );
  }

  if (!dueWords.length) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">恭喜！</h2>
        <p className="text-gray-600">暂时没有需要复习的单词了</p>
        <button 
          onClick={() => refetchWords()}
          className="mt-4 btn btn-primary"
        >
          刷新检查
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* 统计信息 */}
      {stats && (
        <div className="bg-base-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{stats.totalWords || 0}</div>
              <div className="text-sm text-gray-600">总单词数</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-success">{stats.reviewedWords || 0}</div>
              <div className="text-sm text-gray-600">已复习</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-info">{dueWords.length}</div>
              <div className="text-sm text-gray-600">待复习</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">
                {stats.correctRate ? `${(stats.correctRate * 100).toFixed(1)}%` : '0%'}
              </div>
              <div className="text-sm text-gray-600">正确率</div>
            </div>
          </div>
        </div>
      )}

      {/* 单词练习卡片 */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="text-center mb-6">
            <div className="text-sm text-gray-500 mb-2">
              {currentWordIndex + 1} / {dueWords.length}
            </div>
            <h2 className="text-3xl font-bold mb-4">{currentWord?.definition || '加载中...'}</h2>
            
            {currentWord?.pronunciation && (
              <div className="text-lg text-gray-600 mb-2">
                [{currentWord.pronunciation}]
              </div>
            )}
            
            {currentWord?.exampleSentence && (
              <div className="text-base text-gray-700 italic">
                "{currentWord.exampleSentence}"
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="请输入英文单词..."
                className="input input-bordered input-lg text-center"
                disabled={showAnswer || submitting}
                autoFocus
              />
            </div>

            {!showAnswer && (
              <button 
                type="submit" 
                className="btn btn-primary btn-lg w-full"
                disabled={!userInput.trim() || submitting}
              >
                {submitting ? '检查中...' : '检查答案'}
              </button>
            )}
          </form>

          {feedback && (
            <div className={`alert ${isCorrect ? 'alert-success' : 'alert-error'} mt-4`}>
              <span>{feedback}</span>
            </div>
          )}

          {showAnswer && (
            <div className="mt-6">
              <div className="text-center mb-4">
                <div className="text-2xl font-bold text-primary mb-2">
                  {currentWord?.word}
                </div>
                <div className="text-gray-600">
                  {currentWord?.definition}
                </div>
              </div>

              <div className="text-center">
                <p className="mb-4 text-gray-700">这个单词对你来说有多难？</p>
                <div className="flex justify-center gap-2">
                  <button 
                    onClick={() => handleSubmitReview(1)}
                    className="btn btn-error btn-sm"
                    disabled={submitting}
                  >
                    很难 (1)
                  </button>
                  <button 
                    onClick={() => handleSubmitReview(2)}
                    className="btn btn-warning btn-sm"
                    disabled={submitting}
                  >
                    一般 (2)
                  </button>
                  <button 
                    onClick={() => handleSubmitReview(3)}
                    className="btn btn-info btn-sm"
                    disabled={submitting}
                  >
                    简单 (3)
                  </button>
                  <button 
                    onClick={() => handleSubmitReview(4)}
                    className="btn btn-success btn-sm"
                    disabled={submitting}
                  >
                    很简单 (4)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GraphQLWordPractice;