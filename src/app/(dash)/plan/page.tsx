import { createClient } from "@/lib/supabase/server";
import { Empty, PageHeader, SlotBadge } from "@/components/ui";
import { parseSlides } from "@/lib/slides";
import { dayKey, fmtDateTime, fmtDay, fmtNum, isoToViennaLocal } from "@/lib/time";
import type { PostStat } from "@/lib/database.types";
import { addPostStat, markPosted, setPlannedAt } from "../actions";

export default async function PlanPage() {
  const supabase = await createClient();
  const [{ data: approved }, { data: posts }, { data: stats }] = await Promise.all([
    supabase
      .from("drafts")
      .select("id, title, planned_at, caption, slides, is_ad, accounts(slot, handle)")
      .eq("status", "freigegeben")
      .order("planned_at", { ascending: true, nullsFirst: false }),
    supabase
      .from("posts")
      .select("id, url, posted_at, accounts(slot, handle), drafts(caption)")
      .order("posted_at", { ascending: false })
      .limit(50),
    supabase.from("post_stats").select("*").order("date", { ascending: false }),
  ]);

  const latest = new Map<string, PostStat>();
  for (const s of stats ?? []) if (!latest.has(s.post_id)) latest.set(s.post_id, s);

  const groups = new Map<string, NonNullable<typeof approved>>();
  for (const d of approved ?? []) {
    const k = d.planned_at ? dayKey(d.planned_at) : "ohne";
    groups.set(k, [...(groups.get(k) ?? []), d]);
  }

  return (
    <>
      <PageHeader
        title="Plan & Posts"
        sub="Freigegebene Posts einplanen, in TikTok Studio übernehmen und danach als gepostet markieren."
      />

      <section className="mb-10 space-y-6">
        {!approved?.length && <Empty>Keine freigegebenen Entwürfe. Erst unter „Entwürfe“ freigeben.</Empty>}
        {[...groups.entries()].map(([day, items]) => (
          <div key={day}>
            <h2 className="mb-2 text-sm font-semibold text-tinte/60">
              {day === "ohne" ? "Noch ohne Termin" : fmtDay(items[0].planned_at!)}
            </h2>
            <div className="space-y-2">
              {items.map((d) => (
                <div key={d.id} className="card flex flex-wrap items-end gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <SlotBadge slot={d.accounts?.slot ?? "?"} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{d.title ?? parseSlides(d.slides)[0]?.title ?? d.caption ?? "(ohne Text)"}</p>
                      <p className="text-xs text-tinte/50">
                        {d.accounts?.handle}
                        {d.is_ad && " · Werbung kennzeichnen"}
                      </p>
                    </div>
                  </div>
                  <form action={setPlannedAt} className="flex items-end gap-2">
                    <input type="hidden" name="id" value={d.id} />
                    <div>
                      <label className="label">Termin (Wien)</label>
                      <input type="datetime-local" name="planned_at" defaultValue={isoToViennaLocal(d.planned_at)} className="input" />
                    </div>
                    <button className="btn-ghost">Setzen</button>
                  </form>
                  <form action={markPosted} className="flex items-end gap-2">
                    <input type="hidden" name="id" value={d.id} />
                    <div>
                      <label className="label">TikTok-Link (optional)</label>
                      <input type="url" name="url" className="input" placeholder="https://www.tiktok.com/@…" />
                    </div>
                    <button className="btn-primary">Gepostet</button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Gepostet</h2>
        {!posts?.length && <Empty>Noch nichts gepostet.</Empty>}
        <div className="space-y-2">
          {posts?.map((p) => {
            const s = latest.get(p.id);
            return (
              <div key={p.id} className="card">
                <div className="flex flex-wrap items-center gap-2">
                  <SlotBadge slot={p.accounts?.slot ?? "?"} />
                  <span className="text-sm font-medium">{p.accounts?.handle}</span>
                  <span className="text-xs text-tinte/50">{fmtDateTime(p.posted_at)}</span>
                  {p.url && (
                    <a href={p.url} target="_blank" rel="noreferrer" className="text-xs text-aktion underline">
                      ansehen
                    </a>
                  )}
                  <span className="ml-auto flex gap-3 text-xs text-tinte/70">
                    <span>👁 {fmtNum(s?.views)}</span>
                    <span>♥ {fmtNum(s?.likes)}</span>
                    <span>🔖 {fmtNum(s?.saves)}</span>
                    <span>↗ {fmtNum(s?.shares)}</span>
                    {s && <span className="text-tinte/40">Stand {s.date}</span>}
                  </span>
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-tinte/50">Statistik eintragen</summary>
                  <form action={addPostStat} className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
                    <input type="hidden" name="post_id" value={p.id} />
                    {(["views", "likes", "comments", "shares", "saves"] as const).map((k) => (
                      <div key={k}>
                        <label className="label">{k}</label>
                        <input name={k} type="number" min={0} className="input" defaultValue={s?.[k] ?? undefined} />
                      </div>
                    ))}
                    <button className="btn-ghost self-end">Speichern</button>
                  </form>
                </details>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
