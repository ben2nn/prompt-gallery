# Run chunked migration files for large SQL migrations
# Usage: .\scripts\run-chunked-migration.ps1 <database-name>

param(
    [Parameter(Mandatory=$true)]
    [string]$DatabaseName
)

$ChunkDir = "migrations/chunks"

# Check if chunks directory exists
if (-not (Test-Path $ChunkDir)) {
    Write-Host "Error: Chunks directory not found at $ChunkDir" -ForegroundColor Red
    Write-Host "Please run 'node scripts/split-large-migration.js' first" -ForegroundColor Yellow
    exit 1
}

# Get all chunk files sorted
$ChunkFiles = Get-ChildItem -Path $ChunkDir -Filter "*.sql" | Sort-Object Name

if ($ChunkFiles.Count -eq 0) {
    Write-Host "Error: No chunk files found in $ChunkDir" -ForegroundColor Red
    exit 1
}

Write-Host "Found $($ChunkFiles.Count) chunk files to execute" -ForegroundColor Green
Write-Host ""

$SuccessCount = 0
$FailCount = 0

foreach ($File in $ChunkFiles) {
    Write-Host "Executing: $($File.Name)..." -ForegroundColor Cyan
    
    try {
        npx wrangler d1 execute $DatabaseName --remote --file="$($File.FullName)"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Success" -ForegroundColor Green
            $SuccessCount++
        } else {
            Write-Host "✗ Failed with exit code $LASTEXITCODE" -ForegroundColor Red
            $FailCount++
        }
    } catch {
        Write-Host "✗ Error: $_" -ForegroundColor Red
        $FailCount++
    }
    
    Write-Host ""
    
    # Small delay to avoid rate limiting
    Start-Sleep -Milliseconds 500
}

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Migration Summary:" -ForegroundColor Cyan
Write-Host "  Successful: $SuccessCount" -ForegroundColor Green
Write-Host "  Failed: $FailCount" -ForegroundColor Red
Write-Host "================================" -ForegroundColor Cyan

if ($FailCount -gt 0) {
    exit 1
}
