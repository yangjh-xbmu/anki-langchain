import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminLayout from '../../components/layout/AdminLayout';
import PermissionGuard from '../../components/auth/PermissionGuard';

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
}

interface WordStats {
  totalWords: number;
  wordsAddedToday: number;
  wordsAddedThisWeek: number;
  wordsAddedThisMonth: number;
  averageWordsPerUser: number;
}

interface SystemStats {
  totalLogins: number;
  loginsToday: number;
  averageSessionDuration: number;
  errorRate: number;
  uptime: number;
}

interface ChartData {
  date: string;
  users: number;
  words: number;
  logins: number;
}

const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [wordStats, setWordStats] = useState<WordStats | null>(null);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('users');

  // 模拟数据
  useEffect(() => {
    const mockUserStats: UserStats = {
      totalUsers: 1250,
      activeUsers: 890,
      newUsersToday: 15,
      newUsersThisWeek: 87,
      newUsersThisMonth: 342
    };

    const mockWordStats: WordStats = {
      totalWords: 15420,
      wordsAddedToday: 234,
      wordsAddedThisWeek: 1567,
      wordsAddedThisMonth: 6789,
      averageWordsPerUser: 12.3
    };

    const mockSystemStats: SystemStats = {
      totalLogins: 5678,
      loginsToday: 123,
      averageSessionDuration: 25.5,
      errorRate: 0.02,
      uptime: 99.8
    };

    const mockChartData: ChartData[] = [
      { date: '2024-01-09', users: 45, words: 567, logins: 123 },
      { date: '2024-01-10', users: 52, words: 634, logins: 145 },
      { date: '2024-01-11', users: 38, words: 489, logins: 98 },
      { date: '2024-01-12', users: 67, words: 723, logins: 167 },
      { date: '2024-01-13', users: 43, words: 556, logins: 134 },
      { date: '2024-01-14', users: 59, words: 678, logins: 156 },
      { date: '2024-01-15', users: 71, words: 789, logins: 189 }
    ];

    setTimeout(() => {
      setUserStats(mockUserStats);
      setWordStats(mockWordStats);
      setSystemStats(mockSystemStats);
      setChartData(mockChartData);
      setLoading(false);
    }, 1000);
  }, []);

  const getMetricData = () => {
    switch (selectedMetric) {
      case 'users':
        return chartData.map(d => ({ date: d.date, value: d.users }));
      case 'words':
        return chartData.map(d => ({ date: d.date, value: d.words }));
      case 'logins':
        return chartData.map(d => ({ date: d.date, value: d.logins }));
      default:
        return [];
    }
  };

  const getMetricLabel = () => {
    switch (selectedMetric) {
      case 'users': return '新用户数';
      case 'words': return '新增单词数';
      case 'logins': return '登录次数';
      default: return '';
    }
  };

  const exportData = () => {
    const data = {
      userStats,
      wordStats,
      systemStats,
      chartData,
      exportTime: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `analytics_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </AdminLayout>
    );
  }

  const metricData = getMetricData();
  const maxValue = Math.max(...metricData.map(d => d.value));

  return (
    <PermissionGuard requiredPermissions={['analytics:read']}>
      <AdminLayout>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">数据分析</h1>
            <button 
              onClick={exportData}
              className="btn btn-outline"
            >
              导出数据
            </button>
          </div>

          {/* 用户统计 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">用户统计</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-title">总用户数</div>
                <div className="stat-value text-primary">{userStats?.totalUsers}</div>
                <div className="stat-desc">注册用户总数</div>
              </div>
              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-title">活跃用户</div>
                <div className="stat-value text-secondary">{userStats?.activeUsers}</div>
                <div className="stat-desc">近30天活跃</div>
              </div>
              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-title">今日新增</div>
                <div className="stat-value text-accent">{userStats?.newUsersToday}</div>
                <div className="stat-desc">新注册用户</div>
              </div>
              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-title">本周新增</div>
                <div className="stat-value text-info">{userStats?.newUsersThisWeek}</div>
                <div className="stat-desc">过去7天</div>
              </div>
              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-title">本月新增</div>
                <div className="stat-value text-success">{userStats?.newUsersThisMonth}</div>
                <div className="stat-desc">过去30天</div>
              </div>
            </div>
          </div>

          {/* 单词统计 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">单词统计</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-title">总单词数</div>
                <div className="stat-value text-primary">{wordStats?.totalWords}</div>
                <div className="stat-desc">词库总量</div>
              </div>
              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-title">今日新增</div>
                <div className="stat-value text-secondary">{wordStats?.wordsAddedToday}</div>
                <div className="stat-desc">新增单词</div>
              </div>
              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-title">本周新增</div>
                <div className="stat-value text-accent">{wordStats?.wordsAddedThisWeek}</div>
                <div className="stat-desc">过去7天</div>
              </div>
              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-title">本月新增</div>
                <div className="stat-value text-info">{wordStats?.wordsAddedThisMonth}</div>
                <div className="stat-desc">过去30天</div>
              </div>
              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-title">人均单词</div>
                <div className="stat-value text-success">{wordStats?.averageWordsPerUser}</div>
                <div className="stat-desc">平均每用户</div>
              </div>
            </div>
          </div>

          {/* 系统统计 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">系统统计</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-title">总登录次数</div>
                <div className="stat-value text-primary">{systemStats?.totalLogins}</div>
                <div className="stat-desc">累计登录</div>
              </div>
              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-title">今日登录</div>
                <div className="stat-value text-secondary">{systemStats?.loginsToday}</div>
                <div className="stat-desc">今日活跃</div>
              </div>
              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-title">平均会话</div>
                <div className="stat-value text-accent">{systemStats?.averageSessionDuration}min</div>
                <div className="stat-desc">会话时长</div>
              </div>
              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-title">错误率</div>
                <div className="stat-value text-warning">{(systemStats?.errorRate || 0) * 100}%</div>
                <div className="stat-desc">系统错误率</div>
              </div>
              <div className="stat bg-base-200 rounded-lg">
                <div className="stat-title">系统正常运行</div>
                <div className="stat-value text-success">{systemStats?.uptime}%</div>
                <div className="stat-desc">运行时间</div>
              </div>
            </div>
          </div>

          {/* 趋势图表 */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">趋势分析</h2>
              <div className="flex gap-2">
                <select
                  className="select select-bordered select-sm"
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                >
                  <option value="users">新用户数</option>
                  <option value="words">新增单词数</option>
                  <option value="logins">登录次数</option>
                </select>
                <select
                  className="select select-bordered select-sm"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                >
                  <option value="7d">过去7天</option>
                  <option value="30d">过去30天</option>
                  <option value="90d">过去90天</option>
                </select>
              </div>
            </div>
            
            <div className="bg-base-200 rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">{getMetricLabel()}趋势</h3>
              <div className="h-64 flex items-end justify-between gap-2">
                {metricData.map((item, index) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div 
                      className="bg-primary rounded-t w-full transition-all duration-300 hover:bg-primary-focus"
                      style={{ 
                        height: `${(item.value / maxValue) * 200}px`,
                        minHeight: '4px'
                      }}
                      title={`${item.date}: ${item.value}`}
                    ></div>
                    <div className="text-xs mt-2 text-center">
                      {new Date(item.date).toLocaleDateString('zh-CN', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="text-xs font-semibold">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 实时监控 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">实时监控</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card bg-base-200">
                <div className="card-body">
                  <h3 className="card-title text-success">系统状态</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
                    <span>正常运行</span>
                  </div>
                  <div className="text-sm text-gray-500">最后检查: 刚刚</div>
                </div>
              </div>
              
              <div className="card bg-base-200">
                <div className="card-body">
                  <h3 className="card-title text-info">在线用户</h3>
                  <div className="text-2xl font-bold">156</div>
                  <div className="text-sm text-gray-500">当前在线</div>
                </div>
              </div>
              
              <div className="card bg-base-200">
                <div className="card-body">
                  <h3 className="card-title text-warning">服务器负载</h3>
                  <div className="text-2xl font-bold">23%</div>
                  <div className="text-sm text-gray-500">CPU使用率</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </PermissionGuard>
  );
};

export default AnalyticsPage;