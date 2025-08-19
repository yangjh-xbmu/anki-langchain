# Admin面板前端组件设计

## 概述

本文档定义了Admin面板前端的组件架构、设计规范和实现细节，基于Next.js和React构建现代化的管理界面。

## 技术栈

### 核心技术
- **Next.js 13+**: 应用框架，支持App Router
- **React 18+**: UI库，支持并发特性
- **TypeScript**: 类型安全
- **Tailwind CSS**: 样式框架
- **Apollo Client**: GraphQL客户端
- **React Hook Form**: 表单管理
- **Headless UI**: 无样式组件库

### 辅助库
- **@heroicons/react**: 图标库
- **date-fns**: 日期处理
- **recharts**: 图表库
- **react-table**: 表格组件
- **yup**: 表单验证
- **react-hot-toast**: 通知组件

## 项目结构

```
frontend/
├── app/                          # Next.js App Router
│   ├── admin/                    # Admin面板路由
│   │   ├── layout.tsx           # Admin布局
│   │   ├── page.tsx             # Dashboard页面
│   │   ├── users/               # 用户管理
│   │   │   ├── page.tsx
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx     # 用户详情
│   │   │   │   └── edit/page.tsx # 编辑用户
│   │   │   └── new/page.tsx     # 新建用户
│   │   ├── words/               # 单词管理
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   ├── import/page.tsx
│   │   │   └── sync/page.tsx
│   │   ├── roles/               # 角色管理
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── system/              # 系统管理
│   │   │   ├── config/page.tsx
│   │   │   ├── logs/page.tsx
│   │   │   └── stats/page.tsx
│   │   └── profile/page.tsx     # 个人资料
│   ├── login/page.tsx           # 登录页面
│   ├── layout.tsx               # 根布局
│   └── globals.css              # 全局样式
├── components/                   # 组件库
│   ├── admin/                   # Admin专用组件
│   │   ├── layout/              # 布局组件
│   │   ├── dashboard/           # 仪表板组件
│   │   ├── users/               # 用户管理组件
│   │   ├── words/               # 单词管理组件
│   │   ├── roles/               # 角色管理组件
│   │   └── system/              # 系统管理组件
│   ├── ui/                      # 通用UI组件
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Table.tsx
│   │   ├── Form.tsx
│   │   └── Chart.tsx
│   ├── auth/                    # 认证组件
│   │   ├── AuthProvider.tsx
│   │   ├── LoginForm.tsx
│   │   ├── PermissionGuard.tsx
│   │   └── RoleGuard.tsx
│   └── common/                  # 通用组件
│       ├── Loading.tsx
│       ├── ErrorBoundary.tsx
│       ├── Pagination.tsx
│       └── SearchBox.tsx
├── hooks/                       # 自定义Hooks
│   ├── useAuth.ts
│   ├── usePermissions.ts
│   ├── usePagination.ts
│   ├── useDebounce.ts
│   └── useLocalStorage.ts
├── lib/                         # 工具库
│   ├── apollo.ts                # Apollo Client配置
│   ├── auth.ts                  # 认证工具
│   ├── utils.ts                 # 通用工具
│   ├── constants.ts             # 常量定义
│   └── validations.ts           # 验证规则
├── types/                       # 类型定义
│   ├── auth.ts
│   ├── user.ts
│   ├── word.ts
│   ├── role.ts
│   └── system.ts
└── graphql/                     # GraphQL相关
    ├── queries/
    ├── mutations/
    ├── subscriptions/
    └── fragments/
```

## 核心组件设计

### 1. 认证系统

