import { redirectIfAuthenticated } from "@/app/actions/auth";
import { LoginForm } from "@/app/login/login-form";

export default async function LoginPage() {
  await redirectIfAuthenticated();

  return (
    <main className="flex flex-1 flex-col items-center justify-center py-8">
      <div className="mb-8 text-center">
        <p className="font-heading text-sm font-semibold tracking-wide text-primary uppercase">
          Les Petits Pas
        </p>
        <h1 className="mt-2 text-3xl">Bonjour !</h1>
        <p className="mt-2 text-muted-foreground">
          Connectez-vous pour accéder à votre espace.
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
