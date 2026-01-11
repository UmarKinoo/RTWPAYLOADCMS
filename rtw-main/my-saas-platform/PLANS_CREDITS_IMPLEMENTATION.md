# Plans + Credits System Implementation

## Overview
This document describes the implementation of the Plans + Credits system for ReadyToWork, including Payload CMS collections, seed scripts, and Next.js integration.

## Files Changed

### Payload Collections
1. **`src/collections/Plans.ts`** (NEW)
   - Defines pricing plans with entitlements
   - Fields: slug, title, price, currency, entitlements group
   - Revalidation hooks for cache invalidation

2. **`src/collections/Purchases.ts`** (NEW)
   - Tracks employer purchases
   - Fields: employer, plan, status, creditsGranted snapshot, source
   - Timestamps enabled

3. **`src/collections/Employers.ts`** (MODIFIED)
   - Added `wallet` group (interviewCredits, contactUnlockCredits)
   - Added `activePlan` relationship
   - Added `features` group (basicFilters, nationalityRestriction)

4. **`src/collections/Plans/hooks/revalidatePlan.ts`** (NEW)
   - Revalidation hooks for Plans collection

### Seed Scripts
5. **`src/scripts/seed-plans.ts`** (NEW)
   - Idempotent seed script for plans
   - Creates/updates 5 plans: skilled, specialty, elite-specialty, top-picks, custom

### Library Functions
6. **`src/lib/payload/plans.ts`** (NEW)
   - `getPlans()` - Fetches all plans with caching

7. **`src/lib/purchases.ts`** (NEW)
   - `mockPurchase(planSlug)` - Server action for mock purchases
   - Handles credit granting and feature activation

### Frontend Components
8. **`src/components/pricing/PricingCards.tsx`** (MODIFIED)
   - Now fetches plans from Payload
   - Handles mock purchases
   - Routes custom plans to `/custom-request`

9. **`src/app/(frontend)/(site)/pricing/page.tsx`** (MODIFIED)
   - Server component that fetches plans
   - Passes plans to PricingCards component

10. **`src/app/(frontend)/(site)/custom-request/page.tsx`** (NEW)
    - Placeholder page for custom plan requests

### Configuration
11. **`src/payload.config.ts`** (MODIFIED)
    - Added Plans and Purchases collections

12. **`package.json`** (MODIFIED)
    - Added `seed:plans` script

## How to Run

### 1. Seed Plans
```bash
pnpm seed:plans
```

This will:
- Create/update all 5 plans (idempotent - safe to run multiple times)
- Log created/updated/skipped counts

### 2. Generate Types
After seeding, generate Payload types:
```bash
pnpm generate:types
```

### 3. Start Development Server
```bash
pnpm dev
```

## Plan Specifications

### Skilled
- **Slug**: `skilled`
- **Price**: SAR 350
- **Credits**: 5 interview, 1 contact unlock
- **Features**: Basic filters enabled

### Specialty
- **Slug**: `specialty`
- **Price**: SAR 450
- **Credits**: 5 interview, 1 contact unlock
- **Features**: Basic filters enabled

### Elite Specialty
- **Slug**: `elite-specialty`
- **Price**: SAR 600
- **Credits**: 5 interview, 1 contact unlock
- **Features**: Basic filters enabled

### Top Picks
- **Slug**: `top-picks`
- **Price**: SAR 700
- **Credits**: 5 interview, 1 contact unlock
- **Features**: Basic filters enabled, Saudi nationality restriction

### Custom
- **Slug**: `custom`
- **Price**: N/A (null)
- **Credits**: 0 (isCustom=true)
- **Features**: Routes to `/custom-request` page

## Mock Purchase Flow

1. Employer clicks "Get Started" on pricing page
2. `mockPurchase(planSlug)` server action is called
3. System:
   - Validates employer authentication
   - Finds plan by slug
   - Creates purchase record
   - Grants credits to employer wallet
   - Updates employer activePlan and features
   - Revalidates cache
4. Success: Shows toast and redirects to `/candidates`
5. Error: Shows error toast

## Security Notes

- Only authenticated employers can make purchases
- Custom plans don't grant credits (require manual processing)
- Purchase records track credit snapshots for audit
- All purchases require authentication

## Testing

1. **Seed Plans**: Run `pnpm seed:plans`
2. **View Pricing**: Navigate to `/pricing`
3. **Mock Purchase**: Click "Get Started" on any plan (must be logged in as employer)
4. **Verify Credits**: Check employer wallet in Payload admin
5. **Custom Plan**: Click "Get Started" on Custom plan → should route to `/custom-request`

## Next Steps (Future)

- Integrate real payment gateway
- Add purchase history page
- Add credit usage tracking
- Add subscription management
- Add credit expiration logic












