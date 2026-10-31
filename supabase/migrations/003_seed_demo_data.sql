-- SkillBridge Demo Seed Data
-- Run this in Supabase SQL Editor after 001 and 002 migrations to set up test campuses and sample data.

-- 1. Insert sample colleges
insert into public.colleges (id, name, slug, is_active)
values 
  ('a0000000-0000-0000-0000-000000000001', 'Demo University', 'demo-university', true),
  ('a0000000-0000-0000-0000-000000000002', 'Stanford University', 'stanford', true),
  ('a0000000-0000-0000-0000-000000000003', 'IIT Bombay', 'iit-bombay', true)
on conflict (slug) do nothing;

-- 2. Insert verified email domains for colleges
-- Note: 'gmail.com' and 'test.com' are added to Demo University strictly for local development and testing.
insert into public.college_domains (college_id, domain, is_active)
values
  ('a0000000-0000-0000-0000-000000000001', 'student.edu', true),
  ('a0000000-0000-0000-0000-000000000001', 'college.edu', true),
  ('a0000000-0000-0000-0000-000000000001', 'gmail.com', true),
  ('a0000000-0000-0000-0000-000000000002', 'stanford.edu', true),
  ('a0000000-0000-0000-0000-000000000003', 'iitb.ac.in', true)
on conflict (domain) do update set is_active = true;

-- 3. Helper function to check verification status for testing
create or replace function public.is_college_verified(user_uuid uuid)
returns boolean language sql security definer as $$
  select exists(
    select 1 from public.profiles
    where id = user_uuid and college_id is not null and college_verified_at is not null
  );
$$;

