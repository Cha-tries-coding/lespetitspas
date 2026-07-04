import { LogoutButton } from "@/components/auth/logout-button";

type AuthenticatedHeaderProps = {
  title: string;
  subtitle?: string;
};

export function AuthenticatedHeader({
  title,
  subtitle,
}: AuthenticatedHeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1>{title}</h1>
        {subtitle ? (
          <p className="mt-2 text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      <LogoutButton className="shrink-0" />
    </header>
  );
}
