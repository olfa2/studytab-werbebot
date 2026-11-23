# studytab Werbebot – Dashboard

Dashboard für den studytab Marketing-Bot: Trends der Woche, Entwürfe freigeben, Posting-Plan und Performance für die TikTok-Accounts A (@studyflencer), B (@studybuddy893) und C (@study.smarter.dail).

Stack: Next.js 16 (App Router), Tailwind 4, Supabase (Projekt „Tiktokresearch“), Vercel.

## Lokal starten

```bash
cp .env.example .env.local   # Werte eintragen
npm install
npm run dev
```

## Vercel

Umgebungsvariablen setzen:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## Seiten

- **Übersicht** – Follower, Views, Saves pro Account, Warteschlange
- **Trends** – Formate der Woche (nur Hook/Struktur, nie fremde Inhalte)
- **Entwürfe** – prüfen, Caption ändern, freigeben/verwerfen; studytab-Erwähnung erzwingt Werbe-Kennzeichnung
- **Plan & Posts** – Termin setzen (Wiener Zeit), nach dem Einplanen in TikTok Studio als gepostet markieren, Statistik eintragen
- **Wissen** – Regeln des Lern-Systems mit Anzahl zugrunde liegender Posts

Zugriff nur für User in `app_admins` (RLS). Registrierung ist in Supabase deaktiviert.
