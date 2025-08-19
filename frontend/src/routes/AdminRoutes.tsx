import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import PermissionGuard from '../components/auth/PermissionGuard';
import LoginPage from '../pages/admin/LoginPage';
import DashboardPage from '../pages/admin/DashboardPage';
import UserManagementPage from '../pages/admin/UserManagementPage';

// 简单的路由组件
const AdminRoutes: React.FC = () => {
  const currentPath = window.location.pathname;

  const renderPage = () => {
    switch (currentPath) {
      case '/admin/login':
        return <LoginPage />;
      case '/admin':
      case '/admin/':
        return (
          <PermissionGuard requiredPermissions={['admin_panel:read']}>
            <DashboardPage />
          </PermissionGuard>
        );
      case '/admin/users':
        return (
          <PermissionGuard requiredPermissions={['user:read']}>
            <UserManagementPage />
          </PermissionGuard>
        );
      case '/admin/roles':
        return (
          <PermissionGuard requiredPermissions={['role:read']}>
            <div className="p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900">角色权限管理</h1>
              <p className="mt-2 text-gray-600">此页面正在开发中...</p>
            </div>
          </PermissionGuard>
        );
      case '/admin/words':
        return (
          <PermissionGuard requiredPermissions={['word:read']}>
            <div className="p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900">单词管理</h1>
              <p className="mt-2 text-gray-600">此页面正在开发中...</p>
            </div>
          </PermissionGuard>
        );
      case '/admin/analytics':
        return (
          <PermissionGuard requiredPermissions={['system:read']}>
            <div className="p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900">数据统计</h1>
              <p className="mt-2 text-gray-600">此页面正在开发中...</p>
            </div>
          </PermissionGuard>
        );
      case '/admin/settings':
        return (
          <PermissionGuard requiredPermissions={['system:write']}>
            <div className="p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900">系统设置</h1>
              <p className="mt-2 text-gray-600">此页面正在开发中...</p>
            </div>
          </PermissionGuard>
        );
      case '/admin/audit-logs':
        return (
          <PermissionGuard requiredPermissions={['admin_panel:read']}>
            <div className="p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900">审计日志</h1>
              <p className="mt-2 text-gray-600">此页面正在开发中...</p>
            </div>
          </PermissionGuard>
        );
      default:
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">页面未找到</h3>
                <p className="mt-1 text-sm text-gray-500">
                  您访问的页面不存在。
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => window.location.href = '/admin'}
                  >
                    返回首页
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <AuthProvider>
      {renderPage()}
    </AuthProvider>
  );
};

export default AdminRoutes;