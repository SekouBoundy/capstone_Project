# DOUCSOFT — Full Project Plan

**Platform:** Verified housing + second-hand marketplace for international students in Northern Cyprus
**Stack:** Expo (React Native) · Supabase · Cloudinary · 4 languages (EN/FR/TR/AR)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    EXPO APP                          │
│         iOS · Android · Web (one codebase)           │
│                                                      │
│  Expo Router (navigation) · React Query (data)        │
│  i18next (EN/FR/TR/AR + RTL) · Supabase JS SDK       │
└──────────────┬──────────────────────────────────────┘
               │ direct connection (no custom backend)
               ▼
┌─────────────────────────────────────────────────────┐
│                   SUPABASE                           │
│                                                      │
│  Auth (email/password + verification)                │
│  Postgres (data + Row Level Security)                │
│  Realtime (messaging + notifications)                │
│  Storage (backup / fallback for images)              │
│  Edge Functions (email sending via Resend later)     │
└──────────────┬──────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────┐
│                  CLOUDINARY                           │
│         Image upload + optimization + CDN            │
└─────────────────────────────────────────────────────┘
```

**Key principle:** No custom backend server. The Expo app talks directly to Supabase. This keeps the MVP fast to build and easy to deploy.

---

## 2. Tech Stack — Exact Choices

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | **Expo SDK 53+** (React Native) | iOS, Android, Web from one codebase |
| Navigation | **Expo Router** | File-based routing, deep links |
| Data fetching | **TanStack React Query** | Caching, optimistic updates, offline support |
| Backend | **Supabase** | Auth, Postgres, Realtime, Storage |
| Images | **Cloudinary** | Unsigned upload preset from app, auto-optimization |
| i18n | **i18next + react-i18next** | EN, FR, TR, AR with RTL layout support |
| Forms | **React Hook Form + Zod** | Validation, type-safe schemas |
| Styling | **NativeWind (Tailwind CSS)** | Consistent, fast UI development |
| Icons | **@expo/vector-icons** | Ionicons built in |
| State | **Zustand** | Lightweight global state (auth session, locale) |
| Email | Dev: console log → Prod: **Resend** via Supabase Edge Function | Swap with one env var |

---

## 3. Database Schema (PostgreSQL)

### 3.1 Tables

```sql
-- ─── PROFILES ─────────────────────────────────────────
-- Extends Supabase auth.users with app-specific data
profiles
├── id              uuid PK (references auth.users)
├── role            text (student | owner | agency | admin)
├── full_name       text
├── phone           text
├── avatar_url      text
├── university      text
├── faculty         text
├── year_of_study   text
├── bio             text
├── preferred_locale text (en | fr | tr | ar)
├── is_suspended    boolean default false
├── created_at      timestamptz
└── updated_at      timestamptz

-- ─── VERIFICATION ─────────────────────────────────────
-- Owner/Agency verification requests
verification_requests
├── id              uuid PK
├── profile_id      uuid FK → profiles
├── role_type       text (owner | agency)
├── -- owner fields
├── id_document_url text
├── -- agency fields
├── agency_name     text
├── business_reg_url text
├── contact_person  text
├── status          text (pending | approved | rejected)
├── admin_notes     text
├── reviewed_by     uuid FK → profiles
├── reviewed_at     timestamptz
├── created_at      timestamptz
└── updated_at      timestamptz

-- ─── PROPERTIES (Housing) ────────────────────────────
properties
├── id              uuid PK
├── owner_id        uuid FK → profiles
├── title           text
├── description     text
├── property_type   text (apartment | room | studio | house | dorm)
├── price_monthly   numeric
├── charges         numeric (optional)
├── currency        text default 'EUR'
├── rooms           integer
├── bathrooms       integer
├── area_sqm        numeric
├── furnished       boolean
├── amenities       text[] (wifi, ac, washer, etc.)
├── address         text
├── city            text
├── latitude        numeric
├── longitude       numeric
├── available_from  date
├── available       boolean default true
├── is_verified     boolean default false (denormalized from owner)
├── status          text (draft | published | unavailable | removed)
├── created_at      dimestamptz
└── updated_at      timestamptz

