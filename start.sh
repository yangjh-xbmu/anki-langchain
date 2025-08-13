#!/bin/bash

# Anki单词练习应用一键启动脚本

echo "🚀 启动 Anki 单词练习应用..."
echo "================================"

# 代理配置
PROXY_HOST="127.0.0.1"
PROXY_PORT="10808"
PROXY_URL="http://${PROXY_HOST}:${PROXY_PORT}"

# 自动配置代理函数
setup_proxy() {
    echo "🌐 配置网络代理..."
    
    # 设置环境变量代理
    export http_proxy=$PROXY_URL
    export https_proxy=$PROXY_URL
    export HTTP_PROXY=$PROXY_URL
    export HTTPS_PROXY=$PROXY_URL
    export no_proxy="localhost,127.0.0.1,::1"
    export NO_PROXY="localhost,127.0.0.1,::1"
    
    # 设置 Git 代理（静默模式）
    git config --global http.proxy $PROXY_URL 2>/dev/null
    git config --global https.proxy $PROXY_URL 2>/dev/null
    
    # 设置 npm 代理（静默模式）
    npm config set proxy $PROXY_URL 2>/dev/null
    npm config set https-proxy $PROXY_URL 2>/dev/null
    
    # 检查代理是否可用
    if curl -s --connect-timeout 3 --proxy $PROXY_URL http://www.google.com > /dev/null 2>&1; then
        echo "   ✅ 代理已配置 ($PROXY_HOST:$PROXY_PORT)"
        return 0
    else
        echo "   ⚠️  代理配置完成，但连接测试失败"
        echo "   💡 提示: 如需手动管理代理，请使用 ./scripts/setup_proxy.sh"
        return 1
    fi
}

# 配置代理
setup_proxy

# 存储子进程PID
PIDS=()

# 清理函数
cleanup() {
    echo ""
    echo "🛑 正在停止所有服务..."
    for pid in "${PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null
            echo "   已停止进程 $pid"
        fi
    done
    echo "✅ 所有服务已停止"
    exit 0
}

# 设置信号处理
trap cleanup SIGINT SIGTERM

# 检查Python是否安装
if ! command -v python &> /dev/null; then
    echo "❌ 错误: 未找到Python，请先安装Python"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到npm，请先安装Node.js"
    echo "   下载地址: https://nodejs.org/"
    exit 1
fi

# 检查后端依赖
if [ ! -d "backend/venv" ]; then
    echo "⚠️  警告: 后端虚拟环境不存在，请先设置后端环境"
    echo "   1. cd backend"
    echo "   2. python -m venv venv"
    echo "   3. source venv/bin/activate (macOS/Linux) 或 venv\\Scripts\\activate (Windows)"
    echo "   4. pip install -r requirements.txt"
    echo ""
    echo "❌ 请先设置后端环境后再运行此脚本"
    exit 1
fi

# 检查前端依赖
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 安装前端依赖..."
    cd frontend && npm install && cd ..
    if [ $? -ne 0 ]; then
        echo "❌ 前端依赖安装失败"
        exit 1
    fi
fi

echo "🎯 后端服务将在: http://localhost:5001"
echo "🌐 前端服务将在: http://localhost:3000"
echo "================================"
echo "按 Ctrl+C 停止所有服务"
echo ""

# 启动后端服务
echo "🔧 启动后端服务..."
cd backend
source venv/bin/activate
python run.py &
BACKEND_PID=$!
PIDS+=("$BACKEND_PID")
cd ..
echo "   后端服务已启动 (PID: $BACKEND_PID)"

# 等待后端启动
sleep 3

# 启动前端服务
echo "🎨 启动前端服务..."
cd frontend
npm run dev &
FRONTEND_PID=$!
PIDS+=("$FRONTEND_PID")
cd ..
echo "   前端服务已启动 (PID: $FRONTEND_PID)"

echo ""
echo "✅ 所有服务已启动完成！"
echo "   - 后端API: http://localhost:5001"
echo "   - 前端应用: http://localhost:3000"
echo "   - 按 Ctrl+C 停止所有服务"
echo ""

# 等待所有子进程
wait