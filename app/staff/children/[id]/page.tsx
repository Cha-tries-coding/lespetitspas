import { requireAuthProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { AuthenticatedHeader } from "@/components/auth/authenticated-header";
import { ChildDetailClient } from "./child-detail-client";
import { getChildDisplayName } from "@/components/staff/child-avatar";
import type { EventType } from "@/lib/supabase/database.types";

type ChildDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ChildDetailPage({ params }: ChildDetailPageProps) {
  await requireAuthProfile("staff");
  const { id } = await params;
  const supabase = await createClient();

  // 1. Fetch child details
  const { data: child } = await supabase
    .from("children")
    .select(
      "id, first_name, last_name, section, photo_url, allergies, medication_authorization",
    )
    .eq("id", id)
    .single();

  if (!child) {
    notFound();
  }

  // 2. Fetch parents (family members)
  const { data: familyMembers } = await supabase
    .from("family_members")
    .select(`
      id,
      profile_id,
      profiles:profile_id(id, full_name, email)
    `)
    .eq("child_id", id);

  const parents = familyMembers?.map((fm: any) => fm.profiles).filter(Boolean) || [];

  // 3. Fetch unread messages
  const { data: messagesData } = await supabase
    .from("messages")
    .select(`
      id,
      child_id,
      content,
      status,
      created_at,
      profiles:sender_id(full_name)
    `)
    .eq("child_id", id)
    .eq("status", "nouveau")
    .order("created_at", { ascending: false });

  const messages = messagesData?.map((msg: any) => ({
    id: msg.id,
    child_id: msg.child_id,
    content: msg.content,
    status: msg.status,
    created_at: msg.created_at,
    sender_name: msg.profiles?.full_name || "Parent",
  })) || [];

  // 4. Fetch daily events for "Aujourd'hui"
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const { data: eventsData } = await supabase
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

  const events = eventsData?.map((evt: any) => ({
    id: evt.id,
    child_id: evt.child_id,
    event_type: evt.event_type as EventType,
    note: evt.note,
    meal_quality: evt.meal_quality,
    start_time: evt.start_time,
    end_time: evt.end_time,
    activity_label: evt.activity_label,
    medication_name: evt.medication_name,
    severity: evt.severity,
    created_at: evt.created_at,
    created_by_name: evt.profiles?.full_name || "Équipe",
  })) || [];

  return (
    <main className="max-w-4xl mx-auto px-4 pb-12">
      <AuthenticatedHeader
        title={getChildDisplayName(child)}
        subtitle="Fiche de suivi de l'enfant"
      />
      <ChildDetailClient
        child={child}
        initialParents={parents}
        initialMessages={messages}
        initialEvents={events}
      />
    </main>
  );
}
