"use server";

import { redirect } from "next/navigation";

import {
  getRoleRedirectPath,
  type AuthProfile,
} from "@/lib/auth/session";
import type { ProfileRole } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type LoginState = {
  error?: string;
};

function getLoginErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid email or password")
  ) {
    return "Adresse e-mail ou mot de passe incorrect.";
  }

  return "Connexion impossible. Vérifiez vos identifiants et réessayez.";
}

export async function login(
  _prevState: LoginState | null,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Veuillez renseigner votre e-mail et votre mot de passe." };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return { error: getLoginErrorMessage(signInError.message) };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Connexion impossible. Veuillez réessayer." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<Pick<AuthProfile, "role">>();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    return {
      error:
        "Profil introuvable pour ce compte. Contactez l'équipe de la crèche.",
    };
  }

  redirect(getRoleRedirectPath(profile.role));
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function redirectIfAuthenticated() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<Pick<AuthProfile, "role">>();

  if (profile?.role) {
    redirect(getRoleRedirectPath(profile.role as ProfileRole));
  }
}
