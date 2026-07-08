"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuthProfile } from "@/lib/auth/session";

export async function markMessageReadAction(messageId: string) {
  await requireAuthProfile("staff");
  const supabase = await createClient();

  const { error } = await supabase
    .from("messages")
    .update({ status: "lu" })
    .eq("id", messageId);

  if (error) {
    throw new Error("Impossible de marquer le message comme lu : " + error.message);
  }

  return { success: true };
}

export async function markMessageProcessedAction(messageId: string) {
  await requireAuthProfile("staff");
  const supabase = await createClient();

  const { error } = await supabase
    .from("messages")
    .update({ status: "traite" })
    .eq("id", messageId);

  if (error) {
    throw new Error("Impossible de marquer le message comme traité : " + error.message);
  }

  return { success: true };
}
