import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Statische Sicherheitsprüfung der Migrationen (ersetzt keinen Test gegen eine echte DB,
// verhindert aber versehentliche Regressionen in den Regeln).
const schema = readFileSync('supabase/migrations/0001_schema.sql', 'utf8');
const rls = readFileSync('supabase/migrations/0002_rls.sql', 'utf8');
const tables = [...schema.matchAll(/create table (\w+)/g)].map((m) => m[1]!);

describe('Row Level Security', () => {
  it('aktiviert RLS für jede Tabelle', () => {
    expect(tables.length).toBeGreaterThanOrEqual(8);
    for (const t of tables) expect(rls).toMatch(new RegExp(`alter table ${t} enable row level security`));
  });

  it('Besucher lesen nur veröffentlichte Einträge', () => {
    expect(rls).toMatch(/entries_public_read on religious_entries for select using \(status = 'published'\)/);
    expect(rls).toMatch(/translations_public_read[\s\S]*e\.status = 'published'/);
    expect(rls).toMatch(/entry_emotions_public_read[\s\S]*e\.status = 'published'/);
  });

  it('Schreibrechte auf Inhalte nur für Admins', () => {
    for (const t of ['emotions', 'religious_sources', 'religious_entries', 'entry_translations', 'entry_emotions']) {
      expect(rls).toMatch(new RegExp(`on ${t} for all using \\(is_admin\\(\\)\\) with check \\(is_admin\\(\\)\\)`));
    }
  });

  it('Anmeldung allein verleiht keine Adminrechte', () => {
    expect(rls).not.toMatch(/on admin_users for (insert|update|delete|all)/);
    expect(schema).not.toMatch(/create table profiles[^;]*(role|is_admin)/);
    expect(rls).toMatch(/from admin_users where user_id = auth\.uid\(\)/);
  });

  it('Favoriten sind auf den eigenen Nutzer begrenzt', () => {
    expect(rls).toMatch(/favorites_select_own on favorites for select using \(user_id = auth\.uid\(\)\)/);
    expect(rls).toMatch(/favorites_insert_own[\s\S]*user_id = auth\.uid\(\)/);
    expect(rls).toMatch(/favorites_delete_own on favorites for delete using \(user_id = auth\.uid\(\)\)/);
  });

  it('Datenbank erzwingt Quellenprüfung vor Veröffentlichung', () => {
    expect(schema).toMatch(/publish_needs_verification[\s\S]*source_verified/);
    expect(schema).toMatch(/hadith_needs_grade/);
  });
});
