# Wöchentlicher Lauf: Trend-Scout + Content-Generator

Läuft jeden Sonntag als geplante Claude-Aufgabe. Schreibt nur über das Supabase-Tool (`execute_sql`) in das Projekt **Tiktokresearch** (`xytxulmknwxlmyrmeedx`). Kein Posten, kein Login bei TikTok, TikTok nicht öffnen oder scrapen, keine Browser-Automation. Nie das Projekt „Schulapp“ anfassen.

`WOCHE` = der nächste Montag nach dem heutigen Datum (Lauf am Sonntag → morgen), Format `YYYY-MM-DD`. Alle Zeiten Europe/Vienna.

## 0. Lesen

```sql
select id, slot, handle, description, style_notes, studytab_share from accounts order by slot;
select category, rule, based_on_posts, account_id from insights where active order by based_on_posts desc;
select a.slot, d.title, d.slides->0->>'title' as hook, d.status, d.created_at
  from drafts d join accounts a on a.id = d.account_id
  where d.created_at > now() - interval '35 days' order by d.created_at desc;
select id, source, source_url, author, hook, format, likes, saves, posted_at, notes from trends
  where source in ('oliver', 'tiktok') and created_at > now() - interval '14 days' order by rank nulls last, likes desc nulls last;
select count(*) from drafts where planned_at >= 'WOCHE'::date and planned_at < 'WOCHE'::date + 7;
```

Gibt es für `WOCHE` schon Entwürfe, nichts doppelt anlegen: nur ergänzen, was fehlt, und das im Bericht sagen.

Regeln aus `insights` haben Vorrang vor den Startwerten unten, wenn `based_on_posts` ≥ 10.

## 1. Trend-Scout

**Hauptquelle sind echte TikTok-Posts aus der Datenbank** (`trends` mit `source in ('oliver', 'tiktok')`, in den letzten 14 Tagen eingetragen): von Oliver gespeicherte Posts und Posts, die direkt auf TikTok gefunden wurden (Seite „TikTok“ im Dashboard, mit Likes, Saves, Datum, Notizen zum Format). TikTok selbst wird in diesem Lauf nicht geöffnet. Posts mit `notes` und hoher Save-Quote (Saves ÷ Likes) zählen am meisten; ältere als 6 Monate nur als Ergänzung.

- Pro gespeichertem Post analysieren: Was ist das Format (Listicle, Vorher → Nachher, POV, Geständnis, Checkliste …), wie ist der Hook gebaut (Zahl, Identität, Provokation, Frage …), welches Thema? Ergebnis in die Zeile schreiben (`update trends set format = …, structure = …, topic = …, rank = … where id = …`). Ranking nach Save-Quote und Likes; schon analysierte Posts (mit `rank`) nicht neu ranken.
- Hook-Text nie wörtlich übernehmen, nur die Bauweise.
- **Nur wenn weniger als 3 solche Posts da sind:** mit Websuche auf bis zu 5 Formate ergänzen, `source = 'websuche (Ersatz)'`, Zahlen nur wenn belegt (sonst `null`). Im Bericht deutlich sagen, dass Oliver zu wenig Posts gespeichert hat.

Texte immer mit `$q$…$q$` quoten.

## 2. Content-Generator

Pro Account **7 Entwürfe** (1 pro Tag, Mo–So), alle auf Englisch, einfache Wörter. Jeder Entwurf baut ein Format aus Schritt 1 nach (`trend_id`): Aufbau und Hook-Bauweise übernehmen, Thema und Texte eigen. Jeder Trend höchstens 2x pro Woche, die stärksten zuerst. Kein Thema und kein Hook der letzten 5 Wochen wiederholen. Nie derselbe Post auf zwei Accounts.

Alle Accounts nutzen `template = 'notiz'` (weißer Notiz-Stil, lo-fi).

### Slides (`drafts.slides`, JSON-Array)

```json
[{"title":"7 niche habits of students who never cram","small":"(save this)","img":"p-sanduhr-2"},
 {"title":"the 2-day rule","body":"never let a topic sit untouched for _more than 2 days_.","img":"p-gehirn-4"}]
```

