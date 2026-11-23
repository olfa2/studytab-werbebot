import { createClient } from "@/lib/supabase/server";
import { Empty, PageHeader, SlotBadge } from "@/components/ui";
import { toggleInsight } from "../actions";

export default async function WissenPage() {
  const supabase = await createClient();
  const { data: insights } = await supabase
    .from("insights")
    .select("*, accounts(slot, handle)")
    .order("active", { ascending: false })
    .order("based_on_posts", { ascending: false });

  return (
    <>
      <PageHeader
        title="Wissensdatei"
        sub="Was das Lern-System aus den Posts ableitet. Regeln mit wenigen Posts sind eher Zufall – erst ab ca. 4–6 Wochen Daten ernst nehmen."
      />
      {!insights?.length && <Empty>Noch keine Erkenntnisse. Die erste Auswertung kommt nach ein paar Wochen Posts.</Empty>}
      <div className="space-y-2">
        {insights?.map((i) => (
          <div key={i.id} className={`card flex items-start gap-3 ${i.active ? "" : "opacity-50"}`}>
            {i.accounts ? <SlotBadge slot={i.accounts.slot} /> : <span className="grid size-6 place-items-center rounded-md bg-grund text-xs">∗</span>}
            <div className="flex-1">
              <p className="text-sm">{i.rule}</p>
              <p className="mt-1 text-xs text-tinte/50">
                {i.category} · beruht auf {i.based_on_posts} Posts{i.based_on_posts < 10 && " ⚠︎ wenig Daten"} · Woche {i.week}
              </p>
            </div>
            <form action={toggleInsight}>
              <input type="hidden" name="id" value={i.id} />
              <input type="hidden" name="active" value={String(!i.active)} />
              <button className="btn-ghost">{i.active ? "Deaktivieren" : "Aktivieren"}</button>
            </form>
          </div>
        ))}
      </div>
    </>
  );
}
