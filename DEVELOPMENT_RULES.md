# Anki-LangChain 开发规范

## 🚨 核心原则

**严禁随意修改已完成且正常工作的功能代码，除非发现明确的错误或有用户明确要求。**

## 📋 功能规范

### 1. 音频播放功能

#### 1.1 音频源处理优先级

```
1. Anki有道API音频 (最高优先级)
   - 格式: http://dict.youdao.com/dictvoice?type=1&audio={word}
   - 处理方法: LangChainService._process_anki_audio() 中的 youdao_url 类型

2. Anki媒体文件音频
   - 通过AnkiConnect API获取
   - 处理方法: LangChainService._get_anki_audio_url()

3. 本地TTS生成 (最低优先级)
   - 仅在前两种都不可用时使用
   - 处理方法: LangChainService.generate_audio()
```

#### 1.2 音频播放方式规范

**自动播放功能**:
- 单词载入后延迟1秒自动播放
- 使用 `useEffect` 监听 `currentWord` 变化
- 必须包含清理函数防止内存泄漏

**手动播放功能**:
- **当前设定**: Shift+P键播放音频（避免与输入冲突）
- **播放按钮**: 点击音频播放按钮
- **禁止随意更改**: 不得擅自修改快捷键或移除自动播放
- **修改条件**: 仅在用户明确要求时才可修改，且必须更新此文档

#### 1.3 代码结构要求

**保持以下方法的完整性，不得删除或破坏：**

```python
# backend/app/langchain_service.py
class LangChainService:
    def process_audio_url(self, word, audio_info=None)  # 音频处理入口
    def _process_anki_audio(self, audio_info)           # Anki音频处理
    def _get_anki_audio_url(self, filename)             # Anki媒体文件处理
    def generate_audio(self, word)                      # 本地TTS生成
```

```typescript
// frontend/pages/index.tsx
const playAudio = (audioUrl: string) => { ... }        // 音频播放函数
// 键盘事件处理中的P键绑定
case 'p':
case 'P':
  if (currentWord?.audio_url) {
    playAudio(currentWord.audio_url);
  }
```

### 2. 数据同步规范

#### 2.1 音频URL存储要求

- **必须存储完整URL**: 不得存储占位符、None或空值
- **有道API格式**: `http://dict.youdao.com/dictvoice?type=1&audio={word}`
- **验证方法**: 同步后检查数据库中audio_url字段的实际值

#### 2.2 同步流程保护

```python
# backend/app/routes.py - sync_anki()方法
# 保持现有的音频处理逻辑：
audio_url = langchain_service.process_audio_url(
    word_data['word'], audio_info
)
```

### 3. 前端UI规范

#### 3.1 键盘快捷键提示

- 必须与实际功能保持一致
- P键对应"播放发音"功能
- 更改快捷键时同步更新UI提示

#### 3.2 音频播放逻辑

```typescript
// 保持现有的音频URL处理逻辑
const fullAudioUrl = audioUrl.startsWith('http') 
  ? audioUrl 
  : `http://localhost:5001${audioUrl}`;
```

## 🔧 开发流程

### 功能修改决策流程

**重要：任何功能修改都必须遵循以下流程**

#### 1. 需求分析阶段
- [ ] 理解用户真实需求和背景
- [ ] 确认修改的必要性和紧急性
- [ ] 分析当前功能状态和问题

#### 2. 影响评估阶段
- [ ] 评估对现有功能的影响
- [ ] 分析对用户体验的影响
- [ ] 识别技术风险和依赖关系
- [ ] 列出需要修改的文件和组件

#### 3. 方案设计阶段
- [ ] 设计2-3个可行方案
- [ ] 分析每个方案的优缺点
- [ ] 评估实施工作量和复杂度
- [ ] 考虑向后兼容性

#### 4. 用户确认阶段
- [ ] 向用户说明分析结果
- [ ] 提供方案对比和推荐
- [ ] 获得用户明确选择
- [ ] 确认实施细节

#### 5. 实施阶段
- [ ] 按确认的方案实施
- [ ] 更新相关文档
- [ ] 进行功能测试
- [ ] 记录变更日志

### 修改已有功能前的检查清单

- [ ] 确认当前功能是否正常工作
- [ ] 确认是否有用户明确的修改要求
- [ ] 完成上述决策流程的所有步骤
- [ ] 确认修改不会破坏现有的音频播放功能
- [ ] 更新相关文档说明修改原因
- [ ] 测试修改后功能的完整性

### 新功能开发原则

1. **不破坏现有功能**: 新功能不得影响已有的音频播放、键盘快捷键等功能
2. **保持一致性**: 新功能的设计应与现有功能保持一致的用户体验
3. **文档先行**: 重要功能修改必须先更新文档，后修改代码
4. **用户确认**: 重要功能变更需要用户明确确认
5. **渐进实施**: 复杂功能分阶段实施，确保每个阶段都可用

## 📝 变更记录

### 2025年8月 - 用户体验优化功能开发

- 实现输入框自动聚焦功能
- 建立多场景聚焦逻辑（单词加载、答案提交、手动切换）
- 优化输入框属性配置（inputMode、autoComplete等）
- 修复API端点不匹配和TypeScript导入问题
- 遵循用户确认流程，快速响应用户需求

### 2025年1月 - 开发流程优化

- 增加功能修改决策流程（5个阶段）
- 建立用户确认机制
- 强化影响评估要求
- 增加方案对比和选择流程
- 创建经验教训文档体系

### 2025年1月 - 音频播放功能规范制定

- 确立有道API音频为首选音频源
- 规定Shift+P键为音频播放快捷键（避免输入冲突）
- 建立音频处理代码保护机制
- 要求完整URL存储，禁止占位符

## 🔗 相关文档

- [经验教训文档](docs/LESSONS_LEARNED.md) - 开发过程中的问题总结和改进建议
- [技术架构文档](docs/ARCHITECTURE.md) - 系统架构设计和技术选择
- [变更日志](docs/CHANGELOG.md) - 项目版本变更记录

---

**重要提醒**: 本文档是开发的重要参考，任何违反此规范的代码修改都可能导致功能回退或用户体验下降。请严格遵守决策流程，确保用户确认后再实施重要变更。