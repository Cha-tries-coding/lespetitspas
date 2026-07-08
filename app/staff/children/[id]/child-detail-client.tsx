"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  AlertTriangle,
  FileText,
  User,
  Clock,
  Check,
  Utensils,
  Moon,
  Paintbrush,
  Pill,
  MessageSquare,
  Sparkles,
} from "lucide-react";

import { ChildAvatar } from "@/components/staff/child-avatar";
import { SectionBadge } from "@/components/staff/section-badge";
import { SoleilButton } from "@/components/layout/soleil-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import {
  createEventAction,
  markMessageAsReadAction,
} from "@/app/actions/children";
import type { EventType } from "@/lib/supabase/database.types";

// Define local component types
type ChildData = {
  id: string;
  first_name: string;
  last_name: string;
  section: string;
  photo_url: string | null;
  allergies: string | null;
  medication_authorization: boolean;
};

type ParentProfile = {
  id: string;
  full_name: string;
  email: string;
};

type MessageData = {
  id: string;
  child_id: string;
  content: string;
  status: string;
  created_at: string;
  sender_name?: string;
};

type EventData = {
  id: string;
  child_id: string;
  event_type: EventType;
  note: string | null;
  meal_quality: string | null;
  start_time: string | null;
  end_time: string | null;
  activity_label: string | null;
  medication_name: string | null;
  severity: string | null;
  created_at: string;
  created_by_name?: string;
};

type ChildDetailClientProps = {
  child: ChildData;
  initialParents: ParentProfile[];
  initialMessages: MessageData[];
  initialEvents: EventData[];
};

