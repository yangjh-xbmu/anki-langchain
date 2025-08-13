# 🚀 Anki单词练习应用 - 一键启动指南

## 快速启动

### 方法一：使用启动脚本（推荐）

```bash
./start.sh
```

### 方法二：手动启动

```bash
# 启动后端（在一个终端中）
cd backend
source venv/bin/activate  # 激活虚拟环境
python run.py

# 启动前端（在另一个终端中）
cd frontend
npm run dev
```

## 启动后访问地址

- **前端应用**: http://localhost:3000 (或显示的其他端口)
- **后端API**: http://localhost:5001

## 首次使用准备

### 1. 后端环境设置

```bash
cd backend
python -m venv venv

# macOS/Linux
source venv/bin/activate

# Windows
venv\Scripts\activate

pip install -r requirements.txt
cd ..
```

### 2. 前端依赖安装

```bash
cd frontend
npm install
cd ..
```

### 3. 根目录依赖安装

```bash
npm install
```

## 可用的启动方式

### 推荐方式

- `./start.sh` - 使用启动脚本（自动检查环境并启动）

### 手动启动

- 前端：`cd frontend && npm run dev`
- 后端：`cd backend && python run.py`

### 依赖安装

- 前端依赖：`cd frontend && npm install`
- 后端依赖：`cd backend && pip install -r requirements.txt`

## 停止服务

在终端中按 `Ctrl + C` 停止所有服务。

## 故障排除

### 端口冲突

如果端口被占用，前端会自动尝试其他端口（3001, 3002等）。

### Python环境问题

确保已激活虚拟环境：

```bash
cd backend
source venv/bin/activate  # macOS/Linux
# 或
venv\Scripts\activate     # Windows
```

### 依赖问题

重新安装依赖：

```bash
# 前端
cd frontend && rm -rf node_modules && npm install

# 后端
cd backend && pip install -r requirements.txt
```

## 开发模式特性

- **热重载**: 前端代码修改后自动刷新
- **调试模式**: 后端运行在调试模式，代码修改后自动重启
- **并行运行**: 前端和后端同时启动，无需分别管理
