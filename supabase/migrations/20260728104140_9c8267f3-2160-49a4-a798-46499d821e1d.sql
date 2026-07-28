revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.has_role(uuid, public.app_role) from public, anon;
revoke all on function public.purchase_vehicle(uuid, int) from public, anon;
revoke all on function public.restock_vehicle(uuid, int) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.purchase_vehicle(uuid, int) to authenticated;
grant execute on function public.restock_vehicle(uuid, int) to authenticated;