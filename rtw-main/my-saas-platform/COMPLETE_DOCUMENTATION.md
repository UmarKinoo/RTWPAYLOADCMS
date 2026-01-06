# Ready to Work - Complete Application Documentation

**Version**: 1.0  
**Date**: 2025-01-21  
**Status**: Production Ready

---

## Table of Contents

1. [Application Overview](#application-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Database Schema (Collections)](#database-schema-collections)
4. [User Types & Authentication](#user-types--authentication)
5. [Core Features](#core-features)
6. [API Routes](#api-routes)
7. [Components Structure](#components-structure)
8. [Key Workflows](#key-workflows)
9. [Configuration & Environment](#configuration--environment)
10. [File Structure](#file-structure)
11. [Dependencies](#dependencies)
12. [Deployment & Scripts](#deployment--scripts)

---

## Application Overview

**Ready to Work** is a SaaS platform connecting employers with job candidates in Saudi Arabia. The platform facilitates:

- **Candidate Registration**: Multi-step registration with skill taxonomy
- **Employer Registration**: Company registration with subscription plans
- **Candidate Discovery**: Search and filter candidates by skills, experience, location
- **Interview Management**: Request, approve, and schedule interviews
- **Credit System**: Pay-per-use model with interview and contact unlock credits
- **Notifications**: Real-time notifications for interviews and interactions
- **Billing Classes**: A, B, C, D classification system for pricing

### Key Differentiators

- **Smart Skill Matrix**: Hierarchical taxonomy (Disciplines → Categories → SubCategories → Skills)
- **Vector Search**: OpenAI embeddings for semantic skill matching
- **Multi-Collection Auth**: Separate authentication for Candidates, Employers, and Admins
- **Credit-Based Access**: Interview requests and contact unlocks consume credits
- **Moderation System**: Admin approval required for interview requests

---

## Architecture & Tech Stack

### Core Technologies

| Category | Technology | Version |
|----------|-----------|---------|
| **Framework** | Next.js | 16.0.7 |
| **CMS** | Payload CMS | 3.67.0 |
| **Language** | TypeScript | 5.7.3 |
| **Database** | PostgreSQL | (via @payloadcms/db-postgres) |
| **Styling** | Tailwind CSS | 4.1.17 |
| **UI Components** | shadcn/ui + Radix UI | Latest |
| **Email** | Resend | Latest |
| **Storage** | Vercel Blob / S3 / R2 | Configurable |
| **AI/ML** | OpenAI (Embeddings) | text-embedding-3-small |
| **i18n** | next-intl | 3.26.5 |
| **Forms** | react-hook-form + Zod | Latest |

### Architecture Patterns

- **Server-First**: React Server Components by default
- **Client Components**: Only when needed (hooks, event handlers, browser APIs)
- **Server Actions**: All mutations use Next.js server actions
- **Type Safety**: Auto-generated types from Payload collections
- **Caching**: Next.js caching with `unstable_cache` and revalidation tags
- **Access Control**: Payload collection-level access control

---

## Database Schema (Collections)

### Core Collections

#### 1. **Users** (`users`)
- **Purpose**: Admin users and system users
- **Auth**: Enabled
- **Fields**:
  - `email` (text, unique, required)
  - `password` (auto-managed by Payload)
  - `role` (select: 'admin' | 'user')
  - `emailVerified` (checkbox)
  - `emailVerificationToken` (text, hidden)
  - `emailVerificationExpires` (date, hidden)
  - `passwordResetToken` (text, hidden)
  - `passwordResetExpires` (date, hidden)
- **Access**: Admin only for admin operations

#### 2. **Candidates** (`candidates`)
- **Purpose**: Job candidate profiles
- **Auth**: Enabled (creates user account)
- **Key Fields**:
  - **Identity**: `firstName`, `lastName`, `email`, `phone`, `whatsapp`
  - **Smart Matrix**: `primarySkill` (relationship to skills) - auto-sets `billingClass`
  - **Demographics**: `gender`, `dob`, `nationality`, `languages`
  - **Work**: `jobTitle`, `experienceYears`, `saudiExperience`, `currentEmployer`, `availabilityDate`
  - **Visa**: `location`, `visaStatus`, `visaExpiry`, `visaProfession`
  - **Vector Search**: `bio_embedding` (JSON array) - generated from jobTitle + skill + experience
  - **Files**: `profilePicture` (upload), `resume` (upload)
  - **Terms**: `termsAccepted` (checkbox, required)
- **Hooks**:
  - `beforeChange`: Auto-sets `billingClass` from `primarySkill`, generates `bio_embedding`
  - `afterChange`: Revalidates cache
- **Access**: Public create, authenticated read/update/delete

#### 3. **Employers** (`employers`)
- **Purpose**: Company/employer accounts
- **Auth**: Enabled (creates user account)
- **Key Fields**:
  - **Company Info**: `companyName`, `responsiblePerson`, `phone`, `website`, `address`, `industry`, `companySize`
  - **Credits Wallet**: 
    - `wallet.interviewCredits` (number, default: 0)
    - `wallet.contactUnlockCredits` (number, default: 0)
  - **Subscription**: `activePlan` (relationship to plans)
  - **Features**: 
    - `features.basicFilters` (checkbox)
    - `features.nationalityRestriction` (select: 'NONE' | 'SAUDI')
  - **Email Verification**: `emailVerified`, `emailVerificationToken`, `emailVerificationExpires`
  - **Password Reset**: `passwordResetToken`, `passwordResetExpires`
  - **Terms**: `termsAccepted` (checkbox, required)
- **Access**: Public create, authenticated read/update/delete

#### 4. **Skills** (`skills`)
- **Purpose**: Job skills taxonomy (leaf nodes)
- **Key Fields**:
  - `name` (text, required)
  - `subCategory` (relationship to subcategories, required)
  - `billingClass` (select: 'A' | 'B' | 'C' | 'D', required)
  - `group_text` (text, hidden) - Composite text: "Major Discipline: X | Category: Y | Subcategory: Z | Skill: W | Class: A"
  - `name_embedding` (JSON array) - Vector embedding for semantic search
- **Hooks**:
  - `beforeChange`: Generates `group_text` and `name_embedding` using OpenAI
- **Access**: Authenticated create/update/delete, public read

#### 5. **Taxonomy Collections**

##### **Disciplines** (`disciplines`)
- **Purpose**: Top-level job categories
- **Fields**: `name` (text, unique, required)

##### **Categories** (`categories`)
- **Purpose**: Second-level job categories
- **Fields**: 
  - `name` (text, required)
  - `discipline` (relationship to disciplines, required)

##### **SubCategories** (`subcategories`)
- **Purpose**: Third-level job categories
- **Fields**:
  - `name` (text, required)
  - `category` (relationship to categories, required)

**Taxonomy Hierarchy**: `Disciplines` → `Categories` → `SubCategories` → `Skills`

#### 6. **Plans** (`plans`)
- **Purpose**: Subscription plans for employers
- **Key Fields**:
  - `slug` (text, unique, required) - e.g., 'skilled', 'specialty', 'elite-specialty', 'top-picks', 'custom'
  - `title`, `title_en`, `title_ar` (text) - Localized titles
  - `price` (number, nullable) - Price in SAR (null for custom plans)
  - `currency` (text, default: 'SAR')
  - **Entitlements**:
    - `entitlements.interviewCreditsGranted` (number, default: 0)
    - `entitlements.contactUnlockCreditsGranted` (number, default: 0)
    - `entitlements.basicFilters` (checkbox, default: false)
    - `entitlements.nationalityRestriction` (select: 'NONE' | 'SAUDI')
    - `entitlements.isCustom` (checkbox, default: false)
- **Access**: Authenticated create/update/delete, public read (for pricing page)
- **Hooks**: `afterChange` revalidates cache

#### 7. **Purchases** (`purchases`)
- **Purpose**: Track plan purchases and credit grants
- **Key Fields**:
  - `employer` (relationship to employers, required)
  - `plan` (relationship to plans, required)
  - `interviewCreditsGranted` (number) - Snapshot at purchase time
  - `contactUnlockCreditsGranted` (number) - Snapshot at purchase time
  - `amount` (number) - Purchase amount
  - `currency` (text, default: 'SAR')
- **Access**: Authenticated only

#### 8. **Interviews** (`interviews`)
- **Purpose**: Interview requests and scheduling
- **Key Fields**:
  - `employer` (relationship to employers, required)
  - `candidate` (relationship to candidates, required)
  - `scheduledAt` (date with time, required)
  - `duration` (number, default: 30, min: 15) - Minutes
  - `status` (select, default: 'pending'):
    - 'pending' - Awaiting admin approval
    - 'scheduled' - Approved and scheduled
    - 'completed' - Interview completed
    - 'cancelled' - Cancelled
    - 'rejected' - Rejected by admin
    - 'no_show' - Candidate didn't show
  - **Request Metadata**:
    - `requestedAt` (date with time)
    - `approvedAt` (date with time)
    - `approvedBy` (relationship to users)
    - `rejectionReason` (textarea)
  - **Job Details**:
    - `jobPosition` (text)
    - `jobLocation` (text)
    - `salary` (text, e.g., "SAR 5000")
    - `accommodationIncluded` (checkbox)
    - `transportation` (checkbox)
  - **Calendar Integration**:
    - `calendarEventId` (text) - Google Calendar event ID (not yet implemented)
    - `meetingLink` (text) - Video call link
  - `notes` (textarea)
- **Access**: 
  - Admins: Can see all interviews
  - Employers: Can see their own interviews
  - Candidates: Can see their own interviews
- **Hooks**: `afterChange` revalidates cache

#### 9. **Notifications** (`notifications`)
- **Purpose**: In-app notifications for employers and candidates
- **Key Fields**:
  - `employer` (relationship to employers, optional)
  - `candidate` (relationship to candidates, optional)
  - `type` (select, required):
    - 'interview_scheduled'
    - 'interview_reminder'
    - 'interview_request_received'
    - 'interview_request_approved'
    - 'interview_request_rejected'
    - 'candidate_applied'
    - 'credit_low'
    - 'system'
  - `title` (text, required)
  - `message` (textarea, required)
  - `read` (checkbox, default: false)
  - `actionUrl` (text, optional) - URL to navigate on click
- **Access**: Employers and candidates can access their own notifications
- **Hooks**: 
  - `beforeValidate`: Ensures either employer or candidate is set (not both)
  - `afterChange` revalidates cache

#### 10. **CandidateInteractions** (`candidate-interactions`)
- **Purpose**: Track employer interactions with candidates (analytics)
- **Key Fields**:
  - `employer` (relationship to employers, required)
  - `candidate` (relationship to candidates, required)
  - `interactionType` (select, required):
    - 'view' - Profile viewed
    - 'interview_requested' - Interview requested
    - 'interviewed' - Interview completed
    - 'declined' - Candidate declined
    - 'contact_unlocked' - Contact information unlocked
  - `metadata` (JSON) - Additional data (e.g., search query, job posting ID)
- **Access**: Employers can only access their own interactions
- **Hooks**: `afterChange` revalidates cache

#### 11. **JobPostings** (`job-postings`)
- **Purpose**: Job postings created by employers
- **Key Fields**:
  - `employer` (relationship to employers, required)
  - `title` (text, required)
  - `description` (textarea)
  - `jobType` (select: 'full_time' | 'part_time' | 'contract', default: 'full_time')
  - `salaryMin` (number, min: 0)
  - `salaryMax` (number, min: 0)
  - `status` (select: 'active' | 'paused' | 'closed', default: 'active')
  - `applicationsCount` (number, default: 0, read-only)
  - `clicksCount` (number, default: 0, read-only)
  - `expiresAt` (date)
- **Access**: Employers can only access their own job postings
- **Hooks**: `afterChange` revalidates cache

#### 12. **Content Collections**

##### **Pages** (`pages`)
- **Purpose**: CMS-managed pages (homepage, about, etc.)
- **Fields**: Standard Payload page fields with blocks

##### **Posts** (`posts`)
- **Purpose**: Blog posts
- **Fields**: Standard Payload post fields with authors

##### **Categories** (`categories`)
- **Purpose**: Blog post categories
- **Fields**: Standard Payload category fields

##### **Media** (`media`)
- **Purpose**: File uploads (images, documents)
- **Storage**: Configurable (Vercel Blob, S3, R2)

---

## User Types & Authentication

### User Types

1. **Admin** (`users` collection with `role='admin'`)
   - Full access to Payload admin panel
   - Can moderate interview requests
   - Can view all data

2. **Candidate** (`candidates` collection)
   - Can register and create profile
   - Can view own profile and interviews
   - Can receive notifications
   - Can accept/reject interview invitations

3. **Employer** (`employers` collection)
   - Can register company
   - Can purchase plans
   - Can search and view candidates
   - Can request interviews (consumes credits)
   - Can unlock contact info (consumes credits)
   - Can create job postings
   - Can view dashboard with statistics

### Authentication System

**Location**: `src/lib/auth.ts`

#### Features

- **Multi-Collection Auth**: Supports `users`, `candidates`, and `employers` collections
- **HTTP-Only Cookies**: Secure cookie-based authentication
- **Email Verification**: Required for candidates and employers
- **Password Reset**: Works across all collections
- **Remember Me**: Optional extended session
- **Social Login**: Google OAuth support (via NextAuth)

#### Server Actions

- `loginUser(params)` - Authenticate user
- `registerUser(params)` - Register new user
- `registerCandidate(params)` - Register candidate with full profile
- `registerEmployer(params)` - Register employer with company info
- `forgotPassword(email)` - Request password reset
- `resetPassword(params)` - Reset password with token
- `logoutUser()` - Logout current user
- `getUser()` - Get current authenticated user

#### User Type Detection

**Location**: `src/lib/currentUserType.ts`

- `getCurrentUserType()` - Returns:
  - `{ kind: 'admin', user: User }`
  - `{ kind: 'candidate', user: User, candidate: Candidate }`
  - `{ kind: 'employer', user: User, employer: Employer }`
  - `{ kind: 'unknown', user: User }`
  - `null` if not authenticated

---

## Core Features

### 1. Candidate Registration

**Location**: `src/components/candidate/RegistrationWizard.tsx`

- **Multi-Step Form** (6 steps):
  1. Account (email, password)
  2. Personal Info (name, phone, gender, DOB, nationality, languages)
  3. Job Role (primary skill selection with smart search)
  4. Experience (job title, years, Saudi experience, current employer, availability)
  5. Location & Visa (location, visa status, expiry, profession)
  6. Review & Submit

- **Smart Skill Search**: 
  - Vector search using OpenAI embeddings
  - Fallback to text search
  - Shows full path: "Discipline > Category > Subcategory > Skill"

- **Auto-Features**:
  - `billingClass` auto-set from `primarySkill`
  - `bio_embedding` auto-generated from jobTitle + skill + experience

### 2. Employer Registration

**Location**: `src/components/employer/EmployerRegistrationForm.tsx`

- Company information form
- Email verification required
- Terms acceptance required

### 3. Candidate Discovery

**Location**: `src/app/[locale]/(frontend)/(site)/candidates/page.tsx`

- **Public Listing**: All candidates who accepted terms
- **Filtering**:
  - By discipline (filters entire hierarchy)
  - By search query (name, job title)
- **Pagination**: Server-side pagination
- **Profile Cards**: Show key info, profile picture, skill, experience

### 4. Candidate Search (Employer Dashboard)

**Location**: `src/app/api/employer/search/route.ts`

- **Search API**: POST `/api/employer/search`
- **Query**: Searches firstName, lastName, jobTitle
- **Tracking**: Creates `CandidateInteractions` with type 'view'
- **Authentication**: Employer-only

### 5. Interview Request Flow

**Components**:
- `src/components/employer/AddToInterviewButton.tsx`
- `src/components/employer/InterviewRequestModal.tsx`
- `src/components/employer/InterviewRequestForm.tsx`

**Flow**:
1. Employer clicks "Add to Interview" on candidate profile
2. Modal opens with candidate profile card and form
3. Employer fills form (date, time, job position, location, salary, accommodation, transportation)
4. Submission creates interview with status 'pending'
5. Admin reviews in `/admin/interviews/pending`
6. Admin approves/rejects:
   - **Approve**: Deducts interview credit, creates notifications, sets status to 'scheduled'
   - **Reject**: Sets status to 'rejected', sends notification with reason
7. Candidate receives notification
8. Candidate can accept/reject invitation

**Server Actions**:
- `requestInterview(params)` - Create pending interview
- `approveInterviewRequest(interviewId)` - Approve and deduct credit
- `rejectInterviewRequest(interviewId, reason)` - Reject with reason

### 6. Credit System

**Location**: `src/lib/purchases.ts`, `src/lib/billing.ts`

- **Credit Types**:
  - Interview Credits: Required to request interviews
  - Contact Unlock Credits: Required to unlock candidate contact info

- **Purchase Flow**:
  1. Employer selects plan on pricing page
  2. `mockPurchase(planSlug)` server action called
  3. Creates purchase record
  4. Grants credits to employer wallet
  5. Updates employer `activePlan` and `features`

- **Credit Deduction**:
  - Interview credits: Deducted when admin approves interview request
  - Contact unlock credits: Deducted when employer unlocks contact (not yet implemented)

### 7. Notifications System

**Location**: `src/lib/employer/notifications.ts`, `src/lib/candidate/notifications.ts`

- **Notification Types**: See Notifications collection schema
- **Components**:
  - `CandidateNotificationDropdown` - Header dropdown for candidates
  - `EmployerNotificationDropdown` - Header dropdown for employers
  - `CandidateNotificationsPage` - Full notifications page
- **Features**:
  - Unread count badge
  - Mark as read
  - Action URLs for navigation
  - Real-time updates (via cache revalidation)

### 8. Employer Dashboard

**Location**: `src/app/[locale]/(frontend)/(admin)/employer/dashboard/page.tsx`

**Components**:
- `StatsCards` - Key metrics (candidates to review, notifications, interviews, pending requests)
- `StatisticsChart` - Chart with period selector (7d, 30d, 90d, 1y)
- `ScheduleSidebar` - Today's interviews
- `SubscriptionCard` - Current plan and credits
- `RecentCandidatesTable` - Recent job postings/interactions
- `DashboardHeader` - Search functionality

**Data Sources**:
- Real-time statistics from database
- Interview scheduling data
- Credit balance
- Recent interactions

### 9. Candidate Dashboard

**Location**: `src/app/[locale]/(frontend)/(admin)/dashboard/page.tsx`

**Features**:
- Notification dropdown
- Interview invitations view
- Accept/reject interview functionality
- Unread notification count

### 10. Admin Moderation

**Location**: `src/app/[locale]/(frontend)/(admin)/admin/interviews/pending/page.tsx`

**Component**: `PendingInterviewsPage`

**Features**:
- List all pending interview requests
- View full interview details (job position, location, salary, etc.)
- Approve button (deducts credit, creates notifications)
- Reject button (with reason field)

### 11. Skill Search (Vector Search)

**Location**: `src/app/api/skills/search/route.ts`

**Endpoint**: GET `/api/skills/search?q=query&limit=10`

**Algorithm**:
1. If OpenAI key available:
   - Generate embedding for query
   - Fetch all skills with embeddings
   - Calculate cosine similarity
   - Sort by similarity
   - Return top matches
2. Fallback to text search:
   - Search by `name` or `group_text`
   - Sort alphabetically

**Used In**: Candidate registration (Job Role step)

### 12. Pricing Page

**Location**: `src/app/[locale]/(frontend)/(site)/pricing/page.tsx`

**Features**:
- Display all plans (public read)
- Localized plan titles (English/Arabic)
- "Get Started" button for each plan
- Custom plan routes to `/custom-request`

---

## API Routes

### Authentication

- `POST /api/auth/verify-email` - Verify email with token
- `POST /api/auth/generate-social-token` - Generate social login token
- `POST /api/users/social-login` - Social login endpoint

### Employer

- `POST /api/employer/search` - Search candidates (employer-only)
- `GET /api/employer/statistics` - Get employer statistics

### Skills

- `GET /api/skills/search?q=query&limit=10` - Search skills (vector or text)
- `GET /api/skills/[id]` - Get skill by ID

### NextAuth

- `[...nextauth]/route.ts` - NextAuth configuration for social login

---

## Components Structure

### Authentication (`src/components/auth/`)

- `login-form.tsx` - Login form
- `register-form.tsx` - User registration form
- `forgot-password-form.tsx` - Password reset request
- `email-verification-banner.tsx` - Email verification reminder
- `logout-button.tsx` - Client-side logout
- `logout-form.tsx` - Server-side logout
- `RegisterTypeModal.tsx` - Modal to choose registration type (candidate/employer)

### Candidate (`src/components/candidate/`)

- `RegistrationWizard.tsx` - Main registration wizard (6 steps)
- `SkillSearch.tsx` - Skill search component with vector search
- `CandidateDashboard.tsx` - Candidate dashboard wrapper
- `CandidateDashboardContent.tsx` - Dashboard content
- `wizard-steps/` - Individual registration steps
- `notifications/` - Notification components
- `interviews/` - Interview management components
- `dashboard/` - Dashboard-specific components

### Employer (`src/components/employer/`)

- `EmployerRegistrationForm.tsx` - Employer registration
- `AddToInterviewButton.tsx` - Button to request interview
- `InterviewRequestModal.tsx` - Interview request modal
- `InterviewRequestForm.tsx` - Interview request form
- `CandidateProfileCard.tsx` - Candidate profile display
- `dashboard/` - Dashboard components
- `notifications/` - Notification components

### Homepage (`src/components/homepage/`)

- `Navbar.tsx` - Homepage navigation
- `HomepageSection.tsx` - Section wrapper
- `blocks/`:
  - `Hero.tsx` - Hero section with search
  - `Candidates.tsx` - Candidate showcase
  - `MajorDisciplines.tsx` - Disciplines grid
  - `UploadResume.tsx` - Resume upload CTA
  - `Blog.tsx` - Blog posts grid
  - `TrustedBy.tsx` - Company logos carousel
  - `FAQ.tsx` - FAQ accordion
  - `Newsletter.tsx` - Email subscription
  - `Footer.tsx` - Site footer

### UI Components (`src/components/ui/`)

- shadcn/ui components (53 files)
- Includes: buttons, forms, dialogs, dropdowns, tables, charts, etc.

### Other Components

- `navbar/` - Navigation menu components
- `pricing/` - Pricing page components
- `candidates/` - Candidate listing components
- `blog/` - Blog components
- `about/` - About page components
- `contact/` - Contact page components

---

## Key Workflows

### Route Protection

**Location**: `src/proxy.ts`

The middleware handles:
- **Public Routes**: Homepage, register, candidates, pricing, blog, about, contact
- **Protected Routes**: `/dashboard` and sub-routes require authentication
- **Auth Routes**: Login, forgot-password, reset-password redirect to dashboard if already authenticated
- **Token Check**: Uses `payload-token` cookie to determine authentication status

---

## Key Workflows

### 1. Candidate Registration Workflow

```
1. User visits /register
2. Selects "Candidate" registration type
3. Fills 6-step wizard:
   - Account (email/password)
   - Personal Info
   - Job Role (skill search)
   - Experience
   - Location & Visa
   - Review
4. Submits → Creates candidate record
5. Email verification sent
6. User clicks verification link
7. Welcome email sent
8. Candidate can now log in
```

### 2. Employer Registration Workflow

```
1. User visits /employer/register
2. Fills company registration form
3. Submits → Creates employer record
4. Email verification sent
5. User clicks verification link
6. Welcome email sent
7. Employer can now log in
```

### 3. Interview Request Workflow

```
1. Employer searches/browses candidates
2. Clicks "Add to Interview" on candidate profile
3. Fills interview request form (date, time, job details, salary, etc.)
4. Submits → Creates interview with status 'pending'
5. Admin reviews in /admin/interviews/pending
6. Admin approves:
   - Deducts 1 interview credit from employer wallet
   - Creates notification for candidate
   - Creates notification for employer
   - Sets interview status to 'scheduled'
7. Candidate receives notification
8. Candidate can accept/reject invitation
```

### 4. Plan Purchase Workflow

```
1. Employer visits /pricing
2. Selects plan and clicks "Get Started"
3. mockPurchase(planSlug) server action called
4. System:
   - Validates employer authentication
   - Finds plan by slug
   - Creates purchase record
   - Grants credits to employer wallet
   - Updates employer activePlan and features
   - Revalidates cache
5. Redirects to /candidates
```

### 5. Skill Search Workflow

```
1. User types in skill search (candidate registration or elsewhere)
2. Debounced API call to /api/skills/search?q=query
3. If OpenAI key available:
   - Generate embedding for query
   - Fetch all skills with embeddings
   - Calculate cosine similarity
   - Return top matches sorted by similarity
4. Else:
   - Text search by name or group_text
   - Return matches sorted alphabetically
5. Display results with full path (Discipline > Category > Subcategory > Skill)
```

---

## Configuration & Environment

### Environment Variables

#### Required

```bash
# Database
DATABASE_URI=postgres://user:password@localhost:5432/dbname

# Payload CMS
PAYLOAD_SECRET=your-secure-secret-key-min-32-chars

# Storage (at least one required)
BLOB_READ_WRITE_TOKEN=vercel_blob_xxxxxx  # Vercel Blob
# OR
R2_ACCOUNT_ID=your-account-id              # Cloudflare R2
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_URL=https://your-cdn-url.com
# OR
S3_BUCKET=your-bucket                      # AWS S3 / Supabase S3
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_ENDPOINT=https://your-endpoint.com
```

#### Optional

```bash
# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com

# App URL
APP_URL=https://yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# OpenAI (for vector search)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx

# NextAuth (for social login)
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Payload Configuration

**Location**: `src/payload.config.ts`

- **Collections**: All 15 collections registered
- **Storage**: Configurable (R2, S3, Vercel Blob)
- **Database**: PostgreSQL adapter
- **Plugins**: 
  - Form builder
  - Nested docs
  - Redirects
  - Search
  - SEO
  - Payload Cloud

### Next.js Configuration

**Location**: `next.config.mjs`

- Webpack configuration
- Image optimization
- Security headers

### Middleware

**Location**: `src/proxy.ts`

- **Purpose**: Handles locale routing and authentication checks
- **Features**:
  - Locale routing via next-intl
  - Route protection (redirects unauthenticated users from protected routes)
  - Redirects authenticated users away from login/auth pages
  - Public path whitelist (homepage, register, candidates, pricing, blog, about, contact)
  - Protected routes: `/dashboard` and sub-routes
  - Token-based authentication check (checks `payload-token` cookie)
- **Matcher**: Excludes API routes, static files, admin panel, and assets

---

## File Structure

```
rtw-main/my-saas-platform/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── [locale]/                 # Internationalized routes
│   │   │   ├── (frontend)/           # Frontend routes
│   │   │   │   ├── (admin)/          # Protected routes
│   │   │   │   │   ├── admin/        # Admin pages
│   │   │   │   │   ├── dashboard/   # Candidate dashboard
│   │   │   │   │   └── employer/     # Employer dashboard
│   │   │   │   ├── (auth)/           # Auth routes
│   │   │   │   │   ├── login/
│   │   │   │   │   ├── register/
│   │   │   │   │   ├── forgot-password/
│   │   │   │   │   └── reset-password/
│   │   │   │   └── (site)/           # Public routes
│   │   │   │       ├── page.tsx      # Homepage
│   │   │   │       ├── candidates/   # Candidate listing
│   │   │   │       ├── pricing/     # Pricing page
│   │   │   │       ├── about/        # About page
│   │   │   │       ├── contact/      # Contact page
│   │   │   │       └── blog/         # Blog
│   │   │   ├── (payload)/            # Payload CMS admin
│   │   └── api/                      # API routes
│   │       ├── auth/                 # Auth endpoints
│   │       ├── employer/             # Employer APIs
│   │       └── skills/               # Skills APIs
│   ├── collections/                  # Payload collections
│   │   ├── Candidates.ts
│   │   ├── Employers.ts
│   │   ├── Interviews.ts
│   │   ├── Plans.ts
│   │   ├── Skills.ts
│   │   └── ... (15 total)
│   ├── components/                   # React components
│   │   ├── auth/                     # Auth components
│   │   ├── candidate/                # Candidate components
│   │   ├── employer/                 # Employer components
│   │   ├── homepage/                 # Homepage components
│   │   ├── ui/                       # shadcn/ui components
│   │   └── ... (other components)
│   ├── lib/                          # Utilities and server actions
│   │   ├── auth.ts                   # Authentication
│   │   ├── email.ts                  # Email service
│   │   ├── currentUserType.ts        # User type detection
│   │   ├── candidate/                # Candidate utilities
│   │   ├── employer/                 # Employer utilities
│   │   ├── payload/                  # Payload helpers
│   │   └── ... (other utilities)
│   ├── blocks/                       # Payload blocks
│   ├── fields/                       # Payload field configs
│   ├── hooks/                        # React hooks
│   ├── i18n/                         # Internationalization
│   ├── proxy.ts                      # Next.js middleware (locale + auth)
│   ├── payload.config.ts             # Payload configuration
│   └── payload-types.ts              # Auto-generated types
├── public/                           # Static assets
│   └── assets/                       # Images, SVGs
├── messages/                         # i18n translations
│   ├── en.json
│   └── ar.json
├── scripts/                          # Utility scripts
│   ├── seed-skills.ts
│   ├── seed-plans.ts
│   └── ...
├── package.json
├── tsconfig.json
└── next.config.mjs
```

---

## Dependencies

### Core Dependencies

```json
{
  "next": "16.0.7",
  "react": "19.2.0",
  "react-dom": "19.2.0",
  "payload": "3.67.0",
  "@payloadcms/db-postgres": "3.67.0",
  "@payloadcms/next": "3.67.0",
  "typescript": "5.7.3"
}
```

### UI & Styling

```json
{
  "tailwindcss": "4.1.17",
  "@radix-ui/react-*": "Latest",
  "lucide-react": "Latest",
  "class-variance-authority": "Latest",
  "clsx": "Latest",
  "tailwind-merge": "Latest"
}
```

### Forms & Validation

```json
{
  "react-hook-form": "Latest",
  "@hookform/resolvers": "Latest",
  "zod": "4.1.13"
}
```

### Email & Storage

```json
{
  "resend": "Latest",
  "@payloadcms/storage-vercel-blob": "3.67.0",
  "@payloadcms/storage-s3": "3.67.0"
}
```

### Other Key Dependencies

```json
{
  "next-intl": "3.26.5",
  "next-auth": "5.0.0-beta.30",
  "openai": "6.15.0",
  "date-fns": "4.1.0",
  "recharts": "2.15.4"
}
```

---

## Deployment & Scripts

### Available Scripts

```bash
# Development
pnpm dev              # Start dev server
pnpm devsafe          # Start dev server (clears .next cache first)

# Build
pnpm build            # Build for production
pnpm start            # Start production server

# Type Generation
pnpm generate:types   # Generate Payload TypeScript types
pnpm generate:importmap  # Generate Payload import map

# Seeding
pnpm seed:skills      # Seed skills taxonomy
pnpm seed:plans       # Seed subscription plans
pnpm seed:disciplines # Seed disciplines

# Translation
pnpm translate:disciplines  # Translate disciplines
pnpm translate:ar           # Generate Arabic translations

# Utilities
pnpm lint             # Run ESLint
pnpm cleanup          # Clean up build artifacts
pnpm optimize:images  # Optimize images
```

### Seeding Process

1. **Skills**: Run `pnpm seed:skills` to populate skills taxonomy from CSV
2. **Plans**: Run `pnpm seed:plans` to create subscription plans
3. **Disciplines**: Run `pnpm seed:disciplines` to seed disciplines

### Deployment

- **Vercel**: Recommended (configure environment variables)
- **Docker**: Dockerfile and docker-compose.yml included
- **Self-Hosted**: Requires PostgreSQL, Node.js 18.20.2+ or 20.9.0+

---

## Security Features

- **HTTP-Only Cookies**: Secure authentication
- **CSRF Protection**: Built into Payload
- **Input Validation**: Zod schemas
- **Password Hashing**: bcrypt via Payload
- **Security Headers**: Configured in next.config.mjs
- **Rate Limiting**: Built into Payload auth endpoints
- **Access Control**: Collection-level access control
- **Email Enumeration Prevention**: Always returns success for password reset

---

## Internationalization (i18n)

- **Locales**: English (`en`), Arabic (`ar`)
- **Library**: next-intl
- **Translation Files**: `messages/en.json`, `messages/ar.json`
- **Routes**: `/[locale]/...` pattern
- **Language Switcher**: Component in header

---

## Caching Strategy

- **Next.js Caching**: Uses `unstable_cache` with tags
- **Revalidation**: 
  - `revalidatePath` for page-level revalidation
  - `revalidateTag` for tag-based revalidation
- **Cache Tags**: Collection-specific tags (e.g., 'candidates', 'interviews')
- **No `cache: 'no-store'`**: All queries use caching

---

## Known Limitations & Future Enhancements

### Not Yet Implemented

1. **Google Calendar Integration**: `calendarEventId` field exists but integration missing
2. **Contact Unlock**: Credit deduction logic not yet implemented
3. **Job Posting Applications**: Application tracking not fully implemented
4. **Payment Gateway**: Currently using mock purchase flow
5. **Email Templates**: Some templates may need refinement

### Potential Enhancements

1. **Advanced Search**: More filter options (experience range, location, etc.)
2. **Candidate Matching**: AI-powered candidate matching using embeddings
3. **Analytics Dashboard**: More detailed analytics for employers
4. **Mobile App**: React Native mobile app
5. **Real-time Chat**: In-app messaging between employers and candidates

---

## Support & Documentation

- **House Rules Audit**: See `HOUSE_RULES_AUDIT.md`
- **Implementation Status**: See `IMPLEMENTATION_STATUS_CHECK.md`
- **Setup Guides**: Various `.md` files in root directory

---

**End of Documentation**

