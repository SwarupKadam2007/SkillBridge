-- SkillBridge initial schema. Apply in Supabase SQL Editor or Supabase CLI.
create extension if not exists pgcrypto;

create table if not exists public.colleges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.college_domains (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references public.colleges(id) on delete cascade,
  domain text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint domain_lowercase check (domain = lower(domain))
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  username text unique,
  avatar_url text,
  bio text,
  course text,
  graduation_year int,
  college_id uuid references public.colleges(id),
  college_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gigs (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references public.colleges(id),
  seller_id uuid not null references public.profiles(id),
  title text not null check (char_length(title) between 5 and 100),
  description text not null check (char_length(description) between 10 and 3000),
  category text not null,
  price_paise int not null check (price_paise > 0),
  delivery_days int not null check (delivery_days between 1 and 60),
  status text not null default 'open' check (status in ('open','in_progress','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null references public.gigs(id) on delete cascade,
  applicant_id uuid not null references public.profiles(id),
  message text,
  status text not null default 'pending' check (status in ('pending','accepted','rejected','withdrawn')),
  created_at timestamptz not null default now(),
  unique(gig_id, applicant_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null references public.gigs(id),
  buyer_id uuid not null references public.profiles(id),
  seller_id uuid not null references public.profiles(id),
  college_id uuid not null references public.colleges(id),
  agreed_price_paise int not null check (agreed_price_paise > 0),
  status text not null default 'awaiting_payment'
    check (status in ('awaiting_payment','funded','in_progress','delivered','revision_requested','accepted','cancelled','disputed','refunded')),
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (buyer_id <> seller_id)
);

create table if not exists public.deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  submitted_by uuid not null references public.profiles(id),
  note text,
  file_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id),
  provider text,
  provider_payment_id text unique,
  amount_paise int not null check (amount_paise > 0),
  status text not null default 'created'
    check (status in ('created','pending','paid','failed','refund_pending','refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.escrow_transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id),
  payment_id uuid references public.payments(id),
  status text not null default 'not_funded'
    check (status in ('not_funded','funded','release_pending','released','refund_pending','refunded','disputed')),
  funded_at timestamptz,
  released_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  reviewer_id uuid not null references public.profiles(id),
  reviewee_id uuid not null references public.profiles(id),
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique(order_id, reviewer_id),
  check (reviewer_id <> reviewee_id)
);

create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  file_path text,
  external_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid references public.gigs(id),
  buyer_id uuid not null references public.profiles(id),
  seller_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique(gig_id, buyer_id, seller_id),
  check (buyer_id <> seller_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists gigs_college_status_created_idx on public.gigs(college_id, status, created_at desc);
create index if not exists gigs_seller_idx on public.gigs(seller_id);
create index if not exists applications_gig_idx on public.applications(gig_id, status);
create index if not exists orders_buyer_idx on public.orders(buyer_id, created_at desc);
create index if not exists orders_seller_idx on public.orders(seller_id, created_at desc);
create index if not exists messages_conversation_idx on public.messages(conversation_id, created_at);
create index if not exists notifications_user_idx on public.notifications(user_id, created_at desc);

-- Automatically create a profile when a Supabase Auth user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
