# 批量执行 prompt_attachments 迁移 (PowerShell 版本)

Write-Host "开始执行 prompt_attachments 数据迁移..." -ForegroundColor Green

for ($i = 1; $i -le 8; $i++) {
    Write-Host ""
    Write-Host "执行第 $i 部分..." -ForegroundColor Cyan
    
    $file = "./migrations/007_prompt_attachments_part$i.sql"
    wrangler d1 execute prompt-gallery-db --remote --file=$file
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ 第 $i 部分执行成功" -ForegroundColor Green
    } else {
        Write-Host "✗ 第 $i 部分执行失败" -ForegroundColor Red
        exit 1
    }
    
    # 稍微延迟一下，避免请求过快
    Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "所有迁移执行完成！" -ForegroundColor Green