- `title` Pflicht, `body` für Tipp-Slides, `small` nur auf Slide 1, `img` = Schlüssel aus der Bibliothek.
- `_so_` = unterstrichen, in jedem Body 1–2 Stellen.
- **Jede Slide bekommt ein Bild** (Cover und jeder Tipp). In einem Post kein Bild doppelt, über die Woche möglichst breit streuen und zum Inhalt passend wählen (Gehirn → Gedächtnis, Uhr/Sanduhr → Zeit, Tafel → Unterricht, Statue → Haltung/Fokus, Gemälde → Gefühle/Memes, Collage → Kreativität/Chaos).
- Bibliothek Stimmungsbilder: `p-collage-1…5`, `p-gehirn-1…12`, `p-gemaelde-1…7`, `p-sanduhr-1…8`, `p-statue-3`, `p-statue-6`, `p-statue-7`, `p-statue-10`, `p-tafel-1…10`, `p-uhr-1…7`.
- Maskottchen: `kapy-arme-hoch`, `kapy-buch`, `kapy-daumen`, `kapy-entspannt`, `kapy-flamme`, `kapy-freut`.
- Bibliothek App (iPhone-Mockups, aktuelles Design): `app-home` (Startseite mit „coming up“), `app-faecher-liste` (Fächer mit Schnitt), `app-fach` (ein Fach: Test, Lernsets, Notizen, Noten), `app-lernen-ki` (Lernen-Tab: Notiz scannen, mit KI Lernset/Test erstellen), `app-karte-vorne` / `app-karte-hinten` (Karteikarte), `app-lernart-auswahl` (Multiple Choice), `app-lernart-tippen` (Antwort tippen), `app-lernart-puzzle` (Zuordnen), `app-notenrechner` (Notenrechner), `app-notenrechner-ziel` (welche Note man beim nächsten Test braucht), `app-note-eintragen`, `app-alle-noten` (Gesamtschnitt aller Fächer), `app-kalender` (Kalender mit Terminen), `app-termin-erinnerung` (Test eintragen mit Erinnerungen), `app-gruppen-liste`, `app-gruppe-sets` (geteilte Lernsets in der Gruppe). Ältere Mockups (`app-start`, `app-faecher`, `app-gruppen`, `app-karteikarten`, `app-scan`, `app-ki-auswahl`, `app-ki-ergebnis`) nur noch, wenn nichts Neueres passt.
- App- und Kapy-Bilder **nur** auf Slides, die studytab erwähnen, und nur in Posts mit `mentions_studytab = true`. Das App-Mockup muss genau das Feature der Slide zeigen; für Features ohne Mockup (Moodle, Streak, Kapy-Chat) ein Stimmungsbild.

### Account A · Marke

