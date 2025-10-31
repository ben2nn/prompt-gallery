# 本地 D1 数据库种子数据脚本 (PowerShell 版本)
# 从 nana.hrids.com 接口读取数据并更新到 D1 数据库

Write-Host "🌱 开始从 nana.hrids.com 接口读取数据并更新到本地数据库...`n" -ForegroundColor Green

# API 配置
$apiBaseUrl = "https://nana.hrids.com"
$apiEndpoint = "/api/prompts"  # 根据实际接口路径调整
$pageSize = 100  # 每页最大数量

# 从 API 获取数据的函数
function Get-ApiData {
    param([string]$Url)
    
    try {
        Write-Host "📡 正在从 API 获取数据: $Url" -ForegroundColor Cyan
        $response = Invoke-RestMethod -Uri $Url -Method Get -ContentType "application/json"
        Write-Host "✅ 成功获取数据" -ForegroundColor Green
        return $response
    }
    catch {
        Write-Host "❌ 获取 API 数据失败: $_" -ForegroundColor Red
        throw
    }
}

# 分页获取所有数据
function Get-AllApiData {
    param(
        [string]$BaseUrl,
        [string]$Endpoint,
        [int]$PageSize = 100
    )
    
    $allPrompts = @()
    $tags = @()
    $promptClasses = @()
    $page = 1
    $hasMore = $true
    
    Write-Host "📥 开始分页获取远程数据..." -ForegroundColor Yellow
    
    while ($hasMore) {
        # 构建分页 URL（根据实际 API 参数调整，常见的有 page/limit, offset/limit, skip/take 等）
        $url = "$BaseUrl$Endpoint`?page=$page&limit=$PageSize"
        # 或者使用: $url = "$BaseUrl$Endpoint`?offset=$(($page - 1) * $PageSize)&limit=$PageSize"
        
        Write-Host "   第 $page 页..." -ForegroundColor Cyan
        
        try {
            $response = Get-ApiData -Url $url
            
            # 第一次请求时获取 tags 和 classes
            if ($page -eq 1) {
                if ($response.tags) {
                    $tags = $response.tags
                }
                if ($response.classes -or $response.promptClasses) {
                    $promptClasses = if ($response.classes) { $response.classes } else { $response.promptClasses }
                }
            }
            
            # 获取当前页的 prompts
            $currentPrompts = @()
            if ($response.prompts) {
                $currentPrompts = $response.prompts
            }
            elseif ($response.data) {
                $currentPrompts = $response.data
            }
            elseif ($response -is [Array]) {
                $currentPrompts = $response
            }
            
            if ($currentPrompts.Count -gt 0) {
                $allPrompts += $currentPrompts
                Write-Host "   ✓ 获取 $($currentPrompts.Count) 个提示词 (累计: $($allPrompts.Count))" -ForegroundColor Green
            }
            
            # 判断是否还有更多数据
            if ($currentPrompts.Count -lt $PageSize) {
                $hasMore = $false
            }
            elseif ($response.hasMore -ne $null) {
                $hasMore = $response.hasMore
            }
            elseif ($response.total -ne $null) {
                $hasMore = $allPrompts.Count -lt $response.total
            }
            else {
                # 如果没有明确的分页信息，当返回数量小于 pageSize 时停止
                $hasMore = $currentPrompts.Count -eq $PageSize
            }
            
            $page++
            
            # 添加短暂延迟避免请求过快
            Start-Sleep -Milliseconds 200
        }
        catch {
            Write-Host "⚠️  获取第 $page 页数据失败，停止分页" -ForegroundColor Yellow
            $hasMore = $false
        }
    }
    
    Write-Host "`n📊 获取到的数据统计:" -ForegroundColor Yellow
    Write-Host "   - 标签: $($tags.Count) 个"
    Write-Host "   - 分类: $($promptClasses.Count) 个"
    Write-Host "   - 提示词: $($allPrompts.Count) 个`n"
    
    return @{
        tags = $tags
        promptClasses = $promptClasses
        prompts = $allPrompts
    }
}

# 获取所有数据
$apiData = Get-AllApiData -BaseUrl $apiBaseUrl -Endpoint $apiEndpoint -PageSize $pageSize

$tags = $apiData.tags
$promptClasses = $apiData.promptClasses
$prompts = $apiData.prompts

