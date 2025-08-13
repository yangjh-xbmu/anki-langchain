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

### 本地访问

- **前端应用**: http://localhost:3000 (或显示的其他端口)
- **后端API**: http://localhost:5001

### 局域网访问

如需在同一WiFi网络的其他设备上访问：

#### 自动配置（推荐）

```bash
# 获取本机IP地址
ifconfig | grep 'inet ' | grep -v '127.0.0.1' | awk '{print $2}' | head -1

# 使用环境变量启动（替换为实际IP地址）
BACKEND_HOST=192.168.2.63 ./start.sh
```

启动后的访问地址：
- **前端应用**: http://192.168.2.63:3000
- **后端API**: http://192.168.2.63:5001

#### 手动配置

1. **修改前端配置**（已配置）：
   ```json
   // frontend/package.json
   "dev": "next dev -H 0.0.0.0"
   ```

2. **设置后端主机**：
   ```bash
   export BACKEND_HOST=你的IP地址
   ./start.sh
   ```

3. **验证配置**：
   - 前端显示：`Network: http://0.0.0.0:3000`
   - 后端显示：`Running on http://192.168.x.x:5001`

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

如果后端端口5001被占用：
```bash
# 查找占用端口的进程
lsof -ti:5001

# 终止占用进程
lsof -ti:5001 | xargs kill -9
```

### 局域网访问问题

#### 问题：其他设备显示"加载单词中"卡住

**原因**：前端无法连接到后端API

**解决方案**：
1. 确认使用了正确的IP地址启动：
   ```bash
   BACKEND_HOST=你的实际IP ./start.sh
   ```

2. 检查防火墙设置，确保允许3000和5001端口访问

3. 验证所有设备连接到同一WiFi网络

4. 重启服务并检查启动日志中的网络配置

#### 问题：无法获取本机IP地址

```bash
# macOS/Linux 获取IP地址的其他方法
hostname -I | awk '{print $1}'  # Linux
ipconfig getifaddr en0          # macOS WiFi
ipconfig getifaddr en1          # macOS 以太网
```

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