- Jeder Post bewirbt studytab: `mentions_studytab = true`, `is_ad = true`.
- 6–8 Slides. Formate aus Schritt 1, bevorzugt Transformation (Vorher → Nachher) und Listicles; reine Feature-Listen meiden.
- **Darf nicht nach KI-Werbung klingen:** schreiben wie eine kurze Notiz von Schüler:innen für Schüler:innen, alles klein, kurze Sätze, nüchtern. Verboten: Slogans und Floskeln („that's the whole trick“, „game changer“, „level up“, „unlock“, „Kapy is waiting“, „no more chaos“), Dreier-Aufzählungen als Stilmittel, Ausrufezeichen, Gedankenstriche, Emojis, „(studytab)“ im Titel. Kapy nicht im Text nennen.
- studytab auf 2–3 Slides erwähnen, die anderen Slides sind echte, konkrete Tipps zum Thema.
- Erlaubte Features: KI aus Mitschrift (Zusammenfassung, Lernset, Probetest), Mitschrift scannen + automatisch ins Fach, 4 Lernarten (Karten, Auswahl, Tippen, Puzzle), Moodle-Anbindung, Termine + Lernplan + Erinnerungen, Notenrechner (works with your school's grading scale), Gruppen + Live-Battles, Streak + Tagesziel, Kapy-Chat. Nicht: Fokus-Timer, Studytab Plus.

### Account B · @studybuddy893

- **8 Slides** (Hook + 7 Tipps), 7–9 ok, nie 6.
- Hook max. 9 Wörter: Zahl + Status-/Identitätsversprechen + „niche“ (z. B. „7 niche skills that make you scary smart“) oder eine Aussage wie bei Olivers Top-Posts („your grade isn't only about the test“). Zahl passend zur Slide-Anzahl, nicht immer 7. Keine generischen „study tips/hacks“-Hooks. `small`: „(save this)“ oder ein Zusatz mit Mehrwert.
- **2 von 7** Posts mit studytab (`mentions_studytab = true`, `is_ad = true`): studytab genau 1x, frühestens auf der vorletzten Slide, nie auf Slide 2–4, als Feature-Tipp mit passendem `app-*`-Bild oder „btw, studytab does this: …“. Ohne CTA. Jedes Mal ein anderes Feature.
- Die anderen 5: kein studytab, `is_ad = false`.
- Caption: Aussage + Frage („your grade isn't only about the test. which one are you trying tomorrow?“). Hashtags 4–5 aus #niche #lockedin #studytok #studytips #smarttok.

### Account C · allgemein

- **Nie** studytab, nie Kapy, keine App-Bilder: `mentions_studytab = false`, `is_ad = false`.
- Themen abwechseln: Lerntipps & Methoden, Schulalltag & Memes, Matura & Prüfungsstress, Motivation & Produktivität.
- 7–9 Slides. Hooks ohne „niche“ und ohne das B-Muster, z. B. Frage, „POV: …“, „things nobody tells you about …“, Vorher → Nachher, Relatable-Momente, Checkliste. Anderer Ton als B.

### Für alle Accounts

- **Nie Ich-Form** („I scan my notes…“, „I did 5“), keine erfundenen Erlebnisse.
- Jeder Tipp braucht etwas Konkretes (Zahl, Regel, Beispiel, Satz zum Kopieren). Allgemeinplätze (mehr schlafen, Handy weg, Pausen machen, früh anfangen) nur mit konkretem Twist, sonst weglassen.
- Pro Account höchstens 4 von 7 Posts als Listicle.

### Felder pro Entwurf

- `title`: TikTok-Titel, max. 90 Zeichen.
- `caption`, `hashtags` (Array mit `#`).
- `sound_hint`: Sound aus Olivers gespeicherten Posts, sonst „aktuell trendenden Sound aus den TikTok-Vorschlägen wählen“.
- `planned_at` (Startwerte, bis `insights` etwas anderes sagt): B 17:30, A 18:30, C 16:30 Wiener Zeit, z. B. `('WOCHE'::date + 0 + time '17:30') at time zone 'Europe/Vienna'`.
- Ca. 20 % der Posts sind Tests: andere Uhrzeit **oder** anderes Format (immer nur eine Sache), in `experiment` kurz beschreiben.
- `status = 'entwurf'`, `template = 'notiz'`.

```sql
insert into drafts (account_id, trend_id, template, title, slides, caption, hashtags, mentions_studytab, is_ad, sound_hint, planned_at, experiment)
values ((select id from accounts where slot = 'B'), '<trend-uuid>', 'notiz', $q$…$q$, $q$[…]$q$::jsonb, $q$…$q$, array['#niche','#studytok'], false, false, $q$…$q$,
        ('WOCHE'::date + 0 + time '17:30') at time zone 'Europe/Vienna', null);
```

## Gesetzliche Mindestregeln (nicht verhandelbar)

- Keine falschen Versprechen über studytab („garantiert bessere Noten“).
- Konkurrenz-Apps nicht nennen, herabsetzen oder falsch darstellen.
- Keine echten Lehrer, Schüler oder Schulen bloßstellen.
- Keine fremden Clips oder Texte übernehmen – nur Formate nachbauen.
- Jeder Post mit studytab ist Werbung (`is_ad = true`); die Datenbank lehnt ihn sonst ab, und auf Account C ganz.

## 3. Prüfen und berichten

```sql
select a.slot, count(*), sum(d.mentions_studytab::int) as werbung,
       count(*) filter (where exists (select 1 from jsonb_array_elements(d.slides) e where not e ? 'img')) as ohne_bild
  from drafts d join accounts a on a.id = d.account_id
  where d.planned_at >= 'WOCHE'::date and d.planned_at < 'WOCHE'::date + 7 group by a.slot order by a.slot;
```

Erwartung: A 7/7/0, B 7/2/0, C 7/0/0. Kurzer Bericht an Oliver (Deutsch, knapp): wie viele der TikTok-Posts genutzt wurden, wie viele Entwürfe, welche Tests, was auffiel.
