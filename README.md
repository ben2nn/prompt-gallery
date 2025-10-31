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


# API 500 错误修复说明

## 问题原因
访问 `https://prompt-gallery-c0z.pages.dev/api/prompts?page=1&limit=30` 返回 500 错误的原因是：

**数据库表未创建** - D1 数据库中缺少必要的表结构（prompts, tags, prompt_versions 等）

## 解决方案
已执行数据库迁移命令：
```bash
npm run db:migrate
```

该命令执行了以下操作：
1. 创建了所有必要的表结构（tags, prompt_classes, prompts, prompt_versions, prompt_tags）
2. 创建了索引以优化查询性能
3. 插入了测试数据（3 个 prompts, 5 个 tags, 3 个 prompt_classes）

## 验证结果
```bash
npx wrangler d1 execute prompt-gallery-db --remote --command "SELECT COUNT(*) as count FROM prompts"
```
结果：3 条记录

## API 现在应该正常工作
- ✅ 数据库表已创建
- ✅ 测试数据已插入
- ✅ API 代码无语法错误
- ✅ 中间件配置正确

## 测试 API
现在可以访问：
- `https://prompt-gallery-c0z.pages.dev/api/prompts?page=1&limit=30`
- `https://prompt-gallery-c0z.pages.dev/api/tags`

## 注意事项
如果将来需要重置数据库，请再次运行：
```bash
npm run db:migrate
```
