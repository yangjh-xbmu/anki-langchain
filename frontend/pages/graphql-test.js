/**
 * GraphQL测试页面
 * 用于验证GraphQL集成是否正常工作
 */

import React from 'react';
import SimpleGraphQLTest from '../src/components/SimpleGraphQLTest';
import GraphQLWordPractice from '../src/components/GraphQLWordPractice';
import AdminGraphQLTest from '../src/components/AdminGraphQLTest';

export default function GraphQLTestPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            GraphQL 单词练习测试
          </h1>
          <p className="text-gray-600">
            测试GraphQL API集成功能
          </p>
        </div>
        
        <div className="mb-8">
          <SimpleGraphQLTest />
        </div>
        
        <div className="mb-8">
          <AdminGraphQLTest />
        </div>
        
        <GraphQLWordPractice />
      </div>
    </div>
  );
}