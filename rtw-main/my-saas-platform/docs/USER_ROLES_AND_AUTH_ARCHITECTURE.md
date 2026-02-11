# User Roles & Auth Architecture

This document describes the full architecture of user roles, access control, redirect flows, inactivity logout, and how it compares to enterprise SaaS patterns.

---

## 1. User Roles (Payload `users` collection)

Defined in **`src/collections/Users.ts`**:

| Role         | Value         | Description |
|--------------|---------------|-------------|
| Admin        | `admin`       | Full Payload admin access; can manage all collections. |
| Blog Editor  | `blog-editor` | Payload admin access **only** to Posts, Categories, Media (blog-only). |
| Moderator    | `moderator`   | No Payload admin; frontend moderator panel only (approve/reject interview requests). |
| User         | `user`        | Generic; no Payload admin; may have candidate/employer profile by email. |

**Auth collections:** There are **three** auth sources:

- **`users`** – Payload users (admin, blog-editor, moderator, or user with optional candidate/employer link by email).
- **`candidates`** – Candidate accounts (separate collection; login as candidate).
- **`employers`** – Employer accounts (separate collection; login as employer).

Role is stored in JWT via `saveToJWT: true` on the `role` field for Payload admin checks.

---

## 2. Where Access Is Enforced

### 2.1 Payload Admin (CMS)

**Who can open Payload admin (`/admin`):**

- **`canAccessAdmin`** in `src/collections/Users.ts`:
  - `user?.role === 'admin' || user?.role === 'blog-editor'`
  - Moderators and `user` role cannot open Payload admin.

**What blog-editors see:**

- **`hiddenFromBlogEditor`** in `src/access/hiddenFromBlogEditor.ts`:
  - Returns `true` (hide) when `(args.user as { role?: string })?.role === 'blog-editor'`.
- Used as **`admin.hidden: hiddenFromBlogEditor`** on every collection **except**:
  - **Posts** (`src/collections/Posts/index.ts`) – no `admin.hidden`
  - **Categories** (`src/collections/Categories.ts`) – no `admin.hidden`
  - **Media** (`src/collections/Media.ts`) – no `admin.hidden`

**Collections hidden from blog-editors (full admin only):**

- Users, Pages, Disciplines, SubCategories, Skills, Candidates, Employers, Plans, Purchases, Interviews, Notifications, CandidateInteractions, JobPostings, PhoneVerifications, NewsletterSubmissions, ContactSubmissions.

**Users collection:** Also uses `admin.hidden: hiddenFromBlogEditor` so blog-editors do **not** see the Users collection (only full admins do).

### 2.2 Frontend (Next.js) – “User type” and redirects

**Source of truth:** **`getCurrentUserType()`** in `src/lib/currentUserType.ts`.

It:

1. Uses **Payload `auth({ headers })`** (cookie `payload-token`) to get the current user.
2. Validates **single-session**: DB `sessionId` must match cookie `rtw-sid`; if not, redirects to **`/api/auth/clear-session?next=...`** (unless `onLoginPage: true`).
3. Resolves **user type**:
   - **`users`** collection + `role === 'admin' | 'blog-editor'` → `kind: 'admin'`
   - **`users`** collection + `role === 'moderator'` → `kind: 'moderator'`
   - **Candidate** (by ID or email) → `kind: 'candidate'` + `candidate`
   - **Employer** (by ID or email) → `kind: 'employer'` + `employer`
   - **`users`** with no candidate/employer and role not above → `kind: 'unknown'`

**Return type:** `CurrentUserType | null`:

- `{ kind: 'admin'; user }`
- `{ kind: 'moderator'; user }`
- `{ kind: 'candidate'; user; candidate }`
- `{ kind: 'employer'; user; employer }`
- `{ kind: 'unknown'; user }`
- `null` (not authenticated or invalid session)

**Option:** `getCurrentUserType({ onLoginPage: true })` – when session is invalid, returns `null` instead of redirecting to clear-session (used on login page to avoid redirect loops).

