create table public.bookings (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  customer_name text not null,
  customer_address text not null,
  service_date date not null,
  bin_type text not null check (bin_type in ('Restmüll', 'Papier', 'Bio', 'Gelber Sack')),
  service_scope text not null check (service_scope in ('Nur Rausstellen', 'Nur Reinstellen', 'Raus & Rein')),
  status text not null default 'Offen' check (status in ('Offen', 'Erledigt')),
  paid boolean default false,
  is_monthly boolean default false,
  price numeric not null default 2.00
);

-- Row Level Security (RLS)
alter table public.bookings enable row level security;

-- Policies
-- 1. Public can insert bookings (Guest Checkout)
create policy "Public can create bookings"
  on public.bookings for insert
  with check (true);

-- 2. Admins can view all bookings
-- Assuming you configure Supabase Auth for admins or just use service role in backend.
-- For simple client-side access with Anon key, you might need to allow select for now, 
-- or better, restrict it to authenticated users if you use Auth.
-- Since we use a simple "logged in" check, we'll assume Authenticated users are admins 
-- (or you will manually add a rule for your specific admin email).
create policy "Authenticated users can view bookings"
  on public.bookings for select
  using (auth.role() = 'authenticated');

-- 3. Admins can update bookings (Mark as Done)
create policy "Authenticated users can update bookings"
  on public.bookings for update
  using (auth.role() = 'authenticated');
