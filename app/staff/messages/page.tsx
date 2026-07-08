import { requireAuthProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { AuthenticatedHeader } from "@/components/auth/authenticated-header";
import { MessagesClient } from "./messages-client";
import type { MessageStatus } from "@/lib/supabase/database.types";

interface MessageQueryResult {
  id: string;
  child_id: string;
  sender_id: string;
  content: string;
  status: MessageStatus;
  created_at: string;
  profiles: { full_name: string | null } | null;
  children: { first_name: string } | null;
}

export default async function MessagesPage() {
  await requireAuthProfile("staff");
  const supabase = await createClient();

  const { data: messagesData, error } = await supabase
    .from("messages")
    .select(`
      id,
      child_id,
      sender_id,
      content,
      status,
      created_at,
      profiles:sender_id(full_name),
      children:child_id(first_name)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch messages error:", error);
    throw new Error("Impossible de charger les messages.");
  }

  const messages = ((messagesData as unknown as MessageQueryResult[]) || []).map((msg) => ({
    id: msg.id,
    child_id: msg.child_id,
    sender_id: msg.sender_id,
    content: msg.content,
    status: msg.status,
    created_at: msg.created_at,
    sender_name: msg.profiles?.full_name || "Parent",
    child_first_name: msg.children?.first_name || "Enfant",
  }));

  return (
    <main className="max-w-4xl mx-auto px-4 pb-12">
      <AuthenticatedHeader
        title="Messages reçus"
        subtitle="Suivez et gérez les messages envoyés par les parents."
      />
      <MessagesClient initialMessages={messages} />
    </main>
  );
}