property_images
├── id              uuid PK
├── property_id     uuid FK → properties
├── image_url       text (Cloudinary URL)
├── sort_order      integer
└── created_at      timestamptz

-- ─── PRODUCTS (Marketplace) ───────────────────────────
products
├── id              uuid PK
├── seller_id       uuid FK → profiles
├── title           text
├── description     text
├── category        text (furniture | electronics | books | kitchen | clothing | other)
├── price           numeric
├── currency        text default 'EUR'
├── condition       text (new | like_new | good | fair)
├── image_urls      text[] (Cloudinary URLs)
├── city            text
├── status          text (active | sold | removed)
├── created_at      dimestamptz
└── updated_at      timestamptz

-- ─── CONVERSATIONS & MESSAGES ─────────────────────────
conversations
├── id              uuid PK
├── listing_type    text (property | product)
├── listing_id      uuid (FK → properties or products)
├── participant_a   uuid FK → profiles
├── participant_b   uuid FK → profiles
├── created_at      dimestamptz
└── last_message_at timestamptz

messages
├── id              uuid PK
├── conversation_id uuid FK → conversations
├── sender_id       uuid FK → profiles
├── body            text
├── read_at         timestamptz
├── created_at      dimestamptz

-- ─── REPORTS ──────────────────────────────────────────
reports
├── id              uuid PK
├── reporter_id     uuid FK → profiles
├── target_type     text (user | property | product | message)
├── target_id       uuid
├── reason          text (fake_listing | scam | inappropriate | spam | other)
├── description     text
├── status          text (open | investigating | resolved | dismissed)
├── admin_notes     text
├── created_at      dimestamptz
└── updated_at      timestamptz

-- ─── FAVORITES ────────────────────────────────────────
favorites
├── id              uuid PK
├── user_id         uuid FK → profiles
├── listing_type    text (property | product)
├── listing_id      uuid
├── created_at      timestamptz
└── unique(user_id, listing_type, listing_id)

-- ─── NOTIFICATIONS ────────────────────────────────────
notifications
├── id              uuid PK
├── user_id         uuid FK → profiles
├── type            text (new_message | verification_update | listing_approved | report_update)
├── title           text
├── body            text
├── data            jsonb (flexible payload)
├── read            boolean default false
├── created_at      timestamptz
```

### 3.2 Row Level Security (RLS) Policies

| Table | Key Policies |
|-------|-------------|
| `profiles` | Anyone can read non-suspended profiles. Users can update own profile. |
| `properties` | Anyone can read published. Owners can CRUD own. Admin can read all, update any. |
| `products` | Anyone can read active. Sellers can CRUD own. Admin can read all, update any. |
| `conversations` | Participants only. |
| `messages` | Conversation participants only. |
| `reports` | Reporter can read own. Admin can read all. |
| `favorites` | Users can CRUD own. |
| `notifications` | Users can read/update own. |

---

## 4. Authentication Flow

```
┌──────────┐     ┌──────────┐     ┌──────────────┐
│  Sign Up  │────▶│ Supabase │────▶│ Email sent   │
│  (email + │     │ Auth     │     │ (dev: logged │
│  password) │     │          │     │  to console) │
└──────────┘     └──────────┘     └──────┬───────┘
                                         │
                                         ▼
                                  ┌──────────────┐
                                  │ Email link   │
                                  │ clicked      │
                                  └──────┬───────┘
                                         │
                                         ▼
