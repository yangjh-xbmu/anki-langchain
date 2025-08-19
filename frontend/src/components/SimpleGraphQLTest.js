/**
 * 简单的GraphQL连接测试组件
 */

import React from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

// 简单的测试查询
const TEST_QUERY = gql`
  query TestConnection {
    allWords {
      edges {
        node {
          id
          word
          meaning
        }
      }
    }
  }
`;

function SimpleGraphQLTest() {
  const { loading, error, data } = useQuery(TEST_QUERY);

  if (loading) return <div className="p-4">加载中...</div>;
  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        <h3 className="font-bold">GraphQL 连接错误:</h3>
        <p>{error.message}</p>
        <details className="mt-2">
          <summary className="cursor-pointer">详细错误信息</summary>
          <pre className="mt-2 text-sm bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(error, null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4 text-green-600">✅ GraphQL 连接成功!</h2>
      <div className="bg-green-50 border border-green-200 rounded p-4">
        <h3 className="font-semibold mb-2">查询结果:</h3>
        <pre className="text-sm bg-white p-2 rounded border overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export default SimpleGraphQLTest;