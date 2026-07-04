import Link from "next/link";

import { AuthenticatedHeader } from "@/components/auth/authenticated-header";
import { ChildAvatar } from "@/components/staff/child-avatar";
import { SectionBadge } from "@/components/staff/section-badge";
import { SoleilButton } from "@/components/layout/soleil-button";
import { requireAuthProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getChildDisplayName } from "@/components/staff/child-avatar";
import { notFound } from "next/navigation";

type ChildDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ChildDetailPage({ params }: ChildDetailPageProps) {
  await requireAuthProfile("staff");
  const { id } = await params;
  const supabase = await createClient();

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

  return (
    <main>
      <AuthenticatedHeader
        title={getChildDisplayName(child)}
        subtitle="Fiche enfant"
      />
      <div className="mb-6">
        <SoleilButton asChild variant="outline" size="sm">
          <Link href="/staff">← Retour à la liste</Link>
        </SoleilButton>
      </div>
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 text-center shadow-soleil sm:flex-row sm:text-left">
        <ChildAvatar child={child} className="size-24" />
        <div>
          <p className="font-heading text-2xl">
            {child.first_name} {child.last_name}
          </p>
          <div className="mt-3">
            <SectionBadge section={child.section} />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Le détail du suivi sera disponible ici prochainement.
          </p>
        </div>
      </div>
    </main>
  );
}
