-- Lock down helper functions (addresses Supabase security advisors).
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.is_admin() from public, anon;
revoke all on function public.is_super() from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_super() to authenticated;
