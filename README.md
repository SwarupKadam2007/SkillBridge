# SkillBridge — Campus Student Services Marketplace

Android-first React Native (Expo) + Express.js + Supabase PostgreSQL platform designed exclusively for university campus freelancing, student gig exchange, and peer services.

---

## What's Included

| Module | Status | Features |
| :--- | :--- | :--- |
| **Mobile App (React Native Expo)** | ✅ Complete | 5 Bottom Tabs (`Home`, `Chats`, `Post`, `My Work`, `Profile`), Context Auth, Native Stack Navigation |
| **Authentication & Registration** | ✅ Complete | Email + Password, Full Name capture, Supabase Auth tokens |
| **Campus Domain Verification** | ✅ Complete | Dynamic verification against approved college domains and subdomains |
| **Academic Integrity Filter** | ✅ Complete | Automated guard blocking exam cheating, fake tests, and proxy attendance |
| **Home Marketplace** | ✅ Complete | Category filters, search, pull-to-refresh, real-time campus badge, notification bell |
| **Post a Gig** | ✅ Complete | Category selector, delivery time, rupee pricing, client-side & server validation |
| **Gig Details & Custom Pitch** | ✅ Complete | Custom proposals, seller reputation rating, owner applicant review, direct chat button |
| **Real-Time Campus Chat** | ✅ Complete | 1-on-1 real-time messaging with Supabase Realtime WebSockets, optimistic UI, auto-scroll |
| **Student Proposals & Hiring** | ✅ Complete | Gig owner reviews applicants, accepts/declines proposals with 1 click |
| **My Work Dashboard** | ✅ Complete | 3-way segmented dashboard: Active Orders, My Gigs (with applicant counts), My Applications |
| **Order Details & Escrow Workflow**| ✅ Complete | Awaiting payment, Escrow funding, work delivery, buyer release, direct chat |
| **Reviews & Ratings System** | ✅ Complete | Interactive 5-star rating, review submissions on completed orders, campus reputation score |
| **In-App Notifications** | ✅ Complete | Notification bell with unread badge, order/chat/application notifications, mark all read |
| **Payment Gateway & Webhook** | ✅ Complete | Dual-mode checkout: Razorpay production ready + built-in Campus Escrow Vault mode |
| **Student Campus Profile** | ✅ Complete | Verified campus badge, degree/course, grad year, bio, reputation score, in-app editing |
| **Express REST API** | ✅ Complete | JWT authentication, role verification, sanitized inputs, rate-limiting, error handling |
| **Supabase SQL Migrations** | ✅ Complete | `001_initial_schema.sql`, `002_rls_policies.sql`, `003_seed_demo_data.sql` |

---

## Repository Layout

```
Skill-Bridge/
├── mobile/                  # React Native (Expo) Android/iOS app
│   ├── src/
│   │   ├── components/      # GigCard, PrimaryButton, RatingStars
│   │   ├── context/         # AuthContext (profile, session, verification state)
│   │   ├── lib/             # API client, Supabase client
│   │   ├── navigation/      # RootNavigator, Bottom Tabs (Home, Chats, Post, My Work, Profile)
│   │   ├── screens/         # Home, Chats, Chat, Notifications, College, GigDetails, Applicants, Orders, MyWork, Profile
│   │   └── theme.js         # Color palette, spacing, typography
│   ├── App.js
│   ├── app.json
│   └── package.json
├── server/                  # Node.js + Express REST API
│   ├── src/
│   │   ├── config/          # Supabase Admin & Public clients
│   │   ├── middleware/      # Auth JWT, campus verification, academic integrity guard
│   │   ├── modules/
│   │   │   ├── auth/        # /api/me (GET & PUT)
│   │   │   ├── college/     # /api/college/active, /api/college/verify
│   │   │   ├── gigs/        # /api/gigs, /mine, /:id, /:id/applications
│   │   │   ├── applications/# /api/applications/mine, /:id
│   │   │   ├── chat/        # /api/chat/conversations, /:id/messages
│   │   │   ├── reviews/     # /api/reviews, /user/:userId, /order/:orderId
│   │   │   ├── notifications# /api/notifications, /:id/read, /read-all
│   │   │   └── payments/    # /api/payments/create-order, /verify, /webhook
│   │   ├── app.js
│   │   └── server.js
│   └── package.json
└── supabase/
    └── migrations/
        ├── 001_initial_schema.sql    # Tables, relationships, triggers
        ├── 002_rls_policies.sql      # Row Level Security policies
        └── 003_seed_demo_data.sql    # Sample campuses, allowed domains, test seed
```

