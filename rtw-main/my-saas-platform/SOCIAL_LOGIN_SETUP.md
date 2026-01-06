# Social Login Implementation Guide

## Overview

Social login has been implemented using NextAuth (Auth.js) with Google and LinkedIn OAuth providers. The implementation bridges OAuth authentication to Payload Auth using the Pattern A endpoint (`/api/users/social-login`).

## Environment Variables

Add these to your `.env` file:

```bash
# NextAuth (Auth.js)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-min-32-chars

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
```

### Generating NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

## OAuth Provider Setup

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Configure:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google` (dev)
   - Authorized redirect URIs: `https://yourdomain.com/api/auth/callback/google` (prod)
6. Copy Client ID and Client Secret to `.env`

### LinkedIn OAuth

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. In "Auth" tab, add redirect URLs:
   - `http://localhost:3000/api/auth/callback/linkedin` (dev)
   - `https://yourdomain.com/api/auth/callback/linkedin` (prod)
4. Request these products:
   - Sign In with LinkedIn using OpenID Connect
   - Email Address
5. Copy Client ID and Client Secret to `.env`

## Files Created/Modified

### Created Files

1. **`src/app/api/auth/[...nextauth]/route.ts`**
   - NextAuth route handler
   - Configures Google and LinkedIn providers
   - Handles user creation/linking in Payload
   - Generates JWT tokens for Pattern A

2. **`src/app/api/auth/generate-social-token/route.ts`**
   - Server-side token generation endpoint
   - Creates short-lived JWT signed with PAYLOAD_SECRET

3. **`src/app/[locale]/(frontend)/(auth)/auth/social/callback/page.tsx`**
   - OAuth callback page
   - Exchanges token via Pattern A
   - Redirects to dashboard

4. **`src/components/providers/SessionProvider.tsx`**
   - NextAuth SessionProvider wrapper

### Modified Files

1. **`src/components/auth/login-form.tsx`**
   - Added "Continue with Google" and "Continue with LinkedIn" buttons
   - Uses NextAuth `signIn()` function

2. **`src/components/auth/logout-button.tsx`**
   - Updated to clear NextAuth session on logout

3. **`src/lib/auth.ts`**
   - Updated `clearAuthCookies()` to also clear NextAuth cookies

4. **`src/app/[locale]/layout.tsx`**
   - Added SessionProvider wrapper

## How It Works

### Flow

1. **User clicks "Continue with Google/LinkedIn"**
   - `signIn('google')` or `signIn('linkedin')` is called
   - User is redirected to OAuth provider

2. **OAuth Provider authenticates user**
   - User grants permissions
   - Provider redirects back to NextAuth callback

3. **NextAuth `signIn` callback**
   - Extracts email from OAuth profile
   - Finds or creates user in Payload (users collection)
   - Returns user ID for JWT generation

4. **NextAuth `jwt` callback**
   - Stores user ID and email in JWT token

5. **NextAuth `session` callback**
   - Adds user ID to session object

6. **Callback page (`/auth/social/callback`)**
   - Gets user ID from NextAuth session
   - Calls `/api/auth/generate-social-token` to create short-lived token
   - Calls Pattern A endpoint (`/api/users/social-login`) with token
   - Pattern A creates Payload auth session (cookie)
   - User is redirected to dashboard

### User Creation

- **New users**: Created in `users` collection with:
  - Email from OAuth provider
  - Random secure password (user never needs it)
  - `role: 'user'` (default)
  - `emailVerified: true` (OAuth emails are pre-verified)

- **Existing users**: Found by email across:
  - `users` collection
  - `candidates` collection
  - `employers` collection

### Security

✅ **No password stored or required** for social login users  
✅ **No provider access tokens stored** in Payload  
✅ **Short-lived tokens** (5 minutes) for Pattern A  
✅ **Server-side token generation** (PAYLOAD_SECRET never exposed)  
✅ **Email-based linking** (no provider account IDs stored)  

## Testing

### 1. Test Google Login

```bash
# 1. Start dev server
pnpm dev

# 2. Navigate to login page
# 3. Click "Continue with Google"
# 4. Complete OAuth flow
# 5. Should redirect to dashboard with Payload auth cookie set
```

### 2. Test LinkedIn Login

```bash
# Same as Google, but click "Continue with LinkedIn"
```

### 3. Test Existing User Login

```bash
# 1. Create user via email/password registration
# 2. Logout
# 3. Login with Google/LinkedIn using same email
# 4. Should link to existing user (no duplicate created)
```

### 4. Verify Email/Password Login Still Works

```bash
# 1. Use existing email/password login form
# 2. Should work exactly as before
# 3. No changes to existing auth flow
```

## Troubleshooting

### "No email provided by OAuth provider"

- Check OAuth provider scopes are correct
- Verify provider app permissions include email

### "User not found" after OAuth

- Check Payload database connection
- Verify user creation in NextAuth callback
- Check server logs for errors

### "Token verification failed"

- Verify `PAYLOAD_SECRET` is set correctly
- Check token generation endpoint is accessible
- Ensure token hasn't expired (5 min limit)

### NextAuth session not persisting

- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Ensure cookies are not blocked

## Production Checklist

- [ ] Set `NEXTAUTH_URL` to production domain
- [ ] Generate secure `NEXTAUTH_SECRET` (32+ chars)
- [ ] Configure OAuth redirect URIs for production
- [ ] Test OAuth flow in production environment
- [ ] Verify HTTPS is enabled (required for secure cookies)
- [ ] Test logout clears both NextAuth and Payload sessions

## Notes

- **No password required**: Social login users have random passwords they never need
- **Email linking**: Users are linked by email, not provider account ID
- **Multiple providers**: Same email can use Google or LinkedIn (both link to same user)
- **Existing auth unchanged**: Email/password login continues to work normally
- **Onboarding**: Users created via social login may need to complete profile (check in callback page)


