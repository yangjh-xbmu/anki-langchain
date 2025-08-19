import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminLayout from '../../components/layout/AdminLayout';
import PermissionGuard from '../../components/auth/PermissionGuard';

interface SystemConfig {
  id: string;
  key: string;
  value: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  category: string;
  updatedAt: string;
}

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingConfig, setEditingConfig] = useState<SystemConfig | null>(null);
  const [tempValue, setTempValue] = useState('');

  const categories = ['General', 'Learning', 'Security', 'Performance', 'UI'];

  // 模拟数据
  useEffect(() => {
    const mockConfigs: SystemConfig[] = [
      {
        id: '1',
        key: 'site_name',
        value: 'Anki LangChain',
        description: '网站名称',
        type: 'string',
        category: 'General',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        key: 'max_daily_words',
        value: '50',
        description: '每日最大学习单词数',
        type: 'number',
        category: 'Learning',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '3',
        key: 'enable_audio',
        value: 'true',
        description: '启用音频功能',
        type: 'boolean',
        category: 'UI',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '4',
        key: 'session_timeout',
        value: '3600',
        description: '会话超时时间（秒）',
        type: 'number',
        category: 'Security',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '5',
        key: 'cache_duration',
        value: '300',
        description: '缓存持续时间（秒）',
        type: 'number',
        category: 'Performance',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '6',
        key: 'difficulty_weights',
        value: '{"easy": 1, "medium": 2, "hard": 3}',
        description: '难度权重配置',
        type: 'json',
        category: 'Learning',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '7',
        key: 'enable_registration',
        value: 'false',
        description: '允许用户注册',
        type: 'boolean',
        category: 'Security',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '8',
        key: 'default_theme',
        value: 'light',
        description: '默认主题',
        type: 'string',
        category: 'UI',
        updatedAt: '2024-01-01T00:00:00Z'
      }
    ];

    setTimeout(() => {
      setConfigs(mockConfigs);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredConfigs = configs.filter(config => {
    const matchesSearch = config.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         config.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || config.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (config: SystemConfig) => {
    setEditingConfig(config);
    setTempValue(config.value);
  };

  const handleSave = () => {
    if (!editingConfig) return;

    // 验证值的格式
    let isValid = true;
    let processedValue = tempValue;

    switch (editingConfig.type) {
      case 'number':
        if (isNaN(Number(tempValue))) {
          alert('请输入有效的数字');
          return;
        }
        break;
      case 'boolean':
        if (tempValue !== 'true' && tempValue !== 'false') {
          alert('布尔值只能是 true 或 false');
          return;
        }
        break;
      case 'json':
        try {
          JSON.parse(tempValue);
        } catch (e) {
          alert('请输入有效的JSON格式');
          return;
        }
        break;
    }

    // 更新配置
    setConfigs(configs.map(config => 
      config.id === editingConfig.id 
        ? { 
            ...config, 
            value: processedValue,
            updatedAt: new Date().toISOString()
          }
        : config
    ));

    setEditingConfig(null);
    setTempValue('');
  };

  const handleCancel = () => {
    setEditingConfig(null);
    setTempValue('');
  };

  const renderValue = (config: SystemConfig) => {
    if (editingConfig?.id === config.id) {
      switch (config.type) {
        case 'boolean':
          return (
            <select
              className="select select-bordered select-sm"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
            >
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          );
        case 'json':
          return (
            <textarea
              className="textarea textarea-bordered textarea-sm w-full"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              rows={3}
            />
          );
        default:
          return (
            <input
              type={config.type === 'number' ? 'number' : 'text'}
              className="input input-bordered input-sm w-full"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
            />
          );
      }
    }

    // 显示值
    switch (config.type) {
      case 'boolean':
        return (
          <div className={`badge ${config.value === 'true' ? 'badge-success' : 'badge-error'}`}>
            {config.value}
          </div>
        );
      case 'json':
        return (
          <div className="max-w-xs">
            <code className="text-xs bg-base-200 p-1 rounded block overflow-x-auto">
              {config.value}
            </code>
          </div>
        );
      default:
        return <span className="font-mono">{config.value}</span>;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'string': return 'badge-info';
      case 'number': return 'badge-success';
      case 'boolean': return 'badge-warning';
      case 'json': return 'badge-secondary';
      default: return 'badge-neutral';
    }
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

  return (
    <PermissionGuard requiredPermissions={['system:read']}>
      <AdminLayout>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">系统设置</h1>
          </div>

          {/* 筛选和搜索 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <input
              type="text"
              placeholder="搜索配置项..."
              className="input input-bordered"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <select
              className="select select-bordered"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">所有分类</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <div className="text-sm text-gray-500 flex items-center">
              共 {filteredConfigs.length} 个配置项
            </div>
          </div>

          {/* 配置列表 */}
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>配置键</th>
                  <th>描述</th>
                  <th>类型</th>
                  <th>分类</th>
                  <th>当前值</th>
                  <th>更新时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredConfigs.map((config) => (
                  <tr key={config.id}>
                    <td>
                      <code className="font-bold">{config.key}</code>
                    </td>
                    <td>{config.description}</td>
                    <td>
                      <div className={`badge ${getTypeColor(config.type)}`}>
                        {config.type}
                      </div>
                    </td>
                    <td>
                      <div className="badge badge-outline">{config.category}</div>
                    </td>
                    <td className="min-w-48">
                      {renderValue(config)}
                    </td>
                    <td>{new Date(config.updatedAt).toLocaleString()}</td>
                    <td>
                      <div className="flex gap-2">
                        {editingConfig?.id === config.id ? (
                          <PermissionGuard requiredPermissions={['system:write']}>
                            <>
                              <button
                                onClick={handleSave}
                                className="btn btn-sm btn-success"
                              >
                                保存
                              </button>
                              <button
                                onClick={handleCancel}
                                className="btn btn-sm btn-outline"
                              >
                                取消
                              </button>
                            </>
                          </PermissionGuard>
                        ) : (
                          <PermissionGuard requiredPermissions={['system:write']}>
                            <button
                              onClick={() => handleEdit(config)}
                              className="btn btn-sm btn-outline"
                            >
                              编辑
                            </button>
                          </PermissionGuard>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 配置说明 */}
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">配置说明</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                  <h3 className="card-title text-lg">数据类型</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="badge badge-info">string</div>
                      <span className="text-sm">文本字符串</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="badge badge-success">number</div>
                      <span className="text-sm">数字</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="badge badge-warning">boolean</div>
                      <span className="text-sm">布尔值 (true/false)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="badge badge-secondary">json</div>
                      <span className="text-sm">JSON对象</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                  <h3 className="card-title text-lg">注意事项</h3>
                  <ul className="text-sm space-y-1">
                    <li>• 修改配置后可能需要重启服务才能生效</li>
                    <li>• JSON类型的配置需要符合JSON格式规范</li>
                    <li>• 数字类型的配置请输入有效的数值</li>
                    <li>• 布尔类型只接受 true 或 false</li>
                    <li>• 请谨慎修改安全相关的配置</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </PermissionGuard>
  );
};

export default SettingsPage;