---

## 3. Redirect Flows (Where and Why)

### 3.1 Login page (`/[locale]/login`)

**File:** `src/app/[locale]/(frontend)/(auth)/login/page.tsx`

- Calls **`getCurrentUserType({ onLoginPage: true })`**.
- If **any** user type is present:
  - `admin` → **`redirect('/admin')`** (Payload)
  - `moderator` → **`redirect(\`/${locale}/admin/interviews/pending\`)`**
  - `employer` → **`redirect(\`/${locale}/employer/dashboard\`)`**
  - `candidate` → **`redirect(\`/${locale}/dashboard\`)`**
  - else → **`redirect(\`/${locale}/dashboard\`)`**

So staff (admin/blog-editor) and moderator never “land” on the dashboard; they are sent to Payload or moderator panel.

### 3.2 Login form (client) – after successful login

**File:** `src/components/auth/login-form.tsx`

- **Employers** → **`/${locale}/candidates`**
- **Candidates** → **`/${locale}/dashboard`**
- **Users (staff)** → **`/admin`** (Payload)
- Else → **`/${locale}/dashboard`**

### 3.3 (Admin) layout – all authenticated frontend app

**File:** `src/app/[locale]/(frontend)/(admin)/layout.tsx`

- **`getCurrentUserType()`**; if `null` → **`redirect(\`/${locale}/login\`)`**.
- Wraps children in **`<InactivityLogout>`** (see below).

So every route under `(admin)` (dashboard, employer dashboard, moderator panel) requires auth and gets inactivity logout.

### 3.4 Dashboard layout (`/[locale]/dashboard` layout)

**File:** `src/app/[locale]/(frontend)/(admin)/dashboard/layout.tsx`

- **`kind === 'admin'`** → **`redirect('/admin')`**
- **`kind === 'moderator'`** → **`redirect(\`/${locale}/admin/interviews/pending\`)`**
- Else: render children (candidate dashboard).

So admins/blog-editors and moderators never see the candidate dashboard; they are bounced to Payload or moderator panel.

### 3.5 Dashboard page (`/[locale]/dashboard`)

**File:** `src/app/[locale]/(frontend)/(admin)/dashboard/page.tsx`

- No user → **`redirect(\`/${locale}/login\`)`**
- **Candidate** → render candidate dashboard.
- **Employer** → **`redirect(\`/${locale}/employer/dashboard\`)`**
- **Admin** → **`redirect('/admin')`**
- **Moderator** → **`redirect(\`/${locale}/admin/interviews/pending\`)`**
- **Unknown** → **`redirect(\`/${locale}/login\`)`**

### 3.6 Employer dashboard page

**File:** `src/app/[locale]/(frontend)/(admin)/employer/dashboard/page.tsx`

- No user → login.
- **Admin** → **`/admin`**
- **Moderator** → **`/${locale}/admin/interviews/pending`**
- **Candidate** → **`/${locale}/dashboard`**
- **Unknown** → **`/${locale}/dashboard`**
- **Employer** → render employer dashboard.

### 3.7 Moderator panel layout (`/[locale]/admin/...`)

**File:** `src/app/[locale]/(frontend)/(admin)/admin/layout.tsx`

- No user → **`redirect(\`/${locale}/login\`)`**
- **Admin** → **`redirect('/admin')`** (Payload; they don’t use this frontend panel)
- Not moderator → **`redirect(\`/${locale}/dashboard\`)`**
- **Moderator** → render moderator panel (e.g. pending interviews).

### 3.8 Moderator panel – pending interviews page

**File:** `src/app/[locale]/(frontend)/(admin)/admin/interviews/pending/page.tsx`

- No user → **`redirect('/login')`** (no locale in path – see “Redirect loop risks”).
- **Admin or moderator** → allow; else **`redirect('/dashboard')`**.

### 3.9 Candidate sub-routes (dashboard/notifications, resume, activity, settings, interviews)

