import { logout } from "@/app/actions/auth";
import { getAuthProfile } from "@/lib/auth/session";
import { SoleilButton } from "@/components/layout/soleil-button";

type LogoutButtonProps = {
  className?: string;
};

export async function LogoutButton({ className }: LogoutButtonProps) {
  const profile = await getAuthProfile();

  if (!profile) {
    return null;
  }

  return (
    <form action={logout}>
      <SoleilButton type="submit" variant="outline" className={className}>
        Se déconnecter
      </SoleilButton>
    </form>
  );
}
