#!/bin/bash

# 代理设置脚本
# 用于设置系统代理到 127.0.0.1:10808

PROXY_HOST="127.0.0.1"
PROXY_PORT="10808"
PROXY_URL="http://${PROXY_HOST}:${PROXY_PORT}"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查代理是否可用
check_proxy() {
    echo -e "${YELLOW}检查代理连接...${NC}"
    if curl -s --connect-timeout 5 --proxy $PROXY_URL http://www.google.com > /dev/null 2>&1; then
        echo -e "${GREEN}代理连接正常${NC}"
        return 0
    else
        echo -e "${RED}代理连接失败，请检查代理服务是否启动${NC}"
        return 1
    fi
}

# 设置环境变量代理
set_env_proxy() {
    echo -e "${YELLOW}设置环境变量代理...${NC}"
    export http_proxy=$PROXY_URL
    export https_proxy=$PROXY_URL
    export HTTP_PROXY=$PROXY_URL
    export HTTPS_PROXY=$PROXY_URL
    export no_proxy="localhost,127.0.0.1,::1"
    export NO_PROXY="localhost,127.0.0.1,::1"
    echo -e "${GREEN}环境变量代理已设置${NC}"
}

# 取消环境变量代理
unset_env_proxy() {
    echo -e "${YELLOW}取消环境变量代理...${NC}"
    unset http_proxy
    unset https_proxy
    unset HTTP_PROXY
    unset HTTPS_PROXY
    unset no_proxy
    unset NO_PROXY
    echo -e "${GREEN}环境变量代理已取消${NC}"
}

# 设置 Git 代理
set_git_proxy() {
    echo -e "${YELLOW}设置 Git 代理...${NC}"
    git config --global http.proxy $PROXY_URL
    git config --global https.proxy $PROXY_URL
    echo -e "${GREEN}Git 代理已设置${NC}"
}

# 取消 Git 代理
unset_git_proxy() {
    echo -e "${YELLOW}取消 Git 代理...${NC}"
    git config --global --unset http.proxy
    git config --global --unset https.proxy
    echo -e "${GREEN}Git 代理已取消${NC}"
}

# 设置 npm 代理
set_npm_proxy() {
    echo -e "${YELLOW}设置 npm 代理...${NC}"
    npm config set proxy $PROXY_URL
    npm config set https-proxy $PROXY_URL
    npm config set registry https://registry.npmjs.org/
    echo -e "${GREEN}npm 代理已设置${NC}"
}

# 取消 npm 代理
unset_npm_proxy() {
    echo -e "${YELLOW}取消 npm 代理...${NC}"
    npm config delete proxy
    npm config delete https-proxy
    echo -e "${GREEN}npm 代理已取消${NC}"
}

# 设置 pip 代理
set_pip_proxy() {
    echo -e "${YELLOW}设置 pip 代理...${NC}"
    mkdir -p ~/.pip
    cat > ~/.pip/pip.conf << EOF
[global]
proxy = $PROXY_URL
trusted-host = pypi.org
               pypi.python.org
               files.pythonhosted.org
EOF
    echo -e "${GREEN}pip 代理已设置${NC}"
}

# 取消 pip 代理
unset_pip_proxy() {
    echo -e "${YELLOW}取消 pip 代理...${NC}"
    if [ -f ~/.pip/pip.conf ]; then
        rm ~/.pip/pip.conf
    fi
    echo -e "${GREEN}pip 代理已取消${NC}"
}

# 显示当前代理状态
show_status() {
    echo -e "${YELLOW}当前代理状态:${NC}"
    echo "环境变量:"
    echo "  http_proxy: ${http_proxy:-未设置}"
    echo "  https_proxy: ${https_proxy:-未设置}"
    echo "Git 代理:"
    git config --global --get http.proxy || echo "  未设置"
    echo "npm 代理:"
    npm config get proxy || echo "  未设置"
    echo "pip 代理:"
    if [ -f ~/.pip/pip.conf ]; then
        echo "  已设置"
    else
        echo "  未设置"
    fi
}

# 主菜单
show_menu() {
    echo -e "${GREEN}=== 代理设置工具 ===${NC}"
    echo "代理地址: $PROXY_URL"
    echo ""
    echo "1. 设置所有代理"
    echo "2. 取消所有代理"
    echo "3. 仅设置环境变量代理"
    echo "4. 仅取消环境变量代理"
    echo "5. 设置 Git 代理"
    echo "6. 取消 Git 代理"
    echo "7. 设置 npm 代理"
    echo "8. 取消 npm 代理"
    echo "9. 设置 pip 代理"
    echo "10. 取消 pip 代理"
    echo "11. 检查代理连接"
    echo "12. 显示代理状态"
    echo "0. 退出"
    echo ""
}

# 主程序
main() {
    if [ $# -eq 0 ]; then
        # 交互模式
        while true; do
            show_menu
            read -p "请选择操作 (0-12): " choice
            case $choice in
                1)
                    set_env_proxy
                    set_git_proxy
                    set_npm_proxy
                    set_pip_proxy
                    ;;
                2)
                    unset_env_proxy
                    unset_git_proxy
                    unset_npm_proxy
                    unset_pip_proxy
                    ;;
                3) set_env_proxy ;;
                4) unset_env_proxy ;;
                5) set_git_proxy ;;
                6) unset_git_proxy ;;
                7) set_npm_proxy ;;
        8) unset_npm_proxy ;;
                9) set_pip_proxy ;;
                10) unset_pip_proxy ;;
                11) check_proxy ;;
                12) show_status ;;
                0) echo -e "${GREEN}再见!${NC}"; exit 0 ;;
                *) echo -e "${RED}无效选择，请重新输入${NC}" ;;
            esac
            echo ""
            read -p "按回车键继续..."
            clear
        done
    else
        # 命令行模式
        case $1 in
            "set") 
                set_env_proxy
                set_git_proxy
                set_npm_proxy
                set_pip_proxy
                ;;
            "unset")
                unset_env_proxy
                unset_git_proxy
                unset_npm_proxy
                unset_pip_proxy
                ;;
            "env-set") set_env_proxy ;;
            "env-unset") unset_env_proxy ;;
            "git-set") set_git_proxy ;;
            "git-unset") unset_git_proxy ;;
            "npm-set") set_npm_proxy ;;
        "npm-unset") unset_npm_proxy ;;
            "pip-set") set_pip_proxy ;;
            "pip-unset") unset_pip_proxy ;;
            "check") check_proxy ;;
            "status") show_status ;;
            *)
                echo "用法: $0 [set|unset|env-set|env-unset|git-set|git-unset|npm-set|npm-unset|pip-set|pip-unset|check|status]"
                echo "不带参数运行进入交互模式"
                exit 1
                ;;
        esac
    fi
}

# 运行主程序
main "$@"