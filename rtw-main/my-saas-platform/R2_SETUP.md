# Cloudflare R2 Storage Setup

This guide explains how to configure Cloudflare R2 storage for your Payload CMS media collection.

## Installation

The `@payloadcms/storage-s3` package is already installed in this project.

## Environment Variables

Add these variables to your `.env` file:

```env
# Cloudflare R2 Storage Configuration
# Get these from: Cloudflare Dashboard > R2 > Manage R2 API Tokens

# Account ID: Found in Cloudflare Dashboard URL or R2 Overview page
R2_ACCOUNT_ID=your-account-id-here

# Access Key ID: From R2 API Token
R2_ACCESS_KEY_ID=your-access-key-id-here

# Secret Access Key: From R2 API Token (keep this secret!)
R2_SECRET_ACCESS_KEY=your-secret-access-key-here

# Bucket Name: Your R2 bucket name
R2_BUCKET_NAME=your-bucket-name

# Optional: Prefix for files in bucket (defaults to 'media')
R2_PREFIX=media
```

## How to Get Your R2 Credentials

1. **Account ID**: 
   - Go to Cloudflare Dashboard
   - Click on any R2 bucket
   - The Account ID is visible in the URL or on the Overview page
   - Format: Usually a 32-character hex string

2. **API Token**:
   - Go to Cloudflare Dashboard > R2 > Manage R2 API Tokens
   - Click "Create API Token"
   - Give it a name (e.g., "Payload CMS Storage")
   - Set permissions: Object Read & Write
   - Select your bucket or "All buckets"
   - Copy the **Access Key ID** and **Secret Access Key**
   - ⚠️ **Important**: The Secret Access Key is only shown once! Save it securely.

3. **Bucket Name**:
   - Create a bucket in Cloudflare R2 (if you haven't already)
   - Use the bucket name exactly as shown

## Configuration Behavior

The storage configuration automatically:

- ✅ **Enables R2** when all R2 environment variables are present
- ✅ **Disables Vercel Blob** when R2 is enabled
- ✅ **Falls back to Vercel Blob** when R2 variables are missing
- ✅ **Uses correct R2 endpoint**: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`

## Testing

After adding the environment variables:

1. Restart your dev server: `pnpm dev`
2. Go to Payload Admin > Media
3. Upload a test image
4. Check your R2 bucket to verify the file was uploaded

## Troubleshooting

### Files not uploading?
- Verify all R2 environment variables are set correctly
- Check that your API token has the correct permissions
- Ensure the bucket name matches exactly (case-sensitive)

### Getting 403 errors?
- Verify your Access Key ID and Secret Access Key are correct
- Check that your API token hasn't expired
- Ensure the token has Object Read & Write permissions

### Still using Vercel Blob?
- Make sure all 4 required R2 variables are set: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`
- Restart your dev server after adding the variables



