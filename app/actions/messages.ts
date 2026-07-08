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

export async function createMessageAction(childId: string, content: string) {
  const profile = await requireAuthProfile("parent");
  const supabase = await createClient();

  if (!childId || !content || content.trim().length === 0 || content.length > 500) {
    throw new Error("Données de message invalides.");
  }

  // Verify that the child belongs to the parent
  const { data: relationship, error: relationError } = await supabase
    .from("family_members")
    .select("id")
    .eq("child_id", childId)
    .eq("profile_id", profile.id);

  if (relationError || !relationship || relationship.length === 0) {
    throw new Error("Non autorisé : cet enfant n'est pas rattaché à votre compte.");
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      child_id: childId,
      sender_id: profile.id,
      content: content.trim(),
      status: "nouveau",
    })
    .select()
    .single();

  if (error) {
    throw new Error("Impossible d'envoyer le message : " + error.message);
  }

  // TODO Phase 7 : envoyer un email Resend au staff ici

  return { success: true, data };
}
