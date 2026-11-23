"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(_prev: { error: string | null }, formData: FormData): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (error) return { error: "Login fehlgeschlagen. E-Mail oder Passwort falsch." };
  redirect("/");
}