┌──────────┐     ┌──────────┐     ┌──────────────┐
│  Log In   │◀───│ Session  │◀────│ Verified     │
│           │     │ stored   │     │              │
└──────────┘     └──────────┘     └──────────────┘
```

- **Sign up:** Email + password + role selection (Student / Owner / Agency)
- **Email verification:** Required before full access (dev mode: link logged to console)
- **Password reset:** Supabase `resetPasswordForEmail` (dev mode: link logged to console)
- **Session:** Supabase JS SDK auto-manages JWT + refresh tokens
- **Protected routes:** Expo Router layout checks session, redirects to `/auth/login`

---

## 5. Feature Modules → Screens Map

### 5.1 Auth & Onboarding
| Screen | Route | Purpose |
|--------|-------|---------|
| Welcome | `/auth/welcome` | Language selection (EN/FR/TR/AR) |
| Login | `/auth/login` | Email + password |
| Sign Up | `/auth/signup` | Role selection + account creation |
| Verify Email | `/auth/verify` | "Check your email" screen |
| Forgot Password | `/auth/forgot` | Reset link request |
| Onboarding | `/onboarding` | Profile completion (name, phone, university, photo) |

### 5.2 Housing
| Screen | Route | Purpose |
|--------|-------|---------|
| Housing Feed | `/housing` | Property cards with photos, price, location |
| Housing Filters | `/housing/filters` | Budget, type, rooms, furnished, city |
| Property Details | `/housing/[id]` | Full info, gallery, amenities, map link, owner card |
| Owner Profile | `/owner/[id]` | Verified badge, other listings |
| Create Listing | `/housing/new` | Multi-step form (details → photos → review) |
| Edit Listing | `/housing/[id]/edit` | Pre-filled form |
| My Listings | `/account/listings` | Owner's properties with status management |

### 5.3 Marketplace
| Screen | Route | Purpose |
|--------|-------|---------|
| Marketplace Feed | `/marketplace` | Product cards with photos, price, condition |
| Marketplace Filters | `/marketplace/filters` | Category, price range, condition, city |
| Product Details | `/marketplace/[id]` | Full info, gallery, seller card |
| Seller Profile | `/seller/[id]` | Other listings from this seller |
| Create Listing | `/marketplace/new` | Multi-step form |
| Edit Listing | `/marketplace/[id]/edit` | Pre-filled form |
| My Products | `/account/products` | Seller's items with status management |

### 5.4 Messaging
| Screen | Route | Purpose |
|--------|-------|---------|
| Conversation List | `/messages` | All chats with last message + unread count |
| Chat | `/messages/[id]` | Real-time message thread, linked to listing |
| New Message | (from listing) | Auto-creates conversation, navigates to chat |

### 5.5 Account & Profile
| Screen | Route | Purpose |
|--------|-------|---------|
| Profile | `/account` | View own profile |
| Edit Profile | `/account/edit` | Update name, phone, university, photo |
| Favorites | `/account/favorites` | Saved properties + products |
| Verification | `/account/verification` | Submit documents, view status |
| Settings | `/account/settings` | Language, notifications, delete account |

### 5.6 Admin

Admin lives in a **separate web app** at `admin-web/`, not in the mobile app.
It is a Vite + React SPA authenticating against the same Supabase project, so
admin accounts are ordinary app accounts with `role = 'admin'` and one set of
RLS policies governs both clients. See `admin-web/README.md`.

| Screen | Route | Purpose |
|--------|-------|---------|
| Admin Dashboard | `/` | Stats overview, outstanding queues |
| Users | `/users` | Search, role changes, suspend, reactivate |
| Verifications | `/verifications` | Review pending requests, approve/reject |
| Reports | `/reports` | Triage reports, resolve/dismiss with notes |
| Moderation | `/moderation` | Remove and restore listings and items |

All of it runs through `SECURITY DEFINER` RPCs in
`supabase/migrations/014_admin_web_panel.sql`, each gated on `is_admin()`.
The reason an admin types into a removal or a rejection is written to a
notification, so the affected user is told why.

---

## 6. Internationalization (i18n) Strategy

### 6.1 Languages
| Code | Language | Direction | Status |
|------|----------|-----------|--------|
| `en` | English | LTR | Default / fallback |
| `fr` | French | LTR | MVP |
| `tr` | Turkish | LTR | MVP |
| `ar` | Arabic | **RTL** | MVP |

### 6.2 Implementation
- **Library:** `i18next` + `react-i18next` + `expo-localization`
- **RTL:** When `ar` is active, flip layout direction via `I18nManager.forceRTL(true)` and mirror UI elements
- **Persistence:** Store selected language in `AsyncStorage` + `profiles.preferred_locale`
- **Translation files:** `locales/en.json`, `locales/fr.json`, `locales/tr.json`, `locales/ar.json`
- **Scope:** All UI strings translated. User-generated content (listings) stays in original language.

### 6.3 Translation File Structure
```json
{
  "common": { "save": "Save", "cancel": "Cancel", "search": "Search", ... },
  "auth": { "login": "Log in", "signup": "Sign up", ... },
  "housing": { "title": "Find Housing", "filters": "Filters", ... },
  "marketplace": { "title": "Marketplace", "sell": "Sell an Item", ... },
  "messages": { "title": "Messages", "typeMessage": "Type a message...", ... },
  "account": { "profile": "My Profile", "settings": "Settings", ... },
  "admin": { "dashboard": "Dashboard", "users": "Users", ... }
}
```

---

## 7. Real-Time Messaging (Supabase Realtime)

### 7.1 Flow
```
Student taps "Contact" on property
        │
        ▼
