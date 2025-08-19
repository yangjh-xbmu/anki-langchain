import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  requireAll?: boolean; // 是否需要所有权限/角色，默认为 false（只需要其中一个）
  fallback?: React.ReactNode;
  redirectTo?: string;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  requireAll = false,
  fallback = null,
  redirectTo,
}) => {
  const { isAuthenticated, hasPermission, hasRole, hasAnyPermission, hasAnyRole } = useAuth();

  // 如果未认证，显示未授权消息或重定向
  if (!isAuthenticated) {
    if (redirectTo) {
      window.location.href = redirectTo;
      return null;
    }
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">未授权访问</h3>
            <p className="mt-1 text-sm text-gray-500">
              您需要登录才能访问此页面。
            </p>
            <div className="mt-6">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => window.location.href = '/admin/login'}
              >
                前往登录
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 检查权限
  let hasRequiredPermissions = true;
  if (requiredPermissions.length > 0) {
    if (requireAll) {
      hasRequiredPermissions = requiredPermissions.every(permission => hasPermission(permission));
    } else {
      hasRequiredPermissions = hasAnyPermission(requiredPermissions);
    }
  }

  // 检查角色
  let hasRequiredRoles = true;
  if (requiredRoles.length > 0) {
    if (requireAll) {
      hasRequiredRoles = requiredRoles.every(role => hasRole(role));
    } else {
      hasRequiredRoles = hasAnyRole(requiredRoles);
    }
  }

  // 如果没有所需权限或角色，显示无权限消息
  if (!hasRequiredPermissions || !hasRequiredRoles) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
              <svg
                className="h-6 w-6 text-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
            <p className="mt-1 text-sm text-gray-500">
              您没有访问此页面的权限。
            </p>
            {requiredPermissions.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-gray-400">所需权限：</p>
                <div className="mt-1 flex flex-wrap gap-1 justify-center">
                  {requiredPermissions.map(permission => (
                    <span
                      key={permission}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {permission}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {requiredRoles.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-gray-400">所需角色：</p>
                <div className="mt-1 flex flex-wrap gap-1 justify-center">
                  {requiredRoles.map(role => (
                    <span
                      key={role}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-6">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => window.history.back()}
              >
                返回上一页
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 有权限，渲染子组件
  return <>{children}</>;
};

export default PermissionGuard;