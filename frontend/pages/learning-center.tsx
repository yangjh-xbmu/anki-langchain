import React from 'react';
import DailyGoalSetting from '../src/components/DailyGoalSetting';
import ProgressTracking from '../src/components/ProgressTracking';
import MotivationSupport from '../src/components/MotivationSupport';
import LearningAnalytics from '../src/components/LearningAnalytics';
import Link from 'next/link';

export default function LearningCenter() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50" data-theme="light">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* 页面标题和导航 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              📊 学习中心
            </h1>
            <p className="text-gray-600">智能分析你的学习进度，提供个性化建议</p>
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
            <Link href="/settings">
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl shadow-sm transition-all duration-200 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-medium">个人设置</span>
              </button>
            </Link>
          </div>
        </div>

        {/* 智能推荐系统 */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            🎯 智能推荐系统
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <DailyGoalSetting />
            <ProgressTracking />
            <MotivationSupport />
          </div>
        </div>

        {/* 高级数据分析 */}
        <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-6 border border-green-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            📈 学习分析报告
          </h2>
          <LearningAnalytics />
        </div>

        {/* 页面底部提示 */}
        <div className="mt-8 text-center">
          <div className="inline-block bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-3">
            <p className="text-gray-600 text-sm">
              💡 提示：数据分析基于你的学习历史，建议每天查看以优化学习效果
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}