App checks: conversation exists between
student + owner for this property?
        │
   ┌────┴────┐
   │         │
  Yes        No
   │         │
   ▼         ▼
Navigate   Create conversation
to chat    + navigate
              │
              ▼
        ┌──────────┐
        │ Chat      │
        │ Screen    │
        │           │
        │ Supabase  │
        │ Realtime  │
        │ channel:  │
        │ conversation:{id} │
        │           │
        │ New msg ──▶ INSERT on messages
        │ Read ─────▶ UPDATE read_at
        └──────────┘
```

### 7.2 Realtime Channels
| Channel | Event | Purpose |
|---------|-------|---------|
| `conversation:{id}` | `INSERT` on messages | New message in active chat |
| `user:{id}` | `INSERT` on notifications | New message notification (when app backgrounded) |
| `user:{id}` | `INSERT` on conversations | New conversation started |

### 7.3 Optimistic Updates
- Message appears instantly in UI (React Query optimistic update)
- Supabase confirms → replace temp ID with real ID
- Failed send → show retry indicator

---

## 8. Image Uploads (Cloudinary)

### 8.1 Flow
```
User picks image (expo-image-picker)
        │
        ▼
Compress + resize (max 1200px, JPEG 80%)
        │
        ▼
POST to Cloudinary unsigned endpoint
  (upload_preset from env)
        │
        ▼
Get secure_url back
        │
        ▼
Store URL in database (property_images / products.image_urls)
```

### 8.2 Configuration
- **Cloudinary:** Unsigned upload preset (created in Cloudinary dashboard)
- **Env var:** `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME`, `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
- **Max images:** 10 per listing
- **Fallback:** If Cloudinary fails, use Supabase Storage

---

## 9. Project Structure

