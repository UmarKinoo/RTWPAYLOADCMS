#!/bin/bash
# Pre-commit hook to prevent committing secrets
# Install: chmod +x scripts/prevent-secrets.sh
# Add to .git/hooks/pre-commit: ./scripts/prevent-secrets.sh

echo "🔒 Checking for secrets..."

# Patterns to detect
PATTERNS=(
  "postgresql://[^:]+:[^@]+@"
  "password\s*=\s*['\"][^'\"]+['\"]"
  "PASSWORD\s*=\s*['\"][^'\"]+['\"]"
  "api[_-]?key\s*=\s*['\"][^'\"]+['\"]"
  "secret[_-]?key\s*=\s*['\"][^'\"]+['\"]"
  "DATABASE_URI=postgresql://[^:]+:[^@]+@"
  "DATABASE_URL=postgresql://[^:]+:[^@]+@"
)

FOUND_SECRETS=false

# Check staged files
for file in $(git diff --cached --name-only); do
  if [ -f "$file" ]; then
    for pattern in "${PATTERNS[@]}"; do
      if grep -qiE "$pattern" "$file" 2>/dev/null; then
        echo "❌ Potential secret found in: $file"
        echo "   Pattern: $pattern"
        FOUND_SECRETS=true
      fi
    done
  fi
done

if [ "$FOUND_SECRETS" = true ]; then
  echo ""
  echo "🚨 SECURITY WARNING: Potential secrets detected!"
  echo "   Please review the files above and ensure no real credentials are committed."
  echo "   Use environment variables or placeholder values instead."
  exit 1
fi

echo "✅ No secrets detected"
exit 0



