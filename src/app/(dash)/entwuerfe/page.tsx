import { createClient } from "@/lib/supabase/server";
import { Empty, PageHeader, SlotBadge, StatusBadge } from "@/components/ui";
import { CopyButton } from "@/components/copy-button";
import { parseSlides } from "@/lib/slides";
import { DownloadAll } from "@/components/download-all";
import { fmtDateTime } from "@/lib/time";
import type { DraftStatus } from "@/lib/database.types";
import { setDraftStatus, updateDraft } from "../actions";

const FILTERS: { key: DraftStatus | "alle"; label: string }[] = [
  { key: "entwurf", label: "Zur Freigabe" },
  { key: "freigegeben", label: "Freigegeben" },
  { key: "gepostet", label: "Gepostet" },
  { key: "verworfen", label: "Verworfen" },
  { key: "fehler", label: "Fehler" },
  { key: "alle", label: "Alle" },
];

export default async function DraftsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; account?: string }>;
}) {
  const sp = await searchParams;
  const status = (FILTERS.find((f) => f.key === sp.status)?.key ?? "entwurf") as DraftStatus | "alle";
  const supabase = await createClient();

  let query = supabase
    .from("drafts")
    .select("*, accounts(slot, handle), trends(hook, format)")
    .order("created_at", { ascending: false });
  if (status !== "alle") query = query.eq("status", status);
  if (sp.account) query = query.eq("account_id", sp.account);

  const [{ data: drafts, error }, { data: accounts }] = await Promise.all([
    query,
    supabase.from("accounts").select("id, slot, handle").order("slot"),
  ]);

  const href = (p: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    const next = { status, account: sp.account, ...p };
    Object.entries(next).forEach(([k, v]) => v && q.set(k, v));
    return `/entwuerfe?${q}`;
  };

  return (
    <>
      <PageHeader title="Entwürfe" sub="Prüfen, ändern, freigeben. Nichts geht ohne deine Freigabe raus." />

      <div className="mb-3 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <a key={f.key} href={href({ status: f.key })} className={f.key === status ? "btn-primary" : "btn-ghost"}>
            {f.label}
          </a>
        ))}
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        <a href={href({ account: undefined })} className={!sp.account ? "btn-primary" : "btn-ghost"}>Alle Accounts</a>
        {accounts?.map((a) => (
          <a key={a.id} href={href({ account: a.id })} className={sp.account === a.id ? "btn-primary" : "btn-ghost"}>
            {a.slot} · {a.handle}
          </a>
        ))}
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error.message}</p>}
      {!drafts?.length && <Empty>Keine Entwürfe in dieser Ansicht.</Empty>}

      <div className="space-y-4">
        {drafts?.map((d) => {
          const slides = parseSlides(d.slides);
          const fullCaption = [d.caption, d.hashtags.join(" ")].filter(Boolean).join("\n\n");
          return (
            <article key={d.id} className="card">
              <header className="mb-4 flex flex-wrap items-center gap-2">
                <SlotBadge slot={d.accounts?.slot ?? "?"} />
                <span className="font-semibold">{d.accounts?.handle}</span>
                <StatusBadge status={d.status} />
                {d.is_ad && <span className="rounded-full bg-kapy/15 px-2 py-0.5 text-xs font-medium text-green-800">Werbung</span>}
                {d.experiment && <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-800">Test: {d.experiment}</span>}
                <span className="ml-auto text-xs text-tinte/50">
                  {d.trends?.hook ? `Vorlage: ${d.trends.hook}` : "ohne Trend"} · {fmtDateTime(d.created_at)}
                </span>
              </header>

              <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
                {slides.map((_, i) => (
                  <a key={i} href={`/api/slides/${d.id}/${i + 1}`} target="_blank" rel="noreferrer" className="shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/slides/${d.id}/${i + 1}?v=${encodeURIComponent(d.updated_at)}`}
                      alt={`Slide ${i + 1}`}
                      loading="lazy"
                      className="h-64 w-48 rounded-lg bg-white object-cover ring-1 ring-black/5"
                    />
                  </a>
                ))}
                {!slides.length && <p className="text-sm text-tinte/50">Keine Slides.</p>}
              </div>

              <form action={updateDraft} className="grid gap-3 md:grid-cols-[1fr_auto]">
                <input type="hidden" name="id" value={d.id} />
                <div className="space-y-2">
                  <details>
                    <summary className="cursor-pointer text-sm font-medium text-ozean">Slide-Texte bearbeiten</summary>
                    <input type="hidden" name="slide_count" value={slides.length} />
                    <div className="mt-2 space-y-3">
                      {slides.map((sl, i) => (
                        <div key={i} className="rounded-lg bg-grund p-3">
                          <label className="label">Slide {i + 1} – Überschrift</label>
                          <input name={`slide_title_${i}`} defaultValue={sl.title} className="input" />
                          {i > 0 && (
                            <>
                              <label className="label mt-2">Text (_so_ = unterstrichen)</label>
                              <textarea name={`slide_body_${i}`} defaultValue={sl.body ?? ""} rows={2} className="input" />
                            </>
                          )}
                          {sl.small && <input type="hidden" name={`slide_small_${i}`} value={sl.small} />}
                          <label className="label mt-2">Bild aus Bibliothek (leer = keins)</label>
                          <input name={`slide_img_${i}`} defaultValue={sl.img ?? ""} className="input" placeholder="z. B. app-scan, kapy-buch" />
                        </div>
                      ))}
                    </div>
                  </details>
                  <div>
                    <label className="label">TikTok-Titel (max. 90 Zeichen)</label>
                    <input name="title" defaultValue={d.title ?? ""} maxLength={90} className="input" />
                  </div>
                  <div>
                    <label className="label">Caption</label>
                    <textarea name="caption" defaultValue={d.caption ?? ""} rows={3} className="input" />
                  </div>
                  <div>
                    <label className="label">Hashtags</label>
                    <input name="hashtags" defaultValue={d.hashtags.join(" ")} className="input" />
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="mentions_studytab" defaultChecked={d.mentions_studytab} /> erwähnt studytab
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="is_ad" defaultChecked={d.is_ad} /> als Werbung kennzeichnen
                    </label>
                  </div>
                </div>
                <div className="flex flex-col gap-2 md:w-40">
                  <button className="btn-ghost">Änderungen speichern</button>
                  <CopyButton text={fullCaption} label="Caption kopieren" />
                  {d.title && <CopyButton text={d.title} label="Titel kopieren" />}
                  {slides.length > 0 && <DownloadAll id={d.id} count={slides.length} />}
                  {d.sound_hint && <p className="text-xs text-tinte/60">Sound: {d.sound_hint}</p>}
                </div>
              </form>

              <footer className="mt-4 flex flex-wrap gap-2 border-t border-black/5 pt-4">
                {d.status !== "freigegeben" && d.status !== "gepostet" && (
                  <StatusButton id={d.id} status="freigegeben" className="btn-primary">Freigeben</StatusButton>
                )}
                {d.status !== "verworfen" && d.status !== "gepostet" && (
                  <StatusButton id={d.id} status="verworfen" className="btn-ghost">Verwerfen</StatusButton>
                )}
                {(d.status === "freigegeben" || d.status === "verworfen" || d.status === "fehler") && (
                  <StatusButton id={d.id} status="entwurf" className="btn-ghost">Zurück zu Entwurf</StatusButton>
                )}
                {d.is_ad && (
                  <p className="ml-auto self-center text-xs text-tinte/60">
                    In TikTok beim Posten den Schalter „Inhalte offenlegen“ → „Deine Marke“ aktivieren.
                  </p>
                )}
              </footer>
            </article>
          );
        })}
      </div>
    </>
  );
}

function StatusButton({
  id,
  status,
  className,
  children,
}: {
  id: string;
  status: DraftStatus;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <form action={setDraftStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button className={className}>{children}</button>
    </form>
  );
}
