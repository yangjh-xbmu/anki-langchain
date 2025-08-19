# GraphQL 使用指南

## 概述

Anki-Langchain 项目已完全迁移到 GraphQL 架构，提供更灵活、高效的数据查询和操作体验。本指南将帮助您了解如何使用 GraphQL API。

## 🚀 快速开始

### 访问 GraphQL 接口

启动项目后，您可以通过以下方式访问 GraphQL：

1. **GraphiQL 调试界面**（推荐用于开发和测试）
   - 地址：`http://localhost:5001/graphql`
   - 提供交互式查询编辑器和文档浏览

2. **前端测试页面**
   - 地址：`http://localhost:3000/graphql-test`
   - 展示实际的 GraphQL 集成效果

3. **API 端点**
   - 开发环境：`POST http://localhost:5001/graphql`
   - 生产环境：`POST http://localhost:5001/graphql-api`

## 📊 核心查询（Queries）

### 获取所有单词

```graphql
query GetAllWords {
  allWords {
    id
    word
    meaning
    phonetic
    imageUrl
    audioUrl
    deckName
    createdAt
  }
}
```

### 获取到期单词

```graphql
query GetDueWords {
  dueWords {
    id
    word
    meaning
    nextReview
    difficulty
    stability
  }
}
```

### 获取特定单词详情

```graphql
query GetWordById($id: ID!) {
  word(id: $id) {
    id
    word
    meaning
    phonetic
    etymology
    exampleSentence
    exampleTranslation
    relatedWords
    imageUrl
    audioUrl
  }
}
```

### 获取单词记忆状态

```graphql
query GetWordMemory($wordId: ID!) {
  wordMemory(wordId: $wordId) {
    id
    difficulty
    stability
    retrievability
    lastReview
    nextReview
    reviewCount
  }
}
```

### 获取学习统计

```graphql
query GetLearningStats {
  learningStats {
    totalWords
    studiedToday
    streakDays
    accuracy
    averageSessionTime
    totalStudyTime
  }
}
```

### 获取用户学习档案

```graphql
query GetUserLearningProfile {
  userLearningProfile {
    id
    dailyGoal
    preferredStudyTime
    difficultyPreference
    learningStreak
    totalStudyDays
  }
}
```

### 获取每日推荐

```graphql
query GetDailyRecommendation {
  dailyRecommendation {
    id
    recommendedWords
    studyDuration
    difficultyLevel
    createdAt
  }
}
```

## ✏️ 核心变更（Mutations）

### 创建新单词

```graphql
mutation CreateWord($input: WordInput!) {
  createWord(input: $input) {
    word {
      id
      word
      meaning
    }
    success
    message
  }
}
```

**输入变量示例：**
```json
{
  "input": {
    "word": "example",
    "meaning": "例子，实例",
    "phonetic": "/ɪɡˈzæmpəl/",
    "deckName": "GRE词汇"
  }
}
```

### 更新单词信息

```graphql
mutation UpdateWord($id: ID!, $input: WordInput!) {
  updateWord(id: $id, input: $input) {
    word {
      id
      word
      meaning
      updatedAt
    }
    success
    message
  }
}
```

### 提交练习会话

```graphql
mutation SubmitPracticeSession($input: PracticeSessionInput!) {
  submitPracticeSession(input: $input) {
    session {
      id
      score
      completedAt
      duration
    }
    success
    message
  }
}
```

**输入变量示例：**
```json
{
  "input": {
    "wordIds": [1, 2, 3],
    "score": 85,
    "duration": 300,
    "correctAnswers": 17,
    "totalQuestions": 20
  }
}
```

### 更新用户档案

```graphql
mutation UpdateUserProfile($input: UserLearningProfileInput!) {
  updateUserProfile(input: $input) {
    profile {
      id
      dailyGoal
      preferredStudyTime
    }
    success
    message
  }
}
```

### 记录学习会话

```graphql
mutation RecordLearningSession($input: LearningSessionInput!) {
  recordLearningSession(input: $input) {
    session {
      id
      sessionType
      duration
      wordsStudied
    }
    success
    message
  }
}
```

