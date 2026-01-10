# 🔒 Security Setup Instructions

## Immediate Actions Required

### 1. Rotate Exposed Credentials
If credentials were exposed in commit `922b7a9`, you must:
- ✅ **Rotate all database passwords** in Supabase
- ✅ **Rotate any API keys** that were exposed
- ✅ **Check access logs** for unauthorized access

### 2. Install Pre-commit Hooks

**Option A: Using pre-commit (Recommended)**
```bash
pip install pre-commit
pre-commit install
```

**Option B: Using gitleaks**
```bash
# Windows (Chocolatey)
choco install gitleaks

# Or download from: https://github.com/gitleaks/gitleaks/releases
```

**Option C: Manual Git Hook (PowerShell)**
```powershell
# Copy the script to git hooks
Copy-Item scripts/prevent-secrets.ps1 .git/hooks/pre-commit
```

### 3. Verify Setup
```bash
# Test the pre-commit hook
pre-commit run --all-files

# Or test gitleaks
gitleaks detect --source . --verbose
```

## What Was Fixed

1. ✅ **Removed SQL dump files** from git tracking (`app_public.sql`, `supabase_local_dump.sql`)
2. ✅ **Updated .gitignore** to exclude all SQL dumps and sensitive files
3. ✅ **Added pre-commit hooks** to detect secrets before committing
4. ✅ **Created SECURITY.md** with guidelines
5. ✅ **Updated documentation** to use placeholder values (`YOUR_PASSWORD_HERE`)

## Prevention Measures

### Files Now Protected:
- ✅ All `.env*` files (except `.env.example`)
- ✅ All `*.sql` files (except migrations)
- ✅ All `*.dump`, `*.backup` files
- ✅ All `*.secret`, `*.key`, `*.pem` files

### Pre-commit Checks:
- ✅ Detects PostgreSQL connection strings with passwords
- ✅ Detects hardcoded API keys
- ✅ Detects secret keys in code
- ✅ Blocks commits if secrets are found

## Best Practices

1. **Always use environment variables** for secrets
2. **Never commit** `.env` files
3. **Use `.env.example`** with placeholder values
4. **Run pre-commit checks** before pushing
5. **Review diffs** before committing

## If Secrets Are Exposed Again

1. **Immediately rotate** the exposed credentials
2. **Remove from git history** (coordinate with team):
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch path/to/file" \
     --prune-empty --tag-name-filter cat -- --all
   ```
3. **Force push** (⚠️ coordinate with team first)
4. **Notify team** to re-clone repository

