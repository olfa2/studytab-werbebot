import { createClient } from "@/lib/supabase/server";
import { Empty, PageHeader } from "@/components/ui";
import { currentWeek, fmtNum } from "@/lib/time";
import { addTrend, deleteTrend } from "../actions";

export default async function TrendsPage({ searchParams }: { searchParams: Promise<{ woche?: string }> }) {
  const { woche } = await searchParams;
  const week = woche ?? currentWeek();
  const supabase = await createClient();
  const [{ data: trends }, { data: weeks }] = await Promise.all([
    supabase.from("trends").select("*").eq("week", week).order("rank", { ascending: true, nullsFirst: false }).order("views", { ascending: false }),
    supabase.from("trends").select("week").order("week", { ascending: false }),
  ]);
  const weekList = Array.from(new Set([currentWeek(), ...(weeks ?? []).map((w) => w.week)]));

  return (
    <>
      <PageHeader
        title="Trends"
        sub="Nur Format, Hook und Struktur festhalten – fremde Clips, Bilder und Texte werden nie übernommen."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {weekList.map((w) => (
          <a key={w} href={`/trends?woche=${w}`} className={w === week ? "btn-primary" : "btn-ghost"}>
            Woche ab {new Date(w).toLocaleDateString("de-AT", { day: "2-digit", month: "2-digit" })}
          </a>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          {!trends?.length && <Empty>Noch keine Trends für diese Woche.</Empty>}
          {trends?.map((t) => (
            <div key={t.id} className="card">
              <div className="flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-hellblau text-sm font-bold text-ozean">
                  {t.rank ?? "–"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{t.hook ?? "(kein Hook)"}</p>
                  <p className="mt-0.5 text-xs text-tinte/60">
                    {[t.format, t.topic, t.sound && `♪ ${t.sound}`].filter(Boolean).join(" · ")}
                  </p>
                  {t.structure && <p className="mt-2 whitespace-pre-line text-sm">{t.structure}</p>}
                  {t.notes && <p className="mt-2 text-sm text-tinte/70">{t.notes}</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-tinte/60">
                    <span>👁 {fmtNum(t.views)}</span>
                    <span>♥ {fmtNum(t.likes)}</span>
                    <span>↗ {fmtNum(t.shares)}</span>
                    <span>{t.source}</span>
                    {t.source_url && (
                      <a href={t.source_url} target="_blank" rel="noreferrer" className="text-aktion underline">
                        Vorlage öffnen
                      </a>
                    )}
                  </div>
                  {t.hashtags.length > 0 && <p className="mt-2 text-xs text-ozean">{t.hashtags.join(" ")}</p>}
                </div>
                <form action={deleteTrend}>
                  <input type="hidden" name="id" value={t.id} />
                  <button className="text-xs text-tinte/40 hover:text-red-600" title="Löschen">✕</button>
                </form>
              </div>
            </div>
          ))}
        </div>

        <form action={addTrend} className="card h-fit space-y-3">
          <h2 className="font-semibold">Trend manuell eintragen</h2>
          <input type="hidden" name="week" value={week} />
          <Field name="hook" label="Hook (eigene Worte)" />
          <div className="grid grid-cols-2 gap-2">
            <Field name="format" label="Format" placeholder="Listicle, Vorher/Nachher…" />
            <Field name="topic" label="Thema" />
          </div>
          <div>
            <label className="label">Struktur</label>
            <textarea name="structure" rows={3} className="input" placeholder="Slide 1: Hook, 2–6: Tipps, 7: CTA" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Field name="views" label="Views" type="number" />
            <Field name="likes" label="Likes" type="number" />
            <Field name="shares" label="Shares" type="number" />
          </div>
          <div className="grid grid-cols-[1fr_70px] gap-2">
            <Field name="sound" label="Sound" />
            <Field name="rank" label="Rang" type="number" />
          </div>
          <Field name="hashtags" label="Hashtags" placeholder="#studytok #studytips" />
          <Field name="source_url" label="Link zur Vorlage" type="url" />
          <Field name="source" label="Quelle" placeholder="TikTok Creative Center" />
          <div>
            <label className="label">Notizen</label>
            <textarea name="notes" rows={2} className="input" />
          </div>
          <button className="btn-primary w-full">Hinzufügen</button>
        </form>
      </div>
    </>
  );
}

function Field({ name, label, type = "text", placeholder }: { name: string; label: string; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} placeholder={placeholder} className="input" min={type === "number" ? 0 : undefined} />
    </div>
  );
}
