-- Clients never UPDATE bookings — all post-insert writes go through edge functions
-- (service role, which bypasses RLS + grants). Revoke UPDATE entirely so any client
-- attempt to change payment_status is a hard "permission denied", not an RLS no-op.
-- INSERT/SELECT/DELETE grants (create/view/cancel) are untouched.
revoke update on public.bookings from anon, authenticated;
