-- Fix Row Level Security (RLS) Policies

-- 1. Drop existing policies to ensure a clean slate (avoids errors if they exist partially)
drop policy if exists "Public can create bookings" on public.bookings;
drop policy if exists "Authenticated users can view bookings" on public.bookings;
drop policy if exists "Authenticated users can update bookings" on public.bookings;

-- 2. Re-create Policies correctly

-- Allow anyone (Guests) to INSERT bookings
create policy "Public can create bookings"
  on public.bookings for insert
  with check (true);

-- Allow only Logged-in Admins to VIEW bookings
create policy "Authenticated users can view bookings"
  on public.bookings for select
  using (auth.role() = 'authenticated');

-- Allow only Logged-in Admins to UPDATE bookings (e.g. mark as done)
create policy "Authenticated users can update bookings"
  on public.bookings for update
  using (auth.role() = 'authenticated');
