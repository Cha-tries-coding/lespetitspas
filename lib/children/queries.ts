import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type Child = Database["public"]["Tables"]["children"]["Row"];

export async function getAllChildren() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("children")
    .select(
      "id, first_name, last_name, section, photo_url, allergies, medication_authorization, created_by",
    )
    .order("last_name")
    .order("first_name");

  if (error) {
    throw new Error("Impossible de charger la liste des enfants.");
  }

  return data ?? [];
}
