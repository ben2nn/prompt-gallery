# Prompt Gallery

AI 提示词画廊 - Cloudflare Pages + D1 数据库

## 技术栈

- Cloudflare Pages Functions
- Cloudflare D1 (SQLite)
- TypeScript

## 开发

```bash
# 安装依赖
npm install

# 初始化本地数据库
npm run db:migrate:local

# 启动开发服务器
npm run dev
```

## 部署

```bash
# 构建并部署到 Cloudflare Pages
npm run deploy

# 初始化生产数据库（首次部署后执行）
npm run db:migrate
```

## API 端点

- `GET /api/prompts` - 获取提示词列表（支持分页、搜索、标签筛选）
- `GET /api/prompts/[id]` - 获取单个提示词详情
- `GET /api/tags` - 获取标签列表

## 项目结构

```
├── functions/          # Cloudflare Pages Functions (编译后的 JS)
│   ├── api/           # API 路由
│   └── utils/         # 工具函数
├── src/               # TypeScript 源码
│   ├── api/           # API 实现
│   └── utils/         # 工具函数
├── migrations/        # 数据库迁移文件
├── public/            # 静态文件
└── wrangler.toml      # Cloudflare 配置
```
