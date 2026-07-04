import { redirect } from "next/navigation";

import type { ProfileRole } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type AuthProfile = {
  id: string;
  role: ProfileRole;
  full_name: string;
  email: string;
};

export function getRoleRedirectPath(role: ProfileRole) {
  if (role === "staff") {
    return "/staff";
  }

  return "/parent";
}

export async function getAuthProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, email")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return null;
  }

  return profile;
}

export async function requireAuthProfile(expectedRole?: ProfileRole) {
  const profile = await getAuthProfile();

  if (!profile) {
    redirect("/login");
  }

  if (expectedRole && profile.role !== expectedRole) {
    redirect(getRoleRedirectPath(profile.role));
  }

  return profile;
}
