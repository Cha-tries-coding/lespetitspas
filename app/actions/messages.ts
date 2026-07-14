"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuthProfile } from "@/lib/auth/session";

export async function markMessageReadAction(messageId: string) {
  await requireAuthProfile("staff");
  const supabase = await createClient();

  const { error } = await supabase
    .from("messages")
    .update({ status: "lu" })
    .eq("id", messageId);

  if (error) {
    throw new Error("Impossible de marquer le message comme lu : " + error.message);
  }

  return { success: true };
}

export async function markMessageProcessedAction(messageId: string) {
  await requireAuthProfile("staff");
  const supabase = await createClient();

  const { error } = await supabase
    .from("messages")
    .update({ status: "traite" })
    .eq("id", messageId);

  if (error) {
    throw new Error("Impossible de marquer le message comme traité : " + error.message);
  }

  return { success: true };
}

export async function createMessageAction(childId: string, content: string) {
  const profile = await requireAuthProfile("parent");
  const supabase = await createClient();

  if (!childId || !content || content.trim().length === 0 || content.length > 500) {
    throw new Error("Données de message invalides.");
  }

  // Verify that the child belongs to the parent
  const { data: relationship, error: relationError } = await supabase
    .from("family_members")
    .select("id")
    .eq("child_id", childId)
    .eq("profile_id", profile.id);

  if (relationError || !relationship || relationship.length === 0) {
    throw new Error("Non autorisé : cet enfant n'est pas rattaché à votre compte.");
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      child_id: childId,
      sender_id: profile.id,
      content: content.trim(),
      status: "nouveau",
    })
    .select()
    .single();

  if (error) {
    throw new Error("Impossible d'envoyer le message : " + error.message);
  }

  // Send an email notification via the Resend API to all staff members
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    const resendFromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    if (resendApiKey) {
      // 1. Fetch child first name
      const { data: child } = await supabase
        .from("children")
        .select("first_name, last_name")
        .eq("id", childId)
        .single();

      // 2. Fetch all staff profiles
      const { data: staffProfiles } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("role", "staff");

      if (staffProfiles && staffProfiles.length > 0 && child) {
        const parentFullName = profile.full_name || "Un parent";
        const parentFirstName = parentFullName.split(" ")[0] || "Un parent";
        const childFirstName = child.first_name || "un enfant";
        const truncatedContent = content.trim().length > 80 ? content.trim().substring(0, 80) + "..." : content.trim();

        // Send-loop to all staff members in parallel
        await Promise.all(
          staffProfiles.map(async (staff) => {
            const emailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Nouveau message Les Petits Pas</title>
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
      font-size: 20px;
      font-weight: 700;
      line-height: 1.3;
      margin-top: 0;
      margin-bottom: 20px;
    }
    p {
      font-size: 15px;
      line-height: 1.6;
      color: #3E2723;
      margin-top: 0;
      margin-bottom: 20px;
    }
    .highlight {
      font-weight: 700;
      color: #FF8A65;
    }
    .message-preview {
      background-color: #FFF8E1/30;
      border-left: 4px solid #FF8A65;
      padding: 15px 20px;
      border-radius: 4px 12px 12px 4px;
      margin: 25px 0;
      font-style: italic;
      color: #795548;
      background-color: #FFFBF0;
    }
    .security-notice {
      background-color: #FFF3E0;
      border: 1px solid #FFE0B2;
      padding: 12px 15px;
      border-radius: 10px;
      font-size: 12px;
      color: #E65100;
      margin: 20px 0;
      line-height: 1.5;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
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
      padding: 20px 40px;
      font-size: 11px;
      color: #795548;
      text-align: center;
      border-top: 1px solid #EFDFC5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="emoji">💬</div>
        <div class="logo-text">Les Petits Pas</div>
      </div>
      <div class="content">
        <h1>Bonjour ${staff.full_name || "Membre de l'équipe"},</h1>
        <p>
          Le parent <strong class="highlight">${parentFirstName}</strong> vient de vous envoyer un nouveau message concernant <strong class="highlight">${childFirstName}</strong>.
        </p>

        <p>Il y a un message :</p>
        <div class="message-preview">
          « ${truncatedContent} »
        </div>

        <div class="security-notice">
          🔒 <strong>Confidentialité & Santé :</strong> Pour préserver le secret médical et respecter les normes RGPD, aucune information de santé ou donnée confidentielle sensible n&apos;est transmise par e-mail.
        </div>

        <div class="button-container">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/staff/messages" class="btn" target="_blank">Consulter les messages</a>
        </div>

        <p style="margin-bottom: 0;">Belle journée,<br>L&apos;application Les Petits Pas 🧸</p>
      </div>
      <div class="footer">
        <p style="margin: 0;">Cet email automatique a été envoyé à l&apos;équipe professionnelle de la crèche Les Petits Pas.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: resendFromEmail,
                to: staff.email,
                subject: `Nouveau message de ${parentFullName} pour ${childFirstName}`,
                html: emailHtml,
              }),
            });
          })
        );
      }
    }
  } catch (emailErr) {
    console.error("Failed to send staff notification emails:", emailErr);
  }

  return { success: true, data };
}