```
capstone_Project/
├── PROJECT_PLAN.md              ← this document
├── README.md
├── .env.example
├── .gitignore
│
├── supabase/                   ← Supabase local dev + migrations
│   ├── config.toml
│   └── migrations/
│       ├── 001_profiles.sql
│       ├── 002_verification.sql
│       ├── 003_properties.sql
│       ├── 004_products.sql
│       ├── 005_conversations_messages.sql
│       ├── 006_reports.sql
│       ├── 007_favorites.sql
│       ├── 008_notifications.sql
│       └── 009_rls_policies.sql
│
├── app/                         ← Expo Router screens
│   ├── _layout.tsx              ← Root layout (providers, auth gate)
│   ├── index.tsx                ← Redirect to /housing or /auth
│   │
│   ├── auth/
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   ├── verify.tsx
│   │   └── forgot.tsx
│   │
│   ├── onboarding.tsx
│   │
│   ├── housing/
│   │   ├── _layout.tsx
│   │   ├── index.tsx            ← Feed
│   │   ├── filters.tsx
│   │   ├── new.tsx              ← Create listing
│   │   └── [id]/
│   │       ├── index.tsx        ← Details
│   │       └── edit.tsx
│   │
│   ├── marketplace/
│   │   ├── _layout.tsx
│   │   ├── index.tsx            ← Feed
│   │   ├── filters.tsx
│   │   ├── new.tsx              ← Create listing
│   │   └── [id]/
│   │       ├── index.tsx        ← Details
│   │       └── edit.tsx
│   │
│   ├── messages/
│   │   ├── _layout.tsx
│   │   ├── index.tsx            ← Conversation list
│   │   └── [id].tsx             ← Chat screen
│   │
│   ├── account/
│   │   ├── _layout.tsx
│   │   ├── index.tsx            ← Profile
│   │   ├── edit.tsx
│   │   ├── listings.tsx         ← My housing listings
│   │   ├── products.tsx         ← My marketplace listings
│   │   ├── favorites.tsx
│   │   ├── verification.tsx
│   │   └── settings.tsx
│   │
│   └── admin/
│       ├── _layout.tsx          ← Admin guard
│       ├── index.tsx            ← Dashboard
│       ├── users.tsx
│       ├── verifications.tsx
│       ├── reports.tsx
│       └── moderation.tsx
│
├── src/
│   ├── components/              ← Reusable UI components
│   │   ├── ui/                  ← Button, Input, Card, Badge, etc.
│   │   ├── housing/             ← PropertyCard, PropertyGrid, etc.
│   │   ├── marketplace/         ← ProductCard, ProductGrid, etc.
│   │   ├── messaging/           ← MessageBubble, ChatInput, etc.
│   │   └── shared/              ├── ListingCard, UserAvatar, etc.
│   │
│   ├── lib/                     ← Core utilities
│   │   ├── supabase.ts          ← Supabase client
│   │   ├── cloudinary.ts        ← Upload helper
│   │   ├── auth.ts              ← Auth helpers
│   │   ├── validation.ts        ← Zod schemas
│   │   └── constants.ts         ← Categories, amenities, etc.
│   │
│   ├── hooks/                   ← Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useProperties.ts
│   │   ├── useProducts.ts
│   │   ├── useConversations.ts
│   │   ├── useMessages.ts
│   │   └── useRealtime.ts
│   │
│   ├── stores/                  ← Zustand stores
│   │   ├── authStore.ts
│   │   └── localeStore.ts
│   │
│   ├── i18n/                    ← Internationalization
│   │   ├── index.ts
│   │   └── locales/
│   │       ├── en.json
│   │       ├── fr.json
│   │       ├── tr.json
│   │       └── ar.json
│   │
│   └── types/                   ← TypeScript types
│       ├── database.ts          ← Generated from Supabase
│       └── models.ts            ← App-level types
│
├── assets/
│   ├── fonts/
│   ├── images/                  ← Splash, icons, placeholders
│   └── icons/
│
├── package.json
├── app.json                     ← Expo config
├── tsconfig.json
├── tailwind.config.js           ← NativeWind config
└── babel.config.js
```

---

## 10. Environment Variables

```bash
# .env
# ── Supabase ──
EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# ── Cloudinary ──
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-preset

# ── App ──
EXPO_PUBLIC_APP_NAME=DOUCSOFT
EXPO_PUBLIC_APP_URL=http://localhost:8081
```

---

## 11. Build Roadmap (Step by Step)

### Phase 0 — Project Setup
- [ ] Initialize Expo project with TypeScript + Expo Router
- [ ] Set up Supabase CLI + local Docker Compose
- [ ] Run initial migrations (all tables + RLS)
- [ ] Configure NativeWind (Tailwind) + fonts
- [ ] Set up i18n with 4 languages + RTL
- [ ] Create `.env.example` + `.env`
- [ ] Set up ESLint + Prettier

