# Wöchentlicher Lauf: Trend-Scout + Content-Generator

Läuft jeden Sonntag als geplante Claude-Aufgabe. Schreibt nur über das Supabase-Tool (`execute_sql`) in das Projekt **Tiktokresearch** (`xytxulmknwxlmyrmeedx`). Kein Posten, kein Login bei TikTok, keine Browser-Automation. Nie das Projekt „Schulapp“ anfassen.

`WOCHE` = der nächste Montag nach dem heutigen Datum (Lauf am Sonntag → morgen), Format `YYYY-MM-DD`. Alle Zeiten Europe/Vienna.

## 0. Lesen

```sql
select id, slot, handle, description, style_notes, studytab_share from accounts order by slot;
select category, rule, based_on_posts, account_id from insights where active order by based_on_posts desc;
select a.slot, d.title, d.slides->0->>'title' as hook, d.status, d.created_at
  from drafts d join accounts a on a.id = d.account_id
  where d.created_at > now() - interval '35 days' order by d.created_at desc;
select count(*) from trends where week = 'WOCHE';
select count(*) from drafts where planned_at >= 'WOCHE'::date and planned_at < 'WOCHE'::date + 7;
```

Gibt es für `WOCHE` schon Trends oder Entwürfe, nichts doppelt anlegen: nur ergänzen, was fehlt, und das im Bericht sagen.

Regeln aus `insights` haben Vorrang vor den Startwerten unten, wenn `based_on_posts` ≥ 10.

## 1. Trend-Scout