# 执行 SQL 命令的函数
function Invoke-D1SQL {
    param([string]$SQL)
    
    # 转义单引号
    $escapedSQL = $SQL -replace "'", "''"
    $escapedSQL = $escapedSQL -replace '"', '\"'
    $command = "npx wrangler d1 execute prompt-gallery-db --local --command=`"$escapedSQL`""
    
    try {
        Invoke-Expression $command | Out-Null
    }
    catch {
        Write-Host "❌ 执行 SQL 失败: $SQL" -ForegroundColor Red
        Write-Host "错误信息: $_" -ForegroundColor Red
    }
}

# 转义 SQL 字符串的函数
function Escape-SqlString {
    param([string]$Text)
    if ([string]::IsNullOrEmpty($Text)) {
        return ""
    }
    return $Text -replace "'", "''"
}

# 检查数据是否为空
if ($tags.Count -eq 0 -and $promptClasses.Count -eq 0 -and $prompts.Count -eq 0) {
    Write-Host "⚠️  未获取到任何数据，退出脚本" -ForegroundColor Yellow
    exit 1
}

# 插入标签数据
if ($tags.Count -gt 0) {
    Write-Host "📝 插入标签数据..." -ForegroundColor Cyan
    
    foreach ($tag in $tags) {
        $tagName = Escape-SqlString -Text $tag.name
        $tagColor = if ($tag.color) { $tag.color } else { '#999999' }
        $sql = "INSERT OR IGNORE INTO tags (name, color) VALUES ('$tagName', '$tagColor')"
        Invoke-D1SQL -SQL $sql
    }
    
    Write-Host "✅ 成功插入 $($tags.Count) 个标签`n" -ForegroundColor Green
}

# 插入提示词分类数据
if ($promptClasses.Count -gt 0) {
    Write-Host "📝 插入提示词分类数据..." -ForegroundColor Cyan
    
    foreach ($class in $promptClasses) {
        $className = Escape-SqlString -Text $class.name
        $classDesc = Escape-SqlString -Text $class.description
        $sql = "INSERT OR IGNORE INTO prompt_classes (name, description) VALUES ('$className', '$classDesc')"
        Invoke-D1SQL -SQL $sql
    }
    
    Write-Host "✅ 成功插入 $($promptClasses.Count) 个分类`n" -ForegroundColor Green
}

# 创建标签名称到 ID 的映射
$tagNameToId = @{}
$tagResult = Invoke-Expression "npx wrangler d1 execute prompt-gallery-db --local --command=`"SELECT id, name FROM tags`"" 2>$null
if ($tagResult) {
    # 解析输出获取标签 ID（这部分可能需要根据实际输出格式调整）
    Write-Host "📋 已加载标签映射" -ForegroundColor Cyan
}

# 插入提示词数据
if ($prompts.Count -gt 0) {
    Write-Host "�示 插入提示词数据..." -ForegroundColor Cyan
    
    $insertedCount = 0
    foreach ($prompt in $prompts) {
        try {
            # 转义字符串
            $promptName = Escape-SqlString -Text $prompt.name
            $promptDesc = Escape-SqlString -Text $prompt.description
            $promptAuthor = Escape-SqlString -Text $prompt.author
            $mediaType = if ($prompt.media_type) { $prompt.media_type } else { 'image' }
            $classId = if ($prompt.prompt_class_id) { $prompt.prompt_class_id } else { 1 }
            $attachmentUrl = if ($prompt.attachment_url) { Escape-SqlString -Text $prompt.attachment_url } else { '' }
            $thumbnailUrl = if ($prompt.thumbnail_url) { Escape-SqlString -Text $prompt.thumbnail_url } else { '' }
            
            # 插入提示词
            $sql = "INSERT INTO prompts (name, description, author, media_type, prompt_class_id, attachment_url, thumbnail_url) VALUES ('$promptName', '$promptDesc', '$promptAuthor', '$mediaType', $classId, '$attachmentUrl', '$thumbnailUrl')"
            Invoke-D1SQL -SQL $sql
            
            # 获取刚插入的 prompt_id（使用 last_insert_rowid）
            $promptId = $insertedCount + 1
            
            # 插入版本
            if ($prompt.versions) {
                foreach ($version in $prompt.versions) {
                    $versionNum = Escape-SqlString -Text $version.version
                    $content = Escape-SqlString -Text $version.content
                    $contentzh = Escape-SqlString -Text $version.contentzh
                    $sql = "INSERT INTO prompt_versions (prompt_id, version, content, contentzh) VALUES ($promptId, '$versionNum', '$content', '$contentzh')"
                    Invoke-D1SQL -SQL $sql
                }
            }
            
            # 插入标签关联
            if ($prompt.tags) {
                foreach ($tagId in $prompt.tags) {
                    $sql = "INSERT OR IGNORE INTO prompt_tags (prompt_id, tag_id) VALUES ($promptId, $tagId)"
                    Invoke-D1SQL -SQL $sql
                }
            }
            
            $insertedCount++
        }
        catch {
            Write-Host "⚠️  插入提示词失败: $($prompt.name)" -ForegroundColor Yellow
        }
    }
    
    Write-Host "✅ 成功插入 $insertedCount 个提示词及其版本和标签`n" -ForegroundColor Green
}

Write-Host "🎉 数据更新完成！`n" -ForegroundColor Green
Write-Host "📊 最终数据统计:" -ForegroundColor Yellow
Write-Host "   - 标签: $($tags.Count) 个"
Write-Host "   - 分类: $($promptClasses.Count) 个"
Write-Host "   - 提示词: $($prompts.Count) 个"

Write-Host "`n💡 提示: 使用以下命令启动本地开发服务器:" -ForegroundColor Cyan
Write-Host "   npm run dev"
