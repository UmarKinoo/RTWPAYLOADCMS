# ReadyToWork — Update for Aziz (24 Aug 2026)

Hi Aziz,

Quick summary of what we shipped today:

---

## 1. Employer pricing plans — Basic / Standard / Premium

**Problem:** The old Skilled / Specialty / Elite packages (plus a separate Saudi plan) were confusing and didn’t match how you sell volume to employers.

**What we changed:**
- **Three clear packages on the pricing page:**
  - **Basic** (350 SAR) — 7 interviews, 1 CV shared by our team, valid 30 days
  - **Standard** (450 SAR) — unlimited interviews for 1 month, 2 CVs
  - **Premium** (600 SAR) — unlimited interviews for 1 month, 3 CVs (highlighted plan)
- **Removed the Saudi / Top Picks plan** and nationality restrictions on packages.
- **30-day validity** enforced from payment — employers can’t request interviews after expiry; Basic’s 7 interviews must be used within the month.
- **Unlimited plans** skip credit deduction; Basic still deducts one credit per interview.
- **Employer dashboard** updated — shows unlimited vs remaining credits and expiry date.
- **Arabic names:** الباقة الأساسية / الباقة القياسية / الباقة المميزة.
- **Custom / Business plan** unchanged for bespoke deals.

**How to test:** Visit `/en/pricing` and `/ar/pricing` → confirm three cards with new copy → mock purchase each tier → check employer dashboard subscription card and interview request gating.

---

## 2. Job role picker (registration + dashboard)

**Problem:** Candidates saw an empty search box and didn’t know what to type. Internal labels like “Major Discipline” were confusing.

**What we built:**
- **Guided browse flow:** Industry → Category (when needed) → Job Role — similar to LinkedIn, using your existing job matrix.
- **Search still works:** Typing 2+ characters still runs vector search across all roles.
- **Clearer labels:** Candidates see **Industry**, **Category**, and **Job Role** — not internal billing terms.
- **Visual polish:** Industry cards with images (same style as homepage), role cards in a grid, and a “Your career path” summary with edit/change options.
- **Deep link for testing:** `/en/register?step=jobRole` opens registration directly on the job role step.

Nothing changes on the backend — we still store skill IDs on primary/secondary/tertiary roles, so matching and billing are untouched.

---

## 3. Profile strength dock (Upwork-style)

**Problem:** “Complete your profile” only scrolled the page down with no clear feedback. The checklist didn’t show what each item was worth.

**What we built:**
- **Persistent bottom pill:** Shows profile strength % and “Complete now” — centered above the mobile nav (and on desktop).
- **Bottom sheet checklist:** Tap opens a full list of **15 profile sections**, each with a **+X%** badge (weights sum to 100%).
- **All sections covered:** Profile photo, resume, job role, about me, work experience fields, location, nationality, education, visa, languages, job preferences, preferred benefits, WhatsApp.
- **Tap any item:** Sheet closes → navigates or scrolls to that section → **purple highlight ring** so the candidate sees exactly where they landed.
- **Banner + deep link:** “See what to fill” and welcome-email `?complete=1` links now open the sheet instead of scrolling blindly.
- **EN + AR:** Full Arabic/English copy for the new UI.

---

## Test accounts

**Live site:** [https://readytowork.sa](https://readytowork.sa)  
**Login:** [https://readytowork.sa/en/login](https://readytowork.sa/en/login)

Both accounts use the same password: **`AzizTest2026!`**

### Candidate — job role picker + profile strength

| | |
|---|---|
| **Email** | `aziz.qa.candidate@readybot-qa.example.test` |
| **Password** | `AzizTest2026!` |

Profile is partially complete — **Complete now** shows missing items (photo, resume, about me, education, job preferences, benefits, etc.).

**Try:**
- [Dashboard](https://readytowork.sa/en/dashboard) → tap **Complete now** at the bottom
- [Dashboard with sheet open](https://readytowork.sa/en/dashboard?complete=1)
- Job Roles section → browse Industry → Category → Role, or search
- [Registration job role step](https://readytowork.sa/en/register?step=jobRole) (log out first if needed)

### Employer — pricing plans (Basic / Standard / Premium)

| | |
|---|---|
| **Email** | `aziz.qa.employer@readybot-qa.example.test` |
| **Password** | `AzizTest2026!` |

No plan active yet — use this to test purchasing.  
*(If login fails, register at [Employer registration](https://readytowork.sa/en/register?collection=employers) with the same email/password, or ask Umar to run `pnpm seed:aziz-qa` on the live database.)*

**Try:**
- [Pricing (EN)](https://readytowork.sa/en/pricing) / [Pricing (AR)](https://readytowork.sa/ar/pricing)
- Click **Get started** on Basic, Standard, or Premium (mock checkout — no real payment)
- [Employer dashboard](https://readytowork.sa/en/employer/dashboard) → check subscription card (credits, expiry, unlimited)

---

## How to test (quick)

1. **Pricing:** Log in as **employer** → `/en/pricing` → purchase a plan → check dashboard.
2. **Job role:** Log in as **candidate** → dashboard → Job Roles — browse or search.
3. **Profile strength:** Log in as **candidate** → dashboard → tap **Complete now** pill.

---

Let me know if you want any copy tweaks on pricing cards or profile field weighting.

Best,  
Umar
