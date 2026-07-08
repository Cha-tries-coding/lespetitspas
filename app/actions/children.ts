"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAuthProfile } from "@/lib/auth/session";
import type { EventType } from "@/lib/supabase/database.types";

export async function markMessageAsReadAction(messageId: string) {
  await requireAuthProfile("staff");
  const supabase = await createClient();

  const { error } = await supabase
    .from("messages")
    .update({ status: "lu" })
    .eq("id", messageId);

  if (error) {
    throw new Error("Impossible de marquer le message comme lu.");
  }
}

export type CreateEventInput = {
  child_id: string;
  event_type: EventType;
  note?: string;
  meal_quality?: string;
  start_time?: string;
  end_time?: string;
  activity_label?: string;
  medication_name?: string;
  severity?: string;
};

export async function createEventAction(input: CreateEventInput) {
  const profile = await requireAuthProfile("staff");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .insert({
      child_id: input.child_id,
      event_type: input.event_type,
      note: input.note || null,
      meal_quality: input.meal_quality || null,
      start_time: input.start_time || null,
      end_time: input.end_time || null,
      activity_label: input.activity_label || null,
      medication_name: input.medication_name || null,
      severity: input.severity || null,
      created_by: profile.id,
    })
    .select()
    .single();

  if (error) {
    console.error("Create event error:", error);
    throw new Error("Impossible d'ajouter l'événement : " + error.message);
  }

  return data;
}
