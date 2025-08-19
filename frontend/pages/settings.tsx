import React, { useState } from 'react';
import { EyeSlashIcon, PhotoIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import UserPreferences from '../src/components/UserPreferences';
import Link from 'next/link';
import axios from 'axios';

export default function Settings() {
  const [showImage, setShowImage] = useState(true);
  const [celebrationEnabled, setCelebrationEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [syncStatus, setSyncStatus] = useState("");

  const syncAnkiWords = async () => {
    setSyncStatus("正在同步 Anki 单词...");
    try {
      const response = await axios.post("/api/sync-anki");
      setSyncStatus(`同步完成！获取了 ${response.data.count} 个单词`);
      setTimeout(() => setSyncStatus(""), 3000);
    } catch (error) {
      setSyncStatus("同步失败，请检查 Anki 是否运行并启用了 AnkiConnect");
      setTimeout(() => setSyncStatus(""), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50" data-theme="light">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* 页面标题和导航 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              ⚙️ 个人设置
            </h1>
            <p className="text-gray-600">个性化配置你的学习体验</p>
          </div>
          <div className="flex gap-3">
            <Link href="/">
              <button className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl shadow-sm border border-gray-200 transition-all duration-200 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-sm font-medium">返回练习</span>
              </button>
            </Link>
            <Link href="/learning-center">
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl shadow-sm transition-all duration-200 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-sm font-medium">学习中心</span>
              </button>
            </Link>
          </div>
        </div>

        {/* 同步状态信息 */}
        {syncStatus && (
          <div className="alert alert-info mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>{syncStatus}</span>
          </div>
        )}

        {/* 用户偏好设置 */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            👤 个人偏好
          </h2>
          <UserPreferences />
        </div>

        {/* 学习控制设置 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            🎮 学习控制
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 图片显示控制 */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {showImage ? (
                    <PhotoIcon className="h-6 w-6 text-blue-600" />
                  ) : (
                    <EyeSlashIcon className="h-6 w-6 text-gray-400" />
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-800">图片显示</h3>
                    <p className="text-sm text-gray-600">控制单词图片的显示</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowImage(!showImage)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    showImage
                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  {showImage ? '显示中' : '已隐藏'}
                </button>
              </div>
            </div>

            {/* 祝贺动画控制 */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{celebrationEnabled ? '🎉' : '🚫'}</div>
                  <div>
                    <h3 className="font-semibold text-gray-800">祝贺动画</h3>
                    <p className="text-sm text-gray-600">答对时的庆祝效果</p>
                  </div>
                </div>
                <button
                  onClick={() => setCelebrationEnabled(!celebrationEnabled)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    celebrationEnabled
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  {celebrationEnabled ? '开启中' : '已关闭'}
                </button>
              </div>
            </div>

            {/* 音效控制 */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {soundEnabled ? (
                    <SpeakerWaveIcon className="h-6 w-6 text-green-600" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-800">音效设置</h3>
                    <p className="text-sm text-gray-600">控制音频播放功能</p>
                  </div>
                </div>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    soundEnabled
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  {soundEnabled ? '开启中' : '已关闭'}
                </button>
              </div>
            </div>

            {/* Anki 同步 */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-gray-800">Anki 同步</h3>
                    <p className="text-sm text-gray-600">从 Anki 导入单词数据</p>
                  </div>
                </div>
                <button
                  onClick={syncAnkiWords}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
                >
                  立即同步
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 快捷键说明 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            ⌨️ 快捷键说明
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2 justify-center bg-gray-50 rounded-lg p-3">
              <kbd className="px-2 py-1 bg-white text-gray-600 rounded text-xs font-mono shadow-sm">Enter</kbd>
              <span className="text-gray-600">提交答案</span>
            </div>
            <div className="flex items-center gap-2 justify-center bg-gray-50 rounded-lg p-3">
              <kbd className="px-2 py-1 bg-white text-gray-600 rounded text-xs font-mono shadow-sm">Shift+P</kbd>
              <span className="text-gray-600">播放发音</span>
            </div>
            <div className="flex items-center gap-2 justify-center bg-gray-50 rounded-lg p-3">
              <kbd className="px-2 py-1 bg-white text-gray-600 rounded text-xs font-mono shadow-sm">Esc</kbd>
              <span className="text-gray-600">跳过单词</span>
            </div>
            <div className="flex items-center gap-2 justify-center bg-gray-50 rounded-lg p-3">
              <kbd className="px-2 py-1 bg-white text-gray-600 rounded text-xs font-mono shadow-sm">I</kbd>
              <span className="text-gray-600">切换图片</span>
            </div>
          </div>
        </div>

        {/* 页面底部提示 */}
        <div className="mt-8 text-center">
          <div className="inline-block bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-3">
            <p className="text-gray-600 text-sm">
              💡 提示：设置会自动保存，你可以随时调整以获得最佳学习体验
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}