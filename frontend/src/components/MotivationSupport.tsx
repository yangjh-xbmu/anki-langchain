import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface MotivationData {
  motivation_level: number;
  stress_level: number;
  confidence_level: number;
  energy_level: number;
  focus_level: number;
  last_assessment: string;
}

interface EncouragementMessage {
  type: 'motivation' | 'achievement' | 'progress' | 'challenge';
  message: string;
  icon: string;
}

const MotivationSupport: React.FC = () => {
  const [motivationData, setMotivationData] = useState<MotivationData | null>(null);
  const [encouragement, setEncouragement] = useState<EncouragementMessage | null>(null);
  const [showAssessment, setShowAssessment] = useState(false);
  const [assessmentAnswers, setAssessmentAnswers] = useState({
    motivation: 5,
    stress: 3,
    confidence: 5,
    energy: 5,
    focus: 5
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchMotivationData();
    generateEncouragement();
  }, []);

  const fetchMotivationData = async () => {
    try {
      // 模拟API调用 - 实际应该调用后端API
      const mockData: MotivationData = {
        motivation_level: 7,
        stress_level: 4,
        confidence_level: 6,
        energy_level: 8,
        focus_level: 7,
        last_assessment: new Date().toISOString()
      };
      setMotivationData(mockData);
    } catch (error) {
      console.error('获取动机数据失败:', error);
    }
  };

  const generateEncouragement = () => {
    const messages: EncouragementMessage[] = [
      {
        type: 'motivation',
        message: '每一个单词都是通向成功的阶梯，继续加油！',
        icon: '🚀'
      },
      {
        type: 'achievement',
        message: '你的坚持让人敬佩，今天又是进步的一天！',
        icon: '🏆'
      },
      {
        type: 'progress',
        message: '学习如登山，每一步都让你更接近山顶！',
        icon: '⛰️'
      },
      {
        type: 'challenge',
        message: '挑战让我们成长，你正在变得更强大！',
        icon: '💪'
      }
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    setEncouragement(randomMessage);
  };

  const submitAssessment = async () => {
    setIsLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newData: MotivationData = {
        motivation_level: assessmentAnswers.motivation,
        stress_level: assessmentAnswers.stress,
        confidence_level: assessmentAnswers.confidence,
        energy_level: assessmentAnswers.energy,
        focus_level: assessmentAnswers.focus,
        last_assessment: new Date().toISOString()
      };
      
      setMotivationData(newData);
      setShowAssessment(false);
      generateEncouragement();
    } catch (error) {
      console.error('提交评估失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMotivationColor = (level: number) => {
    if (level >= 8) return 'text-green-600';
    if (level >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMotivationBg = (level: number) => {
    if (level >= 8) return 'bg-green-100';
    if (level >= 6) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <span className="text-2xl">🧠</span>
          心理支持系统
        </h3>
        <button
          onClick={() => setShowAssessment(!showAssessment)}
          className="text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1 rounded-lg transition-colors"
        >
          {showAssessment ? '取消评估' : '状态评估'}
        </button>
      </div>

      {/* 鼓励消息 */}
      {encouragement && (
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{encouragement.icon}</span>
            <p className="text-gray-700 font-medium">{encouragement.message}</p>
          </div>
          <button
            onClick={generateEncouragement}
            className="mt-2 text-xs text-purple-600 hover:text-purple-800 transition-colors"
          >
            换一句鼓励 →
          </button>
        </div>
      )}

      {/* 动机状态显示 */}
      {motivationData && !showAssessment && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-3 rounded-lg ${getMotivationBg(motivationData.motivation_level)}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">学习动机</span>
                <span className={`font-bold ${getMotivationColor(motivationData.motivation_level)}`}>
                  {motivationData.motivation_level}/10
                </span>
              </div>
            </div>
            <div className={`p-3 rounded-lg ${getMotivationBg(motivationData.confidence_level)}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">自信水平</span>
                <span className={`font-bold ${getMotivationColor(motivationData.confidence_level)}`}>
                  {motivationData.confidence_level}/10
                </span>
              </div>
            </div>
            <div className={`p-3 rounded-lg ${getMotivationBg(motivationData.energy_level)}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">精力状态</span>
                <span className={`font-bold ${getMotivationColor(motivationData.energy_level)}`}>
                  {motivationData.energy_level}/10
                </span>
              </div>
            </div>
            <div className={`p-3 rounded-lg ${getMotivationBg(motivationData.focus_level)}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">专注程度</span>
                <span className={`font-bold ${getMotivationColor(motivationData.focus_level)}`}>
                  {motivationData.focus_level}/10
                </span>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            上次评估: {new Date(motivationData.last_assessment).toLocaleString()}
          </div>
        </div>
      )}

      {/* 动机评估表单 */}
      {showAssessment && (
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            请根据当前感受评估以下各项（1-10分）：
          </div>
          
          {[
            { key: 'motivation', label: '学习动机', desc: '你对学习的渴望程度' },
            { key: 'stress', label: '压力水平', desc: '你感受到的学习压力' },
            { key: 'confidence', label: '自信水平', desc: '对掌握知识的信心' },
            { key: 'energy', label: '精力状态', desc: '当前的精神状态' },
            { key: 'focus', label: '专注程度', desc: '注意力集中的程度' }
          ].map(({ key, label, desc }) => (
            <div key={key} className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">
                  {label}
                </label>
                <span className="text-sm text-blue-600 font-bold">
                  {assessmentAnswers[key as keyof typeof assessmentAnswers]}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={assessmentAnswers[key as keyof typeof assessmentAnswers]}
                onChange={(e) => setAssessmentAnswers(prev => ({
                  ...prev,
                  [key]: parseInt(e.target.value)
                }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
          ))}
          
          <button
            onClick={submitAssessment}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                提交中...
              </>
            ) : (
              '提交评估'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default MotivationSupport;