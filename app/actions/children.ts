"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAuthProfile } from "@/lib/auth/session";
import type { EventType } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/lib/supabase/admin";

export async function markMessageAsReadAction(messageId: string) {
  await requireAuthProfile("staff");
  const supabase = await createClient();

  const { error } = await supabase
    .from("messages")
    .update({ status: "lu" })
    .eq("id", messageId);

  if (error) {
    throw new Error("Impossible de marquer le message comme lu.");
  }
}

export type CreateEventInput = {
  child_id: string;
  event_type: EventType;
  note?: string;
  meal_quality?: string;
  start_time?: string;
  end_time?: string;
  activity_label?: string;
  medication_name?: string;
  severity?: string;
};

export async function createEventAction(input: CreateEventInput) {
  const profile = await requireAuthProfile("staff");
  const supabase = await createClient();

  // Server-side check for medication authorization
  if (input.event_type === "medicament") {
    const { data: child, error: childError } = await supabase
      .from("children")
      .select("medication_authorization")
      .eq("id", input.child_id)
      .single();

    if (childError || !child || !child.medication_authorization) {
      return {
        success: false,
        error: "403: Administration de médicament non autorisée pour cet enfant.",
        status: 403,
      };
    }
  }

  // Filter columns based on event type
  const insertData: any = {
    child_id: input.child_id,
    event_type: input.event_type,
    note: input.note || null,
    created_by: profile.id,
  };

  if (input.event_type === "repas") {
    insertData.meal_quality = input.meal_quality || null;
  } else if (input.event_type === "sieste") {
    insertData.start_time = input.start_time || null;
    insertData.end_time = input.end_time || null;
  } else if (input.event_type === "activite") {
    insertData.activity_label = input.activity_label || null;
  } else if (input.event_type === "medicament") {
    insertData.medication_name = input.medication_name || null;
  } else if (input.event_type === "incident") {
    insertData.severity = input.severity || null;
  }

  const { data, error } = await supabase
    .from("events")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error("Create event error:", error);
    throw new Error("Impossible d'ajouter l'événement : " + error.message);
  }

  return { success: true, data };
}

export type AttachParentInput = {
  childId: string;
  parentEmail: string;
  parentFullName: string;
};

