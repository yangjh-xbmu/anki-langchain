import React, { useState, useEffect } from 'react';

interface UserPreference {
  id: string;
  category: string;
  name: string;
  value: any;
  type: 'number' | 'boolean' | 'select' | 'range';
  options?: string[];
  min?: number;
  max?: number;
  description: string;
}

interface LearningGoal {
  id: string;
  title: string;
  target_value: number;
  current_value: number;
  unit: string;
  deadline: string;
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'completed' | 'paused';
}

const UserPreferences: React.FC = () => {
  const [preferences, setPreferences] = useState<UserPreference[]>([]);
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('preferences');
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    target_value: 0,
    unit: '个',
    deadline: '',
    priority: 'medium' as 'high' | 'medium' | 'low'
  });

  useEffect(() => {
    fetchUserPreferences();
  }, []);

  const fetchUserPreferences = async () => {
    try {
      setLoading(true);
      
      // 获取用户偏好设置
      const preferencesResponse = await fetch('/api/user/preferences');
      if (preferencesResponse.ok) {
        const preferencesData = await preferencesResponse.json();
        setPreferences(preferencesData.preferences || []);
      }

      // 获取学习目标
      const goalsResponse = await fetch('/api/user/learning-goals');
      if (goalsResponse.ok) {
        const goalsData = await goalsResponse.json();
        setGoals(goalsData.goals || []);
      }
    } catch (error) {
      console.error('获取用户偏好失败:', error);
      // 使用模拟数据
      setPreferences([
        {
          id: 'daily_target',
          category: '学习目标',
          name: '每日学习目标',
          value: 20,
          type: 'range',
          min: 5,
          max: 100,
          description: '每天计划学习的单词数量'
        },
        {
          id: 'difficulty_level',
          category: '学习设置',
          name: '难度等级',
          value: '中等',
          type: 'select',
          options: ['简单', '中等', '困难', '混合'],
          description: '选择适合的学习难度'
        },
        {
          id: 'auto_play_audio',
          category: '媒体设置',
          name: '自动播放音频',
          value: true,
          type: 'boolean',
          description: '显示单词时自动播放发音'
        },
        {
          id: 'show_images',
          category: '媒体设置',
          name: '显示图片',
          value: true,
          type: 'boolean',
          description: '学习时显示相关图片'
        },
        {
          id: 'celebration_effects',
          category: '界面设置',
          name: '庆祝动画',
          value: true,
          type: 'boolean',
          description: '答对时显示庆祝动画'
        },
        {
          id: 'review_interval',
          category: '复习设置',
          name: '复习间隔(小时)',
          value: 24,
          type: 'range',
          min: 1,
          max: 168,
          description: '单词复习的时间间隔'
        },
        {
          id: 'session_duration',
          category: '学习设置',
          name: '学习时长(分钟)',
          value: 15,
          type: 'range',
          min: 5,
          max: 60,
          description: '每次学习会话的建议时长'
        },
        {
          id: 'reminder_time',
          category: '提醒设置',
          name: '学习提醒时间',
          value: '19:00',
          type: 'select',
          options: ['08:00', '12:00', '18:00', '19:00', '20:00', '21:00'],
          description: '每日学习提醒的时间'
        }
      ]);
      
      setGoals([
        {
          id: 'goal1',
          title: '本月掌握200个新单词',
          target_value: 200,
          current_value: 87,
          unit: '个',
          deadline: '2025-01-31',
          priority: 'high',
          status: 'active'
        },
        {
          id: 'goal2',
          title: '连续学习30天',
          target_value: 30,
          current_value: 12,
          unit: '天',
          deadline: '2025-02-15',
          priority: 'medium',
          status: 'active'
        },
        {
          id: 'goal3',
          title: '准确率达到90%',
          target_value: 90,
          current_value: 87,
          unit: '%',
          deadline: '2025-01-20',
          priority: 'medium',
          status: 'active'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (id: string, value: any) => {
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preference_id: id, value }),
      });
      
      if (response.ok) {
        setPreferences(prev => 
          prev.map(pref => 
            pref.id === id ? { ...pref, value } : pref
          )
        );
      }
    } catch (error) {
      console.error('更新偏好设置失败:', error);
      // 本地更新
      setPreferences(prev => 
        prev.map(pref => 
          pref.id === id ? { ...pref, value } : pref
        )
      );
    }
  };

  const addLearningGoal = async () => {
    if (!newGoal.title || !newGoal.target_value || !newGoal.deadline) {
      alert('请填写完整的目标信息');
      return;
    }

    try {
      const response = await fetch('/api/user/learning-goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newGoal,
          current_value: 0,
          status: 'active'
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        setGoals(prev => [...prev, result.goal]);
      }
    } catch (error) {
      console.error('添加学习目标失败:', error);
      // 本地添加
      const goal: LearningGoal = {
        id: `goal_${Date.now()}`,
        ...newGoal,
        current_value: 0,
        status: 'active'
      };
      setGoals(prev => [...prev, goal]);
    }
    
    setNewGoal({
      title: '',
      target_value: 0,
      unit: '个',
      deadline: '',
      priority: 'medium'
    });
    setShowAddGoal(false);
  };

  const updateGoalStatus = async (goalId: string, status: 'active' | 'completed' | 'paused') => {
    try {
      const response = await fetch(`/api/user/learning-goals/${goalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (response.ok) {
        setGoals(prev => 
          prev.map(goal => 
            goal.id === goalId ? { ...goal, status } : goal
          )
        );
      }
    } catch (error) {
      console.error('更新目标状态失败:', error);
      // 本地更新
      setGoals(prev => 
        prev.map(goal => 
          goal.id === goalId ? { ...goal, status } : goal
        )
      );
    }
  };

  const renderPreferenceInput = (pref: UserPreference) => {
    switch (pref.type) {
      case 'boolean':
        return (
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={pref.value}
            onChange={(e) => updatePreference(pref.id, e.target.checked)}
          />
        );
      
      case 'range':
        return (
          <div className="w-full">
            <input
              type="range"
              className="range range-primary"
              min={pref.min}
              max={pref.max}
              value={pref.value}
              onChange={(e) => updatePreference(pref.id, parseInt(e.target.value))}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{pref.min}</span>
              <span className="font-semibold">{pref.value}</span>
              <span>{pref.max}</span>
            </div>
          </div>
        );
      
      case 'select':
        return (
          <select
            className="select select-bordered select-sm w-full"
            value={pref.value}
            onChange={(e) => updatePreference(pref.id, e.target.value)}
          >
            {pref.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'number':
        return (
          <input
            type="number"
            className="input input-bordered input-sm w-full"
            value={pref.value}
            onChange={(e) => updatePreference(pref.id, parseInt(e.target.value))}
          />
        );
      
      default:
        return null;
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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'badge badge-primary';
      case 'completed':
        return 'badge badge-success';
      case 'paused':
        return 'badge badge-warning';
      default:
        return 'badge badge-neutral';
    }
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  if (loading) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">
            ⚙️ 用户偏好设置
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
          ⚙️ 个性化设置
        </h2>
        
        <div className="tabs tabs-boxed">
          <a 
            className={`tab ${activeTab === 'preferences' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            偏好设置
          </a>
          <a 
            className={`tab ${activeTab === 'goals' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('goals')}
          >
            学习目标
          </a>
        </div>

        {activeTab === 'preferences' && (
          <div className="space-y-6">
            {/* 按类别分组显示偏好设置 */}
            {Object.entries(
              preferences.reduce((acc, pref) => {
                if (!acc[pref.category]) acc[pref.category] = [];
                acc[pref.category].push(pref);
                return acc;
              }, {} as Record<string, UserPreference[]>)
            ).map(([category, prefs]) => (
              <div key={category} className="card bg-base-200 shadow-sm">
                <div className="card-body p-4">
                  <h3 className="card-title text-base mb-3">{category}</h3>
                  <div className="space-y-4">
                    {prefs.map(pref => (
                      <div key={pref.id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{pref.name}</div>
                          <div className="text-xs text-gray-500">{pref.description}</div>
                        </div>
                        <div className="ml-4 min-w-[120px]">
                          {renderPreferenceInput(pref)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">我的学习目标</h3>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => setShowAddGoal(true)}
              >
                + 添加目标
              </button>
            </div>

            {/* 添加目标模态框 */}
            {showAddGoal && (
              <div className="card bg-base-200 shadow-sm">
                <div className="card-body p-4">
                  <h4 className="font-semibold mb-3">添加新目标</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="目标标题"
                      className="input input-bordered input-sm w-full"
                      value={newGoal.title}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="目标数值"
                        className="input input-bordered input-sm flex-1"
                        value={newGoal.target_value}
                        onChange={(e) => setNewGoal(prev => ({ ...prev, target_value: parseInt(e.target.value) }))}
                      />
                      <select
                        className="select select-bordered select-sm"
                        value={newGoal.unit}
                        onChange={(e) => setNewGoal(prev => ({ ...prev, unit: e.target.value }))}
                      >
                        <option value="个">个</option>
                        <option value="天">天</option>
                        <option value="%">%</option>
                        <option value="分钟">分钟</option>
                      </select>
                    </div>
                    <input
                      type="date"
                      className="input input-bordered input-sm w-full"
                      value={newGoal.deadline}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, deadline: e.target.value }))}
                    />
                    <select
                      className="select select-bordered select-sm w-full"
                      value={newGoal.priority}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, priority: e.target.value as 'high' | 'medium' | 'low' }))}
                    >
                      <option value="low">低优先级</option>
                      <option value="medium">中优先级</option>
                      <option value="high">高优先级</option>
                    </select>
                    <div className="flex gap-2">
                      <button className="btn btn-primary btn-sm" onClick={addLearningGoal}>
                        添加
                      </button>
                      <button 
                        className="btn btn-outline btn-sm" 
                        onClick={() => setShowAddGoal(false)}
                      >
                        取消
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 目标列表 */}
            <div className="space-y-3">
              {goals.map(goal => {
                const progress = getProgressPercentage(goal.current_value, goal.target_value);
                return (
                  <div key={goal.id} className="card bg-base-200 shadow-sm">
                    <div className="card-body p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-sm">{goal.title}</h4>
                        <div className="flex gap-1">
                          <div className={getPriorityBadgeClass(goal.priority)}>
                            {goal.priority === 'high' ? '高' : goal.priority === 'medium' ? '中' : '低'}
                          </div>
                          <div className={getStatusBadgeClass(goal.status)}>
                            {goal.status === 'active' ? '进行中' : 
                             goal.status === 'completed' ? '已完成' : '已暂停'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span>{goal.current_value} / {goal.target_value} {goal.unit}</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <progress 
                          className="progress progress-primary w-full" 
                          value={progress} 
                          max="100"
                        ></progress>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>截止: {goal.deadline}</span>
                        <div className="flex gap-1">
                          {goal.status === 'active' && (
                            <button 
                              className="btn btn-xs btn-outline"
                              onClick={() => updateGoalStatus(goal.id, 'paused')}
                            >
                              暂停
                            </button>
                          )}
                          {goal.status === 'paused' && (
                            <button 
                              className="btn btn-xs btn-primary"
                              onClick={() => updateGoalStatus(goal.id, 'active')}
                            >
                              继续
                            </button>
                          )}
                          {goal.status !== 'completed' && progress >= 100 && (
                            <button 
                              className="btn btn-xs btn-success"
                              onClick={() => updateGoalStatus(goal.id, 'completed')}
                            >
                              完成
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPreferences;