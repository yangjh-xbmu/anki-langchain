import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminLayout from '../../components/layout/AdminLayout';
import PermissionGuard from '../../components/auth/PermissionGuard';

interface AuditLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  status: 'success' | 'failure';
}

const AuditLogPage: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  const actions = ['login', 'logout', 'create', 'update', 'delete', 'view'];
  const resources = ['user', 'role', 'permission', 'word', 'system_config'];

  // 模拟数据
  useEffect(() => {
    const mockLogs: AuditLog[] = [
      {
        id: '1',
        userId: '1',
        username: 'admin',
        action: 'login',
        resource: 'auth',
        details: '管理员登录系统',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        timestamp: '2024-01-15T10:30:00Z',
        status: 'success'
      },
      {
        id: '2',
        userId: '1',
        username: 'admin',
        action: 'create',
        resource: 'user',
        resourceId: '5',
        details: '创建新用户: testuser',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        timestamp: '2024-01-15T10:35:00Z',
        status: 'success'
      },
      {
        id: '3',
        userId: '2',
        username: 'testuser',
        action: 'login',
        resource: 'auth',
        details: '用户登录失败 - 密码错误',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        timestamp: '2024-01-15T11:00:00Z',
        status: 'failure'
      },
      {
        id: '4',
        userId: '1',
        username: 'admin',
        action: 'update',
        resource: 'role',
        resourceId: '2',
        details: '更新角色权限: admin',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        timestamp: '2024-01-15T11:15:00Z',
        status: 'success'
      },
      {
        id: '5',
        userId: '1',
        username: 'admin',
        action: 'delete',
        resource: 'word',
        resourceId: '123',
        details: '删除单词: obsolete',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        timestamp: '2024-01-15T11:30:00Z',
        status: 'success'
      },
      {
        id: '6',
        userId: '3',
        username: 'moderator',
        action: 'view',
        resource: 'user',
        details: '查看用户列表',
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (Ubuntu; Linux x86_64)',
        timestamp: '2024-01-15T12:00:00Z',
        status: 'success'
      },
      {
        id: '7',
        userId: '1',
        username: 'admin',
        action: 'update',
        resource: 'system_config',
        resourceId: 'max_daily_words',
        details: '更新系统配置: max_daily_words = 100',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        timestamp: '2024-01-15T12:30:00Z',
        status: 'success'
      },
      {
        id: '8',
        userId: '4',
        username: 'guest',
        action: 'login',
        resource: 'auth',
        details: '访客尝试登录',
        ipAddress: '203.0.113.1',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)',
        timestamp: '2024-01-15T13:00:00Z',
        status: 'failure'
      }
    ];

    setTimeout(() => {
      setLogs(mockLogs);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = selectedAction === 'all' || log.action === selectedAction;
    const matchesStatus = selectedStatus === 'all' || log.status === selectedStatus;
    
    let matchesDateRange = true;
    if (dateRange.start) {
      matchesDateRange = matchesDateRange && new Date(log.timestamp) >= new Date(dateRange.start);
    }
    if (dateRange.end) {
      matchesDateRange = matchesDateRange && new Date(log.timestamp) <= new Date(dateRange.end + 'T23:59:59');
    }
    
    return matchesSearch && matchesAction && matchesStatus && matchesDateRange;
  });

  // 分页
  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + pageSize);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'login': return 'badge-info';
      case 'logout': return 'badge-secondary';
      case 'create': return 'badge-success';
      case 'update': return 'badge-warning';
      case 'delete': return 'badge-error';
      case 'view': return 'badge-neutral';
      default: return 'badge-ghost';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'success' ? 'badge-success' : 'badge-error';
  };

  const exportLogs = () => {
    const csvContent = [
      ['时间', '用户', '操作', '资源', '详情', 'IP地址', '状态'].join(','),
      ...filteredLogs.map(log => [
        new Date(log.timestamp).toLocaleString(),
        log.username,
        log.action,
        log.resource,
        `"${log.details}"`,
        log.ipAddress,
        log.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
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

  return (
    <PermissionGuard requiredPermissions={['audit:read']}>
      <AdminLayout>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">审计日志</h1>
            <button 
              onClick={exportLogs}
              className="btn btn-outline"
            >
              导出日志
            </button>
          </div>

          {/* 筛选器 */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <input
              type="text"
              placeholder="搜索日志..."
              className="input input-bordered"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <select
              className="select select-bordered"
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
            >
              <option value="all">所有操作</option>
              {actions.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
            
            <select
              className="select select-bordered"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">所有状态</option>
              <option value="success">成功</option>
              <option value="failure">失败</option>
            </select>
            
            <input
              type="date"
              className="input input-bordered"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              placeholder="开始日期"
            />
            
            <input
              type="date"
              className="input input-bordered"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              placeholder="结束日期"
            />
          </div>

          {/* 统计信息 */}
          <div className="stats shadow mb-6">
            <div className="stat">
              <div className="stat-title">总日志数</div>
              <div className="stat-value text-primary">{logs.length}</div>
            </div>
            <div className="stat">
              <div className="stat-title">筛选结果</div>
              <div className="stat-value text-secondary">{filteredLogs.length}</div>
            </div>
            <div className="stat">
              <div className="stat-title">成功操作</div>
              <div className="stat-value text-success">
                {filteredLogs.filter(log => log.status === 'success').length}
              </div>
            </div>
            <div className="stat">
              <div className="stat-title">失败操作</div>
              <div className="stat-value text-error">
                {filteredLogs.filter(log => log.status === 'failure').length}
              </div>
            </div>
          </div>

          {/* 日志列表 */}
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>用户</th>
                  <th>操作</th>
                  <th>资源</th>
                  <th>详情</th>
                  <th>IP地址</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <div className="text-sm">
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td>
                      <div className="font-bold">{log.username}</div>
                      <div className="text-sm text-gray-500">ID: {log.userId}</div>
                    </td>
                    <td>
                      <div className={`badge ${getActionColor(log.action)}`}>
                        {log.action}
                      </div>
                    </td>
                    <td>
                      <div className="badge badge-outline">{log.resource}</div>
                      {log.resourceId && (
                        <div className="text-xs text-gray-500 mt-1">
                          ID: {log.resourceId}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="max-w-xs truncate" title={log.details}>
                        {log.details}
                      </div>
                    </td>
                    <td>
                      <code className="text-sm">{log.ipAddress}</code>
                    </td>
                    <td>
                      <div className={`badge ${getStatusColor(log.status)}`}>
                        {log.status === 'success' ? '成功' : '失败'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <div className="join">
                <button 
                  className="join-item btn"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  «
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  return (
                    <button
                      key={pageNum}
                      className={`join-item btn ${currentPage === pageNum ? 'btn-active' : ''}`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button 
                  className="join-item btn"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  »
                </button>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </PermissionGuard>
  );
};

export default AuditLogPage;