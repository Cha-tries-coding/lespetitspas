import React from "react";
import Link from "next/link";
import { requireAuthProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { AuthenticatedHeader } from "@/components/auth/authenticated-header";
import { SoleilButton } from "@/components/layout/soleil-button";
import { SoleilCard } from "@/components/layout/soleil-card";
import { ChildAvatar } from "@/components/staff/child-avatar";
import { SectionBadge } from "@/components/staff/section-badge";
import { 
  MessageSquare, 
  Clock, 
  Baby, 
  Utensils, 
  Moon, 
  Paintbrush, 
  Pill, 
  AlertTriangle 
} from "lucide-react";
import type { EventType } from "@/lib/supabase/database.types";

interface ChildItem {
  id: string;
  first_name: string;
  last_name: string;
  section: string;
  photo_url: string | null;
  lastEvent: {
    event_type: EventType;
    note: string | null;
    meal_quality: string | null;
    start_time: string | null;
    end_time: string | null;
    activity_label: string | null;
    medication_name: string | null;
    severity: string | null;
    created_at: string;
  } | null;
}

// Event config mapping for styling inside parent cards
const EVENT_STYLES: Record<EventType, {
  icon: React.ReactNode;
  label: string;
  colorBorder: string;
  colorBg: string;
  colorText: string;
  colorIcon: string;
}> = {
  repas: {
    icon: <Utensils className="size-4" />,
    label: "Repas",
    colorBorder: "border-emerald-100",
    colorBg: "bg-emerald-50/65",
    colorText: "text-emerald-800",
    colorIcon: "bg-emerald-500 text-white"
  },
  sieste: {
    icon: <Moon className="size-4" />,
    label: "Sieste",
    colorBorder: "border-indigo-100",
    colorBg: "bg-indigo-50/65",
    colorText: "text-indigo-800",
    colorIcon: "bg-indigo-500 text-white"
  },
  activite: {
    icon: <Paintbrush className="size-4" />,
    label: "Activité",
    colorBorder: "border-amber-100",
    colorBg: "bg-amber-50/65",
    colorText: "text-amber-800",
    colorIcon: "bg-amber-500 text-white"
  },
  medicament: {
    icon: <Pill className="size-4" />,
    label: "Médicament",
    colorBorder: "border-cyan-100",
    colorBg: "bg-cyan-50/65",
    colorText: "text-cyan-800",
    colorIcon: "bg-cyan-500 text-white"
  },
  incident: {
    icon: <AlertTriangle className="size-4" />,
    label: "Incident",
    colorBorder: "border-rose-100",
    colorBg: "bg-rose-50/65",
    colorText: "text-rose-800",
    colorIcon: "bg-rose-500 text-white"
  }
};

function getMealQualityLabel(quality: string | null) {
  switch (quality) {
    case "excellent":
      return "Très bien mangé 😋";
    case "bien":
      return "Bien mangé 👍";
    case "moyen":
      return "Un peu mangé 🥣";
    case "aucun":
      return "N'a pas mangé 🚫";
    default:
      return "";
  }
}

export default async function ParentPage() {
  const profile = await requireAuthProfile("parent");
  const supabase = await createClient();

  // 1. Get family members/children connected to this parent
  const { data: familyData, error: familyError } = await supabase
    .from("family_members")
    .select("child_id")
    .eq("profile_id", profile.id);

  if (familyError) {
    console.error("Family members fetch error:", familyError);
    return (
      <main className="max-w-4xl mx-auto px-4 pb-12">
        <AuthenticatedHeader title="Espace famille" />
        <SoleilCard className="p-8 text-center border-soleil-error/30 bg-rose-50/30 flex flex-col items-center gap-4">
          <div className="p-3 bg-rose-100 text-rose-600 rounded-full">
            <AlertTriangle className="size-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading font-bold text-lg text-soleil-text">
              Oups ! Une erreur est survenue
            </h3>
            <p className="text-sm text-soleil-text-muted">
              Nous n{"'"}avons pas pu charger les informations de votre famille. Veuillez réessayer.
            </p>
          </div>
        </SoleilCard>
      </main>
    );
  }

  const childIds = familyData?.map((f) => f.child_id) || [];

  const children: ChildItem[] = [];

  if (childIds.length > 0) {
    // 2. Fetch those children
    const { data: childrenData, error: childrenError } = await supabase
      .from("children")
      .select("id, first_name, last_name, section, photo_url")
      .in("id", childIds);

    if (childrenError) {
      console.error("Children fetch error:", childrenError);
    } else if (childrenData) {
      // 3. For each child, fetch the latest event from today
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      for (const child of childrenData) {
        const { data: latestEvents } = await supabase
          .from("events")
          .select("event_type, note, meal_quality, start_time, end_time, activity_label, medication_name, severity, created_at")
          .eq("child_id", child.id)
          .gte("created_at", startOfDay.toISOString())
          .lte("created_at", endOfDay.toISOString())
          .order("created_at", { ascending: false })
          .limit(1);

        const latestEvent = latestEvents && latestEvents.length > 0 ? latestEvents[0] : null;

        children.push({
          id: child.id,
          first_name: child.first_name,
          last_name: child.last_name,
          section: child.section,
          photo_url: child.photo_url,
          lastEvent: latestEvent ? {
            event_type: latestEvent.event_type as EventType,
            note: latestEvent.note,
            meal_quality: latestEvent.meal_quality,
            start_time: latestEvent.start_time,
            end_time: latestEvent.end_time,
            activity_label: latestEvent.activity_label,
            medication_name: latestEvent.medication_name,
            severity: latestEvent.severity,
            created_at: latestEvent.created_at,
          } : null,
        });
      }
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 pb-12 animate-in fade-in duration-300">
      <AuthenticatedHeader
        title="Espace famille"
        subtitle={`Bonjour ${profile.full_name}, suivez la journée de votre enfant.`}
      />

      {/* Primary Actions Bar */}
      <div className="flex justify-end mb-8 -mt-4">
        <SoleilButton asChild variant="secondary" className="bg-soleil-primary text-white hover:bg-soleil-primary/90 font-bold rounded-xl shadow-soleil gap-2">
          <Link href="/parent/messages/new">
            <MessageSquare className="size-4" /> Envoyer un message à l{"'"}équipe
          </Link>
        </SoleilButton>
      </div>

      {/* Children Section */}
      {children.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {children.map((child) => {
            const lastEvent = child.lastEvent;
            const style = lastEvent ? EVENT_STYLES[lastEvent.event_type] : null;

            return (
              <Link key={child.id} href={`/parent/children/${child.id}`} className="block group">
                <SoleilCard className="border border-border/80 p-6 bg-card transition-all duration-300 hover:scale-[1.02] hover:border-soleil-primary/50 group-hover:shadow-soleil-md flex flex-col justify-between h-full gap-5">
                  
                  {/* Child Identity */}
                  <div className="flex items-center gap-4">
                    <ChildAvatar child={child} className="size-16 border-2 border-border shrink-0" />
                    <div className="space-y-1">
                      <h2 className="font-heading font-bold text-xl text-soleil-text group-hover:text-soleil-primary transition-colors flex items-center gap-2">
                        {child.first_name} {child.last_name}
                      </h2>
                      <div className="flex items-center gap-1.5">
                        <SectionBadge section={child.section} />
                        <span className="text-[10px] text-muted-foreground">• Cliquez pour voir les détails</span>
                      </div>
                    </div>
                  </div>

                  {/* Daily event box */}
                  <div className="pt-4 border-t border-border/40 mt-auto">
                    <div className="text-[11px] font-bold text-soleil-text-muted flex items-center gap-1.5 mb-2">
                      <Baby className="size-3.5 text-soleil-primary" />
                      Aujourd{"'"}hui, dernière activité :
                    </div>

                    {lastEvent && style ? (
                      <div className={`p-3.5 border ${style.colorBorder} ${style.colorBg} rounded-xl space-y-1.5`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`rounded-full p-1 ${style.colorIcon}`}>
                              {style.icon}
                            </div>
                            <span className={`text-xs font-extrabold uppercase tracking-wide ${style.colorText}`}>
                              {style.label}
                            </span>
                          </div>
                          
                          <span className="text-[9px] text-muted-foreground font-semibold flex items-center gap-0.5">
                            <Clock className="size-2.5" />
                            {new Date(lastEvent.created_at).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {/* Specific details */}
                        {lastEvent.event_type === "repas" && lastEvent.meal_quality && (
                          <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                            {getMealQualityLabel(lastEvent.meal_quality)}
                          </p>
                        )}

                        {lastEvent.event_type === "activite" && lastEvent.activity_label && (
                          <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                            {lastEvent.activity_label}
                          </p>
                        )}

                        {lastEvent.event_type === "medicament" && lastEvent.medication_name && (
                          <p className="text-xs font-bold text-cyan-800 dark:text-cyan-300">
                            Pris : {lastEvent.medication_name}
                          </p>
                        )}

                        {lastEvent.event_type === "incident" && lastEvent.severity && (
                          <p className="text-xs font-bold text-rose-800 dark:text-rose-300">
                            Incident ({lastEvent.severity})
                          </p>
                        )}

                        {lastEvent.event_type === "sieste" && (lastEvent.start_time || lastEvent.end_time) && (
                          <p className="text-xs font-semibold text-indigo-800 dark:text-indigo-300">
                            {lastEvent.start_time && `Couché le : ${new Date(lastEvent.start_time).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`}
                            {lastEvent.end_time && ` • levé le : ${new Date(lastEvent.end_time).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`}
                          </p>
                        )}

                        {lastEvent.note && (
                          <p className="text-xs text-soleil-text-muted italic line-clamp-1">
                            &ldquo;{lastEvent.note}&rdquo;
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 border border-dashed border-border/80 rounded-xl text-center bg-muted/20">
                        <p className="text-xs text-muted-foreground italic font-heading">
                          Pas encore d{"'"}activité enregistrée pour aujourd{"'"}hui.
                        </p>
                      </div>
                    )}
                  </div>

                </SoleilCard>
              </Link>
            );
          })}
        </div>
      ) : (
        /* Empty Family State */
        <SoleilCard className="p-12 text-center border-dashed border-2 border-border/80 bg-card/60 flex flex-col items-center justify-center gap-5">
          <div className="p-4 bg-soleil-background text-soleil-primary rounded-full">
            <Baby className="size-12 hover:scale-110 transition-transform duration-200" />
          </div>
          <div className="space-y-2">
            <h3 className="font-heading font-bold text-xl text-soleil-text">
              Bienvenue sur votre espace famille !
            </h3>
            <p className="text-sm text-soleil-text-muted max-w-sm mx-auto leading-relaxed">
              Il semblerait qu{"'"}aucun enfant ne soit encore rattaché à votre compte. 
              Pour lier votre profil de parent et suivre les activités quotidiennes, veuillez contacter chaleureusement la direction de la crèche.
            </p>
          </div>
        </SoleilCard>
      )}
    </main>
  );
}
