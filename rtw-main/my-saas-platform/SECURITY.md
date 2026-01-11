# Security Guidelines

## Protecting Credentials and Secrets

### Never Commit:
- ✅ Database connection strings with real passwords
- ✅ API keys or tokens
- ✅ Private keys or certificates
- ✅ Environment files (`.env`, `.env.local`, etc.)
- ✅ Database dumps (`.sql`, `.dump` files)
- ✅ Configuration files with hardcoded secrets

### Always Use:
- ✅ Environment variables for all secrets
- ✅ `.env.example` files with placeholder values
- ✅ Secret management services (Vercel Secrets, AWS Secrets Manager, etc.)
- ✅ Placeholder text like `YOUR_PASSWORD_HERE` in documentation

### Pre-commit Checks

This repository uses pre-commit hooks to detect secrets before committing:

1. **Install pre-commit** (if not already installed):
   ```bash
   pip install pre-commit
   pre-commit install
   ```

2. **Install gitleaks** (alternative):
   ```bash
   # Windows (using Chocolatey)
   choco install gitleaks
   
   # Or download from: https://github.com/gitleaks/gitleaks/releases
   ```

3. **Run checks manually**:
   ```bash
   pre-commit run --all-files
   # or
   gitleaks detect --source . --verbose
   ```

### If You Accidentally Commit Secrets

1. **Immediately rotate the exposed credentials**
2. **Remove from git history**:
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch path/to/file" \
     --prune-empty --tag-name-filter cat -- --all
   ```
3. **Force push** (coordinate with team first):
   ```bash
   git push origin --force --all
   ```
4. **Notify team members** to re-clone the repository

### Environment Variables

All sensitive configuration should be in `.env` files (which are gitignored):

```env
# .env (DO NOT COMMIT)
DATABASE_URI=postgresql://user:password@host:port/db
API_KEY=your-api-key-here
SECRET_KEY=your-secret-key-here
```

Use `.env.example` for documentation:

```env
# .env.example (SAFE TO COMMIT)
DATABASE_URI=postgresql://user:YOUR_PASSWORD_HERE@host:port/db
API_KEY=your-api-key-here
SECRET_KEY=your-secret-key-here
```



