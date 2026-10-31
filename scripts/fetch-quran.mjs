// Holt Verse, Übersetzungen und Audio-URLs von der Quran.com-API (api.quran.com/api/v4)
// und erzeugt daraus src/data/quran-seed.json und supabase/seed/002_quran_entries.sql.
// Nichts wird aus dem Gedächtnis geschrieben: Arabisch = text_uthmani der API,
// Übersetzungen = Quran.com-Ressourcen 27 (Bubenheim & Elyas) und 20 (Saheeh International).
// Die Darija-Erklärungen sind EIGENE, vereinfachte Erklärungen (keine Übersetzung).
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const API = 'https://api.quran.com/api/v4';
const AUDIO_BASE = 'https://verses.quran.com/';
const TRANSLATIONS = { de: 27, en: 20 };
const RECITATION_ID = 7; // Mishari Rashid al-Afasy

// Redaktionelle Zuordnung Vers -> Gefühle (Slugs) + eigene Darija-Erklärung.
const CURATION = [
  ['94:6', ['hope', 'patience', 'exhaustion'], 'مع كل صعوبة كاين تيسير من عند الله.'],
  ['13:28', ['anxiety', 'fear', 'loneliness'], 'ذكر الله كيعطي للقلب السكينة والطمأنينة.'],
  ['2:286', ['exhaustion', 'patience', 'anxiety'], 'الله ما كيكلف حتى واحد بأكثر من طاقتو.'],
  ['3:139', ['sadness', 'hope'], 'ما تضعفوش وما تحزنوش، والله كيرفع المؤمنين.'],
  ['9:40', ['loneliness', 'fear'], 'ما تحزنش، الله معانا. هادي كلمة طمأنينة وقت الشدة.'],
  ['2:153', ['patience'], 'الصبر والصلاة كيعاونو الإنسان، والله مع الصابرين.'],
  ['93:3', ['sadness', 'loneliness'], 'ربك ما خلاك وما كرهك، رحمتو كتبقى معاك.'],
  ['93:5', ['joy', 'hope'], 'الله وعد بالعطاء حتى ترضى.'],
  ['20:46', ['fear'], 'الله كيقول للي كيخاف: ما تخافش، أنا معاك كنسمع وكنشوف.'],
  ['3:173', ['fear', 'anxiety'], 'فوقت الخوف، التوكل على الله هو الملجأ.'],
  ['39:53', ['repentance', 'hope'], 'باب رحمة الله مفتوح، ما تيأسش مهما كانو الذنوب.'],
  ['25:70', ['repentance'], 'التوبة الصادقة والعمل الصالح كيفتحو باب الرحمة.'],
  ['2:222', ['repentance'], 'الله كيحب اللي كيرجع ليه بالتوبة.'],
  ['14:7', ['gratitude'], 'الشكر كيزيد النعمة ويقرب القلب من الله.'],
  ['2:152', ['gratitude', 'loneliness'], 'ملي كنذكرو الله، هو كيذكرنا. ما كنتيناش بوحدنا.'],
  ['55:13', ['gratitude'], 'نعم الله بزاف، وكل وحدة فيها تذكير بالشكر.'],
  ['65:3', ['anxiety', 'uncertainty'], 'اللي كيتوكل على الله، الله كافيه.'],
  ['20:25', ['anxiety', 'exhaustion'], 'دعاء بسيط ديال سيدنا موسى: يا رب وسع ليا صدري.'],
  ['3:134', ['anger'], 'كظم الغيظ والعفو على الناس من صفات المحسنين.'],
  ['41:34', ['anger'], 'رد على الإساءة بالأحسن، وكتلقى القلوب كتتبدل.'],
  ['10:58', ['joy'], 'الفرح الحقيقي هو الفرح بفضل الله ورحمتو.'],
  ['2:186', ['loneliness', 'hope'], 'الله قريب وكيجاوب على دعوة اللي دعاه.'],
  ['50:16', ['loneliness'], 'الله قريب من الإنسان أكثر مما يتصور.'],
  ['11:115', ['patience'], 'اصبر، لأن الله ما كيضيع أجر المحسنين.'],
  ['12:87', ['hope'], 'ما تيأسوش من رحمة الله، الفرج كيجي.'],
  ['2:216', ['uncertainty'], 'ممكن تكره شي حاجة وفيها الخير ليك، والله كيعلم وانتما لا.'],
  ['3:159', ['uncertainty'], 'ملي كتقرر، توكل على الله.'],
  ['12:86', ['sadness'], 'سيدنا يعقوب شكا همو وحزنو لله وحده.'],
  ['6:44', ['repentance', 'gratitude'], 'النعمة ماشي دليل على رضا الله. اللي نسى الله ممكن يتعطى كلشي ومن بعد يتاخذ منو فجأة، والرجوع لله دابا هو الخير.'],
];

