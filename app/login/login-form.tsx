"use client";

import { useActionState } from "react";
import { CircleAlert } from "lucide-react";

import { login, type LoginState } from "@/app/actions/auth";
import { SoleilButton } from "@/components/layout/soleil-button";
import {
  SoleilCard,
  SoleilCardContent,
  SoleilCardDescription,
  SoleilCardHeader,
  SoleilCardTitle,
} from "@/components/layout/soleil-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: LoginState | null = null;

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <SoleilCard className="w-full max-w-md">
      <SoleilCardHeader>
        <SoleilCardTitle className="text-2xl">Connexion</SoleilCardTitle>
        <SoleilCardDescription>
          Accédez à l&apos;espace Les Petits Pas avec votre compte.
        </SoleilCardDescription>
      </SoleilCardHeader>
      <SoleilCardContent>
        <form action={formAction} className="flex flex-col gap-4">
          {state?.error ? (
            <Alert variant="destructive" className="rounded-xl border-destructive/30">
              <CircleAlert />
              <AlertTitle>Connexion refusée</AlertTitle>
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Adresse e-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="vous@exemple.fr"
              required
              disabled={pending}
              className="h-10 rounded-xl bg-card"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
              disabled={pending}
              className="h-10 rounded-xl bg-card"
            />
          </div>

          <SoleilButton type="submit" className="mt-2 h-10 w-full" disabled={pending}>
            {pending ? "Connexion..." : "Se connecter"}
          </SoleilButton>
        </form>
      </SoleilCardContent>
    </SoleilCard>
  );
}