export function ChildDetailClient({
  child,
  initialParents,
  initialMessages,
  initialEvents,
}: ChildDetailClientProps) {
  const supabase = createClient();

  // Component States
  const [messages, setMessages] = useState<MessageData[]>(initialMessages);
  const [events, setEvents] = useState<EventData[]>(initialEvents);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Default to today in YYYY-MM-DD
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  const router = useRouter();

  // Form States for Event Modal
  const [eventType, setEventType] = useState<EventType>("repas");
  const [note, setNote] = useState("");
  const [mealQuality, setMealQuality] = useState("bien");
  const [mealMoment, setMealMoment] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [activityLabel, setActivityLabel] = useState("");
  const [medicationName, setMedicationName] = useState("");
  const [medicationDose, setMedicationDose] = useState("");
  const [medicationTime, setMedicationTime] = useState("");
  const [medicationConfirmed, setMedicationConfirmed] = useState(false);
  const [severity, setSeverity] = useState("mineur");
  const [incidentType, setIncidentType] = useState("");


  // Fetch events when date changes
  useEffect(() => {
    let isMounted = true;
    
    async function fetchEventsForDate() {
      setIsLoadingEvents(true);
      try {
        // Calculate the boundaries of the selected date in the local timezone
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        const { data, error } = await supabase
          .from("events")
          .select(`
            id,
            child_id,
            event_type,
            note,
            meal_quality,
            start_time,
            end_time,
            activity_label,
            medication_name,
            severity,
            created_at,
            profiles:created_by(full_name)
          `)
          .eq("child_id", child.id)
          .gte("created_at", startOfDay.toISOString())
          .lte("created_at", endOfDay.toISOString())
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        if (isMounted && data) {
          const formattedEvents: EventData[] = data.map((evt: any) => ({
            id: evt.id,
            child_id: evt.child_id,
            event_type: evt.event_type as EventType,
            note: evt.note,
            meal_quality: evt.meal_quality,
            start_time: evt.start_time,
            end_time: evt.end_time,
            activity_label: evt.activity_label,
            medication_name: evt.medication_name,
            severity: evt.severity,
            created_at: evt.created_at,
            created_by_name: evt.profiles?.full_name || "Équipe",
          }));
          setEvents(formattedEvents);
        }
      } catch (err) {
        console.error("Error fetching events:", err);
      } finally {
        if (isMounted) setIsLoadingEvents(false);
      }
    }

    fetchEventsForDate();

    return () => {
      isMounted = false;
    };
  }, [selectedDate, child.id]);

  // Actions
  const handleMarkAsRead = async (messageId: string) => {
    try {
      // Optimistic update
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      await markMessageAsReadAction(messageId);
    } catch (err) {
      console.error(err);
      // Revert if error
      alert("Une erreur est survenue lors du marquage du message.");
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side block for medication authorization
    if (eventType === "medicament") {
      if (!child.medication_authorization) {
        alert("Enregistrement impossible : L'administration de médicaments n'est pas autorisée par les parents.");
        return;
      }
      if (!medicationConfirmed) {
        alert("Veuillez confirmer l'autorisation parentale.");
        return;
      }
    }

    setIsSubmittingEvent(true);
    try {
      // Format times if present
      let startIso: string | undefined;
      let endIso: string | undefined;

      if (startTime) {
        const d = new Date(selectedDate);
        const [h, m] = startTime.split(":");
        d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
        startIso = d.toISOString();
      }
      if (endTime) {
        const d = new Date(selectedDate);
        const [h, m] = endTime.split(":");
        d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
        endIso = d.toISOString();
      }

      // Format details into note
      let finalNote = note;
      if (eventType === "repas") {
        finalNote = mealMoment ? `[${mealMoment}] ${note}`.trim() : note;
      } else if (eventType === "medicament") {
        const extraDetails = [
          medicationDose ? `Dose: ${medicationDose}` : null,
          medicationTime ? `Heure: ${medicationTime}` : null
        ].filter(Boolean).join(", ");
        finalNote = extraDetails ? `${extraDetails}${note ? ` - ${note}` : ""}` : note;
      } else if (eventType === "incident") {
        finalNote = incidentType ? `[Type: ${incidentType}] ${note}`.trim() : note;
      }

      const result = await createEventAction({
        child_id: child.id,
        event_type: eventType,
        note: finalNote,
        meal_quality: eventType === "repas" ? mealQuality : undefined,
        start_time: eventType === "sieste" ? startIso : undefined,
        end_time: eventType === "sieste" ? endIso : undefined,
        activity_label: eventType === "activite" ? activityLabel : undefined,
        medication_name: eventType === "medicament" ? medicationName : undefined,
        severity: eventType === "incident" ? severity : undefined,
      });

      if (!result.success) {
        if (result.status === 403) {
          alert("403: Enregistrement refusé par le serveur car l'autorisation parentale est manquante.");
          return;
        }
        throw new Error(result.error || "Erreur de création de l'événement.");
      }

      // Clear form
      setNote("");
      setMealQuality("bien");
      setMealMoment("");
      setStartTime("");
      setEndTime("");
      setActivityLabel("");
      setMedicationName("");
      setMedicationDose("");
      setMedicationTime("");
      setMedicationConfirmed(false);
      setSeverity("mineur");
      setIncidentType("");
      setIsModalOpen(false);

      // Redirect to the child's profile page and refresh the Router Cache
      router.push(`/staff/children/${child.id}`);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Impossible de créer l'événement.");
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  const changeDateByDays = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const setDateToToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const getFriendlyDateLabel = () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    if (selectedDate === todayStr) {
      return "Aujourd'hui";
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
    if (selectedDate === yesterdayStr) {
      return "Hier";
    }

    const d = new Date(selectedDate);
    return d.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  // Event layout styling & details helper
  const getEventConfig = (type: EventType) => {
    switch (type) {
      case "repas":
        return {
          icon: <Utensils className="size-4" />,
          colorBg: "bg-emerald-50 dark:bg-emerald-950/20",
          colorBorder: "border-emerald-200 dark:border-emerald-800/40",
          colorText: "text-emerald-700 dark:text-emerald-400",
          colorIcon: "bg-emerald-500 text-white",
          label: "Repas",
        };
      case "sieste":
        return {
          icon: <Moon className="size-4" />,
          colorBg: "bg-indigo-50 dark:bg-indigo-950/20",
          colorBorder: "border-indigo-200 dark:border-indigo-800/40",
          colorText: "text-indigo-700 dark:text-indigo-400",
          colorIcon: "bg-indigo-500 text-white",
          label: "Sieste",
        };
      case "activite":
        return {
          icon: <Paintbrush className="size-4" />,
          colorBg: "bg-amber-50 dark:bg-amber-950/20",
          colorBorder: "border-amber-200 dark:border-amber-800/40",
          colorText: "text-amber-700 dark:text-amber-400",
          colorIcon: "bg-amber-500 text-white",
          label: "Activité",
        };
      case "medicament":
        return {
          icon: <Pill className="size-4" />,
          colorBg: "bg-cyan-50 dark:bg-cyan-950/20",
          colorBorder: "border-cyan-200 dark:border-cyan-800/40",
          colorText: "text-cyan-700 dark:text-cyan-400",
          colorIcon: "bg-cyan-500 text-white",
          label: "Médicament",
        };
      case "incident":
        return {
          icon: <AlertTriangle className="size-4" />,
          colorBg: "bg-rose-50 dark:bg-rose-950/20",
          colorBorder: "border-rose-200 dark:border-rose-800/40",
          colorText: "text-rose-700 dark:text-rose-400",
          colorIcon: "bg-rose-500 text-white",
          label: "Incident",
        };
    }
  };

  const getMealQualityLabel = (quality: string | null) => {
    switch (quality) {
      case "bien":
        return "Bien mangé 🍽️";
      case "moyen":
        return "Moyen 🥪";
      case "peu":
        return "Peu mangé 🥛";
      default:
        return quality;
    }
  };

  const getSeverityBadgeColor = (sev: string | null) => {
    switch (sev) {
      case "mineur":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "moyen":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "majeur":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex justify-between items-center">
        <SoleilButton asChild variant="outline" size="sm">
          <Link href="/staff" className="flex items-center gap-1">
            <ChevronLeft className="size-4" /> Retour à la liste
          </Link>
        </SoleilButton>
      </div>

      {/* Child Information Header Card */}
      <Card className="p-6 border border-border shadow-soleil rounded-2xl bg-card">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="flex justify-center">
            <ChildAvatar child={child} className="size-28 md:size-32" />
          </div>

          <div className="flex-1 space-y-4 text-center md:text-left">
            <div>
              <div className="flex flex-col items-center gap-2 md:flex-row md:items-baseline md:gap-3">
                <h1 className="font-heading text-3xl font-bold tracking-tight text-soleil-text">
                  {child.first_name} {child.last_name}
                </h1>
                <SectionBadge section={child.section} />
              </div>

              {/* Parents Section */}
              <div className="mt-2 text-sm text-muted-foreground flex flex-wrap justify-center md:justify-start gap-1 items-center">
                <span className="font-medium text-soleil-text-muted">Parents rattachés :</span>
                {initialParents.length > 0 ? (
                  initialParents.map((parent, index) => (
                    <span key={parent.id} className="inline-flex items-center gap-1 font-semibold text-soleil-text bg-muted/60 px-2 py-0.5 rounded-full text-xs">
                      <User className="size-3" />
                      {parent.full_name}
                      {index < initialParents.length - 1 && <span className="text-muted-foreground font-normal">,</span>}
                    </span>
                  ))
                ) : (
                  <span className="italic">Aucun parent rattaché</span>
                )}
              </div>
            </div>

            {/* Health and Authorizations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Medication Authorization */}
              <div className="flex items-center justify-center md:justify-start gap-2.5 p-3 rounded-xl border border-border bg-background/50">
                <div className={`p-1.5 rounded-lg ${child.medication_authorization ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                  {child.medication_authorization ? <Check className="size-4" /> : <X className="size-4" />}
                </div>
                <div className="text-left">
                  <p className="text-xs text-muted-foreground font-medium">Médicaments</p>
                  <p className="text-sm font-semibold text-soleil-text">
                    {child.medication_authorization ? "Autorisé" : "Non autorisé"}
                  </p>
                </div>
              </div>

              {/* Allergies status */}
              <div className={`flex items-center justify-center md:justify-start gap-2.5 p-3 rounded-xl border ${child.allergies ? "bg-rose-50 border-rose-200" : "bg-emerald-50/50 border-emerald-100"}`}>
                <div className={`p-1.5 rounded-lg ${child.allergies ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                  <AlertTriangle className="size-4" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">Allergies</p>
                  <p className="text-sm font-semibold text-soleil-text truncate" title={child.allergies || "Aucune allergie connue"}>
                    {child.allergies || "Aucune"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Unread Messages Block */}
      {messages.length > 0 && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-heading text-lg font-bold text-soleil-text flex items-center gap-2">
              <MessageSquare className="size-5 text-soleil-primary" /> Messages non lus
            </h2>
            <span className="relative flex size-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-soleil-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2.5 bg-soleil-primary"></span>
            </span>
            <Badge variant="default" className="rounded-full bg-soleil-primary text-white text-xs">
              {messages.length}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {messages.map((msg) => (
              <Card key={msg.id} className="p-4 border-l-4 border-l-soleil-primary border-border bg-card shadow-soleil flex flex-col justify-between gap-3 rounded-xl hover:shadow-soleil-md transition-shadow">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-1.5">
                    <span className="font-heading text-sm font-bold text-soleil-text">
                      {msg.sender_name || "Parent"}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="size-3" />
                      {new Date(msg.created_at).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-soleil-text-muted leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
                <div className="flex justify-end pt-1">
                  <SoleilButton
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs rounded-lg hover:bg-soleil-primary/10 hover:text-soleil-primary hover:border-soleil-primary/30"
                    onClick={() => handleMarkAsRead(msg.id)}
                  >
                    <Check className="size-3.5 mr-1" /> Marquer comme lu
                  </SoleilButton>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Controls & Timeline Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-border">
        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-card p-1 rounded-xl border border-border shadow-soleil w-fit">
          <SoleilButton
            variant="ghost"
            size="icon-sm"
            onClick={() => changeDateByDays(-1)}
            title="Jour précédent"
            className="rounded-lg"
          >
            <ChevronLeft className="size-4" />
          </SoleilButton>

          <div className="relative px-3 flex items-center gap-2 cursor-pointer font-heading font-bold text-sm text-soleil-text min-w-36 justify-center">
            <Calendar className="size-4 text-soleil-primary" />
            <span>{getFriendlyDateLabel()}</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>

          <SoleilButton
            variant="ghost"
            size="icon-sm"
            onClick={() => changeDateByDays(1)}
            title="Jour suivant"
            className="rounded-lg"
          >
            <ChevronRight className="size-4" />
          </SoleilButton>

          {/* Quick return button */}
          <SoleilButton
            variant="ghost"
            size="sm"
            onClick={setDateToToday}
            className="text-xs px-2 h-7 font-semibold text-soleil-primary hover:bg-soleil-primary/10 rounded-lg"
          >
            Aujourd'hui
          </SoleilButton>
        </div>

        {/* Add Event Button */}
        <SoleilButton
          onClick={() => setIsModalOpen(true)}
          className="bg-soleil-primary hover:bg-soleil-primary/90 text-white rounded-xl flex items-center gap-1.5 shadow-soleil w-full sm:w-auto py-5 sm:py-2 text-sm justify-center font-bold"
        >
          <Plus className="size-5" /> Ajouter un événement
        </SoleilButton>
      </div>

      {/* Timeline Section */}
      <div className="relative">
        {isLoadingEvents ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-soleil-primary"></div>
          </div>
        ) : events.length > 0 ? (
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
            {events.map((evt) => {
              const config = getEventConfig(evt.event_type);
              return (
                <div key={evt.id} className="relative group">
                  {/* Timeline point */}
                  <div className={`absolute -left-9 sm:-left-11 top-1.5 rounded-full p-1.5 border-2 border-background shadow-sm transition-transform duration-200 group-hover:scale-110 ${config.colorIcon}`}>
                    {config.icon}
                  </div>

                  {/* Event details card */}
                  <Card className={`p-4 border border-border shadow-soleil rounded-xl transition-all hover:shadow-soleil-md ${config.colorBg} ${config.colorBorder}`}>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-xs font-bold uppercase tracking-wider ${config.colorText}`}>
                            {config.label}
                          </span>
                          
                          {/* Meal Info */}
                          {evt.event_type === "repas" && evt.meal_quality && (
                            <Badge variant="outline" className="bg-background/80 font-medium text-xs rounded-full border-emerald-200 text-emerald-800">
                              {getMealQualityLabel(evt.meal_quality)}
                            </Badge>
                          )}

                          {/* Activity Info */}
                          {evt.event_type === "activite" && evt.activity_label && (
                            <Badge variant="outline" className="bg-background/80 font-semibold text-xs rounded-full border-amber-200 text-amber-800">
                              {evt.activity_label}
                            </Badge>
                          )}

                          {/* Medication Info */}
                          {evt.event_type === "medicament" && evt.medication_name && (
                            <Badge variant="outline" className="bg-background/80 font-semibold text-xs rounded-full border-cyan-200 text-cyan-800">
                              {evt.medication_name}
                            </Badge>
                          )}

                          {/* Incident Info */}
                          {evt.event_type === "incident" && evt.severity && (
                            <Badge variant="outline" className={`font-semibold text-xs rounded-full border ${getSeverityBadgeColor(evt.severity)}`}>
                              Incident {evt.severity}
                            </Badge>
                          )}
                        </div>

                        {/* Note/Details */}
                        {evt.note && (
                          <p className="text-sm text-soleil-text leading-relaxed font-normal pt-1">
                            {evt.note}
                          </p>
                        )}

                        {/* Nap Times */}
                        {evt.event_type === "sieste" && (evt.start_time || evt.end_time) && (
                          <div className="flex items-center gap-2 text-xs text-indigo-700 dark:text-indigo-400 font-semibold bg-indigo-100/50 dark:bg-indigo-950/40 w-fit px-2 py-0.5 rounded-md mt-1">
                            <Clock className="size-3" />
                            {evt.start_time && (
                              <span>
                                Couché :{" "}
                                {new Date(evt.start_time).toLocaleTimeString("fr-FR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            )}
                            {evt.end_time && (
                              <span>
                                &nbsp;• Levé :{" "}
                                {new Date(evt.end_time).toLocaleTimeString("fr-FR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Logged info */}
                      <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-1 text-[10px] text-muted-foreground border-t border-border/20 pt-2 sm:border-0 sm:pt-0">
                        <span className="flex items-center gap-1 font-medium bg-background/50 px-1.5 py-0.5 rounded">
                          <Clock className="size-3 text-soleil-primary" />
                          {new Date(evt.created_at).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {evt.created_by_name && (
                          <span className="italic">Par {evt.created_by_name}</span>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <Card className="p-12 text-center border-dashed border-2 border-border/80 rounded-2xl bg-card/50 shadow-none flex flex-col items-center justify-center gap-4">
            <div className="p-4 bg-muted rounded-full text-muted-foreground/60">
              <Sparkles className="size-10 text-soleil-primary/75" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h3 className="font-heading font-bold text-lg text-soleil-text">
                Aucun événement enregistré
              </h3>
              <p className="text-sm text-muted-foreground">
                Il n'y a aucun événement de consigné pour cette journée ({getFriendlyDateLabel()}).
              </p>
            </div>
            <SoleilButton
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="mt-2 text-soleil-primary border-soleil-primary/20 hover:bg-soleil-primary/5 rounded-xl font-bold"
            >
              <Plus className="size-4 mr-1.5" /> Commencer la journée
            </SoleilButton>
          </Card>
        )}
      </div>

      {/* Creation Event Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-soleil-md overflow-hidden relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-border bg-background/50 flex justify-between items-center">
              <div>
                <h3 className="font-heading text-lg font-bold text-soleil-text">
                  Ajouter un événement
                </h3>
                <p className="text-xs text-muted-foreground">
                  Pour {child.first_name} {child.last_name}
                </p>
              </div>
              <SoleilButton
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg"
              >
                <X className="size-4" />
              </SoleilButton>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateEvent} className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Event Type selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Type d'événement
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(["repas", "sieste", "activite", "medicament", "incident"] as EventType[]).map((type) => {
                    const config = getEventConfig(type);
                    const isSelected = eventType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setEventType(type)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-[10px] font-bold transition-all ${
                          isSelected
                            ? `${config.colorBg} ${config.colorBorder} ${config.colorText} border-2 scale-105 shadow-sm`
                            : "border-border hover:bg-muted text-muted-foreground hover:text-soleil-text"
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg mb-1 ${isSelected ? config.colorIcon : "bg-muted text-muted-foreground"}`}>
                          {config.icon}
                        </div>
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Conditional Fields based on Event Type */}
              {eventType === "repas" && (
                <div className="space-y-3 p-3 bg-muted/40 rounded-xl border border-border">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                      Appétit / Qualité du repas
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { val: "bien", label: "Bien mangé 🍽️" },
                        { val: "moyen", label: "Moyen 🥪" },
                        { val: "peu", label: "Peu mangé 🥛" },
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => setMealQuality(opt.val)}
                          className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                            mealQuality === opt.val
                              ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                              : "bg-background border-border text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Moment du repas (optionnel)
                    </label>
                    <input
                      type="text"
                      placeholder="ex: Goûter, Déjeuner, Repas du matin..."
                      value={mealMoment}
                      onChange={(e) => setMealMoment(e.target.value)}
                      className="w-full text-sm h-9 border border-input rounded-lg px-2.5 outline-none bg-background focus:border-ring"
                    />
                  </div>
                </div>
              )}

              {eventType === "sieste" && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-xl border border-border">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Heure de couché
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full text-sm h-9 border border-input rounded-lg px-2.5 outline-none bg-background focus:border-ring"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Heure de levé (optionnel)
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full text-sm h-9 border border-input rounded-lg px-2.5 outline-none bg-background focus:border-ring"
                    />
                  </div>
                </div>
              )}

              {eventType === "activite" && (
                <div className="space-y-1.5 p-3 bg-muted/40 rounded-xl border border-border">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Nom de l'activité
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Peinture à doigts, Parc, Lecture..."
                    value={activityLabel}
                    onChange={(e) => setActivityLabel(e.target.value)}
                    className="w-full text-sm h-9 border border-input rounded-lg px-2.5 outline-none bg-background focus:border-ring"
                  />
                </div>
              )}

              {eventType === "medicament" && (
                <div className="space-y-3 p-3 bg-muted/40 rounded-xl border border-border">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Nom du médicament
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ex: Doliprane 150mg..."
                      value={medicationName}
                      onChange={(e) => setMedicationName(e.target.value)}
                      className="w-full text-sm h-9 border border-input rounded-lg px-2.5 outline-none bg-background focus:border-ring"
                      disabled={!child.medication_authorization}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Dose (optionnel)
                      </label>
                      <input
                        type="text"
                        placeholder="ex: 1 pipette, 5ml..."
                        value={medicationDose}
                        onChange={(e) => setMedicationDose(e.target.value)}
                        className="w-full text-sm h-9 border border-input rounded-lg px-2.5 outline-none bg-background focus:border-ring"
                        disabled={!child.medication_authorization}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Heure d'administration (optionnel)
                      </label>
                      <input
                        type="time"
                        value={medicationTime}
                        onChange={(e) => setMedicationTime(e.target.value)}
                        className="w-full text-sm h-9 border border-input rounded-lg px-2.5 outline-none bg-background focus:border-ring"
                        disabled={!child.medication_authorization}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 p-2.5 bg-background rounded-lg border border-border">
                    <input
                      type="checkbox"
                      id="medicationConfirmed"
                      checked={medicationConfirmed}
                      onChange={(e) => setMedicationConfirmed(e.target.checked)}
                      className="size-4 rounded border-gray-300 text-soleil-primary focus:ring-soleil-primary cursor-pointer"
                      disabled={!child.medication_authorization}
                    />
                    <label htmlFor="medicationConfirmed" className="text-xs font-bold text-soleil-text cursor-pointer select-none">
                      Autorisation parentale confirmée
                    </label>
                  </div>
                  {!child.medication_authorization && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-[11px] rounded-lg flex items-start gap-1.5 font-medium leading-normal">
                      <AlertTriangle className="size-4 shrink-0 text-rose-600 mt-0.5" />
                      <div>
                        Attention : L'administration de médicaments n'est pas autorisée pour cet enfant.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {eventType === "incident" && (
                <div className="space-y-3 p-3 bg-muted/40 rounded-xl border border-border">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                      Gravité
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { val: "mineur", label: "Mineur 🩹" },
                        { val: "moyen", label: "Moyen ⚠️" },
                        { val: "majeur", label: "Majeur 🚨" },
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => setSeverity(opt.val)}
                          className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                            severity === opt.val
                              ? "bg-rose-100 border-rose-300 text-rose-800"
                              : "bg-background border-border text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Type d'incident (optionnel)
                    </label>
                    <input
                      type="text"
                      placeholder="ex: Chute, Dispute, Morsure..."
                      value={incidentType}
                      onChange={(e) => setIncidentType(e.target.value)}
                      className="w-full text-sm h-9 border border-input rounded-lg px-2.5 outline-none bg-background focus:border-ring"
                    />
                  </div>
                </div>
              )}

              {/* Note / Comment field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Commentaire / Note
                </label>
                <textarea
                  rows={3}
                  placeholder="Ajouter des précisions..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full text-sm border border-input rounded-lg px-2.5 py-1.5 outline-none bg-background focus:border-ring resize-none"
                />
              </div>

              {/* Error/Warning notices for medication */}
              {eventType === "medicament" && (
                <div className="mt-1">
                  {!child.medication_authorization ? (
                    <p className="text-xs font-bold text-rose-600 text-center leading-normal">
                      ⚠️ Enregistrement impossible : L'administration de médicaments n'est pas autorisée par les parents.
                    </p>
                  ) : !medicationConfirmed ? (
                    <p className="text-xs font-semibold text-amber-600 text-center leading-normal">
                      Veuillez cocher la case d'autorisation parentale confirmée.
                    </p>
                  ) : null}
                </div>
              )}

              {/* Actions Footer inside modal */}
              <div className="flex gap-3 pt-3 border-t border-border">
                <SoleilButton
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-xl font-bold py-2.5"
                >
                  Annuler
                </SoleilButton>
                <SoleilButton
                  type="submit"
                  disabled={
                    isSubmittingEvent ||
                    (eventType === "medicament" &&
                      (!child.medication_authorization || !medicationConfirmed))
                  }
                  className="flex-1 bg-soleil-primary hover:bg-soleil-primary/95 text-white rounded-xl font-bold py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSubmittingEvent ? "Ajout..." : "Enregistrer"}
                </SoleilButton>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
