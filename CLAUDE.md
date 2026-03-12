# Online Školní Buffet — Project Instructions

## Overview

Web application for a **school buffet ordering system**. Students order food/drinks online, pay with card or school credit, and get notified when their order is ready — so they don't waste their entire break waiting in line. Admins manage products, availability, and school credit balances.

**Stack:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase (Auth, Database, Realtime, Storage)

---

## Design Direction

Use the **frontend-design** skill. The design must be:
- **Light/bright theme** — clean whites, soft warm accents (peach, apricot, warm yellow), subtle food-inspired palette
- **Aesthetic:** "Scandinavian café" — warm minimalism with playful micro-interactions, rounded corners, soft shadows, generous whitespace
- **Typography:** Use a distinctive display font (e.g., "Outfit" or "Sora") paired with a refined body font (e.g., "DM Sans"). NO generic fonts (Inter, Roboto, Arial)
- **Motion:** Smooth staggered reveals on product cards, satisfying cart interactions, subtle hover states, order status pulse animations
- **Memorable element:** A real-time order status tracker with animated steps (Ordered → Preparing → Ready) with playful food-themed icons
- **Cards:** Product cards with rounded images, clear pricing, subtle hover lift effect
- **Mobile-first** responsive design — students will use phones during breaks

---

## Supabase Database Schema

### Tables

```sql
-- Profiles (extends Supabase Auth)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  role text not null check (role in ('student', 'admin')) default 'student',
  school_credit numeric(10,2) not null default 0.00,
  class text, -- e.g. "3.A"
  avatar_url text,
  created_at timestamptz default now()
);

-- Products catalog
create table products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  price numeric(10,2) not null,
  image_url text, -- URL to product image in Supabase Storage (admin uploads manually)
  category text not null check (category in ('food', 'drink', 'snack', 'other')),
  is_available boolean default false, -- admin toggles availability per day
  preparation_time_min int default 5, -- estimated prep time in minutes
  created_at timestamptz default now()
);

-- Orders
create table orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  status text not null check (status in ('pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'cancelled')) default 'pending',
  payment_method text not null check (payment_method in ('card', 'school_credit')),
  total_amount numeric(10,2) not null,
  estimated_ready_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Order items (many-to-many between orders and products)
create table order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references orders(id) on delete cascade not null,
  product_id uuid references products(id) not null,
  quantity int not null default 1,
  unit_price numeric(10,2) not null -- price at time of order
);

-- Notifications
create table notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  order_id uuid references orders(id) on delete cascade,
  message text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);
```

### Row Level Security (RLS)

- `profiles`: Users can read/update their own profile. Admins can read all profiles and update school_credit.
- `products`: Everyone can read. Only admins can insert/update/delete.
- `orders`: Users see only their own orders. Admins see all orders.
- `order_items`: Same as orders — scoped to the order owner or admin.
- `notifications`: Users see only their own notifications.

### Supabase Realtime

- Subscribe to `orders` table changes so students get **real-time order status updates** (preparing → ready).
- Subscribe to `notifications` table for instant notification delivery.

### Supabase Storage

- Bucket: `product-images` — admin uploads product photos manually. Set public read access.

---

## Authentication & Accounts

Use **Supabase Auth** (email + password). On signup:
1. Create auth user
2. Auto-create `profiles` row via database trigger with role `'student'` by default
3. Admin accounts are created manually or via a seed/admin panel (role = `'admin'`)

### Role-based access:
- **Student:** Browse available products, add to cart, place orders, pay with school credit or card, view order history, receive notifications
- **Admin:** Toggle product availability, manage product catalog (CRUD), add/manage school credit for students, view all orders, update order status (confirm → preparing → ready), view analytics (popular items)

---

## Core Features

### 1. Student Flow
- **Product catalog** — Grid of available products with images, names, prices, categories. Filter by category. Search by name.
- **Cart** — Add/remove items, see total. Persistent in localStorage until order placed.
- **Checkout** — Choose payment: school credit (instant deduction) or card (Stripe checkout or simulated). Validate sufficient credit balance.
- **Order tracking** — Real-time status page with animated progress: `Pending → Confirmed → Preparing → Ready → Picked up`. Show estimated time.
- **Notifications** — Bell icon with badge. Real-time push when order status changes (especially "Ready! Come pick up your order!"). Toast notifications.
- **Order history** — List of past orders with details.

