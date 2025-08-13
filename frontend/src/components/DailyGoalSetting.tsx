import React, { useState, useEffect } from 'react';

interface DailyGoalSettingProps {
  userId?: string;
  onGoalUpdate?: (goal: number) => void;
}

interface UserProfile {
  user_id: string;
  learning_style: string;
  difficulty_preference: string;
  daily_goal: number;
  motivation_level: number;
  attention_span: number;
  peak_performance_time: string;
}

interface DailyRecommendation {
  recommended_words: number;
  session_duration: number;
  difficulty_level: string;
  break_intervals: number[];
  motivation_message: string;
  psychological_tips: string[];
}

const DailyGoalSetting: React.FC<DailyGoalSettingProps> = ({ 
  userId = 'default_user', 
  onGoalUpdate 
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recommendation, setRecommendation] = useState<DailyRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserProfile();
    fetchDailyRecommendation();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`/api/recommendation/profile/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('获取用户画像失败:', error);
    }
  };

  const fetchDailyRecommendation = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/recommendation/daily-goal?user_id=${userId}`
      );
      if (response.ok) {
        const data = await response.json();
        setRecommendation(data);
      } else {
        setError('获取推荐失败');
      }
    } catch (error) {
      console.error('获取每日推荐失败:', error);
      setError('网络错误');
    } finally {
      setIsLoading(false);
    }
  };

  const updateDailyGoal = async (newGoal: number) => {
    try {
      const response = await fetch('/api/recommendation/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          daily_goal: newGoal,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        onGoalUpdate?.(newGoal);
        // 重新获取推荐
        fetchDailyRecommendation();
      }
    } catch (error) {
      console.error('更新目标失败:', error);
      setError('更新失败');
    }
  };

  const updatePreference = async (key: string, value: string | number) => {
    try {
      const response = await fetch('/api/recommendation/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          [key]: value,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        fetchDailyRecommendation();
      }
    } catch (error) {
      console.error('更新偏好失败:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="daily-goal-setting loading">
        <div className="spinner">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="daily-goal-setting error">
        <p>错误: {error}</p>
        <button onClick={fetchDailyRecommendation}>重试</button>
      </div>
    );
  }

  return (
    <div className="daily-goal-setting">
      <div className="goal-header">
        <h3>📚 每日学习目标</h3>
        {recommendation && (
          <div className="motivation-message">
            <p>💡 {recommendation.motivation_message}</p>
          </div>
        )}
      </div>

      {profile && (
        <div className="goal-content">
          <div className="current-goal">
            <label>当前目标: {profile.daily_goal} 个单词</label>
            <div className="goal-controls">
              <button 
                onClick={() => updateDailyGoal(Math.max(5, profile.daily_goal - 5))}
                disabled={profile.daily_goal <= 5}
              >
                -5
              </button>
              <span className="goal-value">{profile.daily_goal}</span>
              <button 
                onClick={() => updateDailyGoal(Math.min(100, profile.daily_goal + 5))}
                disabled={profile.daily_goal >= 100}
              >
                +5
              </button>
            </div>
          </div>

          {recommendation && (
            <div className="recommendation-details">
              <div className="rec-item">
                <span className="label">🎯 推荐练习量:</span>
                <span className="value">{recommendation.recommended_words} 个单词</span>
              </div>
              <div className="rec-item">
                <span className="label">⏱️ 建议时长:</span>
                <span className="value">{recommendation.session_duration} 分钟</span>
              </div>
              <div className="rec-item">
                <span className="label">📊 难度级别:</span>
                <span className="value">
                  {recommendation.difficulty_level === 'easy' ? '简单' :
                   recommendation.difficulty_level === 'medium' ? '中等' : '困难'}
                </span>
              </div>
            </div>
          )}

          <div className="preferences">
            <h4>学习偏好设置</h4>
            
            <div className="pref-item">
              <label>学习风格:</label>
              <select 
                value={profile.learning_style} 
                onChange={(e) => updatePreference('learning_style', e.target.value)}
              >
                <option value="visual">视觉型</option>
                <option value="auditory">听觉型</option>
                <option value="kinesthetic">动觉型</option>
                <option value="balanced">平衡型</option>
              </select>
            </div>

            <div className="pref-item">
              <label>难度偏好:</label>
              <select 
                value={profile.difficulty_preference} 
                onChange={(e) => updatePreference('difficulty_preference', e.target.value)}
              >
                <option value="easy">简单</option>
                <option value="medium">中等</option>
                <option value="hard">困难</option>
                <option value="adaptive">自适应</option>
              </select>
            </div>

            <div className="pref-item">
              <label>最佳学习时间:</label>
              <select 
                value={profile.peak_performance_time} 
                onChange={(e) => updatePreference('peak_performance_time', e.target.value)}
              >
                <option value="morning">上午</option>
                <option value="afternoon">下午</option>
                <option value="evening">晚上</option>
                <option value="night">深夜</option>
              </select>
            </div>

            <div className="pref-item">
              <label>专注时长 (分钟):</label>
              <input 
                type="range" 
                min="10" 
                max="60" 
                value={profile.attention_span} 
                onChange={(e) => updatePreference('attention_span', parseInt(e.target.value))}
              />
              <span>{profile.attention_span} 分钟</span>
            </div>
          </div>

          {recommendation && recommendation.psychological_tips && (
            <div className="psychological-tips">
              <h4>💪 心理建议</h4>
              <ul>
                {recommendation.psychological_tips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .daily-goal-setting {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          margin-bottom: 20px;
        }

        .goal-header h3 {
          margin: 0 0 10px 0;
          color: #333;
          font-size: 1.2em;
        }

        .motivation-message {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 15px;
        }

        .motivation-message p {
          margin: 0;
          font-size: 0.9em;
        }

        .current-goal {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .goal-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .goal-controls button {
          width: 35px;
          height: 35px;
          border: none;
          border-radius: 50%;
          background: #007bff;
          color: white;
          cursor: pointer;
          font-weight: bold;
        }

        .goal-controls button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .goal-value {
          font-weight: bold;
          font-size: 1.1em;
          min-width: 30px;
          text-align: center;
        }

        .recommendation-details {
          background: #e8f5e8;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .rec-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .rec-item:last-child {
          margin-bottom: 0;
        }

        .label {
          font-weight: 500;
        }

        .value {
          font-weight: bold;
          color: #28a745;
        }

        .preferences {
          border-top: 1px solid #eee;
          padding-top: 20px;
        }

        .preferences h4 {
          margin: 0 0 15px 0;
          color: #555;
        }

        .pref-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .pref-item label {
          font-weight: 500;
          min-width: 100px;
        }

        .pref-item select,
        .pref-item input {
          padding: 5px 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 0.9em;
        }

        .psychological-tips {
          background: #fff3cd;
          padding: 15px;
          border-radius: 8px;
          margin-top: 20px;
        }

        .psychological-tips h4 {
          margin: 0 0 10px 0;
          color: #856404;
        }

        .psychological-tips ul {
          margin: 0;
          padding-left: 20px;
        }

        .psychological-tips li {
          margin-bottom: 5px;
          color: #856404;
        }

        .loading, .error {
          text-align: center;
          padding: 40px;
        }

        .spinner {
          font-size: 1.1em;
          color: #666;
        }

        .error button {
          margin-top: 10px;
          padding: 8px 16px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default DailyGoalSetting;