#### AuthProvider
```typescript
// components/auth/AuthProvider.tsx
import { createContext, useContext, useEffect, useState } from 'react'
import { User, AuthState } from '@/types/auth'
import { apolloClient } from '@/lib/apollo'
import { LOGIN_MUTATION, REFRESH_TOKEN_MUTATION, CURRENT_USER_QUERY } from '@/graphql/mutations/auth'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  refreshToken: () => Promise<boolean>
  hasRole: (role: string) => boolean
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false
  })

  // 初始化认证状态
  useEffect(() => {
    initializeAuth()
  }, [])

  // 自动刷新token
  useEffect(() => {
    if (authState.isAuthenticated) {
      const interval = setInterval(refreshToken, 14 * 60 * 1000) // 14分钟刷新一次
      return () => clearInterval(interval)
    }
  }, [authState.isAuthenticated])

  const initializeAuth = async () => {
    const token = localStorage.getItem('access_token')
    if (token) {
      try {
        const { data } = await apolloClient.query({
          query: CURRENT_USER_QUERY,
          errorPolicy: 'ignore'
        })
        
        if (data?.currentUser) {
          setAuthState({
            user: data.currentUser,
            isLoading: false,
            isAuthenticated: true
          })
        } else {
          logout()
        }
      } catch (error) {
        logout()
      }
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: LOGIN_MUTATION,
        variables: { username, password }
      })

      if (data?.login?.success) {
        const { token, refreshToken, user } = data.login
        
        localStorage.setItem('access_token', token)
        localStorage.setItem('refresh_token', refreshToken)
        
        setAuthState({
          user,
          isLoading: false,
          isAuthenticated: true
        })
        
        return true
      }
      return false
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    
    setAuthState({
      user: null,
      isLoading: false,
      isAuthenticated: false
    })
    
    apolloClient.clearStore()
  }

  const refreshToken = async (): Promise<boolean> => {
    const refreshTokenValue = localStorage.getItem('refresh_token')
    if (!refreshTokenValue) return false

    try {
      const { data } = await apolloClient.mutate({
        mutation: REFRESH_TOKEN_MUTATION,
        variables: { refreshToken: refreshTokenValue }
      })

      if (data?.refreshToken?.success) {
        const { token, refreshToken: newRefreshToken } = data.refreshToken
        
        localStorage.setItem('access_token', token)
        localStorage.setItem('refresh_token', newRefreshToken)
        
        return true
      }
      
      logout()
      return false
    } catch (error) {
      logout()
      return false
    }
  }

  const hasRole = (role: string): boolean => {
    return authState.user?.roles?.some(r => r.name === role) ?? false
  }

  const hasPermission = (permission: string): boolean => {
    return authState.user?.permissions?.includes(permission) ?? false
  }

  return (
    <AuthContext.Provider value={{
      ...authState,
      login,
      logout,
      refreshToken,
      hasRole,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

#### PermissionGuard
```typescript
// components/auth/PermissionGuard.tsx
import { useAuth } from './AuthProvider'
import { AccessDenied } from './AccessDenied'

