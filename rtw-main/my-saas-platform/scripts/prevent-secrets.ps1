# Pre-commit hook to prevent committing secrets (PowerShell)
# Install: Add to .git/hooks/pre-commit

Write-Host "🔒 Checking for secrets..." -ForegroundColor Cyan

$patterns = @(
    "postgresql://[^:]+:[^@]+@",
    "password\s*=\s*['`"][^'`"]+['`"]",
    "PASSWORD\s*=\s*['`"][^'`"]+['`"]",
    "api[_-]?key\s*=\s*['`"][^'`"]+['`"]",
    "secret[_-]?key\s*=\s*['`"][^'`"]+['`"]",
    "DATABASE_URI=postgresql://[^:]+:[^@]+@",
    "DATABASE_URL=postgresql://[^:]+:[^@]+@"
)

$foundSecrets = $false

# Get staged files
$stagedFiles = git diff --cached --name-only

foreach ($file in $stagedFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -ErrorAction SilentlyContinue
        if ($content) {
            foreach ($pattern in $patterns) {
                if ($content -match $pattern) {
                    Write-Host "❌ Potential secret found in: $file" -ForegroundColor Red
                    Write-Host "   Pattern: $pattern" -ForegroundColor Yellow
                    $foundSecrets = $true
                }
            }
        }
    }
}

if ($foundSecrets) {
    Write-Host ""
    Write-Host "🚨 SECURITY WARNING: Potential secrets detected!" -ForegroundColor Red
    Write-Host "   Please review the files above and ensure no real credentials are committed." -ForegroundColor Yellow
    Write-Host "   Use environment variables or placeholder values instead." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ No secrets detected" -ForegroundColor Green
exit 0

