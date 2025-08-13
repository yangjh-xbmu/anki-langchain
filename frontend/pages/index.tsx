import { EyeSlashIcon, PhotoIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import CelebrationEffect from '../src/components/CelebrationEffect';
import Link from 'next/link';

interface Word {
  id: string;
  word: string;
  meaning: string;
  image_url?: string;
  audio_url?: string;
  phonetic?: string;
  etymology?: string;
  exam_frequency?: number;
  star_level?: number;
  example_sentence?: string;
  example_translation?: string;
  related_words?: string;
  deck_name?: string;
  anki_card_id?: number;
}

interface TypingStats {
  correct: number;
  total: number;
  streak: number;
}

export default function Home() {
  const [words, setWords] = useState<Word[]>([]);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [showImage, setShowImage] = useState(true);
  const [typingStats, setTypingStats] = useState<TypingStats>({
    correct: 0,
    total: 0,
    streak: 0
  });
  const [userInteracted, setUserInteracted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationEnabled, setCelebrationEnabled] = useState(true); // 祝贺动画开关
  const [soundEnabled, setSoundEnabled] = useState(true); // 音效开关
  
  // 输入框引用，用于自动聚焦
  const inputRef = useRef<HTMLInputElement>(null);
  // 提交按钮引用，用于粒子效果定位
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  const fetchWords = async () => {
    try {
      const response = await axios.get("/api/words");
      setWords(response.data);
      setWordCount(response.data.length);
      if (response.data.length > 0) {
        setCurrentWord(response.data[Math.floor(Math.random() * response.data.length)]);
      }
    } catch (error) {
      console.error("获取单词失败:", error);
    }
  };

  const syncAnkiWords = async () => {
    setSyncStatus("正在同步 Anki 单词...");
    try {
      const response = await axios.post("/api/sync-anki");
      setSyncStatus(`同步完成！获取了 ${response.data.count} 个单词`);
      await fetchWords();
      setTimeout(() => setSyncStatus(""), 3000);
    } catch (error) {
      setSyncStatus("同步失败，请检查 Anki 是否运行并启用了 AnkiConnect");
      setTimeout(() => setSyncStatus(""), 5000);
    }
  };

  const submitAnswer = async () => {
    if (!currentWord || !userAnswer.trim()) return;

    // 标记用户已交互
    if (!userInteracted) {
      setUserInteracted(true);
    }

    setIsLoading(true);
    try {
      const response = await axios.post("/api/check-answer", {
        word_id: currentWord.id,
        user_answer: userAnswer.trim(),
        answer_type: "spelling"
      });

      const isCorrect = response.data.is_correct;
      setTypingStats(prev => ({
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
        streak: isCorrect ? prev.streak + 1 : 0
      }));

      if (isCorrect) {
        setFeedback("✅ 正确！");
        // 触发祝贺动画（如果启用）
        if (celebrationEnabled) {
          setShowCelebration(true);
        }
      } else {
        setFeedback(`❌ 错误。正确答案是: ${currentWord.word}`);
      }

      setTimeout(() => {
        setFeedback("");
        setUserAnswer("");
        nextWord();
        // 重新聚焦到输入框
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }, 2000);
    } catch (error) {
      console.error("提交答案失败:", error);
      setFeedback("提交失败，请重试");
      setTimeout(() => setFeedback(""), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const nextWord = () => {
    if (words.length > 0) {
      // 标记用户已交互
      if (!userInteracted) {
        setUserInteracted(true);
      }
      
      const nextIndex = Math.floor(Math.random() * words.length);
      setCurrentWord(words[nextIndex]);
      // 切换单词后聚焦到输入框
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  };

  const playAudio = async (audioUrl: string) => {
    try {
      const audio = new Audio(audioUrl);
      // 设置音频属性
      audio.preload = 'auto';
      audio.volume = 0.8;
      
      // 尝试播放音频
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        await playPromise;
        console.log("音频播放成功:", audioUrl);
      }
    } catch (error) {
      console.error("播放音频失败:", error);
      // 如果是自动播放被阻止，提示用户
      if (error.name === 'NotAllowedError') {
        console.warn("浏览器阻止了自动播放，请点击播放按钮手动播放音频");
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading && userAnswer.trim() && !feedback) {
      submitAnswer();
    }
  };

  useEffect(() => {
    fetchWords();
  }, []);

  // 自动播放音频功能
  useEffect(() => {
    if (currentWord?.audio_url) {
      const timer = setTimeout(() => {
        playAudio(currentWord.audio_url!);
      }, 1000); // 延迟1秒播放
      
      return () => clearTimeout(timer);
    }
  }, [currentWord]);

  // 自动聚焦到输入框
  useEffect(() => {
    if (currentWord && inputRef.current) {
      // 延迟聚焦，确保DOM已更新
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        // 尝试关闭输入法（在支持的浏览器中）
        if (inputRef.current) {
          inputRef.current.blur();
          inputRef.current.focus();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [currentWord]);

  useEffect(() => {
    const handleGlobalKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        nextWord();
      } else if (e.key.toLowerCase() === "p" && e.shiftKey && currentWord?.audio_url) {
        if (!userInteracted) {
          setUserInteracted(true);
        }
        playAudio(currentWord.audio_url);
      } else if (e.key.toLowerCase() === "i") {
        setShowImage(!showImage);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyPress);
    return () => window.removeEventListener("keydown", handleGlobalKeyPress);
  }, [currentWord, showImage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50" data-theme="light">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* 简洁的标题区域 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            提升打字速度，强化单词记忆
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
        </div>

        {/* 统计信息 */}
        {typingStats.total > 0 && (
          <div className="flex justify-center gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-4 text-center min-w-[120px]">
              <div className="text-2xl mb-1">🎯</div>
              <div className="text-2xl font-bold text-blue-600">
                {Math.round((typingStats.correct / typingStats.total) * 100)}%
              </div>
              <div className="text-sm text-gray-500">正确率</div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-4 text-center min-w-[120px]">
              <div className="text-2xl mb-1">🔥</div>
              <div className="text-2xl font-bold text-orange-500">{typingStats.streak}</div>
              <div className="text-sm text-gray-500">连击</div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-4 text-center min-w-[120px]">
              <div className="text-2xl mb-1">📚</div>
              <div className="text-2xl font-bold text-purple-600">{typingStats.total}</div>
              <div className="text-sm text-gray-500">总计</div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-4 text-center min-w-[120px]">
              <div className="text-2xl mb-1">✅</div>
              <div className="text-2xl font-bold text-green-600">{typingStats.correct}</div>
              <div className="text-sm text-gray-500">正确</div>
            </div>
          </div>
        )}

        {/* 快速导航 */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            🚀 快速导航
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/learning-center">
              <div className="bg-white hover:bg-gray-50 rounded-xl p-4 border border-gray-200 transition-all duration-200 cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">学习中心</h3>
                    <p className="text-sm text-gray-600">查看学习进度和智能推荐</p>
                  </div>
                </div>
              </div>
            </Link>
            <Link href="/settings">
              <div className="bg-white hover:bg-gray-50 rounded-xl p-4 border border-gray-200 transition-all duration-200 cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 group-hover:text-purple-600 transition-colors">个人设置</h3>
                    <p className="text-sm text-gray-600">个性化配置和偏好设置</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* 状态信息 */}
        {syncStatus && (
          <div className="alert alert-info mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>{syncStatus}</span>
          </div>
        )}

        {/* 练习区域 - 左右分栏布局 */}
        {currentWord ? (
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-8">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 min-h-[600px]">
                {/* 左侧：图片和词义显示区域 */}
                <div className="flex flex-col justify-start items-center space-y-6 overflow-y-auto max-h-[600px] py-4">
                  {/* 单词图片 */}
                  {showImage && currentWord.image_url && (
                    <div className="relative flex-shrink-0">
                      <div className="w-80 h-80 rounded-3xl overflow-hidden shadow-lg">
                        <img
                          src={currentWord.image_url}
                          alt={currentWord.word}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                      {/* 音频播放按钮 */}
                      {currentWord.audio_url && (
                        <button
                          onClick={() => {
                            if (!userInteracted) {
                              setUserInteracted(true);
                            }
                            playAudio(currentWord.audio_url!);
                          }}
                          className="absolute -bottom-4 -right-4 w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg transition-all duration-200 flex items-center justify-center"
                          title="播放发音"
                        >
                          <SpeakerWaveIcon className="h-6 w-6" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* 单词含义显示 */}
                  <div className="text-center flex-shrink-0">
                    <div className="bg-gray-50 px-8 py-4 rounded-2xl">
                      <div className="text-3xl font-semibold text-gray-700">
                        {currentWord.meaning}
                      </div>
                    </div>
                  </div>

                  {/* 如果没有图片，显示音频播放按钮 */}
                  {(!showImage || !currentWord.image_url) && currentWord.audio_url && (
                    <button
                      onClick={() => {
                        if (!userInteracted) {
                          setUserInteracted(true);
                        }
                        playAudio(currentWord.audio_url!);
                      }}
                      className="w-16 h-16 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg transition-all duration-200 flex items-center justify-center flex-shrink-0"
                      title="播放发音"
                    >
                      <SpeakerWaveIcon className="h-8 w-8" />
                    </button>
                  )}
                </div>

                {/* 右侧：输入和交互区域 - 固定在中央 */}
                <div className="flex flex-col justify-center space-y-8 h-[600px]">
                  {/* 输入区域 */}
                  <div className="space-y-6">
                    <div>
                      <input
                        ref={inputRef}
                        type="text"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="在这里输入英文单词..."
                        className="w-full px-6 py-4 text-2xl text-center border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:outline-none transition-all duration-200"
                        disabled={feedback !== "" || isLoading}
                        autoFocus
                        inputMode="text"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck="false"
                      />
                    </div>
                    
                    <div className="text-center">
                      <button
                        ref={submitButtonRef}
                        onClick={submitAnswer}
                        disabled={!userAnswer.trim() || feedback !== "" || isLoading}
                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-12 py-4 rounded-2xl font-medium transition-all duration-200 flex items-center gap-3 mx-auto text-lg"
                      >
                        {isLoading ? (
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <span>✨</span>
                        )}
                        <span>提交答案</span>
                      </button>
                    </div>
                  </div>

                  {/* 反馈信息 */}
                  {feedback && (
                    <div className={`p-6 rounded-2xl text-center font-medium text-lg ${
                      feedback.includes('✅') 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {feedback}
                    </div>
                  )}
                </div>
              </div>

              {/* 调试信息 */}
              <details className="mt-6 bg-gray-50 rounded-2xl border border-gray-200">
                <summary className="p-4 cursor-pointer text-gray-600 font-medium hover:bg-gray-100 rounded-2xl transition-colors">
                  🔍 单词详细信息
                </summary>
                <div className="p-4 pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div><span className="font-semibold text-gray-700">单词:</span> <span className="text-gray-600">{currentWord.word}</span></div>
                      <div><span className="font-semibold text-gray-700">音标:</span> <span className="text-gray-600">{currentWord.phonetic || 'N/A'}</span></div>
                      <div><span className="font-semibold text-gray-700">含义:</span> <span className="text-gray-600">{currentWord.meaning || 'N/A'}</span></div>
                      <div><span className="font-semibold text-gray-700">牌组:</span> <span className="text-gray-600">{currentWord.deck_name || 'N/A'}</span></div>
                      <div><span className="font-semibold text-gray-700">Anki ID:</span> <span className="text-gray-600">{currentWord.anki_card_id || 'N/A'}</span></div>
                    </div>
                    <div className="space-y-2">
                      <div><span className="font-semibold text-gray-700">词源:</span> <span className="text-gray-600">{currentWord.etymology || 'N/A'}</span></div>
                      <div><span className="font-semibold text-gray-700">考试频率:</span> <span className="text-gray-600">{currentWord.exam_frequency || 'N/A'}</span></div>
                      <div><span className="font-semibold text-gray-700">星级:</span> <span className="text-gray-600">{currentWord.star_level || 'N/A'}</span></div>
                      <div><span className="font-semibold text-gray-700">例句:</span> <span className="text-gray-600">{currentWord.example_sentence || 'N/A'}</span></div>
                      <div><span className="font-semibold text-gray-700">例句翻译:</span> <span className="text-gray-600">{currentWord.example_translation || 'N/A'}</span></div>
                    </div>
                  </div>
                </div>
              </details>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">加载单词中...</p>
          </div>
        )}

        {/* 快捷键提示 */}
        <div className="mt-12">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-center text-lg font-semibold text-gray-700 mb-6">⌨️ 快捷键</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2 justify-center">
                <kbd className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-mono">Enter</kbd>
                <span className="text-gray-600">提交答案</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <kbd className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-mono">Shift+P</kbd>
                <span className="text-gray-600">播放发音</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <kbd className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-mono">Esc</kbd>
                <span className="text-gray-600">跳过单词</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <kbd className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-mono">I</kbd>
                <span className="text-gray-600">切换图片</span>
              </div>
            </div>
          </div>
        </div>

        {/* 词库统计信息 */}
        {wordCount > 0 && (
          <div className="mt-8 text-center">
            <div className="inline-block bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-3">
              <div className="flex items-center gap-2 text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-sm font-medium">词库共有 {wordCount} 个单词</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 祝贺动画效果 */}
      {showCelebration && (
        <CelebrationEffect
          isVisible={showCelebration}
          onComplete={() => setShowCelebration(false)}
          playSound={soundEnabled}
          reducedMotion={!celebrationEnabled}
          buttonRef={submitButtonRef}
        />
      )}
    </div>
  );
}