Each calls **`getCurrentUserType()`**; if no user or not candidate, redirects to **`/${locale}/login`** or **`/${locale}/dashboard`**.  
**Dashboard interviews page** also allows **admin** but then redirects admin to **`/dashboard`** (so they end up at Payload via dashboard layout).

### 3.10 No-access page (`/${locale}/no-access`)

**File:** `src/app/[locale]/(frontend)/(admin)/no-access/page.tsx`

- Shown when user is **authenticated but has no valid role/type** (**unknown**). Stops the login ↔ dashboard loop.
- If user is not unknown (e.g. landed here by mistake), redirects to the correct home (admin, moderator panel, employer dashboard, dashboard).
- Renders “No access”, “Contact support”, and “Back to sign in” (i18n **noAccess** keys in messages).

### 3.11 Accept-invitation page

**File:** `src/app/[locale]/(frontend)/(auth)/accept-invitation/page.tsx`

- After success, **role** comes from **`acceptInvitation()`** response:
  - **Admin or blog-editor** → “Sign in to admin” → **`/admin`**
  - **Moderator (or user)** → “Sign in” → **`/login`** (i18n Link).
- “Back to sign in” and invalid-link link → **`/login`**.
- “Already signed in”: **admin/blog-editor** → **`/admin`**; else → **`/login`**.

---

## 4. Middleware (proxy) – `src/proxy.ts`

**Exported:** `proxy(request)`; matcher excludes `/api`, `/admin`, `/_next`, `/favicon.ico`, `/assets`, and paths with a dot.

**Auth logic (`handleAuth`):**

1. **Public paths** (home, register, candidates, pricing, blog, about, contact, privacy, terms, disclaimer, candidate detail, posts): no redirect.
2. **Logged in** (has `payload-token`) and on **login / forgot-password / reset-password / accept-invitation**:
   - **Exception:** if path is **`/${locale}/login`** and **`error=logged-out`**, do **not** redirect (so user can see login after “logged out elsewhere”).
   - Otherwise → **redirect to `/${locale}/dashboard`** (then dashboard/page and layout send staff to `/admin` or moderator panel).
3. **Not logged in** and path starts with **`/${locale}/dashboard`** → redirect to **`/${locale}/login?from=...`**.

So:

- Staff with token who visit **/login** are sent to **/dashboard** first, then server redirects to **/admin** or moderator panel (two hops).
- Middleware does **not** know user type (no Payload call); it only checks cookie.

---

## 5. Session invalidation and clear-session

**When session is invalid (e.g. logged in elsewhere):**

- **`getCurrentUserType()`** (without `onLoginPage`) detects **`rtw-sid !== DB.sessionId`** and redirects to:
  - **`/api/auth/clear-session?next=${encodeURIComponent(loginUrl)}`**
  - with **`loginUrl = \`/${locale}/login?error=logged-out\``** (from **`getLocaleFromRequest()`** in `src/lib/auth.ts`).
- **`src/app/api/auth/clear-session/route.ts`**: GET handler clears **`payload-token`** and **`rtw-sid`** (maxAge 0, expires epoch) and redirects to **`next`**.

So user lands on **`/en/login?error=logged-out`** (or current locale). **LoginPageToast** shows the “logged out” message (see **`src/components/auth/login-page-toast.tsx`**: `logged-out`, `inactive`, etc.).

---

## 6. Inactivity logout

**Component:** **`src/components/auth/InactivityLogout.tsx`**

- Wraps all content under **`(admin)`** layout (dashboard, employer dashboard, moderator panel).
- **Default timeout:** **120 minutes** (2 hours); overridable by **`NEXT_PUBLIC_INACTIVITY_TIMEOUT_MINUTES`**.
- **Throttle:** timer is reset at most once per **60 seconds** (on activity) to avoid constant resets.
- **Activity:** `mousedown`, `mousemove`, `keydown`, `scroll`, `touchstart`, `click`.
- **On timeout:**  
  **`window.location.href = \`/api/auth/clear-session?next=${encodeURIComponent(\`/${locale}/login?error=inactive\`)}\``**  
  So cookies are cleared and user is sent to **`/en/login?error=inactive`** (or current locale). **LoginPageToast** shows the “inactive” message.

