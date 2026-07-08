import { requireAuthProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ChildTimelineClient } from "./child-timeline-client";

type ChildTimelinePageProps = {
  params: Promise<{ id: string }>;
};

export default async function ChildTimelinePage({ params }: ChildTimelinePageProps) {
  const profile = await requireAuthProfile("parent");
  const { id } = await params;
  const supabase = await createClient();

  // 1. Verify owner/parent relation
  const { data: relationshipData, error: relationError } = await supabase
    .from("family_members")
    .select("id")
    .eq("child_id", id)
    .eq("profile_id", profile.id);

  if (relationError || !relationshipData || relationshipData.length === 0) {
    // If not matching relationship or query fails: redirect to /parent
    console.warn(`Unauthorized access by parent ${profile.id} to child ${id}`);
    redirect("/parent");
  }

  // 2. Load child details
  const { data: child, error: childError } = await supabase
    .from("children")
    .select("id, first_name, last_name, section, photo_url, allergies, medication_authorization")
    .eq("id", id)
    .single();

  if (childError || !child) {
    notFound();
  }

  // 3. Load initial events (for default: today)
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const { data: eventsData, error: eventsError } = await supabase
    .from("events")
    .select(`
      id,
      child_id,
      event_type,
      note,
      meal_quality,
      start_time,
      end_time,
      activity_label,
      medication_name,
      severity,
      created_at,
      profiles:created_by(full_name)
    `)
    .eq("child_id", id)
    .gte("created_at", startOfDay.toISOString())
    .lte("created_at", endOfDay.toISOString())
    .order("created_at", { ascending: false });

  if (eventsError) {
    console.error("Fetch timeline events error:", eventsError);
    throw new Error("Impossible de récupérer l'historique.");
  }

  interface EventQueryResult {
    id: string;
    child_id: string;
    event_type: string;
    note: string | null;
    meal_quality: string | null;
    start_time: string | null;
    end_time: string | null;
    activity_label: string | null;
    medication_name: string | null;
    severity: string | null;
    created_at: string;
    profiles: { full_name: string | null } | null;
  }

  const rawEvents = (eventsData as unknown as EventQueryResult[]) || [];
  const events = rawEvents.map((evt) => ({
    id: evt.id,
    event_type: evt.event_type,
    note: evt.note,
    meal_quality: evt.meal_quality,
    start_time: evt.start_time,
    end_time: evt.end_time,
    activity_label: evt.activity_label,
    medication_name: evt.medication_name,
    severity: evt.severity,
    created_at: evt.created_at,
    created_by_name: evt.profiles?.full_name || "Équipe",
  }));

  // Format today's date as YYYY-MM-DD for initial calendar state
  const formattedTodayDate = today.toISOString().split("T")[0];

  return (
    <main className="max-w-4xl mx-auto px-4 pb-12">
      <ChildTimelineClient
        child={child}
        initialEvents={events}
        initialDate={formattedTodayDate}
      />
    </main>
  );
}