- Recherche per Websuche (zuerst `standard`, bei dünnen Ergebnissen `extended`): aktuelle Formate auf TikTok in der Lern-/Schulnische (#studytok, #studytips, #studywithme, #schule, #schulalltag, #matura, #abitur, #prüfung, #studymotivation, #productivity), TikTok Creative Center (Trend-Hashtags, Songs), aktuelle Artikel über virale Study-Slideshows.
- 10 Formate auswählen und ranken (1 = stärkstes). Pro Format: Hook **in eigenen Worten** (nie fremde Texte übernehmen), Format, Struktur, Thema, Sound (falls bekannt), Hashtags, Zahlen nur wenn belegt (sonst `null`, nie schätzen), Quelle, Link.
- Einfügen:

```sql
insert into trends (week, source, source_url, hook, format, structure, topic, sound, hashtags, views, likes, shares, rank, notes)
values ('WOCHE', $q$…$q$, $q$…$q$, $q$…$q$, …, array['#studytok','#studytips'], null, null, null, 1, $q$…$q$);
```

Texte immer mit `$q$…$q$` quoten.

## 2. Content-Generator

Pro Account **7 Entwürfe** (1 pro Tag, Mo–So), alle auf Englisch, einfache Wörter. Jeder Entwurf basiert auf einem Trend-Format der Woche (`trend_id`), aber mit eigenem Thema und eigenen Texten. Kein Thema und kein Hook der letzten 5 Wochen wiederholen. Nie derselbe Post auf zwei Accounts.

### Slides (`drafts.slides`, JSON-Array)

```json
[{"title":"7 niche habits that make teachers secretly love you","small":"(save this)","img":"kapy-buch"},
 {"title":"sit front or middle","body":"teachers mostly talk to _whoever they can see_."}]
```

- `title` Pflicht, `body` für Tipp-Slides, `small` nur auf Slide 1, `img` optional (Schlüssel aus der Bibliothek).
- `_so_` = unterstrichen/markiert, in jedem Body 1–2 Stellen.
- Bibliothek: `kapy-arme-hoch`, `kapy-buch`, `kapy-daumen`, `kapy-entspannt`, `kapy-flamme`, `kapy-freut`, `app-start`, `app-faecher` (Fächer + Noten), `app-gruppen`, `app-karteikarten`, `app-scan` (Mitschrift scannen), `app-ki-auswahl` (KI: Lernset/Test/Zusammenfassung wählen), `app-ki-ergebnis`.
- Kapy- und App-Bilder **nur** in Posts mit `mentions_studytab = true` (sonst wäre es versteckte Werbung).

### Account A · Marke (`template = 'marke'`)

- Jeder Post bewirbt studytab: `mentions_studytab = true`, `is_ad = true`.
- 5–7 Slides. Startformat: Transformation („how i went from X to Y“, Vorher → Nachher) und Listicles; reine Feature-Listen meiden. Lo-fi, ehrlich, Schüler-Perspektive ohne erfundene Erlebnisse.
- Slide 1: Hook + Kapy-Bild. Tipp-Slides: App-Mockup, das genau das Feature der Slide zeigt.
- Erlaubte Features: KI aus Mitschrift (Zusammenfassung, Lernset, Probetest), Mitschrift scannen + automatisch ins Fach, 4 Lernarten (Karten, Auswahl, Tippen, Puzzle), Moodle-Anbindung, Termine + Lernplan, Notenrechner (österreichische Skala), Gruppen + Live-Battles, Streak + Tagesziel, Kapy-Chat. Nicht: Fokus-Timer, Studytab Plus.

### Account B · @studybuddy893 (`template = 'notiz'`)

- Weißer Notiz-Stil, **8 Slides** (Hook + 7 Tipps), 7–9 ok, nie 6.
- Hook max. 9 Wörter: Zahl + Status-/Identitätsversprechen + „niche“ (z. B. „7 niche skills that make you scary smart“). Keine generischen „study tips/hacks“-Hooks. `small`: „(save this)“ oder ein Zusatz mit Mehrwert.
- Jeder Tipp braucht etwas Konkretes (Zahl, Beispiel, Satz zum Kopieren). Allgemeinplätze („take breaks“, „sleep more“) fliegen raus.
- **2 von 7** Posts mit studytab (`mentions_studytab = true`, `is_ad = true`): studytab genau 1x, frühestens auf der vorletzten Slide, nie auf Slide 2–4, als Feature-Tipp mit passendem `app-*`-Bild oder „btw, … works with studytab“. Ohne CTA. Jedes Mal ein anderes Feature.
- Die anderen 5: kein studytab, keine Bilder, `is_ad = false`.
- Caption: Aussage + Frage („your grade isn't only about the test. which one are you trying tomorrow?“). Hashtags 4–5 aus #niche #lockedin #studytok #studytips #smarttok.

### Account C · allgemein (`template = 'notiz'`)

- **Nie** studytab, nie Kapy, keine App-Bilder: `mentions_studytab = false`, `is_ad = false`, keine `img`.
- Themen abwechseln: Lerntipps & Methoden, Schulalltag & Memes, Matura & Prüfungsstress, Motivation & Produktivität.
- 7–9 Slides, sonst gleiche Textregeln wie B. Anderer Ton als B, damit die Accounts nicht gleich wirken.

### Felder pro Entwurf

- `title`: TikTok-Titel, max. 90 Zeichen.
- `caption`, `hashtags` (Array mit `#`).
- `sound_hint`: „aktuell trendenden Sound aus den TikTok-Vorschlägen wählen“ oder ein konkreter Sound aus der Trend-Recherche.
- `planned_at` (Startwerte, bis `insights` etwas anderes sagt): B 17:30, A 18:30, C 16:30 Wiener Zeit, als `timestamptz` mit `Europe/Vienna`, z. B. `('WOCHE'::date + 0 + time '17:30') at time zone 'Europe/Vienna'`.
- Ca. 20 % der Posts sind Tests: andere Uhrzeit **oder** anderes Format (immer nur eine Sache), in `experiment` kurz beschreiben (z. B. „Uhrzeit 20:00 statt 17:30“).
- `status = 'entwurf'`.

```sql
insert into drafts (account_id, trend_id, template, title, slides, caption, hashtags, mentions_studytab, is_ad, sound_hint, planned_at, experiment)
values ((select id from accounts where slot = 'B'), '<trend-uuid>', 'notiz', $q$…$q$, $q$[…]$q$::jsonb, $q$…$q$, array['#niche','#studytok'], false, false, $q$…$q$,
        ('WOCHE'::date + 0 + time '17:30') at time zone 'Europe/Vienna', null);
```

## Gesetzliche Mindestregeln (nicht verhandelbar)

- Keine falschen Versprechen über studytab („garantiert bessere Noten“).
- Konkurrenz-Apps nicht nennen, herabsetzen oder falsch darstellen.
- Keine echten Lehrer, Schüler oder Schulen bloßstellen.
- Keine fremden Clips, Bilder oder Texte übernehmen – nur Formate nachbauen.
- Jeder Post mit studytab ist Werbung (`is_ad = true`); die Datenbank lehnt ihn sonst ab, und auf Account C ganz.

## 3. Prüfen und berichten

```sql
select a.slot, count(*), sum(d.mentions_studytab::int) as werbung
  from drafts d join accounts a on a.id = d.account_id
  where d.planned_at >= 'WOCHE'::date and d.planned_at < 'WOCHE'::date + 7 group by a.slot order by a.slot;
```

Erwartung: A 7/7, B 7/2, C 7/0. Kurzer Bericht an Oliver (Deutsch, knapp): wie viele Trends und Entwürfe, welche Tests diese Woche, was auffiel (z. B. dünne Trend-Daten).
