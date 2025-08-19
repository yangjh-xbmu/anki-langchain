/**
 * Apollo GraphQL客户端配置
 * 用于与后端GraphQL API通信
 */

import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// 创建HTTP链接
const httpLink = createHttpLink({
  uri: `${API_BASE_URL}/graphql`,
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 创建Apollo客户端实例
const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache({
    typePolicies: {
      // 缓存策略配置
      Word: {
        fields: {
          // 单词列表缓存合并策略
          wordMemory: {
            merge(existing, incoming) {
              return incoming;
            },
          },
        },
      },
      Query: {
        fields: {
          // 查询结果缓存策略
          allWords: {
            merge(existing = [], incoming) {
              return incoming;
            },
          },
          dueWords: {
            merge(existing = [], incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});

export default client;