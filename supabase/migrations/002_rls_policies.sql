-- Enable RLS on every user-facing table.
alter table public.colleges enable row level security;
alter table public.college_domains enable row level security;
alter table public.profiles enable row level security;
alter table public.gigs enable row level security;
alter table public.applications enable row level security;
alter table public.orders enable row level security;
alter table public.deliveries enable row level security;
alter table public.payments enable row level security;
alter table public.escrow_transactions enable row level security;
alter table public.reviews enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;

-- Public college directory; domains are not exposed to clients.
create policy "active colleges readable" on public.colleges
for select to authenticated using (is_active = true);

-- A verified student's own campus profiles and gigs are visible.
create policy "same college profiles readable" on public.profiles
for select to authenticated using (
  id = auth.uid() or (
    college_id is not null and college_id = (
      select p.college_id from public.profiles p where p.id = auth.uid()
    ) and college_verified_at is not null
  )
);
create policy "profile owner can update safe profile fields" on public.profiles
for update to authenticated using (id = auth.uid())
with check (id = auth.uid());

create policy "same college open gigs readable" on public.gigs
for select to authenticated using (
  college_id = (select p.college_id from public.profiles p where p.id = auth.uid())
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.college_verified_at is not null)
);
create policy "verified student creates own campus gig" on public.gigs
for insert to authenticated with check (
  seller_id = auth.uid()
  and college_id = (select p.college_id from public.profiles p where p.id = auth.uid())
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.college_verified_at is not null)
);
create policy "seller updates own gig" on public.gigs
for update to authenticated using (seller_id = auth.uid()) with check (seller_id = auth.uid());

create policy "applications visible to applicant or gig owner" on public.applications
for select to authenticated using (
  applicant_id = auth.uid() or exists (
    select 1 from public.gigs g where g.id = gig_id and g.seller_id = auth.uid()
  )
);
create policy "verified student applies to same college gig" on public.applications
for insert to authenticated with check (
  applicant_id = auth.uid()
  and exists (
    select 1 from public.gigs g
    join public.profiles p on p.id = auth.uid()
    where g.id = gig_id and g.college_id = p.college_id
      and g.seller_id <> auth.uid() and p.college_verified_at is not null
      and g.status = 'open'
  )
);
create policy "applicant can withdraw own application" on public.applications
for update to authenticated using (applicant_id = auth.uid()) with check (applicant_id = auth.uid());

create policy "order participants read orders" on public.orders
for select to authenticated using (buyer_id = auth.uid() or seller_id = auth.uid());
create policy "order participants read deliveries" on public.deliveries
for select to authenticated using (exists (
  select 1 from public.orders o where o.id = order_id and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
));
create policy "seller submits delivery" on public.deliveries
for insert to authenticated with check (
  submitted_by = auth.uid() and exists (
    select 1 from public.orders o where o.id = order_id and o.seller_id = auth.uid()
  )
);

create policy "participants read conversations" on public.conversations
for select to authenticated using (buyer_id = auth.uid() or seller_id = auth.uid());
create policy "participants read messages" on public.messages
for select to authenticated using (exists (
  select 1 from public.conversations c where c.id = conversation_id
  and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
));
create policy "participant sends message" on public.messages
for insert to authenticated with check (
  sender_id = auth.uid() and exists (
    select 1 from public.conversations c where c.id = conversation_id
    and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  )
);

create policy "user reads own notifications" on public.notifications
for select to authenticated using (user_id = auth.uid());
create policy "user marks own notifications read" on public.notifications
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "same campus portfolio readable" on public.portfolio_items
for select to authenticated using (
  user_id = auth.uid() or exists (
    select 1 from public.profiles owner
    join public.profiles viewer on viewer.id = auth.uid()
    where owner.id = user_id and owner.college_id = viewer.college_id
      and owner.college_verified_at is not null and viewer.college_verified_at is not null
  )
);
create policy "owner manages portfolio" on public.portfolio_items
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "same campus reviews readable" on public.reviews
for select to authenticated using (
  exists (
    select 1 from public.profiles p
    where p.id in (reviewer_id, reviewee_id)
      and p.college_id = (select me.college_id from public.profiles me where me.id = auth.uid())
  )
);

-- Payments, escrow, college domains and reviews are written by trusted server workflows.
-- Do not grant clients direct INSERT/UPDATE on payments or escrow tables.
