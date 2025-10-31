#!/bin/bash
# 批量执行 prompt_attachments 迁移

echo "开始执行 prompt_versions 数据迁移..."

for i in {11..19}; do
    echo ""
    echo "执行第 $i 部分..."
    npx wrangler d1 execute -y prompt-gallery-db --remote --file=./migrations/005_prompt_versions_part${i}.sql
    
    if [ $? -eq 0 ]; then
        echo "✓ 第 $i 部分执行成功"
    else
        echo "✗ 第 $i 部分执行失败"
        exit 1
    fi
    
    # 稍微延迟一下，避免请求过快
    sleep 1
done

echo ""
echo "所有迁移执行完成！"
