import React from "react";
import { requireAuthProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { AuthenticatedHeader } from "@/components/auth/authenticated-header";
import { NewMessageFormClient } from "./new-message-form-client";
import { SoleilCard } from "@/components/layout/soleil-card";
import { AlertTriangle, Baby } from "lucide-react";
import type { MessageStatus } from "@/lib/supabase/database.types";

interface ChildQueryResult {
  id: string;
  first_name: string;
  last_name: string;
}

interface MessageQueryResult {
  id: string;
  child_id: string;
  content: string;
  status: MessageStatus;
  created_at: string;
  children: {
    first_name: string;
    last_name: string;
  } | null;
}

export default async function NewMessagePage() {
  const profile = await requireAuthProfile("parent");
  const supabase = await createClient();

  // 1. Get family members / child ids for this parent
  const { data: familyMembers, error: relationError } = await supabase
    .from("family_members")
    .select("child_id")
    .eq("profile_id", profile.id);

  if (relationError) {
    console.error("Fetch family members error in new message dashboard:", relationError);
    return (
      <main className="max-w-3xl mx-auto px-4 pb-12">
        <AuthenticatedHeader title="Nouveau message" />
        <SoleilCard className="p-8 text-center border-soleil-error/30 bg-rose-50/30 flex flex-col items-center gap-4">
          <div className="p-3 bg-rose-100 text-rose-600 rounded-full">
            <AlertTriangle className="size-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading font-bold text-lg text-soleil-text">
              Oups ! Une erreur est survenue
            </h3>
            <p className="text-sm text-soleil-text-muted">
              Nous n{"'"}avons pas pu charger les informations de votre famille. Veuillez actualiser la page.
            </p>
          </div>
        </SoleilCard>
      </main>
    );
  }

  const childIds = familyMembers?.map((fm) => fm.child_id) || [];

  let children: ChildQueryResult[] = [];
  if (childIds.length > 0) {
    const { data: childrenData, error: childrenError } = await supabase
      .from("children")
      .select("id, first_name, last_name")
      .in("id", childIds);

    if (childrenError) {
      console.error("Fetch children error under new message dashboard:", childrenError);
    } else {
      children = childrenData || [];
    }
  }

  // 2. Load sent messages sent by this parent
  const { data: messagesData, error: messagesError } = await supabase
    .from("messages")
    .select(`
      id,
      child_id,
      content,
      status,
      created_at,
      children:child_id(first_name, last_name)
    `)
    .eq("sender_id", profile.id)
    .order("created_at", { ascending: false });

  if (messagesError) {
    console.error("Fetch sent messages error under messages dashboard:", messagesError);
  }

  const rawMessages = (messagesData as unknown as MessageQueryResult[]) || [];
  const sentMessages = rawMessages.map((msg) => ({
    id: msg.id,
    child_id: msg.child_id,
    content: msg.content,
    status: msg.status,
    created_at: msg.created_at,
    child_name: msg.children ? `${msg.children.first_name} ${msg.children.last_name}` : "Enfant",
  }));

  return (
    <main className="max-w-3xl mx-auto px-4 pb-12">
      <AuthenticatedHeader
        title="Nouveau message"
        subtitle="Saisissez une information importante ou une consigne pour l'équipe éducative."
      />
      
      {children.length === 0 ? (
        <SoleilCard className="p-12 text-center border-dashed border-2 border-border/80 bg-card/60 flex flex-col items-center justify-center gap-5">
          <div className="p-4 bg-soleil-background text-soleil-primary rounded-full">
            <Baby className="size-12" />
          </div>
          <div className="space-y-2">
            <h3 className="font-heading font-bold text-xl text-soleil-text">
              Aucun enfant trouvé
            </h3>
            <p className="text-sm text-soleil-text-muted max-w-sm mx-auto">
              Il semblerait qu{"'"}aucun enfant ne soit encore rattaché à votre compte. 
              Vous ne pouvez pas envoyer de messages sans avoir d{"'"}enfants rattachés.
            </p>
          </div>
        </SoleilCard>
      ) : (
        <NewMessageFormClient 
          childrenList={children} 
          initialMessages={sentMessages}
        />
      )}
    </main>
  );
}
