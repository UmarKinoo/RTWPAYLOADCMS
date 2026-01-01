#!/bin/bash
# Supabase Cloud Restore Script for WSL (Ubuntu/Debian)
# Run this in WSL: bash restore-via-wsl.sh

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Supabase Cloud Restore via WSL${NC}"
echo "================================"

# Set connection details
DB_HOST="db.gyvstzmebvmcrhxoxldc.supabase.co"
DB_PORT="5432"
DB_USER="postgres"
DB_NAME="postgres"
DB_PASSWORD="WPcjhV*XW5_!kJ&"
DUMP_FILE="/mnt/c/Users/UmarKinoo/rtw-payload/rtw-main/my-saas-platform/supabase_local_dump.sql"

# Check if dump file exists
if [ ! -f "$DUMP_FILE" ]; then
    echo -e "${RED}Error: Dump file not found at: $DUMP_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}Dump file found: $DUMP_FILE${NC}"
echo -e "${YELLOW}File size: $(du -h "$DUMP_FILE" | cut -f1)${NC}"
echo ""

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed or not in PATH${NC}"
    echo "Please install Docker or enable Docker Desktop WSL2 integration"
    exit 1
fi

echo -e "${GREEN}Step 1: Testing connection to Supabase Cloud...${NC}"
docker run --rm \
  -e PGPASSWORD="$DB_PASSWORD" \
  postgres:17 \
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  -c "SELECT version();" \
  "sslmode=require"

if [ $? -ne 0 ]; then
    echo -e "${RED}Connection test failed!${NC}"
    exit 1
fi

echo -e "${GREEN}Connection successful!${NC}"
echo ""

echo -e "${GREEN}Step 2: Restoring database dump...${NC}"
echo -e "${YELLOW}This may take several minutes for large databases...${NC}"

docker run --rm \
  -v "$(dirname $DUMP_FILE):/backup" \
  -e PGPASSWORD="$DB_PASSWORD" \
  postgres:17 \
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  -f "/backup/$(basename $DUMP_FILE)" \
  "sslmode=require"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Database restore completed successfully!${NC}"
    echo ""
    echo -e "${GREEN}Step 3: Enabling pgvector extension...${NC}"
    
    docker run --rm \
      -e PGPASSWORD="$DB_PASSWORD" \
      postgres:17 \
      psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
      -c "CREATE EXTENSION IF NOT EXISTS vector;" \
      "sslmode=require"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ pgvector extension enabled!${NC}"
    else
        echo -e "${YELLOW}⚠ Warning: Could not enable pgvector. Enable it manually via Supabase Dashboard${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}Migration completed successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Verify tables in Supabase Dashboard → Table Editor"
    echo "2. Update your .env file with the pooler connection string"
    echo "3. Restart your Next.js app"
else
    echo ""
    echo -e "${RED}✗ Database restore failed!${NC}"
    exit 1
fi

