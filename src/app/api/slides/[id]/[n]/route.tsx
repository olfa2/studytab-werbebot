import { createClient } from "@/lib/supabase/server";
import { renderSlide } from "@/lib/render-slide";
import { parseSlides } from "@/lib/slides";

export async function GET(request: Request, { params }: { params: Promise<{ id: string; n: string }> }) {
  const { id, n } = await params;
  const index = Number(n);
  const supabase = await createClient();
  // RLS: liefert nur für Admins Daten
  const { data: draft } = await supabase
    .from("drafts")
    .select("slides, template, accounts(handle)")
    .eq("id", id)
    .maybeSingle();
  if (!draft) return new Response("Nicht gefunden", { status: 404 });

  const slides = parseSlides(draft.slides);
  if (!Number.isInteger(index) || index < 1 || index > slides.length) {
    return new Response("Slide gibt es nicht", { status: 404 });
  }

  const img = renderSlide(draft.template, slides, index);
  const headers = new Headers(img.headers);
  headers.set("Cache-Control", "private, max-age=60");
  if (new URL(request.url).searchParams.has("download")) {
    headers.set("Content-Disposition", `attachment; filename="${id.slice(0, 8)}-slide-${index}.png"`);
  }
  return new Response(img.body, { status: 200, headers });
}