### Phase 1 — Auth & Profiles
- [ ] Supabase Auth integration (sign up, login, logout)
- [ ] Email verification flow (dev mode: console log)
- [ ] Password reset flow
- [ ] Auth guard (protected routes)
- [ ] Onboarding screen (profile completion)
- [ ] Profile screen + edit profile
- [ ] Role selection (Student / Owner / Agency)

### Phase 2 — Housing Module
- [ ] Property feed (list + search)
- [ ] Property filters (budget, type, rooms, furnished, city)
- [ ] Property details screen (gallery, amenities, owner card)
- [ ] Create property listing (multi-step form + image upload)
- [ ] Edit / delete own listing
- [ ] Mark as unavailable
- [ ] Owner profile screen (verified badge, other listings)

### Phase 3 — Marketplace Module
- [ ] Product feed (list + search)
- [ ] Product filters (category, price, condition, city)
- [ ] Product details screen (gallery, seller card)
- [ ] Create product listing (multi-step form + image upload)
- [ ] Edit / delete own listing
- [ ] Mark as sold
- [ ] Seller profile screen

### Phase 4 — Messaging
- [ ] Conversation list screen
- [ ] Chat screen with real-time messages (Supabase Realtime)
- [ ] "Contact" button on listings → auto-create conversation
- [ ] Unread message counts
- [ ] Block / report user from chat

### Phase 5 — Trust & Safety
- [ ] Owner/Agency verification submission flow
- [ ] Verification status tracking
- [ ] Report listing / user flow
- [x] Admin dashboard (stats overview) — `admin-web/`
- [x] Admin: user management (suspend, reactivate) — `admin-web/`
- [x] Admin: verification review (approve, reject) — `admin-web/`
- [x] Admin: reports management — `admin-web/`
- [x] Admin: content moderation (remove listings) — `admin-web/`

### Phase 6 — Polish & UX
- [ ] Favorites (save properties + products)
- [ ] Notifications screen
- [ ] Settings screen (language switcher, delete account)
- [ ] Loading states, empty states, error states
- [ ] Pull-to-refresh on all feeds
- [ ] Deep linking (listing URLs)
- [ ] App icon + splash screen

### Phase 7 — Testing & Launch
- [ ] End-to-end testing of all user journeys
- [ ] Test on iOS, Android, and Web
- [ ] Performance optimization (image caching, list virtualization)
- [ ] Security audit (RLS policies, input validation)
- [ ] Deploy: EAS Build (iOS/Android) + Vercel (web)
- [ ] Set up production Supabase project
- [ ] Configure Resend for production email
- [ ] Seed data for demo

---

## 12. Key Technical Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Expo SDK 53+ | One codebase → iOS, Android, Web |
| Backend | Supabase (direct) | No custom server needed, fastest MVP |
| Database | PostgreSQL via Supabase | Relational data, RLS, realtime |
| Local DB | Docker Compose (Supabase CLI) | Easy reset, matches production |
| Auth | Supabase Auth | Email + password, JWT, session management |
| Images | Cloudinary | Free tier, optimization, CDN |
| i18n | i18next + react-i18next | Mature, RTL support, 4 languages |
| Styling | NativeWind (Tailwind) | Fast, consistent, familiar |
| Data | TanStack React Query | Caching, optimistic updates, offline |
| State | Zustand | Lightweight, simple |
| Messaging | Supabase Realtime | No WebSocket server needed |
| Email | Dev: console → Prod: Resend | Zero setup now, swap later |

---

## 13. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Supabase RLS misconfiguration | Test all policies thoroughly in Phase 0 |
| Arabic RTL layout issues | Test early, use logical CSS properties |
| Image upload failures | Fallback to Supabase Storage |
| Scope creep | Follow MUST/SHOULD/LATER from spec strictly |
| 4-month timeline | Phased approach — each phase delivers value |

---

*Plan prepared for DOUCSOFT — Sekou BOUNDY — 2026*