const uuid = (key) => {
  const h = createHash('sha1').update(key).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
const esc = (s) => (s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`);
const strip = (html) => html.replace(/<sup[^>]*>.*?<\/sup>/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

async function json(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

// 1. Übersetzungs-IDs gegen die API verifizieren
const { translations: res } = await json(`${API}/resources/translations`);
const names = {};
for (const [lang, id] of Object.entries(TRANSLATIONS)) {
  const t = res.find((x) => x.id === id);
  if (!t) throw new Error(`Übersetzung ${id} nicht gefunden`);
  names[lang] = t.author_name;
}
if (!/bubenheim/i.test(names.de) || !/saheeh/i.test(names.en)) {
  throw new Error(`Unerwartete Übersetzer: ${JSON.stringify(names)}`);
}
console.log('Übersetzungen:', names);

const { chapters } = await json(`${API}/chapters?language=en`);
const entries = [];
for (const [key, emotions, darija] of CURATION) {
  const [s, a] = key.split(':').map(Number);
  const v = await json(
    `${API}/verses/by_key/${key}?words=false&fields=text_uthmani&translations=${Object.values(TRANSLATIONS).join(',')}`,
  );
  const verse = v.verse;
  const ch = chapters.find((c) => c.id === s);
  const byId = Object.fromEntries(verse.translations.map((t) => [t.resource_id, strip(t.text)]));

  // Audio nur übernehmen, wenn die URL tatsächlich erreichbar ist
  let audioUrl = null;
  try {
    const rec = await json(`${API}/recitations/${RECITATION_ID}/by_ayah/${key}`);
    const file = rec.audio_files?.[0]?.url;
    if (file) {
      const url = file.startsWith('http') ? file : AUDIO_BASE + file;
      const head = await fetch(url, { method: 'HEAD' });
      if (head.ok) audioUrl = url;
    }
  } catch {
    /* kein Audio */
  }

  entries.push({
    id: uuid(`quran:${key}`),
    key,
    type: 'quran',
    arabic: verse.text_uthmani,
    surah: { number: s, nameAr: ch.name_arabic, nameEn: ch.name_simple },
    ayah: a,
    emotionSlugs: emotions,
    translations: [
      { lang: 'de', kind: 'translation', body: byId[TRANSLATIONS.de], sourceName: `${names.de} (Quran.com)` },
      { lang: 'en', kind: 'translation', body: byId[TRANSLATIONS.en], sourceName: `${names.en} (Quran.com)` },
      { lang: 'ar', kind: 'explanation', body: darija, sourceName: null },
    ],
    source: { name: 'Quran.com', url: `https://quran.com/${s}/${a}`, reference: `${s}:${a}` },
    audioUrl,
  });
  console.log('OK', key, ch.name_simple, audioUrl ? '♪' : '');
}

mkdirSync('src/data', { recursive: true });
mkdirSync('supabase/seed', { recursive: true });
writeFileSync('src/data/quran-seed.json', JSON.stringify(entries, null, 2) + '\n');

// 2a. Emotionen-Seed aus src/data/emotions.json
const emotions = JSON.parse(readFileSync('src/data/emotions.json', 'utf8'));
const emo = emotions.map(
  (e, i) =>
    `insert into emotions (id, slug, name_ar, name_de, name_en, color, icon, sort_order) values (${esc(uuid(`emotion:${e.slug}`))}, ${esc(e.slug)}, ${esc(e.name.ar)}, ${esc(e.name.de)}, ${esc(e.name.en)}, ${esc(e.color)}, ${esc(e.icon)}, ${i}) on conflict (id) do nothing;`,
);
writeFileSync('supabase/seed/001_emotions.sql', '-- GENERIERT von scripts/fetch-quran.mjs\n' + emo.join('\n') + '\n');

// 2b. SQL-Seed (idempotent durch deterministische UUIDs)
const sql = [];
sql.push('-- GENERIERT von scripts/fetch-quran.mjs - nicht manuell bearbeiten.');
sql.push(
  `insert into religious_sources (id, name, kind, base_url, license_note) values (${esc(uuid('source:quran.com'))}, 'Quran.com', 'quran', 'https://quran.com', 'Text und Übersetzungen über die Quran.com/Quran Foundation API. Lizenz der Übersetzungen vor kommerzieller Nutzung prüfen.') on conflict (id) do nothing;`,
);
for (const e of entries) {
  sql.push(
    `insert into religious_entries (id, type, arabic_text, surah_number, surah_name_ar, surah_name_en, ayah_number, source_id, source_reference, source_url, audio_url, audio_source, status, source_verified, verified_at) values (${esc(e.id)}, 'quran', ${esc(e.arabic)}, ${e.surah.number}, ${esc(e.surah.nameAr)}, ${esc(e.surah.nameEn)}, ${e.ayah}, ${esc(uuid('source:quran.com'))}, ${esc(e.source.reference)}, ${esc(e.source.url)}, ${esc(e.audioUrl)}, ${e.audioUrl ? "'Quran.com (Mishari al-Afasy)'" : 'null'}, 'published', true, now()) on conflict (id) do nothing;`,
  );
  for (const t of e.translations) {
    sql.push(
      `insert into entry_translations (id, entry_id, lang, kind, body, source_name) values (${esc(uuid(`tr:${e.key}:${t.lang}:${t.kind}`))}, ${esc(e.id)}, '${t.lang}', '${t.kind}', ${esc(t.body)}, ${esc(t.sourceName)}) on conflict (id) do nothing;`,
    );
  }
  for (const slug of e.emotionSlugs) {
    sql.push(
      `insert into entry_emotions (entry_id, emotion_id) values (${esc(e.id)}, ${esc(uuid(`emotion:${slug}`))}) on conflict do nothing;`,
    );
  }
}
writeFileSync('supabase/seed/002_quran_entries.sql', sql.join('\n') + '\n');
console.log(`Fertig: ${entries.length} Verse.`);
