import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, SlotBadge } from "@/components/ui";
import { currentWeek, fmtNum } from "@/lib/time";
import { addAccountStat } from "./actions";
import type { PostStat } from "@/lib/database.types";

export default async function OverviewPage() {
  const supabase = await createClient();
  const week = currentWeek();
  const [accounts, stats, drafts, posts, postStats, trends] = await Promise.all([
    supabase.from("accounts").select("*").order("slot"),
    supabase.from("account_stats").select("*").order("date", { ascending: false }),
    supabase.from("drafts").select("account_id, status"),
    supabase.from("posts").select("id, account_id"),
    supabase.from("post_stats").select("*").order("date", { ascending: false }),
    supabase.from("trends").select("id", { count: "exact", head: true }).eq("week", week),
  ]);

  // pro Post nur den neuesten Statistik-Stand
  const latestByPost = new Map<string, PostStat>();
  for (const s of postStats.data ?? []) if (!latestByPost.has(s.post_id)) latestByPost.set(s.post_id, s);

  const openDrafts = (drafts.data ?? []).filter((d) => d.status === "entwurf").length;
  const approved = (drafts.data ?? []).filter((d) => d.status === "freigegeben").length;

  return (
    <>
      <PageHeader title="Übersicht" sub="Alle Accounts, Warteschlange und Performance auf einen Blick." />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Link href="/trends" className="card hover:border-aktion/30">
          <p className="text-xs text-tinte/60">Trends diese Woche</p>
          <p className="mt-1 text-3xl font-bold">{trends.count ?? 0}</p>
        </Link>
        <Link href="/entwuerfe" className="card hover:border-aktion/30">
          <p className="text-xs text-tinte/60">Warten auf Freigabe</p>
          <p className="mt-1 text-3xl font-bold">{openDrafts}</p>
        </Link>
        <Link href="/plan" className="card hover:border-aktion/30">
          <p className="text-xs text-tinte/60">Freigegeben, noch nicht gepostet</p>
          <p className="mt-1 text-3xl font-bold">{approved}</p>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {(accounts.data ?? []).map((a) => {
          const accStats = (stats.data ?? []).filter((s) => s.account_id === a.id);
          const latest = accStats[0];
          const prev = accStats.find((s) => s.date <= shiftDays(latest?.date, -7));
          const accPosts = (posts.data ?? []).filter((p) => p.account_id === a.id);
          const totals = accPosts.reduce(
            (acc, p) => {
              const s = latestByPost.get(p.id);
              acc.views += s?.views ?? 0;
              acc.saves += s?.saves ?? 0;
              acc.likes += s?.likes ?? 0;
              return acc;
            },
            { views: 0, saves: 0, likes: 0 },
          );
          const accDrafts = (drafts.data ?? []).filter((d) => d.account_id === a.id);
          return (
            <div key={a.id} className="card">
              <div className="flex items-center gap-2">
                <SlotBadge slot={a.slot} />
                <h2 className="font-semibold">{a.handle ?? "Handle fehlt"}</h2>
              </div>
              <p className="mt-1 text-xs text-tinte/60">{a.description}</p>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Stat label="Follower" value={fmtNum(latest?.followers)} delta={latest && prev ? (latest.followers ?? 0) - (prev.followers ?? 0) : null} />
                <Stat label="Posts" value={String(accPosts.length)} />
                <Stat label="Views gesamt" value={fmtNum(totals.views)} />
                <Stat label="Ø Views/Post" value={accPosts.length ? fmtNum(Math.round(totals.views / accPosts.length)) : "–"} />
                <Stat label="Saves" value={fmtNum(totals.saves)} />
                <Stat label="Offene Entwürfe" value={String(accDrafts.filter((d) => d.status === "entwurf").length)} />
              </dl>

              <form action={addAccountStat} className="mt-4 flex items-end gap-2 border-t border-black/5 pt-4">
                <input type="hidden" name="account_id" value={a.id} />
                <div className="flex-1">
                  <label className="label">Follower heute eintragen</label>
                  <input name="followers" type="number" min={0} required className="input" placeholder={String(latest?.followers ?? "")} />
                </div>
                <button className="btn-ghost">Speichern</button>
              </form>
            </div>
          );
        })}
      </div>
    </>
  );
}

function shiftDays(date: string | undefined, days: number) {
  if (!date) return "";
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function Stat({ label, value, delta }: { label: string; value: string; delta?: number | null }) {
  return (
    <div>
      <dt className="text-xs text-tinte/60">{label}</dt>
      <dd className="font-semibold">
        {value}
        {delta != null && delta !== 0 && (
          <span className={`ml-1 text-xs ${delta > 0 ? "text-green-600" : "text-red-600"}`}>
            {delta > 0 ? "+" : ""}
            {delta} / 7 T.
          </span>
        )}
      </dd>
    </div>
  );
}
