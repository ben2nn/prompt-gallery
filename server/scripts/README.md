# 数据导入脚本

## 概述

这些脚本用于从 API 获取提示词数据并生成 SQL 插入语句。

## 脚本说明

### fetch-and-generate-sql.js

主脚本，用于从 API 获取所有提示词数据并生成 SQL 文件。

**功能：**
- 从 `https://nana.hrids.com/api/v1/gallery/prompts` 获取所有提示词数据（共367条）
- 自动处理分页（每页100条）
- 生成符合数据库表结构的 SQL 插入语句
- 按照外键依赖关系正确排序 SQL 语句

**使用方法：**
```bash
node scripts/fetch-and-generate-sql.js
```

**输出文件：**
`migrations/005_seed_prompts_from_api.sql`

**SQL 执行顺序：**
1. `prompt_classes` - 提示词分类（无依赖）
2. `tags` - 标签（无依赖）
3. `prompts` - 提示词（依赖 prompt_classes）
4. `prompt_versions` - 提示词版本（依赖 prompts）
5. `prompt_tags` - 提示词标签关联（依赖 prompts 和 tags）

### test-api-response.js

测试脚本，用于验证 API 响应格式。

**使用方法：**
```bash
node scripts/test-api-response.js
```

### test-pagination.js

测试脚本，用于验证 API 分页功能。

**使用方法：**
```bash
node scripts/test-pagination.js
```

### test-offset.js

测试脚本，用于验证 API offset 参数。

**使用方法：**
```bash
node scripts/test-offset.js
```

## 数据统计

从 API 获取的数据包括：
- **提示词分类**: 1 个
- **标签**: 36 个
- **提示词**: 367 个
- **提示词版本**: 367 个
- **提示词标签关联**: 1333 个

## 注意事项

1. 脚本使用 `INSERT OR IGNORE` 来避免重复插入分类和标签
2. 提示词使用 `INSERT` 语句，如果需要重新导入，请先清空相关表
3. 所有 SQL 语句都按照外键依赖关系排序，确保数据完整性
4. API 请求之间有 500ms 延迟，避免请求过快
