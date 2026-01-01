# WSL Migration Guide - Supabase Local to Cloud

## Prerequisites

1. **WSL with Ubuntu/Debian installed** (not docker-desktop distro)
2. **Docker Desktop WSL2 integration enabled**

### Check WSL Distributions

```powershell
wsl --list --verbose
```

### Install Ubuntu (if needed)

```powershell
wsl --install -d Ubuntu
```

### Enable Docker Desktop WSL2 Integration

1. Open Docker Desktop
2. Go to Settings → Resources → WSL Integration
3. Enable integration for your Ubuntu distribution
4. Click "Apply & Restart"

## Method 1: Using WSL Script (Recommended)

### Step 1: Copy Script to WSL

The script is already in your project. In WSL:

```bash
# Navigate to project in WSL
cd /mnt/c/Users/UmarKinoo/rtw-payload/rtw-main/my-saas-platform

# Make script executable
chmod +x restore-via-wsl.sh

# Run the script
bash restore-via-wsl.sh
```

## Method 2: Manual WSL Commands

### Step 1: Open WSL (Ubuntu)

```powershell
wsl -d Ubuntu
```

### Step 2: Navigate to Project

```bash
cd /mnt/c/Users/UmarKinoo/rtw-payload/rtw-main/my-saas-platform
```

### Step 3: Test Connection

```bash
docker run --rm \
  -e PGPASSWORD='WPcjhV*XW5_!kJ&' \
  postgres:17 \
  psql -h db.gyvstzmebvmcrhxoxldc.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  -c "SELECT version();" \
  "sslmode=require"
```

### Step 4: Restore Database

```bash
docker run --rm \
  -v $(pwd):/backup \
  -e PGPASSWORD='WPcjhV*XW5_!kJ&' \
  postgres:17 \
  psql -h db.gyvstzmebvmcrhxoxldc.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  -f /backup/supabase_local_dump.sql \
  "sslmode=require"
```

### Step 5: Enable pgvector

```bash
docker run --rm \
  -e PGPASSWORD='WPcjhV*XW5_!kJ&' \
  postgres:17 \
  psql -h db.gyvstzmebvmcrhxoxldc.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  -c "CREATE EXTENSION IF NOT EXISTS vector;" \
  "sslmode=require"
```

## Why WSL Works Better

✅ **Better Networking**: WSL2 has native Linux networking that works with external services  
✅ **No IPv6 Issues**: WSL handles network connections more reliably  
✅ **Docker Integration**: Docker Desktop integrates seamlessly with WSL2  
✅ **Native Linux Tools**: Access to full Linux toolchain  

## Troubleshooting

### Issue: "Docker is not installed"

**Solution:**
```bash
# In WSL, check if Docker is accessible
docker --version

# If not, ensure Docker Desktop WSL2 integration is enabled
# Docker Desktop → Settings → Resources → WSL Integration
```

### Issue: "Permission denied" on dump file

**Solution:**
```bash
# Fix file permissions
chmod 644 /mnt/c/Users/UmarKinoo/rtw-payload/rtw-main/my-saas-platform/supabase_local_dump.sql
```

### Issue: "Connection refused"

**Solution:**
- Verify Supabase Cloud database is running
- Check firewall settings
- Try using the pooler port (6543) instead

## Quick Commands Reference

```bash
# Test connection
docker run --rm -e PGPASSWORD='WPcjhV*XW5_!kJ&' postgres:17 \
  psql -h db.gyvstzmebvmcrhxoxldc.supabase.co -p 5432 -U postgres -d postgres \
  -c "SELECT 1;" "sslmode=require"

# Restore dump
docker run --rm -v $(pwd):/backup -e PGPASSWORD='WPcjhV*XW5_!kJ&' postgres:17 \
  psql -h db.gyvstzmebvmcrhxoxldc.supabase.co -p 5432 -U postgres -d postgres \
  -f /backup/supabase_local_dump.sql "sslmode=require"

# Enable pgvector
docker run --rm -e PGPASSWORD='WPcjhV*XW5_!kJ&' postgres:17 \
  psql -h db.gyvstzmebvmcrhxoxldc.supabase.co -p 5432 -U postgres -d postgres \
  -c "CREATE EXTENSION IF NOT EXISTS vector;" "sslmode=require"
```

