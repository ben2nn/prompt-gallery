# 快速参考

本地开发常用命令速查表。

## 🚀 快速开始

```bash
# 自动设置本地环境（推荐）
# Windows
..\scripts\setup-local-dev.ps1

# Linux/Mac
bash ../scripts/setup-local-dev.sh
```

## 📦 安装和设置

```bash
# 安装依赖
npm install

# 初始化数据库
npm run db:migrate:local

# 填充测试数据
npm run db:seed:local

# 一键重置数据库
npm run db:reset:local
```

## 🔧 开发服务器

```bash
# 标准 Next.js 开发（不含 D1）
npm run dev

# Cloudflare Pages 开发（含 D1）
npm run dev:pages

# 预览生产构建
npm run preview
```

## 🗄️ 数据库操作

```bash
# 查看所有表
npx wrangler d1 execute prompt-gallery-db --local --command="SELECT name FROM sqlite_master WHERE type='table'"

# 查询标签
npx wrangler d1 execute prompt-gallery-db --local --command="SELECT * FROM tags"

# 查询提示词数量
npx wrangler d1 execute prompt-gallery-db --local --command="SELECT COUNT(*) FROM prompts"

# 执行 SQL 文件
npx wrangler d1 execute prompt-gallery-db --local --file=../migrations/001_initial_schema.sql

# 清空表
npx wrangler d1 execute prompt-gallery-db --local --command="DELETE FROM prompts"
```

## 🧪 测试 API

```bash
# 获取标签
curl http://localhost:3000/api/tags

# 获取提示词列表
curl http://localhost:3000/api/prompts

# 分页查询
curl "http://localhost:3000/api/prompts?page=1&limit=10"

# 标签筛选
curl "http://localhost:3000/api/prompts?tag=1"

# 搜索
curl "http://localhost:3000/api/prompts?search=城市"

# 获取详情
curl http://localhost:3000/api/prompts/1
```

## 🏗️ 构建和部署

```bash
# 构建生产版本
npm run build

# 部署到 Cloudflare Pages
npm run deploy

# 远程数据库迁移
npm run db:migrate:remote
```

## 🐛 调试

```bash
# 查看 Wrangler 版本
npx wrangler --version

# 查看 D1 数据库列表
npx wrangler d1 list

# 查看数据库信息
npx wrangler d1 info prompt-gallery-db

# 启用详细日志
WRANGLER_LOG=debug npm run dev:pages
```

## 🧹 清理

```bash
# 清理构建产物
rm -rf .next
rm -rf .vercel

# 清理本地数据库
rm -rf .wrangler

# 重新安装依赖
rm -rf node_modules
npm install
```

## 📁 重要文件路径

```
gallery/
├── wrangler.toml              # Wrangler 配置
├── package.json               # npm 脚本
├── LOCAL_DEVELOPMENT.md       # 详细开发指南
├── LOCAL_DEV_CHECKLIST.md     # 环境检查清单
├── functions/                 # Pages Functions
│   └── api/                   # API 端点
└── .wrangler/                 # 本地数据库（自动生成）

migrations/
└── 001_initial_schema.sql     # 数据库架构

scripts/
├── seed-local-db.js           # 种子数据脚本
├── seed-local-db.ps1          # 种子数据脚本（PowerShell）
├── setup-local-dev.sh         # 环境设置脚本（Bash）
└── setup-local-dev.ps1        # 环境设置脚本（PowerShell）
```

## 🔗 相关文档

- [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) - 完整开发指南
- [LOCAL_DEV_CHECKLIST.md](./LOCAL_DEV_CHECKLIST.md) - 环境检查清单
- [functions/README.md](./functions/README.md) - API 开发文档
- [../migrations/MIGRATION_GUIDE.md](../migrations/MIGRATION_GUIDE.md) - 数据库迁移指南

## 💡 提示

- 使用 `npm run dev:pages` 进行全栈开发
- 修改 Pages Functions 后需要重启服务器
- 本地数据库存储在 `.wrangler/` 目录
- 使用 `npm run db:reset:local` 快速重置数据库
- 查看 Wrangler 日志以调试问题
