import React, { useState, useEffect, useRef } from 'react';
import FSRSService from '../services/fsrsService';

function WordPractice() {
  const [currentWord, setCurrentWord] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isCorrect, setIsCorrect] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reviewStats, setReviewStats] = useState(null);
  const [dueCount, setDueCount] = useState(0);
  
  const inputRef = useRef(null);

  useEffect(() => {
    fetchReviewStats();
    fetchDueCount();
    getNextWord();
  }, []);

  const fetchReviewStats = async () => {
    try {
      const stats = await FSRSService.getReviewStats();
      setReviewStats(stats);
    } catch (error) {
      console.error('获取复习统计失败:', error);
    }
  };

  const fetchDueCount = async () => {
    try {
      const dueWords = await FSRSService.getDueWords();
      setDueCount(dueWords.length);
    } catch (error) {
      console.error('获取待复习数量失败:', error);
    }
  };

  const getNextWord = async () => {
    setIsLoading(true);
    try {
      const word = await FSRSService.getNextWord();
      setCurrentWord(word);
      setUserInput('');
      setShowAnswer(false);
      setFeedback('');
      setIsCorrect(null);
    } catch (error) {
      console.error('获取下一个单词失败:', error);
      setFeedback('获取单词失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleCheckAnswer();
  };

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

  const submitReview = async (rating) => {
    if (!currentWord) return;
    
    setIsLoading(true);
    try {
      const timeSpent = 0; // 可以后续添加计时功能
      await FSRSService.submitReview(currentWord.id, rating, timeSpent);
      
      // 更新统计
      await fetchReviewStats();
      await fetchDueCount();
      
      // 获取下一个单词
      await getNextWord();
    } catch (error) {
      console.error('提交复习结果失败:', error);
      setFeedback('提交失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && userInput.trim() && !showAnswer) {
      handleCheckAnswer();
    }
  };

  const playAudio = async (audioUrl) => {
    if (!audioUrl) return;
    
    try {
      const audio = new Audio(audioUrl);
      await audio.play();
    } catch (error) {
      console.error('播放音频失败:', error);
    }
  };

  if (!currentWord) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* 统计信息 */}
      {reviewStats && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{dueCount}</div>
              <div className="text-sm text-gray-600">待复习</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{reviewStats.total_reviews}</div>
              <div className="text-sm text-gray-600">总复习</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {reviewStats.accuracy_rate ? Math.round(reviewStats.accuracy_rate * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600">正确率</div>
            </div>
          </div>
        </div>
      )}

      {/* 单词卡片 */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
        <div className="text-center">
          {/* 音标 */}
          {currentWord.phonetic && (
            <div className="text-lg text-gray-600 mb-2">{currentWord.phonetic}</div>
          )}
          
          {/* 音频播放按钮 */}
          {currentWord.audio_url && (
            <button
              onClick={() => playAudio(currentWord.audio_url)}
              className="mb-4 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              🔊 播放发音
            </button>
          )}

          {/* 图片 */}
          {currentWord.image_url && (
            <div className="mb-4">
              <img 
                src={currentWord.image_url} 
                alt={currentWord.word}
                className="max-w-xs mx-auto rounded-lg shadow-md"
              />
            </div>
          )}

          {/* 输入框 */}
          <div className="mb-4">
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !showAnswer && handleCheckAnswer()}
              placeholder="输入单词拼写"
              disabled={isLoading || showAnswer}
              className="w-full max-w-md px-4 py-3 text-xl border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-center"
            />
          </div>

          {/* 检查按钮 */}
          {!showAnswer && (
            <button
              onClick={handleCheckAnswer}
              disabled={!userInput.trim() || isLoading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
            >
              检查答案
            </button>
          )}

          {/* 反馈信息 */}
          {feedback && (
            <div className={`mt-4 text-lg ${feedback.includes('正确') ? 'text-green-600' : 'text-red-600'}`}>
              {feedback}
            </div>
          )}

          {/* 显示答案 */}
          {showAnswer && (
            <div className="mt-6">
              <div className="text-2xl font-bold text-gray-800 mb-2">{currentWord.word}</div>
              <div className="text-lg text-gray-600 mb-4">{currentWord.meaning}</div>
              
              {/* 例句 */}
              {currentWord.example_sentence && (
                <div className="text-left bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="text-sm text-gray-600 mb-1">例句:</div>
                  <div className="text-gray-800">{currentWord.example_sentence}</div>
                  {currentWord.example_translation && (
                    <div className="text-sm text-gray-600 mt-1">
                      {currentWord.example_translation}
                    </div>
                  )}
                </div>
              )}

              {/* 复习评分按钮 */}
              <div className="flex justify-center gap-2 flex-wrap">
                <button
                  onClick={() => submitReview(1)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300 transition-colors text-sm"
                  title="完全不会"
                >
                  完全不会
                </button>
                <button
                  onClick={() => submitReview(2)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-gray-300 transition-colors text-sm"
                  title="困难"
                >
                  困难
                </button>
                <button
                  onClick={() => submitReview(3)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-gray-300 transition-colors text-sm"
                  title="一般"
                >
                  一般
                </button>
                <button
                  onClick={() => submitReview(4)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 transition-colors text-sm"
                  title="简单"
                >
                  简单
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 单词详情 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {currentWord.etymology && (
            <div>
              <div className="font-semibold text-gray-700 mb-1">词源:</div>
              <div className="text-gray-600">{currentWord.etymology}</div>
            </div>
          )}
          
          {currentWord.related_words && (
            <div>
              <div className="font-semibold text-gray-700 mb-1">相关词汇:</div>
              <div className="text-gray-600">{currentWord.related_words}</div>
            </div>
          )}
          
          {currentWord.exam_frequency && (
            <div>
              <div className="font-semibold text-gray-700 mb-1">考试频率:</div>
              <div className="text-gray-600">{currentWord.exam_frequency}</div>
            </div>
          )}
          
          {currentWord.star_level && (
            <div>
              <div className="font-semibold text-gray-700 mb-1">难度等级:</div>
              <div className="text-gray-600">{currentWord.star_level}星</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WordPractice;