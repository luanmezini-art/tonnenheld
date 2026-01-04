-- 4. Erlaubt nur ADMINS das Löschen
create policy "Authenticated users can delete bookings"
  on public.bookings for delete
  using (auth.role() = 'authenticated');
