# PowerShell script to clean up Next.js lockfiles and processes on Windows

Write-Host "Cleaning up Next.js processes and lockfiles..." -ForegroundColor Yellow

# Stop all Node.js processes
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Stopping $($nodeProcesses.Count) Node.js process(es)..." -ForegroundColor Yellow
    $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "[OK] Node.js processes stopped" -ForegroundColor Green
} else {
    Write-Host "[OK] No Node.js processes found" -ForegroundColor Green
}

# Remove lockfile
$lockFile = ".next\dev\lock"
if (Test-Path $lockFile) {
    try {
        Remove-Item $lockFile -Force -ErrorAction Stop
        Write-Host "[OK] Lock file removed" -ForegroundColor Green
    } catch {
        Write-Host "[WARN] Could not remove lock file: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "[OK] No lock file found" -ForegroundColor Green
}

# Remove .next directory if it exists
if (Test-Path ".next") {
    try {
        $files = Get-ChildItem ".next" -Recurse -File -ErrorAction SilentlyContinue
        foreach ($file in $files) {
            if ($file.IsReadOnly) {
                $file.IsReadOnly = $false
            }
        }
        Remove-Item ".next" -Recurse -Force -ErrorAction Stop
        Write-Host "[OK] .next directory removed" -ForegroundColor Green
    } catch {
        Write-Host "[WARN] Could not remove .next directory: $_" -ForegroundColor Yellow
        Write-Host "  You may need to manually remove it or restart your computer" -ForegroundColor Yellow
    }
} else {
    Write-Host "[OK] .next directory does not exist" -ForegroundColor Green
}

Write-Host ""
Write-Host "Cleanup complete! You can now run 'pnpm dev'" -ForegroundColor Green