---

## 1. Quick Start Guide

### Step 1: Database Setup (Supabase)
1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Run the migrations in sequence:
   - Run `supabase/migrations/001_initial_schema.sql`
   - Run `supabase/migrations/002_rls_policies.sql`
   - Run `supabase/migrations/003_seed_demo_data.sql`
4. Copy your **Project URL**, **Anon Public Key**, and **Service Role Key** (from Settings > API).

> **Note for Local Testing**: `003_seed_demo_data.sql` configures `@student.edu`, `@college.edu`, and `@gmail.com` under "Demo University" so you can test campus verification immediately without needing a live institutional mailbox.

---

### Step 2: Start the Express API
```bash
cd server
copy .env.example .env    # On Windows: copy .env.example .env (On Mac/Linux: cp .env.example .env)
```
Fill in `.env`:
```ini
PORT=4000
NODE_ENV=development
CLIENT_ORIGIN=*
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY

# Optional: Razorpay (if omitted, SkillBridge uses built-in Campus Escrow Vault mode)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```
Start the API:
```bash
npm install
npm run dev
```
The server will boot on `http://localhost:4000`.

---

### Step 3: Start the Mobile App (Expo)
```bash
cd ../mobile
copy .env.example .env
```
Fill in `mobile/.env`:
```ini
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
# For Android Emulator:
EXPO_PUBLIC_API_URL=http://10.0.2.2:4000
# For physical phone with Expo Go:
# EXPO_PUBLIC_API_URL=http://<YOUR_LOCAL_IP>:4000
```
Run the Expo development server:
```bash
npm install
npx expo start
```
- Press **`a`** to launch on Android emulator.
- Scan the QR code using the **Expo Go** app on your physical Android phone (ensure phone and PC are on the same Wi-Fi).

---

## API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Server health check (no auth needed) |
| `GET` | `/api/me` | Fetch authenticated user profile and college data |
| `PUT` | `/api/me` | Update name, bio, course, graduation year |
| `GET` | `/api/college/active` | List supported campuses and allowed email domains |
| `POST` | `/api/college/verify` | Verify current user's email against allowed domains |
| `GET` | `/api/gigs` | Search & filter active campus gigs (`?category=&search=`) |
| `POST` | `/api/gigs` | Post a new gig (protected by Academic Integrity Guard) |
| `GET` | `/api/gigs/mine` | List all gigs posted by the current student with applicant count |
| `GET` | `/api/gigs/:id` | Get single gig details, owner flag, and application status |
| `GET` | `/api/gigs/:id/applications`| List all proposals submitted to this gig (owner only) |
| `POST` | `/api/gigs/:id/applications`| Submit custom proposal/pitch for a gig |
| `GET` | `/api/applications/mine` | List all gigs applied to by the user |
| `PATCH`| `/api/applications/:id` | Accept or decline applicant (owner), or withdraw (applicant) |
| `GET` | `/api/orders/mine` | List all orders where user is buyer or seller |
| `POST` | `/api/orders` | Create an order from an accepted proposal |
| `GET` | `/api/orders/:id` | Order details, deliverables history, and escrow state |
| `PATCH`| `/api/orders/:id/status`| Transition status (`delivered`, `accepted`, `cancelled`, etc.) |
| `POST` | `/api/orders/:id/deliveries` | Submit work notes and deliverable links (seller) |
| `POST` | `/api/chat/conversations` | Start or retrieve conversation between buyer & seller |
| `GET` | `/api/chat/conversations` | List all user's active campus chats with latest message |
| `GET` | `/api/chat/conversations/:id/messages` | Message history for a conversation |
| `POST` | `/api/chat/conversations/:id/messages` | Send message (triggers notification) |
| `POST` | `/api/reviews` | Submit star rating (1-5) and feedback for completed order |
| `GET` | `/api/reviews/user/:userId` | Get student reputation score and reviews list |
| `GET` | `/api/notifications` | Get user notifications and unread count |
| `PATCH`| `/api/notifications/:id/read` | Mark single notification as read |
| `POST` | `/api/notifications/read-all` | Mark all notifications as read |
| `POST` | `/api/payments/create-order` | Create payment order (Razorpay or Campus Escrow Vault) |
| `POST` | `/api/payments/verify` | Verify payment and fund escrow |
| `POST` | `/api/payments/webhook` | Payment gateway webhook receiver |
