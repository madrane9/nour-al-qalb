-- Row Level Security
create function is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from admin_users where user_id = auth.uid());
$$;
revoke all on function is_admin() from public;
grant execute on function is_admin() to anon, authenticated;

alter table profiles enable row level security;
alter table admin_users enable row level security;
alter table emotions enable row level security;
alter table religious_sources enable row level security;
alter table religious_entries enable row level security;
alter table entry_translations enable row level security;
alter table entry_emotions enable row level security;
alter table favorites enable row level security;

-- profiles: nur eigenes Profil
create policy profiles_select_own on profiles for select using (id = auth.uid());
create policy profiles_update_own on profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- admin_users: man sieht nur den eigenen Eintrag; schreiben ist über die API unmöglich (keine Policy)
create policy admin_users_select_own on admin_users for select using (user_id = auth.uid());

-- emotions
create policy emotions_public_read on emotions for select using (not archived);
create policy emotions_admin_all on emotions for all using (is_admin()) with check (is_admin());

-- sources (öffentliche Metadaten)
create policy sources_public_read on religious_sources for select using (true);
create policy sources_admin_all on religious_sources for all using (is_admin()) with check (is_admin());

-- entries: Besucher sehen nur veröffentlichte
create policy entries_public_read on religious_entries for select using (status = 'published');
create policy entries_admin_all on religious_entries for all using (is_admin()) with check (is_admin());

create policy translations_public_read on entry_translations for select
  using (exists (select 1 from religious_entries e where e.id = entry_id and e.status = 'published'));
create policy translations_admin_all on entry_translations for all using (is_admin()) with check (is_admin());

create policy entry_emotions_public_read on entry_emotions for select
  using (exists (select 1 from religious_entries e where e.id = entry_id and e.status = 'published'));
create policy entry_emotions_admin_all on entry_emotions for all using (is_admin()) with check (is_admin());

-- favorites: nur eigene, nur für veröffentlichte Einträge
create policy favorites_select_own on favorites for select using (user_id = auth.uid());
create policy favorites_insert_own on favorites for insert with check (
  user_id = auth.uid()
  and exists (select 1 from religious_entries e where e.id = entry_id and e.status = 'published')
);
create policy favorites_delete_own on favorites for delete using (user_id = auth.uid());

-- Quellenprüfung: verified_by/verified_at serverseitig setzen
create function stamp_verification() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.source_verified and (tg_op = 'INSERT' or not old.source_verified) then
    new.verified_at = now();
    new.verified_by = auth.uid();
  elsif not new.source_verified then
    new.verified_at = null;
    new.verified_by = null;
  end if;
  return new;
end $$;
create trigger trg_stamp_verification before insert or update on religious_entries
  for each row execute function stamp_verification();