interface PermissionGuardProps {
  permission?: string
  role?: string
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function PermissionGuard({ 
  permission, 
  role, 
  fallback = <AccessDenied />, 
  children 
}: PermissionGuardProps) {
  const { hasPermission, hasRole, isLoading } = useAuth()

  if (isLoading) {
    return <div className="animate-pulse">Loading...</div>
  }

  const hasAccess = (
    (permission && hasPermission(permission)) ||
    (role && hasRole(role)) ||
    (!permission && !role)
  )

  return hasAccess ? <>{children}</> : <>{fallback}</>
}
```

### 2. 布局组件

#### AdminLayout
```typescript
// components/admin/layout/AdminLayout.tsx
import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Breadcrumb } from './Breadcrumb'

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 移动端侧边栏 */}
      <Sidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        mobile
      />
      
      {/* 桌面端侧边栏 */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <Sidebar />
      </div>

      {/* 主内容区域 */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <Header 
          onMenuClick={() => setSidebarOpen(true)}
          user={user}
        />
        
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Breadcrumb />
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
```

#### Sidebar
```typescript
// components/admin/layout/Sidebar.tsx
import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/components/auth/AuthProvider'
import { SidebarNavigation } from './SidebarNavigation'
import { UserProfile } from './UserProfile'

interface SidebarProps {
  open?: boolean
  onClose?: () => void
  mobile?: boolean
}

export function Sidebar({ open = true, onClose, mobile = false }: SidebarProps) {
  const { user } = useAuth()

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <img
          className="h-8 w-auto"
          src="/logo.svg"
          alt="Anki LangChain"
        />
        <span className="ml-2 text-xl font-semibold text-gray-900">
          Admin Panel
        </span>
      </div>

      {/* 导航菜单 */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <SidebarNavigation />
      </div>

      {/* 用户信息 */}
      <div className="border-t border-gray-200">
        <UserProfile user={user} />
      </div>
    </div>
  )

  if (mobile) {
    return (
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-40 lg:hidden" onClose={onClose!}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 flex z-40">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex-1 flex flex-col max-w-xs w-full">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute top-0 right-0 -mr-12 pt-2">
                    <button
                      type="button"
                      className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                      onClick={onClose}
                    >
                      <XMarkIcon className="h-6 w-6 text-white" />
                    </button>
                  </div>
                </Transition.Child>
                {sidebarContent}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    )
  }

  return sidebarContent
}
```

### 3. 数据表格组件

#### DataTable
```typescript
// components/ui/DataTable.tsx
import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  flexRender
} from '@tanstack/react-table'
import { ChevronUpDownIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { Button } from './Button'
import { Input } from './Input'
import { Pagination } from './Pagination'

interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  searchable?: boolean
  searchPlaceholder?: string
  pageSize?: number
  loading?: boolean
  onRowClick?: (row: T) => void
}

export function DataTable<T>({
  data,
  columns,
  searchable = true,
  searchPlaceholder = "搜索...",
  pageSize = 10,
  loading = false,
  onRowClick
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination: {
        pageIndex: 0,
        pageSize
      }
    }
  })

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 搜索栏 */}
      {searchable && (
        <div className="flex items-center space-x-2">
          <Input
            placeholder={searchPlaceholder}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>
      )}

      {/* 表格 */}
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center space-x-1">
                      <span>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </span>
                      {header.column.getCanSort() && (
                        <span className="flex-shrink-0">
                          {{
                            asc: <ChevronUpIcon className="h-4 w-4" />,
                            desc: <ChevronDownIcon className="h-4 w-4" />
                          }[header.column.getIsSorted() as string] ?? (
                            <ChevronUpDownIcon className="h-4 w-4" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map(row => (
              <tr
                key={row.id}
                className={`hover:bg-gray-50 ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
                onClick={() => onRowClick?.(row.original)}
              >
                {row.getVisibleCells().map(cell => (
                  <td
                    key={cell.id}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      <Pagination
        currentPage={table.getState().pagination.pageIndex + 1}
        totalPages={table.getPageCount()}
        onPageChange={(page) => table.setPageIndex(page - 1)}
        hasNextPage={table.getCanNextPage()}
        hasPreviousPage={table.getCanPreviousPage()}
      />
    </div>
  )
}
```

### 4. 表单组件

#### FormProvider
```typescript
// components/ui/Form.tsx
import { createContext, useContext } from 'react'
import { useForm, FormProvider as RHFProvider, FieldValues, UseFormReturn } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

interface FormContextType {
  formState: any
  register: any
  handleSubmit: any
  watch: any
  setValue: any
  getValues: any
  formErrors: any
}

const FormContext = createContext<FormContextType | null>(null)

interface FormProviderProps<T extends FieldValues> {
  children: React.ReactNode
  onSubmit: (data: T) => void | Promise<void>
  schema?: yup.ObjectSchema<any>
  defaultValues?: Partial<T>
  className?: string
}

export function FormProvider<T extends FieldValues>({
  children,
  onSubmit,
  schema,
  defaultValues,
  className = ''
}: FormProviderProps<T>) {
  const methods = useForm<T>({
    resolver: schema ? yupResolver(schema) : undefined,
    defaultValues
  })

  const { handleSubmit, formState: { errors } } = methods

  return (
    <RHFProvider {...methods}>
      <FormContext.Provider value={{
        ...methods,
        formErrors: errors
      }}>
        <form onSubmit={handleSubmit(onSubmit)} className={className}>
          {children}
        </form>
      </FormContext.Provider>
    </RHFProvider>
  )
}

export const useFormContext = () => {
  const context = useContext(FormContext)
  if (!context) {
    throw new Error('useFormContext must be used within FormProvider')
  }
  return context
}
```

#### FormField
```typescript
// components/ui/FormField.tsx
import { useFormContext } from './Form'
import { Input } from './Input'
import { Textarea } from './Textarea'
import { Select } from './Select'
import { Checkbox } from './Checkbox'

interface FormFieldProps {
  name: string
  label?: string
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox'
  placeholder?: string
  options?: Array<{ value: string; label: string }>
  required?: boolean
  disabled?: boolean
  className?: string
  description?: string
}

export function FormField({
  name,
  label,
  type = 'text',
  placeholder,
  options,
  required = false,
  disabled = false,
  className = '',
  description
}: FormFieldProps) {
  const { register, formErrors } = useFormContext()
  const error = formErrors[name]

  const renderInput = () => {
    const commonProps = {
      ...register(name),
      placeholder,
      disabled,
      error: !!error
    }

    switch (type) {
      case 'textarea':
        return <Textarea {...commonProps} />
      case 'select':
        return <Select {...commonProps} options={options || []} />
      case 'checkbox':
        return <Checkbox {...commonProps} />
      default:
        return <Input {...commonProps} type={type} />
    }
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {renderInput()}
      
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
      
      {error && (
        <p className="text-sm text-red-600">{error.message}</p>
      )}
    </div>
  )
}
```

### 5. 图表组件

#### StatsCard
```typescript
// components/admin/dashboard/StatsCard.tsx
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid'

interface StatsCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease'
  }
  icon?: React.ReactNode
  loading?: boolean
}

export function StatsCard({ title, value, change, icon, loading }: StatsCardProps) {
  if (loading) {
    return (
      <div className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 text-gray-400">
              {icon}
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </div>
                {change && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    change.type === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {change.type === 'increase' ? (
                      <ArrowUpIcon className="self-center flex-shrink-0 h-4 w-4" />
                    ) : (
                      <ArrowDownIcon className="self-center flex-shrink-0 h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {change.type === 'increase' ? 'Increased' : 'Decreased'} by
                    </span>
                    {Math.abs(change.value)}%
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
```

#### ChartContainer
```typescript
// components/ui/Chart.tsx
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface ChartProps {
  data: any[]
  type: 'line' | 'area' | 'bar' | 'pie'
  xKey?: string
  yKey?: string
  title?: string
  height?: number
  colors?: string[]
  loading?: boolean
}

const DEFAULT_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
  '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'
]

export function Chart({
  data,
  type,
  xKey = 'name',
  yKey = 'value',
  title,
  height = 300,
  colors = DEFAULT_COLORS,
  loading = false
}: ChartProps) {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        {title && (
          <div className="h-6 bg-gray-200 rounded mb-4 animate-pulse"></div>
        )}
        <div className={`bg-gray-200 rounded animate-pulse`} style={{ height }}></div>
      </div>
    )
  }

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey={yKey}
              stroke={colors[0]}
              strokeWidth={2}
            />
          </LineChart>
        )
      
      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey={yKey}
              stroke={colors[0]}
              fill={colors[0]}
              fillOpacity={0.3}
            />
          </AreaChart>
        )
      
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={yKey} fill={colors[0]} />
          </BarChart>
        )
      
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey={yKey}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      {title && (
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  )
}
```

## 页面组件设计

### 1. Dashboard页面

```typescript
// app/admin/page.tsx
import { useQuery } from '@apollo/client'
import { SYSTEM_STATS_QUERY } from '@/graphql/queries/system'
import { StatsCard } from '@/components/admin/dashboard/StatsCard'
import { Chart } from '@/components/ui/Chart'
import { UsersIcon, BookOpenIcon, ChartBarIcon, ClockIcon } from '@heroicons/react/24/outline'

export default function AdminDashboard() {
  const { data, loading, error } = useQuery(SYSTEM_STATS_QUERY, {
    variables: {
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      }
    },
    pollInterval: 30000 // 30秒刷新一次
  })

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">加载统计数据失败: {error.message}</p>
      </div>
    )
  }

  const stats = data?.systemStats

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">仪表板</h1>
        <p className="mt-1 text-sm text-gray-500">
          系统概览和关键指标
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="总用户数"
          value={stats?.totalUsers || 0}
          icon={<UsersIcon />}
          loading={loading}
        />
        <StatsCard
          title="活跃用户"
          value={stats?.activeUsers || 0}
          icon={<UsersIcon />}
          loading={loading}
        />
        <StatsCard
          title="单词总数"
          value={stats?.totalWords || 0}
          icon={<BookOpenIcon />}
          loading={loading}
        />
        <StatsCard
          title="今日练习"
          value={stats?.todaySessions || 0}
          icon={<ClockIcon />}
          loading={loading}
        />
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Chart
          title="用户增长趋势"
          type="area"
          data={stats?.userGrowth || []}
          xKey="date"
          yKey="newUsers"
          loading={loading}
        />
        <Chart
          title="练习会话统计"
          type="bar"
          data={stats?.sessionStats || []}
          xKey="date"
          yKey="sessionCount"
          loading={loading}
        />
      </div>

      {/* 热门单词 */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            热门练习单词
          </h3>
          <div className="space-y-3">
            {stats?.topWords?.slice(0, 5).map((wordStat, index) => (
              <div key={wordStat.word.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 w-6">
                    {index + 1}
                  </span>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {wordStat.word.word}
                    </p>
                    <p className="text-sm text-gray-500">
                      {wordStat.word.meaning}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {wordStat.practiceCount} 次
                  </p>
                  <p className="text-sm text-gray-500">
                    {(wordStat.successRate * 100).toFixed(1)}% 正确率
                  </p>
                </div>
              </div>
            )) || (
              loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-6 h-4 bg-gray-200 rounded"></div>
                      <div className="ml-3 space-y-1">
                        <div className="w-20 h-4 bg-gray-200 rounded"></div>
                        <div className="w-32 h-3 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="w-12 h-4 bg-gray-200 rounded"></div>
                      <div className="w-16 h-3 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">暂无数据</p>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 2. 用户管理页面

```typescript
// app/admin/users/page.tsx
import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { useRouter } from 'next/navigation'
import { USERS_QUERY, DELETE_USER_MUTATION } from '@/graphql/queries/users'
import { DataTable } from '@/components/ui/DataTable'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { ColumnDef } from '@tanstack/react-table'
import { User } from '@/types/user'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function UsersPage() {
  const router = useRouter()
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  
  const { data, loading, refetch } = useQuery(USERS_QUERY, {
    variables: {
      pagination: { first: 50 },
      sort: { field: 'createdAt', direction: 'DESC' }
    }
  })

  const [deleteUser] = useMutation(DELETE_USER_MUTATION, {
    onCompleted: () => {
      toast.success('用户删除成功')
      refetch()
      setDeleteUserId(null)
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`)
    }
  })

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'username',
      header: '用户名',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.username}</div>
      )
    },
    {
      accessorKey: 'email',
      header: '邮箱'
    },
    {
      accessorKey: 'displayName',
      header: '显示名称'
    },
    {
      accessorKey: 'roles',
      header: '角色',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.roles.map(role => (
            <Badge key={role.id} variant="secondary">
              {role.name}
            </Badge>
          ))}
        </div>
      )
    },
    {
      accessorKey: 'isActive',
      header: '状态',
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'success' : 'danger'}>
          {row.original.isActive ? '活跃' : '禁用'}
        </Badge>
      )
    },
    {
      accessorKey: 'lastLoginAt',
      header: '最后登录',
      cell: ({ row }) => (
        <span className="text-sm text-gray-500">
          {row.original.lastLoginAt ? formatDate(row.original.lastLoginAt) : '从未登录'}
        </span>
      )
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <PermissionGuard permission="users.write">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/admin/users/${row.original.id}/edit`)}
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="users.delete">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteUserId(row.original.id)}
              className="text-red-600 hover:text-red-700"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </PermissionGuard>
        </div>
      )
    }
  ]

  const handleDeleteUser = async () => {
    if (deleteUserId) {
      await deleteUser({ variables: { id: deleteUserId } })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">用户管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            管理系统用户和权限
          </p>
        </div>
        <PermissionGuard permission="users.write">
          <Button onClick={() => router.push('/admin/users/new')}>
            <PlusIcon className="h-4 w-4 mr-2" />
            新建用户
          </Button>
        </PermissionGuard>
      </div>

      <DataTable
        data={data?.users?.edges?.map(edge => edge.node) || []}
        columns={columns}
        loading={loading}
        searchPlaceholder="搜索用户名或邮箱..."
        onRowClick={(user) => router.push(`/admin/users/${user.id}`)}
      />

      <ConfirmDialog
        open={!!deleteUserId}
        onClose={() => setDeleteUserId(null)}
        onConfirm={handleDeleteUser}
        title="删除用户"
        description="确定要删除这个用户吗？此操作不可撤销。"
        confirmText="删除"
        cancelText="取消"
        variant="danger"
      />
    </div>
  )
}
```

## 样式系统

### Tailwind配置

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8'
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ]
}
```

## 性能优化

### 1. 代码分割

```typescript
// 动态导入大型组件
const ChartComponent = dynamic(() => import('@/components/ui/Chart'), {
  loading: () => <div className="animate-pulse h-64 bg-gray-200 rounded"></div>,
  ssr: false
})

// 路由级别的代码分割
const AdminUsersPage = dynamic(() => import('./users/page'), {
  loading: () => <PageSkeleton />
})
```

### 2. 缓存策略

```typescript
// Apollo Client缓存配置
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        users: {
          keyArgs: ['filter', 'sort'],
          merge(existing = { edges: [] }, incoming) {
            return {
              ...incoming,
              edges: [...existing.edges, ...incoming.edges]
            }
          }
        }
      }
    },
    User: {
      fields: {
        roles: {
          merge: false
        }
      }
    }
  }
})
```

### 3. 虚拟滚动

```typescript
// 大数据量表格的虚拟滚动
import { FixedSizeList as List } from 'react-window'

function VirtualizedTable({ data, columns }) {
  const Row = ({ index, style }) => (
    <div style={style} className="flex items-center border-b">
      {columns.map(column => (
        <div key={column.key} className={column.className}>
          {column.render(data[index])}
        </div>
      ))}
    </div>
  )

  return (
    <List
      height={600}
      itemCount={data.length}
      itemSize={50}
    >
      {Row}
    </List>
  )
}
```

## 测试策略

### 1. 组件测试

```typescript
// __tests__/components/DataTable.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { DataTable } from '@/components/ui/DataTable'

const mockData = [
  { id: 1, name: 'John', email: 'john@example.com' },
  { id: 2, name: 'Jane', email: 'jane@example.com' }
]

const mockColumns = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' }
]

describe('DataTable', () => {
  it('renders table with data', () => {
    render(<DataTable data={mockData} columns={mockColumns} />)
    
    expect(screen.getByText('John')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
  })

  it('filters data when searching', () => {
    render(<DataTable data={mockData} columns={mockColumns} />)
    
    const searchInput = screen.getByPlaceholderText('搜索...')
    fireEvent.change(searchInput, { target: { value: 'John' } })
    
    expect(screen.getByText('John')).toBeInTheDocument()
    expect(screen.queryByText('Jane')).not.toBeInTheDocument()
  })
})
```

### 2. 集成测试

```typescript
// __tests__/pages/admin/users.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import UsersPage from '@/app/admin/users/page'
import { USERS_QUERY } from '@/graphql/queries/users'

const mocks = [
  {
    request: {
      query: USERS_QUERY,
      variables: {
        pagination: { first: 50 },
        sort: { field: 'createdAt', direction: 'DESC' }
      }
    },
    result: {
      data: {
        users: {
          edges: [
            {
              node: {
                id: '1',
                username: 'admin',
                email: 'admin@example.com',
                roles: [{ id: '1', name: 'admin' }],
                isActive: true
              }
            }
          ]
        }
      }
    }
  }
]

describe('UsersPage', () => {
  it('displays users list', async () => {
    render(
      <MockedProvider mocks={mocks}>
        <UsersPage />
      </MockedProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('admin')).toBeInTheDocument()
      expect(screen.getByText('admin@example.com')).toBeInTheDocument()
    })
  })
})
```

## 部署配置

### Next.js配置

```javascript
// next.config.js
module.exports = {
  experimental: {
    appDir: true
  },
  images: {
    domains: ['localhost', 'your-domain.com']
  },
  env: {
    GRAPHQL_ENDPOINT: process.env.GRAPHQL_ENDPOINT,
    WS_ENDPOINT: process.env.WS_ENDPOINT
  },
  async rewrites() {
    return [
      {
        source: '/api/graphql',
        destination: `${process.env.BACKEND_URL}/graphql`
      }
    ]
  }
}
```

### 环境变量

```bash
# .env.local
NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://localhost:5000/graphql
NEXT_PUBLIC_WS_ENDPOINT=ws://localhost:5000/graphql
NEXT_PUBLIC_APP_NAME="Anki LangChain Admin"
NEXT_PUBLIC_APP_VERSION=1.0.0
```

本设计文档为Admin面板前端提供了完整的组件架构和实现指南，确保代码的可维护性、可扩展性和用户体验。