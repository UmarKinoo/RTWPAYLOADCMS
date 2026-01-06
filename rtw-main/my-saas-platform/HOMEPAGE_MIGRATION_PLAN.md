# Homepage Migration Plan: rtwfront → rtw-main

## Overview
Migrate homepage UI components from standalone React app (`rtwfront/`) to Next.js + Payload CMS app (`rtw-main/my-saas-platform/`).

## Migration Strategy

### 1. Component Structure
- **Location**: `src/components/homepage/` (new directory)
- **Blocks**: Each homepage block as a separate component
- **Navbar**: `src/components/homepage/Navbar.tsx` (replaces/extends existing Header)

### 2. Component Mapping

| rtwfront Component | Next.js Location | Type | Notes |
|-------------------|------------------|------|-------|
| `Navbar` | `src/components/homepage/Navbar.tsx` | Client | Uses dropdown menu |
| `Hero` | `src/components/homepage/blocks/Hero.tsx` | Client | Has search input |
| `Candidates` | `src/components/homepage/blocks/Candidates.tsx` | Server | Presentational |
| `MajorDisciplines` | `src/components/homepage/blocks/MajorDisciplines.tsx` | Server | Presentational |
| `UploadResume` | `src/components/homepage/blocks/UploadResume.tsx` | Client | Has form/interactions |
| `Blog` | `src/components/homepage/blocks/Blog.tsx` | Server | Presentational |
| `TrustedBy` | `src/components/homepage/blocks/TrustedBy.tsx` | Server | Presentational |
| `FAQ` | `src/components/homepage/blocks/FAQ.tsx` | Client | Uses accordion |
| `Newsletter` | `src/components/homepage/blocks/Newsletter.tsx` | Client | Has form |
| `Footer` | `src/components/homepage/blocks/Footer.tsx` | Server | Presentational |

### 3. Key Changes Required

#### A. Routing & Links
- ❌ Remove: React Router (not used)
- ✅ Update: Hash links (`#candidates`) → Next.js scroll links or proper routes
- ✅ Update: Login/Get Started links → `/login` and `/register`

#### B. Images
- ❌ Remove: `http://localhost:3845/assets/...` URLs
- ✅ Add: Images to `public/assets/` directory
- ✅ Update: Use `/assets/...` paths (Next.js handles `/public` automatically)
- ✅ Consider: Using `next/image` for optimization (optional, can use `<img>` initially)

#### C. Section Component
- **Issue**: rtwfront Section has different padding structure
- **Solution**: Create `HomepageSection` wrapper that matches rtwfront padding, or adapt existing Section
- **Location**: `src/components/homepage/HomepageSection.tsx`

#### D. Server vs Client Components
- **Server Components** (default): Candidates, MajorDisciplines, Blog, TrustedBy, Footer
- **Client Components** (`'use client'`): Navbar, Hero, UploadResume, FAQ, Newsletter

#### E. UI Components
- ✅ Reuse: Existing shadcn/ui components from `src/components/ui/`
- ✅ Check: Button variants (may need `glass` variant)
- ✅ Verify: DropdownMenu, Accordion components exist

### 4. File Structure

```
rtw-main/my-saas-platform/
├── src/
│   ├── app/
│   │   └── (frontend)/
│   │       └── (site)/
│   │           └── page.tsx          # Updated homepage
│   ├── components/
│   │   ├── homepage/                 # NEW
│   │   │   ├── Navbar.tsx
│   │   │   ├── HomepageSection.tsx   # Adapted Section wrapper
│   │   │   └── blocks/
│   │   │       ├── Hero.tsx
│   │   │       ├── Candidates.tsx
│   │   │       ├── MajorDisciplines.tsx
│   │   │       ├── UploadResume.tsx
│   │   │       ├── Blog.tsx
│   │   │       ├── TrustedBy.tsx
│   │   │       ├── FAQ.tsx
│   │   │       ├── Newsletter.tsx
│   │   │       └── Footer.tsx
│   │   └── ui/                       # Existing (verify components)
│   └── public/
│       └── assets/                    # NEW - migrate images here
│           ├── [all image files]
```

### 5. Migration Steps

1. ✅ Create directory structure
2. ✅ Create HomepageSection component (adapted Section)
3. ✅ Migrate Hero block (first, most complex)
4. ✅ Migrate remaining blocks one by one
5. ✅ Migrate Navbar
6. ✅ Update app/page.tsx
7. ⚠️ Handle image assets (manual step - download/move images)

### 6. Manual Steps Required

#### Image Assets
- **Action**: Download all images from `http://localhost:3845/assets/` or extract from rtwfront
- **Location**: Place in `public/assets/`
- **Update**: Replace all `http://localhost:3845/assets/...` with `/assets/...`

#### Button Variants
- **Check**: If `variant="glass"` exists in Button component
- **Action**: Add if missing or use alternative styling

#### Tailwind Custom Classes
- **Check**: Custom breakpoints (`3xl`, `2xl`, etc.) in rtwfront
- **Action**: Verify Tailwind config supports these or add custom breakpoints

### 7. Testing Checklist

- [ ] Homepage loads without errors
- [ ] All images display correctly
- [ ] Navigation links work
- [ ] Client components (forms, dropdowns) function
- [ ] Responsive design works
- [ ] No console errors
- [ ] Payload CMS admin still accessible

### 8. Notes

- **No React Router**: Components use simple anchor tags - easy migration
- **Section Padding**: rtwfront uses custom padding (`px-[95px]`) - may need custom wrapper
- **Image Optimization**: Can optimize later with `next/image`, but `<img>` works initially
- **Environment Variables**: No env vars needed for homepage (static content)







