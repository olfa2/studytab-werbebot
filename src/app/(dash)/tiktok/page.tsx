import { createClient } from "@/lib/supabase/server";
import { Empty, PageHeader } from "@/components/ui";
import { daysAgo, fmtNum } from "@/lib/time";

const SORTS = {
  likes: { label: "Meiste Likes", col: "likes" },
  neu: { label: "Neueste", col: "posted_at" },
  saves: { label: "Meiste Saves", col: "saves" },
} as const;

export default async function TikTokPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; alle?: string }>;
}) {
  const sp = await searchParams;
  const sort = (sp.sort && sp.sort in SORTS ? sp.sort : "likes") as keyof typeof SORTS;
  const alle = sp.alle === "1";
  const since = daysAgo(180);

  const supabase = await createClient();
  let q = supabase
    .from("trends")
    .select("*")
    .eq("source", "tiktok")
    .order(SORTS[sort].col, { ascending: false, nullsFirst: false });
  if (!alle) q = q.gte("posted_at", since);
  const [{ data: posts }, { data: analysed }] = await Promise.all([
    q,
    supabase.from("trends").select("*").eq("source", "tiktok").not("rank", "is", null).order("rank"),
  ]);

  const href = (p: Record<string, string | undefined>) => {
    const s = new URLSearchParams();
    const next = { sort, alle: alle ? "1" : undefined, ...p };
    Object.entries(next).forEach(([k, v]) => v && s.set(k, v));
    return `/tiktok?${s}`;
  };

  return (
    <>
      <PageHeader
        title="TikTok-Trends"
        sub="Direkt auf TikTok gefunden (Suche nach Lern-Themen, 1 Klick pro Minute). Nur als Vorlage für Format und Hook, nie Inhalte übernehmen."
      />

      {analysed && analysed.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-bold">Angeschaut &amp; analysiert</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {analysed.map((t) => {
              const rate = t.saves && t.likes ? Math.round((t.saves / t.likes) * 100) : null;
              return (
                <div key={t.id} className="card flex flex-col">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="grid size-7 place-items-center rounded-lg bg-hellblau text-sm font-bold text-ozean">{t.rank}</span>
                    <span className="text-sm font-semibold">{t.format}</span>
                  </div>
                  <p className="font-medium">„{t.hook}“</p>
                  <p className="mt-2 flex-1 text-sm text-tinte/70">{t.notes}</p>
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-tinte/60">
                    <span>♥ {fmtNum(t.likes)}</span>
                    <span>🔖 {fmtNum(t.saves)}{rate != null && ` (${rate} %)`}</span>
                    <span>↗ {fmtNum(t.shares)}</span>
                    <span>💬 {fmtNum(t.comments)}</span>
                    {t.slide_count ? <span>{t.slide_count} Slides</span> : null}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-tinte/50">
                      @{t.author} · {t.posted_at ? new Date(t.posted_at).toLocaleDateString("de-AT") : "–"}
                    </span>
                    <a href={t.source_url ?? "#"} target="_blank" rel="noreferrer" className="btn-primary">
                      Auf TikTok ansehen
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="mr-2 text-lg font-bold">Alle Funde</h2>
          {Object.entries(SORTS).map(([k, v]) => (
            <a key={k} href={href({ sort: k })} className={k === sort ? "btn-primary" : "btn-ghost"}>
              {v.label}
            </a>
          ))}
          <a href={href({ alle: alle ? undefined : "1" })} className="btn-ghost">
            {alle ? "Nur letzte 6 Monate" : "Auch ältere zeigen"}
          </a>
        </div>
        {!posts?.length && <Empty>Keine Funde in diesem Zeitraum.</Empty>}
        {posts && posts.length > 0 && (
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/5 text-xs text-tinte/60">
                <tr>
                  <th className="px-4 py-3">Hook / Beschreibung</th>
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3 text-right">Likes</th>
                  <th className="px-4 py-3 text-right">Saves</th>
                  <th className="px-4 py-3">Gepostet</th>
                  <th className="px-4 py-3">Suche</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {posts.map((t) => (
                  <tr key={t.id} className="border-b border-black/5 last:border-0 hover:bg-grund">
                    <td className="max-w-xs px-4 py-2">
                      {t.hook}
                      {t.format && <span className="ml-2 rounded bg-hellblau px-1.5 text-xs text-ozean">{t.format}</span>}
                    </td>
                    <td className="px-4 py-2 text-tinte/70">@{t.author}</td>
                    <td className="px-4 py-2 text-right font-medium">{fmtNum(t.likes)}</td>
                    <td className="px-4 py-2 text-right">{fmtNum(t.saves)}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-tinte/70">
                      {t.posted_at ? new Date(t.posted_at).toLocaleDateString("de-AT") : "–"}
                    </td>
                    <td className="px-4 py-2 text-xs text-tinte/50">{t.search_query}</td>
                    <td className="px-4 py-2">
                      <a href={t.source_url ?? "#"} target="_blank" rel="noreferrer" className="text-aktion underline">
                        öffnen
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
