# Email Templates Implementation

## Overview

Branded email templates have been created for Ready to Work with support for:
- Email verification (for candidates and employers)
- Password reset (for all user types)
- Welcome emails (after verification)
- Password changed confirmation

All templates use Ready to Work branding with:
- Primary color: `#4644b8` (purple)
- Text color: `#16252d` (dark)
- Accent color: `#ecf2ff` (light purple)
- Responsive design for mobile devices

## Files Created/Modified

### New Files
1. **`src/lib/email-templates.ts`** - Branded email templates with Ready to Work styling
2. **`scripts/test-email.ts`** - Test script for email sending

### Modified Files
1. **`src/lib/email.ts`** - Updated to use new branded templates
2. **`src/collections/Employers.ts`** - Added email verification fields:
   - `emailVerified` (checkbox)
   - `emailVerificationToken` (text, hidden)
   - `emailVerificationExpires` (date, hidden)
   - `passwordResetToken` (text, hidden)
   - `passwordResetExpires` (date, hidden)
3. **`src/lib/employer.ts`** - Updated registration to:
   - Generate verification token
   - Send verification email (instead of auto-login)
   - Set `emailVerified: false` on registration
4. **`src/lib/auth.ts`** - Updated to:
   - Support multi-collection password reset (users, candidates, employers)
   - Use branded email templates with user type
5. **`src/app/api/auth/verify-email/route.ts`** - Updated to:
   - Support both `users` and `employers` collections
   - Accept `type` query parameter
   - Send appropriate welcome email based on user type

## Email Templates

### 1. Verification Email (`verificationEmailTemplate`)
- **Purpose**: Sent when user registers (candidate or employer)
- **Features**:
  - Branded header with Ready to Work logo
  - Clear call-to-action button
  - Fallback link for copy/paste
  - 24-hour expiry notice
- **Usage**: `verificationEmailTemplate(email, token, 'candidate' | 'employer')`

### 2. Welcome Email (`welcomeEmailTemplate`)
- **Purpose**: Sent after email verification
- **Features**:
  - Success confirmation
  - Dashboard link
  - Next steps guidance
  - User type-specific content
- **Usage**: `welcomeEmailTemplate(email, 'candidate' | 'employer')`

### 3. Employer Welcome Email (`employerWelcomeEmailTemplate`)
- **Purpose**: Special welcome email for employers
- **Features**:
  - Personalized with company name and responsible person
  - Employer-specific features list
  - Direct link to employer dashboard
- **Usage**: `employerWelcomeEmailTemplate(companyName, responsiblePerson)`

### 4. Password Reset Email (`passwordResetEmailTemplate`)
- **Purpose**: Sent when user requests password reset
- **Features**:
  - Security notice
  - Reset button
  - 1-hour expiry notice
  - User type-aware styling
- **Usage**: `passwordResetEmailTemplate(email, token, 'candidate' | 'employer')`

### 5. Password Changed Email (`passwordChangedEmailTemplate`)
- **Purpose**: Confirmation after password change
- **Features**:
  - Security alert if unauthorized
  - Sign-in link
  - Security best practices
- **Usage**: `passwordChangedEmailTemplate()`

## Environment Variables

Make sure these are set in your `.env` file:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@readytowork.sa
APP_URL=https://readytowork.sa  # or http://localhost:3000 for dev
SUPPORT_EMAIL=support@readytowork.sa  # Optional
```

## Testing

### 1. Test Email Sending

Run the test script:

```bash
cd rtw-main/my-saas-platform
TEST_EMAIL=your-email@example.com npx tsx scripts/test-email.ts
```

This will send test emails for:
- Verification email
- Password reset email
- Welcome email

### 2. Test Employer Registration

1. Go to `/register?collection=employers`
2. Fill out the registration form
3. Check your email for verification email
4. Click the verification link
5. You should receive a welcome email

### 3. Test Password Reset

1. Go to `/forgot-password`
2. Enter your email (works for candidates, employers, and users)
3. Check your email for reset link
4. Click the link and reset your password
5. You should receive a confirmation email

### 4. Test Email Verification

1. Register a new employer account
2. Check email inbox for verification email
3. Click the verification link
4. Should redirect to login with success message
5. Should receive welcome email

## Features

### Multi-Collection Support
- Password reset works across `users`, `candidates`, and `employers` collections
- Automatically detects which collection the user belongs to
- Sends appropriate email template based on user type

### Security
- Email enumeration prevention (always returns success even if user doesn't exist)
- Token expiry (24 hours for verification, 1 hour for password reset)
- Secure token generation using `randomBytes`

### Branding
- Consistent Ready to Work branding across all emails
- Responsive design for mobile devices
- Professional styling with brand colors
- Logo in header
- Footer with links and support email

## Email Flow

### Employer Registration Flow
1. User registers → `registerEmployer()` called
2. Verification token generated
3. Verification email sent
4. User clicks link → `/api/auth/verify-email?token=...&email=...&type=employer`
5. Email verified → Welcome email sent
6. User can now log in

### Password Reset Flow
1. User requests reset → `forgotPassword()` called
2. System searches all collections (employers, candidates, users)
3. Reset token generated
4. Reset email sent with appropriate template
5. User clicks link → `/reset-password?token=...&email=...&type=...`
6. Password reset → Confirmation email sent

## Notes

- **shadcn/ui**: Email templates use HTML/CSS (not React components) since emails are rendered server-side. The styling is inspired by shadcn/ui design principles but adapted for email HTML.

- **Logo**: The logo URL uses `${appUrl}/assets/...` to ensure it works in both development and production.

- **User Type Detection**: The system automatically detects user type when possible, but you can also pass it explicitly via query parameters.

## Troubleshooting

### Emails not sending
1. Check `RESEND_API_KEY` is set correctly
2. Verify `EMAIL_FROM` domain is verified in Resend
3. Check Resend dashboard for delivery status
4. Check server logs for errors

### Verification links not working
1. Ensure `APP_URL` is set correctly
2. Check token hasn't expired (24 hours)
3. Verify email matches exactly (case-sensitive)

### Styling issues in emails
1. Some email clients have limited CSS support
2. Test in multiple email clients (Gmail, Outlook, Apple Mail)
3. Use inline styles where possible (already implemented)

## Next Steps

- [ ] Add email templates for other events (interview scheduled, profile updated, etc.)
- [ ] Add email preferences for users
- [ ] Add email analytics tracking
- [ ] Add support for email attachments
- [ ] Add support for HTML email preview in development


