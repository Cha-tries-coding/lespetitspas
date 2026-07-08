import { AuthenticatedHeader } from "@/components/auth/authenticated-header";
import { ChildrenGrid } from "@/components/staff/children-grid";
import { requireAuthProfile } from "@/lib/auth/session";
import { getAllChildren } from "@/lib/children/queries";
import { SoleilButton } from "@/components/layout/soleil-button";
import { MessageSquare } from "lucide-react";
import Link from "next/link";

export default async function StaffPage() {
  const profile = await requireAuthProfile("staff");
  const children = await getAllChildren();

  return (
    <main className="space-y-6">
      <AuthenticatedHeader
        title="Les enfants"
        subtitle={`Bonjour ${profile.full_name}, retrouvez ici tous les enfants accueillis.`}
      />

      <div className="flex justify-end -mt-4 mb-4">
        <SoleilButton asChild variant="secondary" className="bg-soleil-primary text-white hover:bg-soleil-primary/90 font-bold rounded-xl shadow-soleil">
          <Link href="/staff/messages" className="flex items-center gap-2">
            <MessageSquare className="size-4" /> Voir les messages des parents
          </Link>
        </SoleilButton>
      </div>

      <ChildrenGrid items={children} />
    </main>
  );
}