export async function attachParentAction(input: AttachParentInput) {
  // 1. Authenticate the staff member
  await requireAuthProfile("staff");
  
  const childId = input.childId;
  const parentEmail = input.parentEmail.trim().toLowerCase();
  const parentFullName = input.parentFullName.trim();

  if (!childId || !parentEmail || !parentFullName) {
    return { success: false, error: "Tous les champs (email, nom complet) sont requis." };
  }

  const adminSupabase = createAdminClient();

  // 2. Fetch child details to personalize the email
  const { data: child, error: childError } = await adminSupabase
    .from("children")
    .select("first_name, last_name")
    .eq("id", childId)
    .single();

  if (childError || !child) {
    return { success: false, error: "Enfant introuvable." };
  }

  try {
    // 3. Check if user already exists in profiles
    const { data: existingProfile, error: profileFetchError } = await adminSupabase
      .from("profiles")
      .select("id, email, full_name")
      .eq("email", parentEmail)
      .maybeSingle();

    let parentProfileId: string;
    let isNewUser = false;

    if (existingProfile) {
      parentProfileId = existingProfile.id;
    } else {
      // 4. User does not exist in profiles - Create auth user
      const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
        email: parentEmail,
        email_confirm: true,
        user_metadata: { full_name: parentFullName },
      });

      if (authError || !authData.user) {
        console.error("Auth user creation failed:", authError);
        return {
          success: false,
          error: `Impossible de créer le compte utilisateur : ${authError?.message || "Erreur inconnue"}`,
        };
      }

      parentProfileId = authData.user.id;
      isNewUser = true;

      // Ensure public profile exists
      // (some DB triggers automatically create profiles upon auth.users insert)
      const { data: checkProfile } = await adminSupabase
        .from("profiles")
        .select("id")
        .eq("id", parentProfileId)
        .maybeSingle();

      if (!checkProfile) {
        const { error: insertProfileError } = await adminSupabase
          .from("profiles")
          .insert({
            id: parentProfileId,
            role: "parent",
            full_name: parentFullName,
            email: parentEmail,
          });

        if (insertProfileError) {
          console.error("Manual profile creation failed:", insertProfileError);
          return {
            success: false,
            error: `Erreur lors de la création du profil public : ${insertProfileError.message}`,
          };
        }
      }
    }

    // 5. Connect child to parent in family_members
    // Check if link already exists
    const { data: existingLink } = await adminSupabase
      .from("family_members")
      .select("id")
      .eq("child_id", childId)
      .eq("profile_id", parentProfileId)
      .maybeSingle();

    if (!existingLink) {
      const { error: linkError } = await adminSupabase
        .from("family_members")
        .insert({
          child_id: childId,
          profile_id: parentProfileId,
        });

      if (linkError) {
        console.error("Linking parent to child failed:", linkError);
        return {
          success: false,
          error: `Impossible de lier le parent à l'enfant : ${linkError.message}`,
        };
      }
    } else {
      // Already linked!
      return { success: false, error: "Ce parent est déjà rattaché à cet enfant." };
    }

    // 6. Generate action link for creating/resetting password
    let linkType: "invite" | "recovery" = isNewUser ? "invite" : "recovery";
    let { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
      type: linkType,
      email: parentEmail,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/parent`,
      },
    });

    if (linkError && linkType === "invite") {
      console.warn("Invite link generation failed, trying recovery link fallback:", linkError);
      const fallback = await adminSupabase.auth.admin.generateLink({
        type: "recovery",
        email: parentEmail,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/parent`,
        },
      });
      linkData = fallback.data;
      linkError = fallback.error;
    }

    const actionLink = linkData?.properties?.action_link;

    if (linkError || !actionLink) {
      console.error("Generate link failed:", linkError);
      return {
        success: false,
        error: `Rattachement réussi, mais impossible de générer le lien d'invitation : ${linkError?.message || "Lien non retourné"}`,
      };
    }

    // 7. Send invitation email via Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    const resendFromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    if (!resendApiKey) {
      console.error("Missing RESEND_API_KEY in server environment");
      return {
        success: false,
        error: "Rattachement réussi, mais l'envoi d'email a échoué car l'API Resend n'est pas configurée dans .env.local (RESEND_API_KEY).",
      };
    }

    const emailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invitation Les Petits Pas</title>
  <style>
    body {
      background-color: #FFF8E1;
      font-family: 'Nunito', 'Inter', system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 0;
      color: #3E2723;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      background-color: #FFF8E1;
      width: 100%;
      padding: 40px 0;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border: 1px solid #EFDFC5;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(62, 39, 35, 0.05);
    }
    .header {
      background-color: #FFFFFF;
      padding: 30px 40px 10px 40px;
      text-align: center;
      border-bottom: 3px solid #FFD54F;
    }
    .logo-text {
      color: #FF8A65;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .emoji {
      font-size: 32px;
      margin-bottom: 10px;
    }
    .content {
      padding: 40px;
    }
    h1 {
      color: #FF8A65;
      font-size: 22px;
      font-weight: 700;
      line-height: 1.3;
      margin-top: 0;
      margin-bottom: 20px;
    }
    p {
      font-size: 15.5px;
      line-height: 1.6;
      color: #3E2723;
      margin-top: 0;
      margin-bottom: 20px;
    }
    .highlight {
      font-weight: 700;
      color: #FF8A65;
    }
    .button-container {
      text-align: center;
      margin: 35px 0;
    }
    .btn {
      display: inline-block;
      background-color: #FF8A65;
      color: #FFFFFF !important;
      text-decoration: none !important;
      font-weight: 700;
      font-size: 15px;
      padding: 14px 30px;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(255, 138, 101, 0.25);
    }
    .footer {
      background-color: #FFF8E1;
      padding: 25px 40px;
      font-size: 11px;
      color: #795548;
      line-height: 1.5;
      border-top: 1px solid #EFDFC5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="emoji">☀️</div>
        <div class="logo-text">Les Petits Pas</div>
      </div>
      <div class="content">
        <h1>Bonjour ${parentFullName},</h1>
        <p>
          L'équipe de la crèche vous invite à rejoindre <strong class="highlight">Les Petits Pas</strong>, 
          le journal de bord numérique spécialement conçu pour suivre les journées de votre enfant, <strong class="highlight">${child.first_name}</strong>.
        </p>
        <p>
          Grâce à cette application, vous pourrez retrouver en temps réel le fil d'actualité de votre enfant 
          (repas, siestes, activités ludiques, soins et transmissions) et échanger des messages en toute 
          sécurité avec l'équipe éducative.
        </p>
        <p>
          Pour activer votre compte de parent et définir votre mot de passe, cliquez simplement sur le bouton ci-dessous :
        </p>
        
        <div class="button-container">
          <a href="${actionLink}" class="btn" target="_blank">Créer mon mot de passe</a>
        </div>
        
        <p style="font-size: 14px; color: #795548;">Suivi pour : ${child.first_name} ${child.last_name}</p>
        <p style="margin-bottom: 0;">À très vite,<br>L'équipe de la crèche 🧸</p>
      </div>
      <div class="footer">
        <p style="margin-bottom: 8px; font-weight: bold;">
          Mention RGPD :
        </p>
        <p style="margin-bottom: 8px; margin-top: 0;">
          Vos données personnelles (nom, prénom et adresse email) sont stockées de manière strictement confidentielle et sécurisée par Les Petits Pas. Elles sont exclusivement destinées à vous permettre de suivre les activités de votre enfant au sein de l'établissement et d'interagir avec l'équipe éducative. Elles ne feront jamais l'objet d'un transfert ou d'une revente à des tiers.
        </p>
        <p style="margin: 0;">
          Conformément à la réglementation, vous disposez d'un droit d'accès, de rectification, de portabilité et d'effacement de vos données sur simple demande auprès de la direction de la crèche.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resendFromEmail,
        to: parentEmail,
        subject: `Vous êtes invité à suivre la journée de ${child.first_name} sur Les Petits Pas`,
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      try {
        const errorJson = JSON.parse(errorText);
        console.error("Resend delivery failed:", errorJson);
        return {
          success: false,
          error: `Rattachement réussi, mais impossible d'envoyer l'email d'invitation : ${errorJson.message || resendResponse.statusText}`,
        };
      } catch {
        console.error("Resend delivery failed:", errorText);
        return {
          success: false,
          error: `Rattachement réussi, mais impossible d'envoyer l'email d'invitation : ${resendResponse.statusText}`,
        };
      }
    }

    revalidatePath(`/staff/children/${childId}`);

    return { success: true };
  } catch (err: any) {
    console.error("Exception in attachParentAction:", err);
    return {
      success: false,
      error: `Une erreur imprévue est survenue : ${err.message || err}`,
    };
  }
}

