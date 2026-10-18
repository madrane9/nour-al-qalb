-- Nour Al-Qalb: Schema
create extension if not exists pgcrypto;

create type entry_type as enum ('quran', 'hadith', 'reflection');
create type entry_status as enum ('draft', 'published', 'archived');
create type translation_kind as enum ('translation', 'explanation', 'reflection');

-- Profile (1:1 zu auth.users). KEINE Rollenspalte: Adminrechte stehen ausschließlich in admin_users.
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

-- Explizite Admin-Freigabe. Einträge nur per SQL-Editor / service_role, nie über die App.
create table admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table emotions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name_ar text not null,
  name_de text not null,
  name_en text not null,
  color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  icon text not null,
  sort_order int not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table religious_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('quran', 'hadith', 'other')),
  base_url text,
  license_note text,
  created_at timestamptz not null default now()
);

create table religious_entries (
  id uuid primary key default gen_random_uuid(),
  type entry_type not null,
  arabic_text text,
  surah_number int check (surah_number between 1 and 114),
  surah_name_ar text,
  surah_name_en text,
  ayah_number int check (ayah_number >= 1),
  source_id uuid references religious_sources (id) on delete set null,
  source_reference text,          -- z. B. "94:6" oder "Nr. 5641"
  source_url text check (source_url is null or source_url ~ '^https://'),
  grade text,                     -- Hadith: Authentizitätsbewertung
  grade_source text,              -- Hadith: wer hat bewertet / wo nachgeprüft
  audio_url text check (audio_url is null or audio_url ~ '^https://'),
  audio_source text,
  status entry_status not null default 'draft',
  source_verified boolean not null default false,
  verified_at timestamptz,
  verified_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quran_needs_location check (type <> 'quran' or (surah_number is not null and ayah_number is not null)),
  -- Veröffentlichung nur nach manueller Quellenprüfung
  constraint publish_needs_verification check (
    status <> 'published'
    or type = 'reflection'
    or (source_verified and source_url is not null and source_reference is not null)
  ),
  constraint hadith_needs_grade check (
    status <> 'published' or type <> 'hadith' or (grade is not null and grade_source is not null)
  ),
  constraint quran_needs_arabic check (status <> 'published' or type <> 'quran' or arabic_text is not null)
);

create table entry_translations (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references religious_entries (id) on delete cascade,
  lang text not null check (lang in ('ar', 'de', 'en')),
  kind translation_kind not null,
  body text not null,
  source_name text,
  created_at timestamptz not null default now(),
  unique (entry_id, lang, kind)
);

create table entry_emotions (
  entry_id uuid not null references religious_entries (id) on delete cascade,
  emotion_id uuid not null references emotions (id) on delete cascade,
  primary key (entry_id, emotion_id)
);

create table favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_id uuid not null references religious_entries (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, entry_id)
);

create index idx_entries_status_type on religious_entries (status, type);
create index idx_translations_entry on entry_translations (entry_id);
create index idx_entry_emotions_emotion on entry_emotions (emotion_id);
create index idx_favorites_user on favorites (user_id);

-- updated_at
create function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger trg_entries_updated before update on religious_entries
  for each row execute function set_updated_at();

-- Profil automatisch anlegen (ohne Rechte)
create function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();
