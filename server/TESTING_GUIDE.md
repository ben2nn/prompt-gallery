# 数据库种子数据指南

## 数据源

所有数据从 `https://nana.hrids.com` API 获取：
- 标签: `/api/v1/gallery/tags`
- 提示词: `/api/v1/gallery/prompts`

## 快速开始

### 1. 初始化数据库结构

**本地数据库:**
```bash
npm run db:migrate:local
```

**远程数据库:**
```bash
npm run db:migrate
```

### 2. 导入种子数据

**导入到本地数据库:**
```bash
npm run db:seed:local
```

**导入到远程数据库:**
```bash
npm run db:seed:remote
```

⚠️ 远程导入需要较长时间（约 5-10 分钟），因为需要逐条插入 367 个提示词及其关联数据。

### 3. 测试 API

**测试本地 API:**
```bash
# 启动开发服务器
npm run dev

# 在新终端测试
npm run test:local
```

**测试远程 API:**
```bash
npm run test:remote
```

## 数据统计

从 nana.hrids.com 获取的数据：
- 36 个标签
- 4 个分类
- 367 个提示词
- 每个提示词包含版本、标签和附件信息

## 脚本说明

### seed-local-db.js
- 从 nana.hrids.com 获取数据
- 插入到本地 D1 数据库
- 使用 `--local` 参数
- 速度较快

### seed-remote-db.js
- 从 nana.hrids.com 获取数据
- 插入到远程 Cloudflare D1 数据库
- 使用 `--remote` 参数
- 需要网络连接和 Cloudflare 认证
- 速度较慢（每条 SQL 都需要网络请求）

## 常见问题

### Q: 种子脚本报错 "HTTP error! status: 404"
A: 检查网络连接，确保可以访问 https://nana.hrids.com

### Q: 本地 API 返回空数据
A: 先运行 `npm run db:migrate:local` 再运行 `npm run db:seed:local`

### Q: 远程数据库插入失败
A: 确保已登录 Cloudflare (`wrangler login`) 并且有数据库访问权限

### Q: 想要清空数据库重新导入
**本地:**
```bash
npm run db:migrate:local
npm run db:seed:local
```

**远程:**
```bash
npm run db:migrate
npm run db:seed:remote
```

## 开发工作流

1. 初始化本地数据库: `npm run db:migrate:local`
2. 导入测试数据: `npm run db:seed:local`
3. 启动开发服务器: `npm run dev`
4. 测试 API: `npm run test:local`
5. 部署前更新远程数据库:
   ```bash
   npm run db:migrate
   npm run db:seed:remote
   npm run deploy
   ```
