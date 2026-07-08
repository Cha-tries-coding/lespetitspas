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

  // Server-side check for medication authorization
  if (input.event_type === "medicament") {
    const { data: child, error: childError } = await supabase
      .from("children")
      .select("medication_authorization")
      .eq("id", input.child_id)
      .single();

    if (childError || !child || !child.medication_authorization) {
      return {
        success: false,
        error: "403: Administration de médicament non autorisée pour cet enfant.",
        status: 403,
      };
    }
  }

  // Filter columns based on event type
  const insertData: any = {
    child_id: input.child_id,
    event_type: input.event_type,
    note: input.note || null,
    created_by: profile.id,
  };

  if (input.event_type === "repas") {
    insertData.meal_quality = input.meal_quality || null;
  } else if (input.event_type === "sieste") {
    insertData.start_time = input.start_time || null;
    insertData.end_time = input.end_time || null;
  } else if (input.event_type === "activite") {
    insertData.activity_label = input.activity_label || null;
  } else if (input.event_type === "medicament") {
    insertData.medication_name = input.medication_name || null;
  } else if (input.event_type === "incident") {
    insertData.severity = input.severity || null;
  }

  const { data, error } = await supabase
    .from("events")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error("Create event error:", error);
    throw new Error("Impossible d'ajouter l'événement : " + error.message);
  }

  return { success: true, data };
}