**Not covered by InactivityLogout:**

- Payload admin (**`/admin`**) is **not** under **`(admin)`** layout; Payload has its own session/timeout. So inactivity logout applies only to the **frontend app** (candidate dashboard, employer dashboard, moderator panel).

---

## 7. Redirect loop risks and mitigations

### 7.1 Login page with invalid session

- **Risk:** User has stale/invalid cookie; **`getCurrentUserType()`** would redirect to **clear-session** → login; if login page again called **`getCurrentUserType()`** without special handling, it could redirect again → loop.
- **Mitigation:** Login page uses **`getCurrentUserType({ onLoginPage: true })`**. When session is invalid, it returns **`null`** and does **not** redirect; user sees the login form.

### 7.2 Unknown user type (fixed)

- **Previous risk:** Unknown users could loop between login and dashboard.
- **Fix (enterprise pattern):** Unknown is treated as **authenticated but unauthorized**. They are sent to a stable **`/${locale}/no-access`** page (with “Contact support”). Login page, dashboard layout, and dashboard page all redirect **unknown** to **no-access**. No bouncing between login and dashboard.

### 7.3 Locale in redirects (fixed)

- **Fix:** Centralized helpers in **`src/lib/redirects.ts`**: **`redirectToLogin(locale, options?)`**, **`redirectToDashboard(locale)`**, **`redirectToNoAccess(locale)`**, **`redirectToAdmin()`**, **`redirectToModeratorPanel(locale)`**, **`redirectToEmployerDashboard(locale)`**. All app redirects to login/dashboard/no-access use these helpers so locale is always correct. **Code review:** ban hardcoded **`/login`** and **`/dashboard`** in redirects.

---

## 8. Enterprise SaaS comparison

### 8.1 Inactivity / idle logout

| Aspect | This codebase | Common enterprise SaaS |
|--------|----------------|--------------------------|
| **Where** | Client-side timer in **InactivityLogout** (frontend app only). | Often server-side session TTL **and/or** client idle timeout. |
| **Timeout** | 2 hours (configurable via env). | Often 15–60 min idle, sometimes configurable per org. |
| **Warning** | None; hard redirect when timer fires. | Many show “You’ll be logged out in N minutes” and “Stay signed in”. |
| **Scope** | Only **frontend** (dashboard, employer, moderator). **Payload `/admin`** not covered. | Usually one policy for whole product or per app (e.g. main app vs admin). |

**Possible improvements:**

- Add a **warning modal** (e.g. 5 minutes before logout) with “Stay signed in” (reset timer) and “Log out”.
- Optionally enforce **server-side session TTL** (e.g. JWT expiry or DB session expiry) so that even without inactivity, sessions expire.
- Optionally apply similar idle timeout to **Payload admin** (e.g. Payload config or custom middleware) if required.

### 8.2 Role-based redirects after login

| Aspect | This codebase | Common enterprise SaaS |
|--------|----------------|--------------------------|
| **Where** | Login **page** (server) and login **form** (client after submit). | Often centralized “post-login redirect” (e.g. by role or default app). |
| **Staff** | Admin/blog-editor → **Payload `/admin`**; moderator → **moderator panel**. | Admin roles often go to admin app or admin area; support/moderator to their tool. |
| **Middleware** | Middleware only checks **token**; sends to **`/dashboard`**; then server components redirect by role. | Sometimes middleware or API knows role (e.g. from JWT) and redirects once to final destination. |

**Possible improvement:** If you add role (or “default app”) to the JWT or a lightweight API used by middleware, you could redirect **directly** from middleware (e.g. staff → `/admin`, moderator → moderator URL) to avoid the extra **/dashboard** hop.

### 8.3 Single-session (one device)

