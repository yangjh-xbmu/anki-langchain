# npm 配置说明

本项目已全面配置为使用 npm 作为包管理工具，以下是所有相关配置的详细说明。

## 📁 配置文件详解

### 1. `.npmrc` - npm 全局配置

```ini
# npm 配置
# 启用严格模式
strict-peer-dependencies=true

# npm 配置
cache=~/.npm-cache
package-lock=true
engine-strict=true
```

### 2. `frontend/package.json` - 前端项目配置

```json
{
  "engines": {
    "node": ">=16.0.0",
    "npm": ">=8.0.0"
  }
}
```

### 3. `.vscode/settings.json` - VSCode 编辑器配置

```json
{
  "npm.packageManager": "npm"
}
```

### 4. `.vscode/tasks.json` - VSCode 任务配置

包含以下预定义任务：

- `Install Frontend Dependencies`: 使用 `npm install`
- `Start Frontend`: 使用 `npm run dev`

## 🚀 启动脚本配置

### `start.sh` - 一键启动脚本

```bash
# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到npm，请先安装Node.js"
    exit 1
fi

# 安装前端依赖
cd frontend && npm install && cd ..

# 启动前端服务
npm run dev &
```

### `scripts/setup_proxy.sh` - 代理配置脚本

- 检查 npm 是否安装
- 使用 `npm install` 安装前端依赖
- 使用 `npm run dev` 启动服务

## 📖 文档更新

### `README.md`

- 前端安装说明使用 npm
- 故障排除部分包含 npm 相关命令
- 明确说明项目使用 npm

### `STARTUP_GUIDE.md`

- 所有启动命令使用 npm
- 可用脚本说明更新为 npm
- 依赖安装指南使用 npm

## ✅ npm 配置机制

1. **引擎限制**: `package.json` 中的 `engines` 字段限制只能使用 npm >= 8.0.0
2. **npmrc 配置**: `.npmrc` 文件配置 npm 行为
3. **VSCode 集成**: 编辑器配置默认使用 npm
4. **脚本统一**: 所有启动和安装脚本都使用 npm

## 🛠️ 常用命令

### 安装依赖

```bash
# 安装所有依赖
npm install

# 安装前端依赖
cd frontend && npm install

# 使用根目录脚本安装
npm run install
```

### 启动服务

```bash
# 启动前端开发服务器
npm run dev
```

### 添加依赖

```bash
# 添加生产依赖
cd frontend && npm install <package-name>

# 添加开发依赖
cd frontend && npm install -D <package-name>

# 添加全局依赖
npm install -g <package-name>
```

## ⚠️ 注意事项

1. **统一使用 npm**: 项目已配置使用 npm
2. **版本要求**: 确保 npm 版本 >= 8.0.0
3. **锁文件**: 使用 `package-lock.json`
4. **团队协作**: 所有团队成员都应使用 npm 以确保依赖一致性

## 🔍 故障排除

检查 npm 配置是否正确：

```bash
# 检查 npm 版本
npm --version

# 查看 npm 配置
npm config list

# 测试安装（不实际安装）
npm install --dry-run
```
