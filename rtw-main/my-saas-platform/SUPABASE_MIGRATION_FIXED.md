# Supabase Migration - Fixed Approach

## The Problem

**Docker Networking Issue on Windows:**
- Docker is trying to connect via IPv6 (`2a05:d018:...`) which isn't working
- Windows Docker networking has limitations with external connections
- The "Network is unreachable" error is a Docker networking problem, not a Supabase issue

## Solution: Use Supabase SQL Editor (Recommended)

Since Docker networking is problematic, use Supabase's built-in SQL Editor:

### Step 1: Upload Dump File to Supabase

1. **Go to Supabase Dashboard:**
   - Navigate to: SQL Editor → New Query

2. **Copy dump file contents:**
   ```powershell
   # Read the dump file
   Get-Content supabase_local_dump.sql -Raw
   ```

3. **Paste into SQL Editor and run**

**OR use the file upload feature:**
- Some Supabase projects support file upload in SQL Editor
- Check if your project has this feature

## Alternative: Direct Connection (Bypass Docker)

If you want to use command line, install `psql` locally:

### Option A: Install PostgreSQL Client (Recommended)

```powershell
# Using Chocolatey
choco install postgresql --params '/Password:postgres'

# Or download from: https://www.postgresql.org/download/windows/
```

Then restore directly:
```powershell
cd C:\Users\UmarKinoo\rtw-payload\rtw-main\my-saas-platform
$env:PGPASSWORD="WPcjhV*XW5_!kJ&"
psql "postgresql://postgres:WPcjhV*XW5_!kJ&@db.gyvstzmebvmcrhxoxldc.supabase.co:5432/postgres?sslmode=require" -f supabase_local_dump.sql
```

## Direct Connection vs Pooler for Next.js + Payload 3.0

### ✅ **For Your App (Production): Use Pooler (Port 6543)**

**Why?**
- Payload 3.0 uses connection pooling internally via `postgresAdapter`
- Supabase pooler handles connection management better
- Prevents connection exhaustion
- Better for serverless/edge functions
- Recommended by Supabase for production apps

**Connection String Format:**
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require
```

**For your app's `.env`:**
```env
DATABASE_URI=postgresql://postgres.gyvstzmebvmcrhxoxldc:WPcjhV*XW5_!kJ&@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
```

### ⚠️ **For Migrations/Dumps: Use Direct Connection (Port 5432)**

**Why?**
- Direct connection is needed for `pg_dump` and `psql` operations
- Pooler doesn't support all PostgreSQL features needed for migrations
- One-time operations don't need pooling

**Connection String:**
```
postgresql://postgres:WPcjhV*XW5_!kJ&@db.gyvstzmebvmcrhxoxldc.supabase.co:5432/postgres?sslmode=require
```

## Quick Fix: Use Supabase SQL Editor

Since Docker isn't working, here's the easiest approach:

1. **Open your dump file:**
   ```powershell
   notepad supabase_local_dump.sql
   ```

2. **Copy all contents** (Ctrl+A, Ctrl+C)

3. **Go to Supabase Dashboard:**
   - SQL Editor → New Query
   - Paste the SQL
   - Click "Run" or press Ctrl+Enter

4. **Wait for completion** (may take a few minutes for 8.4MB)

5. **Enable pgvector:**
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

## Verify Migration

After restoring, verify in Supabase Dashboard:

1. **Check Tables:**
   - Go to Table Editor
   - You should see all your Payload collections (users, candidates, employers, etc.)

2. **Check Row Counts:**
   - Click on each table
   - Verify data is present

3. **Test Connection:**
   - Update your `.env` with pooler connection string
   - Restart your Next.js app
   - Test Payload admin panel

## Update Your .env File

After migration, update your `.env`:

```env
# Use POOLER connection for your app (port 6543)
# Get this from: Supabase Dashboard → Settings → Database → Connection Pooling
DATABASE_URI=postgresql://postgres.gyvstzmebvmcrhxoxldc:WPcjhV*XW5_!kJ&@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
```

**Note:** Replace `us-east-1` with your actual region. Check Supabase Dashboard for the correct pooler URL.

## Summary

- ✅ **Dump created successfully** (8.4 MB)
- ❌ **Docker restore failed** (Windows networking issue)
- ✅ **Solution: Use Supabase SQL Editor** (web-based, no Docker needed)
- ✅ **For app: Use pooler (6543)** - Better for Next.js + Payload 3.0
- ✅ **For migrations: Use direct (5432)** - When Docker works

The pooler is **definitely recommended** for your Next.js + Payload 3.0 app in production!








