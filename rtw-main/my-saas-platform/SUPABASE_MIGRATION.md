# Supabase Local to Cloud Migration Guide

## Prerequisites

1. **Get local database password:**
   ```powershell
   supabase status
   ```
   Look for the `DB Password` value.

2. **Get Supabase Cloud connection string:**
   - Go to Supabase Cloud Dashboard → Project Settings → Database
   - Copy the "Connection string" (URI format)
   - Format: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require`

## Step 1: Dump Local Database

### Get Database Password
```powershell
# Run this to get the password
supabase status
```

### Create Dump File
```powershell
# Set your local database password
$env:PGPASSWORD = "your-local-password-from-supabase-status"

# Create dump using Docker
docker run --rm `
  -e PGPASSWORD=$env:PGPASSWORD `
  -v ${PWD}:/backup `
  postgres:16 `
  pg_dump -h host.docker.internal -p 54322 -U postgres -d postgres `
  --no-owner --no-acl --clean --if-exists `
  -f /backup/supabase_local_dump.sql
```

**Alternative (if password has special characters):**
```powershell
docker run --rm `
  -e PGPASSWORD="your-password-here" `
  -v ${PWD}:/backup `
  postgres:16 `
  pg_dump -h host.docker.internal -p 54322 -U postgres -d postgres `
  --no-owner --no-acl --clean --if-exists `
  -f /backup/supabase_local_dump.sql
```

**Flags explained:**
- `--no-owner`: Don't output commands to set ownership
- `--no-acl`: Don't output ACL (access control) commands
- `--clean`: Include DROP statements before CREATE
- `--if-exists`: Use IF EXISTS for DROP statements (safer)

## Step 2: Verify Dump File

```powershell
# Check file exists and size
Get-Item supabase_local_dump.sql | Select-Object Name, Length, LastWriteTime

# Check file content (first 50 lines)
Get-Content supabase_local_dump.sql -Head 50
```

**Expected output:**
- File should exist in current directory
- Size should be > 0 bytes (typically several MB for a real database)
- Should start with `--` comments and `CREATE` statements

## Step 3: Restore to Supabase Cloud

### Set Cloud Connection String
```powershell
# Set your Supabase Cloud connection string
$env:SUPABASE_CLOUD_URI = "postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require"
```

### Restore Database
```powershell
# Restore dump to Supabase Cloud
docker run --rm `
  -v ${PWD}:/backup `
  -e PGPASSWORD="your-cloud-password" `
  postgres:16 `
  psql "$env:SUPABASE_CLOUD_URI" `
  -f /backup/supabase_local_dump.sql
```

**Alternative (if connection string has special characters):**
```powershell
# Extract password from connection string and use separately
$cloudUri = "postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
$cloudPassword = "your-cloud-password"

docker run --rm `
  -v ${PWD}:/backup `
  -e PGPASSWORD=$cloudPassword `
  postgres:16 `
  psql "$cloudUri?sslmode=require" `
  -f /backup/supabase_local_dump.sql
```

## Step 4: Verify Restoration

### Check Tables Exist
```powershell
# Connect and list tables
docker run --rm `
  -e PGPASSWORD="your-cloud-password" `
  postgres:16 `
  psql "$env:SUPABASE_CLOUD_URI" `
  -c "\dt"
```

### Check Row Counts
```powershell
# Count rows in key tables (adjust table names as needed)
docker run --rm `
  -e PGPASSWORD="your-cloud-password" `
  postgres:16 `
  psql "$env:SUPABASE_CLOUD_URI" `
  -c "SELECT schemaname, tablename, n_tup_ins as row_count FROM pg_stat_user_tables ORDER BY tablename;"
```

### Verify Payload CMS Collections
```powershell
# Check if Payload collections exist
docker run --rm `
  -e PGPASSWORD="your-cloud-password" `
  postgres:16 `
  psql "$env:SUPABASE_CLOUD_URI" `
  -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'payload_%';"
