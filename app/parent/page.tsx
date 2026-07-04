import { AuthenticatedHeader } from "@/components/auth/authenticated-header";
import { requireAuthProfile } from "@/lib/auth/session";

export default async function ParentPage() {
  const profile = await requireAuthProfile("parent");

  return (
    <main>
      <AuthenticatedHeader
        title="Espace famille"
        subtitle={`Bonjour ${profile.full_name}, suivez la journée de votre enfant.`}
      />
      <p className="text-muted-foreground">
        Les écrans familiaux seront disponibles ici prochainement.
      </p>
    </main>
  );
}
