import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Skill } from "@/types/models";

/**
 * The structured skill catalog lives in the `skills` table, so the picker
 * always offers exactly the skills the matching engine knows about.
 */
export async function listSkills(): Promise<Skill[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("skills")
    .select("id, name, category, created_at")
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("[data/skills] list failed:", error.message);
    return [];
  }

  return (data ?? []) as Skill[];
}