```

## Step 5: Enable pgvector Extension

Supabase Cloud requires enabling pgvector manually:

1. **Via Supabase Dashboard:**
   - Go to Database → Extensions
   - Search for "vector"
   - Click "Enable" on `pgvector`

2. **Via SQL Editor:**
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

3. **Via Docker (if needed):**
   ```powershell
   docker run --rm `
     -e PGPASSWORD="your-cloud-password" `
     postgres:16 `
     psql "$env:SUPABASE_CLOUD_URI" `
     -c "CREATE EXTENSION IF NOT EXISTS vector;"
   ```

## Complete Migration Script

Save this as `migrate-to-cloud.ps1`:

```powershell
# Supabase Local to Cloud Migration Script
# Usage: .\migrate-to-cloud.ps1

param(
    [Parameter(Mandatory=$true)]
    [string]$LocalPassword,
    
    [Parameter(Mandatory=$true)]
    [string]$CloudConnectionString
)

Write-Host "Step 1: Creating database dump..." -ForegroundColor Green

docker run --rm `
  -e PGPASSWORD=$LocalPassword `
  -v ${PWD}:/backup `
  postgres:16 `
  pg_dump -h host.docker.internal -p 54322 -U postgres -d postgres `
  --no-owner --no-acl --clean --if-exists `
  -f /backup/supabase_local_dump.sql

if ($LASTEXITCODE -ne 0) {
    Write-Host "Dump failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Step 2: Verifying dump file..." -ForegroundColor Green
$dumpFile = Get-Item supabase_local_dump.sql -ErrorAction SilentlyContinue
if (-not $dumpFile) {
    Write-Host "Dump file not found!" -ForegroundColor Red
    exit 1
}
Write-Host "Dump file size: $($dumpFile.Length) bytes" -ForegroundColor Cyan

Write-Host "Step 3: Restoring to Supabase Cloud..." -ForegroundColor Green

docker run --rm `
  -v ${PWD}:/backup `
  postgres:16 `
  psql "$CloudConnectionString" `
  -f /backup/supabase_local_dump.sql

if ($LASTEXITCODE -ne 0) {
    Write-Host "Restore failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Step 4: Enabling pgvector extension..." -ForegroundColor Green

docker run --rm `
  postgres:16 `
  psql "$CloudConnectionString" `
  -c "CREATE EXTENSION IF NOT EXISTS vector;"

Write-Host "Migration completed successfully!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update your .env file with the Supabase Cloud connection string"
Write-Host "2. Test your application connection"
Write-Host "3. Verify all data is present"
```

**Usage:**
```powershell
.\migrate-to-cloud.ps1 -LocalPassword "your-local-password" -CloudConnectionString "postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require"
```

## Troubleshooting

### Issue: "connection refused" or "host.docker.internal not found"
**Solution:** Ensure Docker Desktop is running and `host.docker.internal` is available (Windows 10/11 should have this by default).

### Issue: "password authentication failed"
**Solution:** 
- Verify password from `supabase status`
- Check for special characters that need escaping
- Try using `PGPASSWORD` environment variable

### Issue: "SSL connection required"
**Solution:** Ensure `sslmode=require` is in your connection string.

### Issue: "extension vector does not exist"
**Solution:** Enable pgvector via Supabase Dashboard → Database → Extensions.

### Issue: "relation already exists"
**Solution:** The dump includes `--clean --if-exists` flags. If issues persist, you may need to drop existing tables first (be careful!).

## Post-Migration Checklist

- [ ] Dump file created and verified
- [ ] All tables restored to cloud
- [ ] Row counts match between local and cloud
- [ ] pgvector extension enabled
- [ ] Updated `.env` with cloud connection string
- [ ] Tested application connection
- [ ] Verified Payload CMS collections exist
- [ ] Tested authentication flow
- [ ] Verified file uploads work (if using Supabase Storage)

## Security Notes

⚠️ **Important:**
- Never commit connection strings or passwords to git
- Use environment variables for sensitive data
- The dump file contains all your data - keep it secure
- Delete dump files after successful migration if no longer needed

## Next Steps After Migration

1. **Update Environment Variables:**
   ```env
   DATABASE_URI=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require
   ```

2. **Update Next.js App:**
   - Restart your development server
   - Test database connections
   - Verify Payload CMS admin panel works

3. **Update Vercel (if deployed):**
   - Add new `DATABASE_URI` to Vercel environment variables
   - Redeploy application

