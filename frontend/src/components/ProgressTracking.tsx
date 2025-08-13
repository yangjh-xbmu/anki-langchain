import React, { useState, useEffect } from 'react';

interface ProgressTrackingProps {
  userId?: string;
}

interface LearningSession {
  id: number;
  session_type: string;
  words_practiced: number;
  correct_answers: number;
  session_duration: number;
  difficulty_level: string;
  engagement_score: number;
  fatigue_level: number;
  created_at: string;
}

interface ProgressStats {
  today_progress: {
    words_practiced: number;
    correct_rate: number;
    time_spent: number;
    sessions_completed: number;
  };
  weekly_progress: {
    total_words: number;
    average_accuracy: number;
    total_time: number;
    streak_days: number;
  };
  learning_insights: {
    best_performance_time: string;
    preferred_difficulty: string;
    learning_pattern: string;
    motivation_trend: string;
  };
}

const ProgressTracking: React.FC<ProgressTrackingProps> = ({ 
  userId = 'default_user' 
}) => {
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'insights'>('today');

  useEffect(() => {
    fetchProgressData();
  }, [userId]);

  const fetchProgressData = async () => {
    setIsLoading(true);
    try {
      // 模拟获取进度数据 - 实际应该从API获取
      const mockStats: ProgressStats = {
        today_progress: {
          words_practiced: 15,
          correct_rate: 0.85,
          time_spent: 25,
          sessions_completed: 2
        },
        weekly_progress: {
          total_words: 120,
          average_accuracy: 0.82,
          total_time: 180,
          streak_days: 5
        },
        learning_insights: {
          best_performance_time: 'morning',
          preferred_difficulty: 'medium',
          learning_pattern: 'consistent',
          motivation_trend: 'increasing'
        }
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('获取进度数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const recordSession = async (sessionData: Partial<LearningSession>) => {
    try {
      const response = await fetch('/api/recommendation/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          ...sessionData,
        }),
      });

      if (response.ok) {
        // 重新获取进度数据
        fetchProgressData();
      }
    } catch (error) {
      console.error('记录学习会话失败:', error);
    }
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getProgressPercentage = (current: number, target: number): number => {
    return Math.min(100, (current / target) * 100);
  };

  const getMotivationColor = (trend: string): string => {
    switch (trend) {
      case 'increasing': return '#28a745';
      case 'stable': return '#ffc107';
      case 'decreasing': return '#dc3545';
      default: return '#6c757d';
    }
  };

  if (isLoading) {
    return (
      <div className="progress-tracking loading">
        <div className="spinner">加载进度数据...</div>
      </div>
    );
  }

  return (
    <div className="progress-tracking">
      <div className="progress-header">
        <h3>📊 学习进度追踪</h3>
        <div className="tab-navigation">
          <button 
            className={activeTab === 'today' ? 'active' : ''}
            onClick={() => setActiveTab('today')}
          >
            今日
          </button>
          <button 
            className={activeTab === 'week' ? 'active' : ''}
            onClick={() => setActiveTab('week')}
          >
            本周
          </button>
          <button 
            className={activeTab === 'insights' ? 'active' : ''}
            onClick={() => setActiveTab('insights')}
          >
            洞察
          </button>
        </div>
      </div>

      {stats && (
        <div className="progress-content">
          {activeTab === 'today' && (
            <div className="today-progress">
              <div className="progress-grid">
                <div className="progress-card">
                  <div className="card-header">
                    <span className="icon">📚</span>
                    <span className="title">练习单词</span>
                  </div>
                  <div className="card-content">
                    <div className="main-number">{stats.today_progress.words_practiced}</div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${getProgressPercentage(stats.today_progress.words_practiced, 20)}%` }}
                      ></div>
                    </div>
                    <div className="sub-text">目标: 20 个</div>
                  </div>
                </div>

                <div className="progress-card">
                  <div className="card-header">
                    <span className="icon">🎯</span>
                    <span className="title">正确率</span>
                  </div>
                  <div className="card-content">
                    <div className="main-number">{Math.round(stats.today_progress.correct_rate * 100)}%</div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill accuracy"
                        style={{ width: `${stats.today_progress.correct_rate * 100}%` }}
                      ></div>
                    </div>
                    <div className="sub-text">表现优秀!</div>
                  </div>
                </div>

                <div className="progress-card">
                  <div className="card-header">
                    <span className="icon">⏱️</span>
                    <span className="title">学习时长</span>
                  </div>
                  <div className="card-content">
                    <div className="main-number">{formatTime(stats.today_progress.time_spent)}</div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill time"
                        style={{ width: `${getProgressPercentage(stats.today_progress.time_spent, 30)}%` }}
                      ></div>
                    </div>
                    <div className="sub-text">目标: 30分钟</div>
                  </div>
                </div>

                <div className="progress-card">
                  <div className="card-header">
                    <span className="icon">🔥</span>
                    <span className="title">学习次数</span>
                  </div>
                  <div className="card-content">
                    <div className="main-number">{stats.today_progress.sessions_completed}</div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill sessions"
                        style={{ width: `${getProgressPercentage(stats.today_progress.sessions_completed, 3)}%` }}
                      ></div>
                    </div>
                    <div className="sub-text">建议: 3次</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'week' && (
            <div className="week-progress">
              <div className="week-summary">
                <div className="summary-item">
                  <span className="label">📈 本周总词汇量</span>
                  <span className="value">{stats.weekly_progress.total_words} 个</span>
                </div>
                <div className="summary-item">
                  <span className="label">🎯 平均准确率</span>
                  <span className="value">{Math.round(stats.weekly_progress.average_accuracy * 100)}%</span>
                </div>
                <div className="summary-item">
                  <span className="label">⏰ 总学习时长</span>
                  <span className="value">{formatTime(stats.weekly_progress.total_time)}</span>
                </div>
                <div className="summary-item">
                  <span className="label">🔥 连续学习天数</span>
                  <span className="value streak">{stats.weekly_progress.streak_days} 天</span>
                </div>
              </div>

              <div className="week-chart">
                <h4>本周学习趋势</h4>
                <div className="chart-placeholder">
                  <div className="chart-bars">
                    {[12, 18, 15, 22, 20, 16, 15].map((value, index) => (
                      <div key={index} className="chart-bar">
                        <div 
                          className="bar-fill"
                          style={{ height: `${(value / 25) * 100}%` }}
                        ></div>
                        <div className="bar-label">
                          {['周一', '周二', '周三', '周四', '周五', '周六', '周日'][index]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="learning-insights">
              <div className="insight-grid">
                <div className="insight-card">
                  <div className="insight-header">
                    <span className="icon">🌅</span>
                    <span className="title">最佳学习时间</span>
                  </div>
                  <div className="insight-content">
                    <div className="insight-value">
                      {stats.learning_insights.best_performance_time === 'morning' ? '上午' :
                       stats.learning_insights.best_performance_time === 'afternoon' ? '下午' :
                       stats.learning_insights.best_performance_time === 'evening' ? '晚上' : '深夜'}
                    </div>
                    <div className="insight-desc">您在这个时间段表现最佳</div>
                  </div>
                </div>

                <div className="insight-card">
                  <div className="insight-header">
                    <span className="icon">📊</span>
                    <span className="title">偏好难度</span>
                  </div>
                  <div className="insight-content">
                    <div className="insight-value">
                      {stats.learning_insights.preferred_difficulty === 'easy' ? '简单' :
                       stats.learning_insights.preferred_difficulty === 'medium' ? '中等' : '困难'}
                    </div>
                    <div className="insight-desc">最适合您的难度级别</div>
                  </div>
                </div>

                <div className="insight-card">
                  <div className="insight-header">
                    <span className="icon">📈</span>
                    <span className="title">学习模式</span>
                  </div>
                  <div className="insight-content">
                    <div className="insight-value">
                      {stats.learning_insights.learning_pattern === 'consistent' ? '稳定型' :
                       stats.learning_insights.learning_pattern === 'intensive' ? '集中型' : '分散型'}
                    </div>
                    <div className="insight-desc">您的学习习惯特征</div>
                  </div>
                </div>

                <div className="insight-card">
                  <div className="insight-header">
                    <span className="icon">💪</span>
                    <span className="title">动机趋势</span>
                  </div>
                  <div className="insight-content">
                    <div 
                      className="insight-value"
                      style={{ color: getMotivationColor(stats.learning_insights.motivation_trend) }}
                    >
                      {stats.learning_insights.motivation_trend === 'increasing' ? '上升' :
                       stats.learning_insights.motivation_trend === 'stable' ? '稳定' : '下降'}
                    </div>
                    <div className="insight-desc">学习动机变化趋势</div>
                  </div>
                </div>
              </div>

              <div className="recommendations">
                <h4>💡 个性化建议</h4>
                <ul>
                  <li>根据您的最佳学习时间，建议在上午安排重点学习</li>
                  <li>保持当前的中等难度设置，有助于稳定进步</li>
                  <li>您的学习模式很稳定，继续保持这种节奏</li>
                  <li>动机呈上升趋势，可以适当增加学习目标</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .progress-tracking {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          margin-bottom: 20px;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .progress-header h3 {
          margin: 0;
          color: #333;
          font-size: 1.2em;
        }

        .tab-navigation {
          display: flex;
          gap: 5px;
        }

        .tab-navigation button {
          padding: 8px 16px;
          border: none;
          background: #f8f9fa;
          color: #666;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab-navigation button.active {
          background: #007bff;
          color: white;
        }

        .progress-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .progress-card {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 15px;
          border-left: 4px solid #007bff;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }

        .card-header .icon {
          font-size: 1.2em;
        }

        .card-header .title {
          font-weight: 500;
          color: #555;
        }

        .main-number {
          font-size: 2em;
          font-weight: bold;
          color: #333;
          margin-bottom: 8px;
        }

        .progress-bar {
          width: 100%;
          height: 6px;
          background: #e9ecef;
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 5px;
        }

        .progress-fill {
          height: 100%;
          background: #007bff;
          transition: width 0.3s ease;
        }

        .progress-fill.accuracy {
          background: #28a745;
        }

        .progress-fill.time {
          background: #ffc107;
        }

        .progress-fill.sessions {
          background: #dc3545;
        }

        .sub-text {
          font-size: 0.8em;
          color: #666;
        }

        .week-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 25px;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 6px;
        }

        .summary-item .label {
          font-weight: 500;
          color: #555;
        }

        .summary-item .value {
          font-weight: bold;
          color: #333;
        }

        .summary-item .value.streak {
          color: #dc3545;
        }

        .week-chart {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
        }

        .week-chart h4 {
          margin: 0 0 15px 0;
          color: #555;
        }

        .chart-bars {
          display: flex;
          justify-content: space-between;
          align-items: end;
          height: 150px;
          gap: 10px;
        }

        .chart-bar {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
        }

        .bar-fill {
          width: 100%;
          background: linear-gradient(to top, #007bff, #66b3ff);
          border-radius: 4px 4px 0 0;
          min-height: 10px;
          transition: height 0.3s ease;
        }

        .bar-label {
          margin-top: 8px;
          font-size: 0.8em;
          color: #666;
        }

        .insight-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 25px;
        }

        .insight-card {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 8px;
          padding: 15px;
          text-align: center;
        }

        .insight-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 10px;
        }

        .insight-header .icon {
          font-size: 1.5em;
        }

        .insight-header .title {
          font-weight: 500;
          color: #555;
        }

        .insight-value {
          font-size: 1.5em;
          font-weight: bold;
          color: #333;
          margin-bottom: 5px;
        }

        .insight-desc {
          font-size: 0.8em;
          color: #666;
        }

        .recommendations {
          background: #e8f5e8;
          padding: 20px;
          border-radius: 8px;
        }

        .recommendations h4 {
          margin: 0 0 15px 0;
          color: #155724;
        }

        .recommendations ul {
          margin: 0;
          padding-left: 20px;
        }

        .recommendations li {
          margin-bottom: 8px;
          color: #155724;
          line-height: 1.4;
        }

        .loading {
          text-align: center;
          padding: 40px;
        }

        .spinner {
          font-size: 1.1em;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default ProgressTracking;