- **Current:** **`sessionId`** in DB + **`rtw-sid`** cookie; **getCurrentUserType** validates they match; if not, redirect to **clear-session** and login with **`error=logged-out`**.
- **Enterprise:** Often similar (single session per user) or “session per device” with ability to revoke others; some offer “log out all other sessions” in settings.

### 8.4 Clear separation of roles

- **Current:** Clear split: **admin** (Payload full), **blog-editor** (Payload blog only), **moderator** (frontend only), **candidate/employer** (frontend). Payload uses **admin.hidden** for blog-editor; frontend uses **getCurrentUserType** and layout/page redirects.
- **Enterprise:** Similar: RBAC with role → permissions; admin UIs often hide or disable by permission.

### 8.5 Accept-invitation and post-set-password

- **Current:** After setting password, **admin/blog-editor** get “Sign in to admin” → **`/admin`**; **moderator** get “Sign in” → **`/login`**. Role comes from **acceptInvitation** response.
- **Enterprise:** Invitation flows often end with “Sign in” to the appropriate app (main app vs admin) based on role or invitation type.

---

## 9. File reference summary

| Purpose | File(s) |
|--------|--------|
| User roles (Payload) | `src/collections/Users.ts` |
| Payload admin access | `canAccessAdmin` in Users.ts |
| Blog-editor visibility | `src/access/hiddenFromBlogEditor.ts`; collections using `admin.hidden: hiddenFromBlogEditor` |
| Frontend user type | `src/lib/currentUserType.ts` |
| Redirect helpers (locale-safe) | `src/lib/redirects.ts` – use these instead of raw redirect('/login') or redirect('/dashboard') |
| No-access page (unknown users) | `src/app/[locale]/(frontend)/(admin)/no-access/page.tsx` |
| Login page redirects | `src/app/[locale]/(frontend)/(auth)/login/page.tsx` |
| Login form redirects | `src/components/auth/login-form.tsx` |
| (Admin) layout + inactivity | `src/app/[locale]/(frontend)/(admin)/layout.tsx`, `InactivityLogout` |
| Dashboard layout/page | `src/app/[locale]/(frontend)/(admin)/dashboard/layout.tsx`, `page.tsx` |
| Employer dashboard | `src/app/[locale]/(frontend)/(admin)/employer/dashboard/page.tsx` |
| Moderator panel | `src/app/[locale]/(frontend)/(admin)/admin/layout.tsx`, `admin/interviews/pending/page.tsx` |
| Clear session | `src/app/api/auth/clear-session/route.ts` |
| Inactivity logout | `src/components/auth/InactivityLogout.tsx` |
| Middleware (auth + locale) | `src/proxy.ts` |
| Login toasts (errors) | `src/components/auth/login-page-toast.tsx` |
| Accept-invitation | `src/app/[locale]/(frontend)/(auth)/accept-invitation/page.tsx`, `acceptInvitation` in `src/lib/auth.ts` |

---

## 10. Quick role → destination matrix

| Role / Type | Payload `/admin` | Frontend dashboard | Employer dashboard | Moderator panel |
|-------------|------------------|--------------------|--------------------|-----------------|
| **admin** | ✅ Full | Redirect to `/admin` | Redirect to `/admin` | Redirect to `/admin` |
| **blog-editor** | ✅ Blog only (Posts, Categories, Media) | Redirect to `/admin` | Redirect to `/admin` | Redirect to `/admin` |
| **moderator** | ❌ | Redirect to moderator panel | Redirect to moderator panel | ✅ |
| **candidate** | ❌ | ✅ | Redirect to dashboard | Redirect to dashboard |
| **employer** | ❌ | Redirect to employer dashboard | ✅ | Redirect to employer dashboard |
| **unknown** | ❌ | Redirect to **no-access** | Redirect to **no-access** | Redirect to **no-access** |

This should give you a single place to reason about roles, access, redirects, inactivity, and how they align with enterprise SaaS patterns.
