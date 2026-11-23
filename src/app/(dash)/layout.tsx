import { Nav } from "@/components/nav";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";

export const dynamic = "force-dynamic";

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const { data: admin } = await supabase
    .from("app_admins")
    .select("user_id")
    .eq("user_id", claims?.claims.sub ?? "")
    .maybeSingle();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-black/5 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-kapy text-lg">🦫</span>
          <Nav />
          <form action={signOut} className="ml-auto">
            <button className="btn-ghost">Abmelden</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        {!admin ? (
          <div className="card border-red-200 bg-red-50 text-sm text-red-700">
            Dein User ({String(claims?.claims.email ?? "")}) ist nicht in <code>app_admins</code> eingetragen. Ohne
            Eintrag blockiert RLS alle Daten.
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
