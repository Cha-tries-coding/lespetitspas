import { AuthenticatedHeader } from "@/components/auth/authenticated-header";
import { ChildrenGrid } from "@/components/staff/children-grid";
import { requireAuthProfile } from "@/lib/auth/session";
import { getAllChildren } from "@/lib/children/queries";

export default async function StaffPage() {
  const profile = await requireAuthProfile("staff");
  const children = await getAllChildren();

  return (
    <main>
      <AuthenticatedHeader
        title="Les enfants"
        subtitle={`Bonjour ${profile.full_name}, retrouvez ici tous les enfants accueillis.`}
      />
      <ChildrenGrid items={children} />
    </main>
  );
}