### 2. Admin Flow
- **Dashboard** — Overview: today's orders count, revenue, popular items chart/ranking.
- **Product management** — Table/grid of all products. Toggle availability switch per product. Edit name/price/description/category. Image URL field (admin pastes URL or uploads to storage).
- **Order management** — Live feed of incoming orders. Click to update status step by step. Filter by status.
- **Student credit management** — Search students, view balance, add/deduct credit. Bulk credit top-up option.
- **Analytics** — Most ordered products (bar chart), orders per day (line chart), revenue tracking. Use a lightweight chart library (e.g., recharts or Chart.js).

### 3. School Credit System
- Admin can add credit to any student's account (like topping up a school card).
- Students see their credit balance prominently in the header.
- On checkout with school credit: check balance ≥ total → deduct atomically (use Supabase RPC/transaction).
- Credit history/log would be a bonus.

### 4. Notifications & "Ready" Alert
- When admin changes order status to `'ready'`:
  - Insert row into `notifications` table with message like "Tvoje objednávka #XYZ je připravená! Přijď si ji vyzvednout."
  - Student sees real-time toast + notification badge update via Supabase Realtime subscription.
  - Optional: browser push notification if permitted.

---

## Page Structure

```
/                     → Landing / product catalog (students see available items)
/login                → Login page
/register             → Registration page  
/cart                 → Shopping cart
/checkout             → Payment selection & confirmation
/orders               → Student order history
/orders/[id]          → Order detail with real-time status tracker
/admin                → Admin dashboard (protected, role='admin')
/admin/products       → Product management (CRUD + availability toggle)
/admin/orders         → Order management with status updates
/admin/students       → Student list + credit management
/admin/analytics      → Popular items, revenue charts
```

---

## Tech Requirements

- **Next.js 14** with App Router, Server Components where possible, Client Components for interactivity
- **TypeScript** throughout
- **Tailwind CSS** for styling (use the frontend-design skill for all UI)
- **Supabase JS client** (`@supabase/supabase-js`) — use `createClientComponentClient` and `createServerComponentClient`
- **Supabase Auth** with middleware for route protection
- **Supabase Realtime** for live order status + notifications
- **Zustand** or React Context for client-side cart state
- **react-hot-toast** or **sonner** for toast notifications
- **recharts** for admin analytics charts
- **Stripe** (optional/simulated) for card payments — can be a mock for now
- **Lucide React** for icons
- Use `.env.local` for Supabase URL and anon key:
  ```
  NEXT_PUBLIC_SUPABASE_URL=...
  NEXT_PUBLIC_SUPABASE_ANON_KEY=...
  ```

---

## Implementation Order

1. Initialize Next.js project with TypeScript + Tailwind
2. Set up Supabase client, types, and middleware (auth + route protection)
3. Create database schema (provide SQL migration file)
4. Build auth pages (login, register) with role handling
5. Build product catalog page (student view) with filtering
6. Build cart + checkout flow with school credit payment
7. Build order tracking page with Supabase Realtime
8. Build notification system (bell icon + toasts)
9. Build admin dashboard + product management
10. Build admin order management with status updates
11. Build admin student credit management
12. Build admin analytics page
13. Polish design, animations, responsiveness

---

## Language

- UI text in **Czech** (it's a Czech school project): buttons, labels, statuses, notifications
- Code (variables, comments) in **English**

---

## Key UX Principles

- Students have **max 10-15 minutes** during a break. Every interaction must be fast and frictionless.
- The "order ready" notification is the **killer feature** — make it unmissable (sound, vibration, bold visual).
- Product images are critical — large, appetizing, with fallback placeholder if no image set.
- Show estimated wait time clearly after ordering.
- Admin needs to update order status **quickly** — one-click status advancement, not complex forms.