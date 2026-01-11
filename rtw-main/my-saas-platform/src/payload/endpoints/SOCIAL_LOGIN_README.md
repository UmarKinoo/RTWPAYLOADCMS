# Social Login Endpoint Documentation

## Overview

The social login endpoint (`/api/users/social-login`) bridges OAuth authentication to Payload Auth. It accepts a server-signed JWT token, verifies it, and creates a Payload auth session without requiring a password.

## Security Model

### Why PAYLOAD_SECRET?
- **Server-side verification only**: The token must be signed with `PAYLOAD_SECRET`, which is only available server-side
- **No client secrets**: OAuth providers handle their own authentication; this endpoint only bridges to Payload
- **Cryptographic security**: Uses HS256 JWT signing, same as Payload's internal tokens

### Why Short-Lived Tokens?
- **Reduced attack surface**: Short expiration (5-15 minutes recommended) limits exposure if token is intercepted
- **One-time use pattern**: Token should be used immediately after OAuth flow completes
- **No token storage**: Tokens are ephemeral and not stored in the database

## Endpoint Details

**URL**: `POST /api/users/social-login`

**Request Body**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Success - 200)**:
```json
{
  "success": true,
  "message": "Authentication successful",
  "userId": "123"
}
```

**Response (Error - 401)**:
```json
{
  "error": "Invalid or expired token"
}
```

**Response (Error - 404)**:
```json
{
  "error": "User not found"
}
```

## Token Structure

The incoming token must be a JWT signed with `PAYLOAD_SECRET` and contain:

```json
{
  "userId": "123",  // Required: User ID in Payload
  "exp": 1234567890, // Optional: Expiration timestamp
  "iat": 1234567890  // Optional: Issued at timestamp
}
```

## Flow

1. **OAuth Provider** authenticates user (Google/LinkedIn/etc.)
2. **Server** creates short-lived JWT token with `userId`, signed with `PAYLOAD_SECRET`
3. **Client** sends token to `/api/users/social-login`
4. **Endpoint** verifies token, fetches user, creates Payload session
5. **Cookie** is set (`payload-token`), user is authenticated

## Testing

### Manual Testing with curl

```bash
# 1. Generate a test token (server-side script)
# You'll need to create a token signed with PAYLOAD_SECRET
# Example using Node.js:
# const token = await new SignJWT({ userId: '123' })
#   .setProtectedHeader({ alg: 'HS256' })
#   .setExpirationTime('5m')
#   .sign(secretKey)

# 2. Call the endpoint
curl -X POST http://localhost:3000/api/users/social-login \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_TOKEN_HERE"}'

# 3. Check response
# Should return: {"success": true, "message": "Authentication successful", "userId": "123"}

# 4. Verify cookie is set
# Check Set-Cookie header in response
```

### Testing with fetch (JavaScript)

```javascript
const response = await fetch('/api/users/social-login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    token: 'YOUR_TOKEN_HERE',
  }),
});

const data = await response.json();
console.log(data);

// If successful, the payload-token cookie is now set
// Subsequent requests to Payload API will be authenticated
```

### Testing Invalid Token

```bash
# Expired token
curl -X POST http://localhost:3000/api/users/social-login \
  -H "Content-Type: application/json" \
  -d '{"token": "expired_token"}'
# Expected: 401 with "Token has expired"

# Invalid signature
curl -X POST http://localhost:3000/api/users/social-login \
  -H "Content-Type: application/json" \
  -d '{"token": "invalid_token"}'
# Expected: 401 with "Invalid or expired token"

# Missing token
curl -X POST http://localhost:3000/api/users/social-login \
  -H "Content-Type: application/json" \
  -d '{}'
# Expected: 400 with "Token is required and must be a string"
```

## Integration with OAuth Flow

### Example: Google OAuth

```typescript
// After Google OAuth callback
async function handleGoogleCallback(code: string) {
  // 1. Exchange code for Google tokens
  const googleTokens = await exchangeCodeForTokens(code);
  
  // 2. Get user info from Google
  const googleUser = await getGoogleUserInfo(googleTokens.access_token);
  
  // 3. Find or create user in Payload
  const payloadUser = await findOrCreateUser({
    email: googleUser.email,
    // ... other fields
  });
  
  // 4. Generate short-lived token
  const socialToken = await generateSocialLoginToken({
    userId: payloadUser.id,
    expiresIn: '5m', // 5 minutes
  });
  
  // 5. Return token to client
  return { token: socialToken };
}

// Client-side
const { token } = await handleGoogleCallback(code);
await fetch('/api/users/social-login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token }),
});
```

## Error Handling

| Status | Error | Cause |
|--------|-------|-------|
| 400 | Invalid request body | Missing or invalid JSON |
| 400 | Token is required | Token field missing |
| 401 | Token has expired | Token expiration passed |
| 401 | Invalid or expired token | Invalid signature or malformed token |
| 404 | User not found | userId in token doesn't exist |
| 500 | Failed to create session | Token generation failed |
| 500 | Internal server error | Unexpected error |

## Files

- **Implementation**: `src/payload/endpoints/social-login.ts`
- **Route Handler**: `src/app/api/users/social-login/route.ts`
- **Documentation**: This file

## Notes

- This endpoint does NOT handle OAuth provider logic
- This endpoint does NOT store OAuth tokens
- This endpoint ONLY bridges OAuth → Payload Auth
- Existing email/password login remains unchanged
- All tokens must be signed server-side with `PAYLOAD_SECRET`







