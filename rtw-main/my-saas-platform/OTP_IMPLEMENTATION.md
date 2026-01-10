# Phone Verification OTP Implementation

## Overview

Phone verification OTP system using Taqnyat SMS service. Secure, rate-limited, and production-ready.

## Environment Variables

Add these to your `.env` file:

```env
# Taqnyat SMS Configuration
TAQNYAT_BEARER_TOKEN=your-bearer-token-here
TAQNYAT_SENDER=your-sender-name

# OTP Configuration (optional, defaults shown)
OTP_TTL_MINUTES=3           # OTP expiration time in minutes (default: 3)
OTP_MAX_ATTEMPTS=5          # Maximum verification attempts
OTP_RESEND_THROTTLE_SECONDS=60  # Minimum seconds between resend requests

# Development Only (NEVER set in production)
OTP_DEV_BYPASS=true         # Log OTP to console in development
```

## API Endpoints

### POST /api/otp/start

Request OTP code via SMS.

**Request Body:**
```json
{
  "phone": "+9665xxxxxxx",
  "userId": "optional-user-id",
  "userCollection": "optional-users|candidates|employers"
}
```

**Response:**
```json
{
  "ok": true
}
```

**Errors:**
- `400`: Invalid phone number format
- `429`: Rate limit (resend too soon)
- `500`: SMS sending failed

### POST /api/otp/verify

Verify OTP code.

**Request Body:**
```json
{
  "phone": "+9665xxxxxxx",
  "code": "123456"
}
```

**Response:**
```json
{
  "ok": true,
  "verified": true
}
```

**Errors:**
- `400`: Invalid code or expired
- `429`: Too many attempts
- `500`: Server error

## Security Features

1. **OTP Hashing**: OTPs are hashed with SHA256 + salt (never stored in plain text)
2. **Rate Limiting**: 
   - Resend throttle: 60 seconds between requests
   - Max attempts: 5 attempts per OTP
3. **Expiration**: OTPs expire after 10 minutes (configurable)
4. **Generic Errors**: Don't leak which part is wrong (invalid vs expired)
5. **Server-Only**: All OTP logic runs server-side, tokens never exposed to browser

## Phone Number Format

Accepts multiple formats and normalizes to E.164:
- `+9665xxxxxxx` → `+9665xxxxxxx`
- `9665xxxxxxx` → `+9665xxxxxxx`
- `05xxxxxxx` → `+9665xxxxxxx`
- `5xxxxxxx` → `+9665xxxxxxx`

## Frontend Component

Use the `PhoneVerification` component:

```tsx
import { PhoneVerification } from '@/components/auth/phone-verification'

// For Employers (testing)
<PhoneVerification
  phone="+9665xxxxxxx"
  userId="employer-id"
  userCollection="employers"
  onVerified={() => {
    // Handle successful verification
  }}
/>

// For Candidates (future implementation)
<PhoneVerification
  phone="+9665xxxxxxx"
  userId="candidate-id"
  userCollection="candidates"
  onVerified={() => {
    // Handle successful verification
  }}
/>
```

**Note:** Users collection (admin users) does not support phone verification.

## Testing

### Development Mode

1. Set `OTP_DEV_BYPASS=true` in `.env`
2. Start the dev server: `pnpm dev`
3. Request OTP - code will be logged to server console
4. Use the logged code to verify

### Test Script

```bash
pnpm tsx src/scripts/test-otp.ts +966501234567
```

## Database Schema

### phone-verifications Collection

- `phone` (text, required): Normalized phone number
- `userId` (text, optional): User ID if linked
- `userCollection` (select, optional): users|candidates|employers
- `otpHash` (text, hidden): SHA256 hash of OTP + salt
- `otpSalt` (text, hidden): Random salt
- `expiresAt` (date, required): OTP expiration
- `attempts` (number, default 0): Verification attempts
- `verifiedAt` (date, nullable): Verification timestamp
- `lastSentAt` (date): Last OTP send time (for throttling)
- `requestIp` (text, optional): Request IP address
- `userAgent` (text, optional): User agent

### User Collections

Added `phoneVerified` field to:
- `employers` ✅ (Active - ready for testing)
- `candidates` ✅ (Ready for future implementation)
- `users` ❌ (Not needed - admin users don't require phone verification)

## Files Created

1. `src/collections/PhoneVerifications.ts` - Payload collection
2. `src/server/sms/taqnyat.ts` - Taqnyat SMS service
3. `src/server/otp/utils.ts` - OTP utility functions
4. `src/app/api/otp/start/route.ts` - Start OTP endpoint
5. `src/app/api/otp/verify/route.ts` - Verify OTP endpoint
6. `src/components/auth/phone-verification.tsx` - Frontend component
7. `src/scripts/test-otp.ts` - Test script

## Production Checklist

- [ ] Set `TAQNYAT_BEARER_TOKEN` in production environment
- [ ] Set `TAQNYAT_SENDER` in production environment
- [ ] Ensure `OTP_DEV_BYPASS` is NOT set (or set to false)
- [ ] Test SMS delivery in production
- [ ] Monitor OTP success/failure rates
- [ ] Set up alerts for SMS failures

