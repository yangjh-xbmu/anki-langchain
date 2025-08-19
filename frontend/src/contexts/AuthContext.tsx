import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

// 类型定义
interface User {
  id: number;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshAccessToken: () => Promise<boolean>;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; accessToken: string; refreshToken: string } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'REFRESH_TOKEN_SUCCESS'; payload: { accessToken: string } }
  | { type: 'SET_LOADING'; payload: boolean };

// 初始状态
const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,
  isAuthenticated: false,
};

// Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        isLoading: false,
        isAuthenticated: true,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        isAuthenticated: false,
      };
    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };
    case 'REFRESH_TOKEN_SUCCESS':
      return {
        ...state,
        accessToken: action.payload.accessToken,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
}

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// GraphQL 查询和变更
const LOGIN_MUTATION = `
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      success
      message
      user {
        id
        username
        email
        isActive
        isVerified
        lastLoginAt
        roles {
          name
          displayName
        }
      }
      accessToken
      refreshToken
    }
  }
`;

const REFRESH_TOKEN_MUTATION = `
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      success
      message
      accessToken
    }
  }
`;

const LOGOUT_MUTATION = `
  mutation Logout($refreshToken: String) {
    logout(refreshToken: $refreshToken) {
      success
      message
    }
  }
`;

// GraphQL 客户端函数
const graphqlRequest = async (query: string, variables: any = {}) => {
  const response = await fetch('/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(localStorage.getItem('accessToken') && {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      }),
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0].message);
  }
  
  return result.data;
};

// Provider 组件
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 从 localStorage 恢复认证状态
  useEffect(() => {
    const initializeAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (accessToken && refreshToken) {
        try {
          // 验证 access token
          const decoded = jwtDecode<any>(accessToken);
          const currentTime = Date.now() / 1000;

          if (decoded.exp > currentTime) {
            // Token 仍然有效
            const user: User = {
              id: decoded.user_id,
              username: decoded.username,
              email: decoded.email,
              roles: decoded.roles || [],
              permissions: decoded.permissions || [],
              isActive: true,
              isVerified: true,
            };

            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: { user, accessToken, refreshToken },
            });
          } else {
            // Token 过期，尝试刷新
            const success = await refreshAccessToken();
            if (!success) {
              // 刷新失败，清除存储的 token
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
            }
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }

      dispatch({ type: 'SET_LOADING', payload: false });
    };

    initializeAuth();
  }, []);

  // 登录函数
  const login = async (username: string, password: string): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });

    try {
      const data = await graphqlRequest(LOGIN_MUTATION, { username, password });
      
      if (data.login.success) {
        const { user: userData, accessToken, refreshToken } = data.login;
        
        // 提取用户权限
        const roles = userData.roles.map((role: any) => role.name);
        const permissions = userData.permissions || [];
        
        const user: User = {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          roles,
          permissions,
          isActive: userData.isActive,
          isVerified: userData.isVerified,
          lastLoginAt: userData.lastLoginAt,
        };

        // 存储到 localStorage
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, accessToken, refreshToken },
        });

        return true;
      } else {
        dispatch({ type: 'LOGIN_FAILURE' });
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      dispatch({ type: 'LOGIN_FAILURE' });
      return false;
    }
  };

  // 登出函数
  const logout = async () => {
    try {
      if (state.refreshToken) {
        await graphqlRequest(LOGOUT_MUTATION, { refreshToken: state.refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      dispatch({ type: 'LOGOUT' });
    }
  };

  // 刷新访问令牌
  const refreshAccessToken = async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      return false;
    }

    try {
      const data = await graphqlRequest(REFRESH_TOKEN_MUTATION, { refreshToken });
      
      if (data.refreshToken.success) {
        const { accessToken } = data.refreshToken;
        
        localStorage.setItem('accessToken', accessToken);
        
        dispatch({
          type: 'REFRESH_TOKEN_SUCCESS',
          payload: { accessToken },
        });
        
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  };

  // 权限检查函数
  const hasRole = (role: string): boolean => {
    return state.user?.roles.includes(role) || false;
  };

  const hasPermission = (permission: string): boolean => {
    return state.user?.permissions.includes(permission) || false;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some(role => hasRole(role));
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    refreshAccessToken,
    hasRole,
    hasPermission,
    hasAnyRole,
    hasAnyPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;