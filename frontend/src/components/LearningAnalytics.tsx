import React, { useState, useEffect } from 'react';

interface LearningPattern {
  pattern_type: string;
  confidence: number;
  description: string;
  recommendations: string[];
}

interface PerformanceMetric {
  metric: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  description: string;
}

interface LearningInsight {
  category: string;
  insights: string[];
  action_items: string[];
  priority: 'high' | 'medium' | 'low';
}

interface TimeDistribution {
  hour: number;
  sessions: number;
  accuracy: number;
}

interface DifficultyAnalysis {
  level: string;
  count: number;
  accuracy: number;
  avg_time: number;
}

const LearningAnalytics: React.FC = () => {
  const [patterns, setPatterns] = useState<LearningPattern[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [insights, setInsights] = useState<LearningInsight[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [timeDistribution, setTimeDistribution] = useState<TimeDistribution[]>([]);
  const [difficultyAnalysis, setDifficultyAnalysis] = useState<DifficultyAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('patterns');

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // 获取学习模式
      const patternsResponse = await fetch('/api/analytics/learning-patterns');
      if (patternsResponse.ok) {
        const patternsData = await patternsResponse.json();
        setPatterns(patternsData.patterns || []);
        setTimeDistribution(patternsData.time_distribution || []);
        setDifficultyAnalysis(patternsData.difficulty_analysis || []);
      }

      // 获取个性化建议
      const recommendationsResponse = await fetch('/api/analytics/personalized-recommendations');
      if (recommendationsResponse.ok) {
        const recommendationsData = await recommendationsResponse.json();
        setRecommendations(recommendationsData.recommendations || []);
      }

      // 获取学习洞察
      const insightsResponse = await fetch('/api/analytics/performance-insights');
      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json();
        setInsights(insightsData.insights || []);
        setPerformanceMetrics(insightsData.performance_metrics || []);
      }
    } catch (error) {
      console.error('获取分析数据失败:', error);
      // 使用模拟数据
      setPatterns([
        {
          pattern_type: '时间偏好',
          confidence: 0.85,
          description: '您在上午9-11点学习效果最佳',
          recommendations: ['建议在上午安排重要学习任务', '避免在下午3-5点进行高强度学习']
        },
        {
          pattern_type: '学习频率',
          confidence: 0.78,
          description: '您倾向于短时间高频率的学习模式',
          recommendations: ['保持每日15-20分钟的学习习惯', '可以增加学习频次而非单次时长']
        }
      ]);
      
      setRecommendations([
        {
          type: '学习策略',
          title: '间隔重复优化',
          description: '基于您的遗忘曲线，建议调整复习间隔',
          priority: 'high'
        },
        {
          type: '难度调整',
          title: '适当增加挑战',
          description: '您的准确率较高，可以尝试更难的词汇',
          priority: 'medium'
        }
      ]);
      
      setInsights([
        {
          category: '学习效率',
          insights: ['您的学习效率在过去一周提升了15%', '错误率下降了8%'],
          action_items: ['继续保持当前学习节奏', '可以适当增加学习难度'],
          priority: 'high'
        }
      ]);
      
      setPerformanceMetrics([
        { metric: '准确率', value: 87, trend: 'up', description: '比上周提升5%' },
        { metric: '学习时长', value: 125, trend: 'up', description: '本周总计125分钟' },
        { metric: '词汇掌握', value: 234, trend: 'up', description: '已掌握234个词汇' },
        { metric: '连续天数', value: 12, trend: 'stable', description: '连续学习12天' }
      ]);
      
      setTimeDistribution([
        { hour: 8, sessions: 2, accuracy: 85 },
        { hour: 9, sessions: 5, accuracy: 92 },
        { hour: 10, sessions: 8, accuracy: 89 },
        { hour: 11, sessions: 6, accuracy: 87 },
        { hour: 14, sessions: 3, accuracy: 78 },
        { hour: 15, sessions: 2, accuracy: 75 },
        { hour: 19, sessions: 4, accuracy: 83 },
        { hour: 20, sessions: 7, accuracy: 88 }
      ]);
      
      setDifficultyAnalysis([
        { level: '简单', count: 45, accuracy: 95, avg_time: 2.3 },
        { level: '中等', count: 78, accuracy: 87, avg_time: 3.8 },
        { level: '困难', count: 32, accuracy: 72, avg_time: 5.2 },
        { level: '极难', count: 12, accuracy: 58, avg_time: 7.1 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <span className="text-green-500">↗️</span>;
      case 'down':
        return <span className="text-red-500">↘️</span>;
      default:
        return <span className="text-gray-400">➡️</span>;
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'badge badge-error';
      case 'medium':
        return 'badge badge-warning';
      case 'low':
        return 'badge badge-success';
      default:
        return 'badge badge-neutral';
    }
  };

  if (loading) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">
            📊 学习分析
          </h2>
          <div className="flex items-center justify-center h-32">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">
          🧠 智能学习分析
        </h2>
        
        <div className="tabs tabs-boxed">
          <a 
            className={`tab ${activeTab === 'patterns' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('patterns')}
          >
            学习模式
          </a>
          <a 
            className={`tab ${activeTab === 'performance' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('performance')}
          >
            表现分析
          </a>
          <a 
            className={`tab ${activeTab === 'insights' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('insights')}
          >
            学习洞察
          </a>
          <a 
            className={`tab ${activeTab === 'recommendations' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('recommendations')}
          >
            个性化建议
          </a>
        </div>

        {activeTab === 'patterns' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {patterns.map((pattern, index) => (
                <div key={index} className="card bg-base-200 shadow-sm">
                  <div className="card-body p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{pattern.pattern_type}</h3>
                      <div className="badge badge-outline">
                        {Math.round(pattern.confidence * 100)}% 置信度
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{pattern.description}</p>
                    <div className="space-y-1">
                      {pattern.recommendations.map((rec, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-green-500">✓</span>
                          <span className="text-xs">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {timeDistribution.length > 0 && (
              <div className="card bg-base-200 shadow-sm">
                <div className="card-body">
                  <h3 className="card-title text-sm">
                    🕐 时间分布分析
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>时间</th>
                          <th>学习次数</th>
                          <th>准确率</th>
                        </tr>
                      </thead>
                      <tbody>
                        {timeDistribution.map((item, index) => (
                          <tr key={index}>
                            <td>{item.hour}:00</td>
                            <td>{item.sessions}</td>
                            <td>{item.accuracy}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {performanceMetrics.map((metric, index) => (
                <div key={index} className="card bg-base-200 shadow-sm">
                  <div className="card-body p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{metric.metric}</p>
                        <p className="text-2xl font-bold">{metric.value}</p>
                        <p className="text-xs text-gray-500">{metric.description}</p>
                      </div>
                      {getTrendIcon(metric.trend)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {difficultyAnalysis.length > 0 && (
              <div className="card bg-base-200 shadow-sm">
                <div className="card-body">
                  <h3 className="card-title text-sm">
                    🎯 难度分析
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>难度等级</th>
                          <th>词汇数量</th>
                          <th>准确率</th>
                          <th>平均用时(秒)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {difficultyAnalysis.map((item, index) => (
                          <tr key={index}>
                            <td>{item.level}</td>
                            <td>{item.count}</td>
                            <td>{item.accuracy}%</td>
                            <td>{item.avg_time}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div key={index} className="card bg-base-200 shadow-sm">
                <div className="card-body">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="card-title text-sm">{insight.category}</h3>
                    <div className={getPriorityBadgeClass(insight.priority)}>
                      {insight.priority === 'high' ? '高优先级' : 
                       insight.priority === 'medium' ? '中优先级' : '低优先级'}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium mb-2">关键洞察</h4>
                      {insight.insights.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 mb-1">
                          <span className="text-blue-500">ℹ️</span>
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">行动建议</h4>
                      {insight.action_items.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 mb-1">
                          <span className="text-green-500">✓</span>
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="card bg-base-200 shadow-sm">
                <div className="card-body">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="card-title text-sm">{rec.title}</h3>
                    <div className={getPriorityBadgeClass(rec.priority)}>
                      {rec.type}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{rec.description}</p>
                </div>
              </div>
            ))}
            
            <div className="flex justify-center">
              <button 
                className="btn btn-outline btn-sm" 
                onClick={fetchAnalyticsData}
              >
                刷新分析数据
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningAnalytics;