# Vercel Database Connection Troubleshooting

## Issue: Password Authentication Failed After Password Change

### Step 1: Verify Environment Variable on Vercel

1. **Go to Vercel Dashboard**:
   - Project → Settings → Environment Variables
   - Check that `DATABASE_URI` is set (not just `DATABASE_URL`)
   - Verify it's set for **Production**, **Preview**, and **Development** environments

2. **Check the Connection String Format**:
   ```
   postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres?sslmode=require
   ```
   - Make sure password is **URL-encoded** if it contains special characters
   - Special characters that need encoding: `@`, `#`, `$`, `%`, `&`, `+`, `=`, `?`, `/`, `:`

### Step 2: URL Encode Password (If Needed)

If your password contains special characters, encode them:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `=` → `%3D`
- `?` → `%3F`
- `/` → `%2F`
- `:` → `%3A`

**Example:**
```
Password: MyP@ss#123
Encoded: MyP%40ss%23123
Connection String: postgresql://postgres:MyP%40ss%23123@host:5432/postgres
```

### Step 3: Clear Vercel Build Cache

1. **Redeploy** (this clears cache):
   - Go to Deployments
   - Click "..." on latest deployment
   - Select "Redeploy"

2. **Or trigger a new deployment**:
   - Make a small commit and push
   - This forces a fresh build with new env vars

### Step 4: Verify Connection String

Test your connection string locally first:

```bash
# Test with psql (if installed)
psql "postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres?sslmode=require"

# Or test with Node.js
node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: 'postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres?sslmode=require' }); pool.query('SELECT NOW()').then(r => { console.log('✅ Connected:', r.rows[0]); process.exit(0); }).catch(e => { console.error('❌ Error:', e.message); process.exit(1); });"
```

### Step 5: Check Supabase Connection Settings

1. **Verify you're using the correct connection string**:
   - **For App (Pooler)**: Port 6543
     ```
     postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require
     ```
   - **For Direct Connection**: Port 5432
     ```
     postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres?sslmode=require
     ```

2. **Check Supabase Dashboard**:
   - Settings → Database → Connection String
   - Copy the **exact** connection string
   - Make sure password matches what you set

### Step 6: Common Issues

#### Issue: Using Wrong Environment Variable Name
- ✅ Use: `DATABASE_URI` (Payload expects this)
- ❌ Don't use: `DATABASE_URL` (unless you update payload.config.ts)

#### Issue: Password Not Saved Properly
- Make sure you **saved** the environment variable in Vercel
- Check that it's set for the correct **environment** (Production/Preview)

#### Issue: Build Cache
- Vercel caches builds
- **Redeploy** after changing env vars to clear cache

#### Issue: Special Characters in Password
- **URL encode** special characters
- Or use a password without special characters

### Step 7: Quick Fix Checklist

- [ ] Password changed in Supabase Dashboard
- [ ] `DATABASE_URI` updated in Vercel (not `DATABASE_URL`)
- [ ] Password is URL-encoded if it has special characters
- [ ] Environment variable is set for **Production** environment
- [ ] Redeployed after changing env var
- [ ] Connection string format is correct
- [ ] Using correct port (6543 for pooler, 5432 for direct)

### Step 8: Test Locally First

Before deploying, test the connection string locally:

```bash
# In your .env file
DATABASE_URI=postgresql://postgres:[NEW_PASSWORD]@[HOST]:[PORT]/postgres?sslmode=require

# Then test
pnpm dev
```

If it works locally but not on Vercel, it's an environment variable issue.



