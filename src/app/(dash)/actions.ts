"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { currentWeek, viennaLocalToIso } from "@/lib/time";
import type { DraftStatus } from "@/lib/database.types";

const str = (f: FormData, k: string) => {
  const v = f.get(k);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
};
const num = (f: FormData, k: string) => {
  const v = str(f, k);
  if (v == null) return null;
  const n = Number(v.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
};
const tags = (v: string | null) =>
  (v ?? "")
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => (t.startsWith("#") ? t : `#${t}`));

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function addTrend(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("trends").insert({
    week: str(formData, "week") ?? currentWeek(),
    source: str(formData, "source") ?? "TikTok Creative Center",
    source_url: str(formData, "source_url"),
    hook: str(formData, "hook"),
    format: str(formData, "format"),
    structure: str(formData, "structure"),
    topic: str(formData, "topic"),
    sound: str(formData, "sound"),
    hashtags: tags(str(formData, "hashtags")),
    views: num(formData, "views"),
    likes: num(formData, "likes"),
    shares: num(formData, "shares"),
    rank: num(formData, "rank"),
    notes: str(formData, "notes"),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/trends");
}

export async function deleteTrend(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("trends").delete().eq("id", String(formData.get("id")));
  if (error) throw new Error(error.message);
  revalidatePath("/trends");
}

const STATUSES: DraftStatus[] = ["entwurf", "freigegeben", "verworfen", "gepostet", "fehler"];

export async function setDraftStatus(formData: FormData) {
  const status = String(formData.get("status")) as DraftStatus;
  if (!STATUSES.includes(status)) throw new Error("Ungültiger Status");
  const supabase = await createClient();
  const { error } = await supabase.from("drafts").update({ status }).eq("id", String(formData.get("id")));
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function updateDraft(formData: FormData) {
  const mentions = formData.get("mentions_studytab") === "on";
  const supabase = await createClient();
  const { error } = await supabase
    .from("drafts")
    .update({
      caption: str(formData, "caption"),
      hashtags: tags(str(formData, "hashtags")),
      mentions_studytab: mentions,
      // Werbung immer kennzeichnen, sobald studytab vorkommt
      is_ad: mentions || formData.get("is_ad") === "on",
    })
    .eq("id", String(formData.get("id")));
  if (error) throw new Error(error.message);
  revalidatePath("/entwuerfe");
}

export async function setPlannedAt(formData: FormData) {
  const local = str(formData, "planned_at");
  const supabase = await createClient();
  const { error } = await supabase
    .from("drafts")
    .update({ planned_at: local ? viennaLocalToIso(local) : null })
    .eq("id", String(formData.get("id")));
  if (error) throw new Error(error.message);
  revalidatePath("/plan");
}

export async function markPosted(formData: FormData) {
  const id = String(formData.get("id"));
  const url = str(formData, "url");
  const supabase = await createClient();
  const { data: draft, error: e1 } = await supabase
    .from("drafts")
    .select("account_id, planned_at")
    .eq("id", id)
    .single();
  if (e1 || !draft) throw new Error(e1?.message ?? "Entwurf nicht gefunden");
  const tiktokId = url?.match(/\/(?:video|photo)\/(\d+)/)?.[1] ?? null;
  const { error: e2 } = await supabase.from("posts").insert({
    draft_id: id,
    account_id: draft.account_id,
    url,
    tiktok_id: tiktokId,
    posted_at: draft.planned_at ?? new Date().toISOString(),
  });
  if (e2) throw new Error(e2.message);
  const { error: e3 } = await supabase.from("drafts").update({ status: "gepostet" }).eq("id", id);
  if (e3) throw new Error(e3.message);
  revalidatePath("/", "layout");
}

export async function addAccountStat(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("account_stats").upsert({
    account_id: String(formData.get("account_id")),
    date: str(formData, "date") ?? new Date().toISOString().slice(0, 10),
    followers: num(formData, "followers"),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function addPostStat(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("post_stats").upsert({
    post_id: String(formData.get("post_id")),
    date: str(formData, "date") ?? new Date().toISOString().slice(0, 10),
    views: num(formData, "views"),
    likes: num(formData, "likes"),
    comments: num(formData, "comments"),
    shares: num(formData, "shares"),
    saves: num(formData, "saves"),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/plan");
  revalidatePath("/");
}

export async function toggleInsight(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("insights")
    .update({ active: formData.get("active") === "true" })
    .eq("id", String(formData.get("id")));
  if (error) throw new Error(error.message);
  revalidatePath("/wissen");
}
