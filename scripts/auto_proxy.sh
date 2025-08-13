#!/bin/bash

# 自动代理设置脚本 - 用于终端启动时自动配置
# 代理地址: 127.0.0.1:10808

PROXY_URL="http://127.0.0.1:10808"

# 静默设置环境变量代理
export http_proxy=$PROXY_URL
export https_proxy=$PROXY_URL
export HTTP_PROXY=$PROXY_URL
export HTTPS_PROXY=$PROXY_URL
export no_proxy="localhost,127.0.0.1,::1"
export NO_PROXY="localhost,127.0.0.1,::1"

# 设置 Git 代理（静默模式）
git config --global http.proxy $PROXY_URL 2>/dev/null
git config --global https.proxy $PROXY_URL 2>/dev/null

# 检查代理是否可用（静默检查）
if curl -s --connect-timeout 3 --proxy $PROXY_URL http://www.google.com > /dev/null 2>&1; then
    echo "✅ 代理已自动配置 (127.0.0.1:10808)"
else
    echo "⚠️  代理配置完成，但连接测试失败 - 请检查代理服务是否启动"
fi

# 显示快捷命令提示
echo "💡 代理管理命令:"
echo "   ./scripts/setup_proxy.sh        # 完整代理管理工具"
echo "   ./scripts/setup_proxy.sh status # 查看代理状态"
echo "   ./scripts/setup_proxy.sh unset  # 取消所有代理"