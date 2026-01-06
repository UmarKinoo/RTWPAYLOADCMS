# PowerShell script to push changes to GitHub
# Run this script after installing Git for Windows

Write-Host "🚀 Pushing changes to GitHub..." -ForegroundColor Green

# Navigate to the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# Check if Git is available
try {
    $gitVersion = git --version
    Write-Host "✅ Git found: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Git from: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

# Initialize git repository if not already initialized
if (-not (Test-Path .git)) {
    Write-Host "📦 Initializing git repository..." -ForegroundColor Cyan
    git init
}

# Add all files
Write-Host "📝 Adding files to staging..." -ForegroundColor Cyan
git add .

# Check if there are changes to commit
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "ℹ️  No changes to commit" -ForegroundColor Yellow
    exit 0
}

# Commit changes
Write-Host "💾 Committing changes..." -ForegroundColor Cyan
git commit -m "Implement vector search with group_text embeddings for skills

- Added group_text field to Skills collection
- Updated embedding generation to use composite group_text (Discipline → Category → Subcategory → Skill → Class)
- Implemented vector search with cosine similarity in skills search API
- Updated seed script to generate embeddings from group_text
- Skills search now uses semantic search instead of simple text matching"

# Check if remote exists
$remote = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  No remote repository configured" -ForegroundColor Yellow
    Write-Host "Please add your GitHub repository:" -ForegroundColor Yellow
    Write-Host "  git remote add origin https://github.com/UmarKinoo/your-repo-name.git" -ForegroundColor Cyan
    Write-Host "Then run this script again." -ForegroundColor Yellow
    exit 0
}

# Push to GitHub
Write-Host "📤 Pushing to GitHub..." -ForegroundColor Cyan
git branch -M main 2>$null
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to push to GitHub. Please check your credentials and remote URL." -ForegroundColor Red
}

















