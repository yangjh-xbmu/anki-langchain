/**
 * Admin GraphQL 测试组件
 * 用于测试系统配置和审计日志的 GraphQL API
 */

import React, { useState } from 'react';

const AdminGraphQLTest = () => {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});
  const [configKey, setConfigKey] = useState('test_config');
  const [configValue, setConfigValue] = useState('test_value');
  const [configDescription, setConfigDescription] = useState('测试配置项');

  const executeQuery = async (queryName, query, variables = {}) => {
    setLoading(prev => ({ ...prev, [queryName]: true }));
    try {
      const response = await fetch('http://localhost:5001/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables
        })
      });
      
      const result = await response.json();
      setResults(prev => ({ ...prev, [queryName]: result }));
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        [queryName]: { error: error.message } 
      }));
    } finally {
      setLoading(prev => ({ ...prev, [queryName]: false }));
    }
  };

  const testQueries = {
    // 查询系统配置列表
    systemConfigsList: {
      name: '查询系统配置列表',
      query: `
        query {
          systemConfigsList {
            key
            value
            description
            configType
            isPublic
            isReadonly
            createdAt
            updatedAt
          }
        }
      `
    },
    
    // 创建系统配置
    createSystemConfig: {
      name: '创建系统配置',
      query: `
        mutation CreateSystemConfig($key: String!, $value: String!, $description: String, $configType: String, $isPublic: Boolean, $isReadonly: Boolean) {
          createSystemConfig(
            key: $key
            value: $value
            description: $description
            configType: $configType
            isPublic: $isPublic
            isReadonly: $isReadonly
          ) {
            success
            message
            config {
              key
              value
              description
              configType
              isPublic
              isReadonly
            }
          }
        }
      `,
      variables: () => ({
        key: configKey,
        value: configValue,
        description: configDescription,
        configType: 'string',
        isPublic: true,
        isReadonly: false
      })
    },
    
    // 更新系统配置
    updateSystemConfig: {
      name: '更新系统配置',
      query: `
        mutation UpdateSystemConfig($key: String!, $value: String!, $description: String) {
          updateSystemConfig(
            key: $key
            value: $value
            description: $description
          ) {
            success
            message
            config {
              key
              value
              description
              updatedAt
            }
          }
        }
      `,
      variables: () => ({
        key: configKey,
        value: configValue + '_updated',
        description: configDescription + ' (已更新)'
      })
    },
    
    // 删除系统配置
    deleteSystemConfig: {
      name: '删除系统配置',
      query: `
        mutation DeleteSystemConfig($key: String!) {
          deleteSystemConfig(key: $key) {
            success
            message
          }
        }
      `,
      variables: () => ({
        key: configKey
      })
    },
    
    // 查询审计日志列表
    auditLogsList: {
      name: '查询审计日志列表',
      query: `
        query {
          auditLogsList(limit: 10) {
            id
            action
            tableName
            recordId
            oldValues
            newValues
            userId
            ipAddress
            userAgent
            createdAt
          }
        }
      `
    },
    
    // 清理审计日志
    cleanupAuditLogs: {
      name: '清理审计日志',
      query: `
        mutation CleanupAuditLogs($days: Int!) {
          cleanupAuditLogs(days: $days) {
            success
            message
            deletedCount
          }
        }
      `,
      variables: () => ({
        days: 30
      })
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Admin GraphQL API 测试
      </h2>
      
      {/* 配置输入表单 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">配置参数</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              配置键名
            </label>
            <input
              type="text"
              value={configKey}
              onChange={(e) => setConfigKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如: test_config"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              配置值
            </label>
            <input
              type="text"
              value={configValue}
              onChange={(e) => setConfigValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如: test_value"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              配置描述
            </label>
            <input
              type="text"
              value={configDescription}
              onChange={(e) => setConfigDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如: 测试配置项"
            />
          </div>
        </div>
      </div>
      
      {/* 测试按钮 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {Object.entries(testQueries).map(([key, test]) => (
          <button
            key={key}
            onClick={() => executeQuery(
              key, 
              test.query, 
              test.variables ? test.variables() : {}
            )}
            disabled={loading[key]}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading[key] ? '执行中...' : test.name}
          </button>
        ))}
      </div>
      
      {/* 结果显示 */}
      <div className="space-y-4">
        {Object.entries(results).map(([key, result]) => (
          <div key={key} className="border rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2 text-gray-800">
              {testQueries[key]?.name || key} - 结果
            </h3>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminGraphQLTest;