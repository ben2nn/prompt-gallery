# Cloudflare Pages Functions API

本目录包含 Cloudflare Pages Functions 实现的 API 端点，用于从 D1 数据库查询提示词数据。

## 目录结构

```
functions/
├── env.d.ts              # 环境类型定义
├── _middleware.ts        # 全局中间件（CORS、错误处理、日志）
├── api/
│   ├── tags.ts          # GET /api/tags - 获取标签列表
│   ├── prompts.ts       # GET /api/prompts - 获取提示词列表
│   └── prompts/
│       └── [id].ts      # GET /api/prompts/:id - 获取提示词详情
└── utils/
    ├── response.ts      # 响应格式化工具
    ├── query.ts         # 查询参数解析工具
    └── error.ts         # 错误处理工具
```

## API 端点

### 1. 获取标签列表

**端点**: `GET /api/tags`

**响应格式**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "风景",
      "color": "#3B82F6",
      "count": 15,
      "prompt_count": 15,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 2. 获取提示词列表

**端点**: `GET /api/prompts`

**查询参数**:
- `page` (可选): 页码，默认 1
- `limit` (可选): 每页数量，默认 20，最大 100
- `tag` (可选): 标签 ID，用于筛选
- `search` (可选): 搜索关键词

**示例**:
- `/api/prompts?page=1&limit=20`
- `/api/prompts?tag=1`
- `/api/prompts?search=风景`

**响应格式**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "提示词名称",
      "description": "描述",
      "author": "作者",
      "media_type": "image",
      "tags": [
        {
          "id": 1,
          "name": "风景",
          "color": "#3B82F6",
          "created_at": "2024-01-01T00:00:00Z",
          "updated_at": "2024-01-01T00:00:00Z"
        }
      ],
      "prompt_class": {
        "id": 1,
        "name": "分类名称",
        "description": "分类描述",
        "created_at": "",
        "updated_at": ""
      },
      "current_version": {
        "id": 1,
        "prompt_id": 1,
        "version": "1.0",
        "content": "英文内容",
        "contentzh": "中文内容",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
      },
      "attachment_url": "/attachments/file.png",
      "thumbnail_url": "/thumbnails/thumb.png",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 3. 获取提示词详情

**端点**: `GET /api/prompts/:id`

**示例**: `/api/prompts/1`

**响应格式**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "提示词名称",
    "description": "描述",
    "author": "作者",
    "media_type": "image",
    "tags": [...],
    "prompt_class": {...},
    "current_version": {...},
    "versions": [
      {
        "id": 1,
        "prompt_id": 1,
        "version": "1.0",
        "content": "英文内容",
        "contentzh": "中文内容",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
      }
    ],
    "attachment_url": "/attachments/file.png",
    "thumbnail_url": "/thumbnails/thumb.png",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

## 错误响应

所有错误响应遵循统一格式：

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {}
  }
}
```

**错误代码**:
- `NOT_FOUND` (404): 资源未找到
- `BAD_REQUEST` (400): 请求参数错误
- `DATABASE_ERROR` (500): 数据库查询失败
- `INTERNAL_ERROR` (500): 服务器内部错误

## 中间件功能

`_middleware.ts` 提供以下功能：

1. **CORS 支持**: 自动添加 CORS 头，允许跨域请求
2. **请求日志**: 记录所有 API 请求
3. **错误捕获**: 全局错误处理，确保返回统一的错误格式
4. **OPTIONS 处理**: 自动处理预检请求

## 本地开发

使用 Wrangler 在本地测试：

```bash
# 启动本地开发服务器
npm run dev

# 或使用 Wrangler Pages Dev
wrangler pages dev .vercel/output/static --d1 DB=<database-id>
```

## 部署

Functions 会随 Pages 项目自动部署，无需额外配置。确保在 `wrangler.toml` 中正确配置了 D1 数据库绑定。

## 性能优化

- 使用批量查询减少数据库往返次数
- 为常用查询字段创建索引
- 设置适当的缓存头（5 分钟客户端缓存，10 分钟 CDN 缓存）
- 限制分页大小最大为 100

## 注意事项

1. 所有 API 端点都是只读的（GET 请求）
2. 分页参数会自动验证和限制
3. 数据库查询失败会返回友好的错误信息
4. 所有响应都包含 `success` 字段用于判断请求是否成功