### 重置单词记忆

```graphql
mutation ResetWordMemory($wordId: ID!) {
  resetWordMemory(wordId: $wordId) {
    wordMemory {
      id
      difficulty
      stability
    }
    success
    message
  }
}
```

## 🔧 前端集成

### Apollo Client 配置

项目使用 Apollo Client 作为 GraphQL 客户端，配置文件位于 `frontend/src/services/apolloClient.js`：

```javascript
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001';

const httpLink = createHttpLink({
  uri: `${API_BASE_URL}/graphql`,
  credentials: 'include',
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache({
    typePolicies: {
      Word: {
        fields: {
          wordMemory: {
            merge: true,
          },
        },
      },
      Query: {
        fields: {
          allWords: {
            merge: false,
          },
          dueWords: {
            merge: false,
          },
        },
      },
    },
  }),
});
```

### React 组件中使用

```javascript
import { useQuery, useMutation } from '@apollo/client';
import { GET_ALL_WORDS, CREATE_WORD } from '../services/graphqlQueries';

function WordList() {
  const { loading, error, data } = useQuery(GET_ALL_WORDS);
  const [createWord] = useMutation(CREATE_WORD);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      {data.allWords.map(word => (
        <div key={word.id}>
          <h3>{word.word}</h3>
          <p>{word.meaning}</p>
        </div>
      ))}
    </div>
  );
}
```

## 🎯 最佳实践

### 1. 查询优化

- **精确字段选择**：只查询需要的字段，避免过度获取
- **使用片段**：对于重复的字段集合，使用 GraphQL 片段
- **批量操作**：合并多个相关查询到单个请求

### 2. 错误处理

```javascript
const { loading, error, data } = useQuery(GET_ALL_WORDS, {
  errorPolicy: 'all', // 显示部分数据和错误
  onError: (error) => {
    console.error('GraphQL Error:', error);
    // 处理错误逻辑
  }
});
```

### 3. 缓存策略

```javascript
const { loading, error, data } = useQuery(GET_WORD_BY_ID, {
  variables: { id: wordId },
  fetchPolicy: 'cache-first', // 优先使用缓存
  nextFetchPolicy: 'cache-only', // 后续查询仅使用缓存
});
```

### 4. 实时更新

```javascript
const [createWord] = useMutation(CREATE_WORD, {
  update: (cache, { data: { createWord } }) => {
    if (createWord.success) {
      // 更新缓存
      const existingWords = cache.readQuery({ query: GET_ALL_WORDS });
      cache.writeQuery({
        query: GET_ALL_WORDS,
        data: {
          allWords: [...existingWords.allWords, createWord.word]
        }
      });
    }
  }
});
```

## 🔍 调试技巧

### 1. 使用 GraphiQL

- 访问 `http://localhost:5001/graphql`
- 利用自动补全和文档功能
- 测试查询和变更

### 2. Apollo Client DevTools

- 安装 Apollo Client DevTools 浏览器扩展
- 监控查询状态和缓存
- 调试网络请求

### 3. 日志记录

```javascript
const client = new ApolloClient({
  // ... 其他配置
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});
```

## 🚨 常见问题

### 1. CORS 错误

确保后端 CORS 配置正确，允许前端域名访问。

### 2. 查询超时

对于复杂查询，可能需要增加超时时间：

```javascript
const { loading, error, data } = useQuery(COMPLEX_QUERY, {
  fetchPolicy: 'network-only',
  timeout: 10000, // 10秒超时
});
```

### 3. 缓存不一致

手动刷新缓存：

```javascript
client.refetchQueries({
  include: [GET_ALL_WORDS, GET_LEARNING_STATS]
});
```

## 📚 更多资源

- [GraphQL 官方文档](https://graphql.org/learn/)
- [Apollo Client 文档](https://www.apollographql.com/docs/react/)
- [Graphene Python 文档](https://graphene-python.org/)
- [项目 GraphQL Schema 设计文档](./GRAPHQL_SCHEMA_DESIGN.md)