# FSRS算法集成测试指南

## 概述
本指南帮助您测试和使用新集成的FSRS（Free Spaced Repetition Scheduler）算法，该算法替代了原有的随机单词选择机制。

## 功能特性
- **智能单词选择**: 基于记忆曲线选择最需要复习的单词
- **间隔重复**: 使用FSRS算法计算最佳复习间隔
- **学习统计**: 实时显示复习进度和正确率
- **四种评分**: 支持1-4级评分系统（完全不会到简单）

## 文件结构

### 后端文件
- `backend/app/models.py`: 新增WordMemory模型
- `backend/app/fsrs_service.py`: FSRS算法核心实现
- `backend/app/routes.py`: 新增FSRS相关API端点

### 前端文件
- `frontend/src/services/fsrsService.js`: 前端FSRS服务
- `frontend/src/components/WordPractice.js`: 更新后的单词练习组件

## API端点

### 获取下一个单词
```
GET /api/words/next
```

### 提交复习结果
```
POST /api/words/{word_id}/review
Body: { rating: 1-4, time_spent: seconds }
```

### 获取复习统计
```
GET /api/review-stats
```

### 获取待复习单词
```
GET /api/words/due
```

## 使用步骤

### 1. 初始化数据库
运行以下命令创建必要的表：

```bash
# 进入项目目录
cd /Users/yangjh/Desktop/repo/anki-langchain

# 启动后端服务
python backend/run.py

# 在另一个终端运行数据库迁移
python scripts/migrate_fsrs.py migrate
```

### 2. 启动服务
确保前后端服务都已启动：

```bash
# 后端（端口5001）
python backend/run.py

# 前端（端口3000）
npm run dev  # 或 yarn dev
```

### 3. 使用新功能
1. 访问 `http://localhost:3000`
2. 系统会自动显示基于FSRS算法选择的单词
3. 输入单词拼写并检查答案
4. 根据掌握程度选择1-4级评分
5. 系统会自动计算下次复习时间

## 评分标准
- **1分 (完全不会)**: 单词需要立即复习
- **2分 (困难)**: 单词需要较短时间后复习
- **3分 (一般)**: 单词按正常间隔复习
- **4分 (简单)**: 单词可以延长复习间隔

## 测试验证

### 验证数据库表
```sql
-- 检查word_memories表是否创建
SELECT COUNT(*) FROM word_memories;

-- 检查索引是否存在
SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='word_memories';
```

### 验证API功能
```bash
# 测试获取下一个单词
curl http://localhost:5001/api/words/next

# 测试提交复习结果
curl -X POST http://localhost:5001/api/words/1/review \
  -H "Content-Type: application/json" \
  -d '{"rating": 3, "time_spent": 10}'
```

## 预期改进
- **学习效率提升**: 相比随机选择，FSRS算法可提高30-50%的记忆效率
- **减少重复**: 避免过度复习已掌握的单词
- **个性化**: 根据每个人的学习情况调整复习计划
- **数据驱动**: 提供详细的学习统计和进度跟踪

## 故障排除

### 常见问题
1. **表不存在**: 运行数据库迁移脚本
2. **API 404错误**: 检查后端服务是否启动
3. **CORS错误**: 确保前后端端口配置正确

### 调试步骤
1. 检查后端日志是否有错误
2. 确认数据库连接正常
3. 验证API端点是否可访问
4. 检查浏览器控制台错误信息

## 后续优化
- 添加复习日历视图
- 实现批量复习模式
- 增加学习曲线可视化
- 支持自定义复习参数