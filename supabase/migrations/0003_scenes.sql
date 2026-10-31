-- Nour Al-Qalb: Szenen ("Situation & Antwort")
-- Eine Szene ist ein Bild mit Sprechblasen (pro Sprache ein eigenes Bild)
-- und verweist auf einen bereits geprüften Eintrag (Vers/Hadith) als Antwort.

create table scenes (
  id uuid primary key default gen_random_uuid(),
  -- Der Eintrag, der die Antwort ist. Wird er gelöscht, verschwindet auch die Szene.
  entry_id uuid not null references religious_entries (id) on delete cascade,
  status entry_status not null default 'draft',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Pro Sprache ein eigenes Bild. 'fr' ist schon erlaubt, weil Französisch geplant ist.
create table scene_images (
  scene_id uuid not null references scenes (id) on delete cascade,
  lang text not null check (lang in ('ar', 'de', 'en', 'fr')),
  image_path text not null,   -- Pfad im Storage-Bucket "scenes"
  alt_text text not null,     -- Bildbeschreibung für Screenreader (Text der Sprechblasen)
  created_at timestamptz not null default now(),
  primary key (scene_id, lang)
);

create index idx_scenes_status on scenes (status, sort_order);

create trigger trg_scenes_updated before update on scenes
  for each row execute function set_updated_at();

-- Sicherheit (gleicher Stil wie 0002_rls.sql)
alter table scenes enable row level security;
alter table scene_images enable row level security;

-- Besucher sehen eine Szene nur, wenn Szene UND Antwort-Eintrag veröffentlicht sind.
create policy scenes_public_read on scenes for select using (
  status = 'published'
  and exists (select 1 from religious_entries e where e.id = entry_id and e.status = 'published')
);
create policy scenes_admin_all on scenes for all using (is_admin()) with check (is_admin());

-- Bilder sind sichtbar, wenn die Szene sichtbar ist.
create policy scene_images_public_read on scene_images for select using (
  exists (
    select 1 from scenes s
    join religious_entries e on e.id = s.entry_id
    where s.id = scene_id and s.status = 'published' and e.status = 'published'
  )
);
create policy scene_images_admin_all on scene_images for all using (is_admin()) with check (is_admin());

-- Bucket "scenes": öffentlich lesbar, max. 2 MB pro Datei, nur Bildformate.
-- Quelle: https://supabase.com/docs/guides/storage/buckets/creating-buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('scenes', 'scenes', true, 2097152, array['image/webp', 'image/png', 'image/jpeg'])
on conflict (id) do nothing;

-- Nur Admins dürfen Dateien hochladen, ersetzen und löschen.
-- Lesen braucht keine Regel, weil der Bucket öffentlich ist.
-- Quelle: https://supabase.com/docs/guides/storage/security/access-control
create policy scenes_files_admin on storage.objects for all to authenticated
  using (bucket_id = 'scenes' and public.is_admin())
  with check (bucket_id = 'scenes' and public.is_admin());
