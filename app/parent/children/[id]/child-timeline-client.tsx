"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ChevronLeft,
  Calendar,
  Utensils,
  Moon,
  Paintbrush,
  Pill,
  AlertTriangle,
  Clock,
  User,
  Heart,
  BookOpen,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SoleilButton } from "@/components/layout/soleil-button";
import { SoleilCard } from "@/components/layout/soleil-card";
import { ChildAvatar } from "@/components/staff/child-avatar";
import { SectionBadge } from "@/components/staff/section-badge";
import { createClient } from "@/lib/supabase/client";

type ChildDetail = {
  id: string;
  first_name: string;
  last_name: string;
  section: string;
  photo_url: string | null;
  allergies: string | null;
  medication_authorization: boolean;
};

type EventItem = {
  id: string;
  event_type: string;
  note: string | null;
  meal_quality: string | null;
  start_time: string | null;
  end_time: string | null;
  activity_label: string | null;
  medication_name: string | null;
  severity: string | null;
  created_at: string;
  created_by_name: string;
};

type ChildTimelineClientProps = {
  child: ChildDetail;
  initialEvents: EventItem[];
  initialDate: string; // YYYY-MM-DD
};

// Event configurations for rendering within timeline
const EVENT_CONFIGS: Record<
  string,
  {
    icon: React.ReactNode;
    label: string;
    colorBg: string;
    colorBorder: string;
    colorText: string;
    colorIcon: string;
  }
> = {
  repas: {
    icon: <Utensils className="size-4" />,
    label: "Repas",
    colorBg: "bg-emerald-50 dark:bg-emerald-950/20",
    colorBorder: "border-emerald-200 dark:border-emerald-800/40",
    colorText: "text-emerald-700 dark:text-emerald-400",
    colorIcon: "bg-emerald-500 text-white",
  },
  sieste: {
    icon: <Moon className="size-4" />,
    label: "Sieste",
    colorBg: "bg-indigo-50 dark:bg-indigo-950/20",
    colorBorder: "border-indigo-200 dark:border-indigo-800/40",
    colorText: "text-indigo-700 dark:text-indigo-400",
    colorIcon: "bg-indigo-500 text-white",
  },
  activite: {
    icon: <Paintbrush className="size-4" />,
    label: "Activité",
    colorBg: "bg-amber-50 dark:bg-amber-950/20",
    colorBorder: "border-amber-200 dark:border-amber-800/40",
    colorText: "text-amber-700 dark:text-amber-400",
    colorIcon: "bg-amber-500 text-white",
  },
  medicament: {
    icon: <Pill className="size-4" />,
    label: "Médicament",
    colorBg: "bg-cyan-50 dark:bg-cyan-950/20",
    colorBorder: "border-cyan-200 dark:border-cyan-800/40",
    colorText: "text-cyan-700 dark:text-cyan-400",
    colorIcon: "bg-cyan-500 text-white",
  },
  incident: {
    icon: <AlertTriangle className="size-4" />,
    label: "Incident",
    colorBg: "bg-rose-50 dark:bg-rose-950/20",
    colorBorder: "border-rose-200 dark:border-rose-800/40",
    colorText: "text-rose-700 dark:text-rose-400",
    colorIcon: "bg-rose-500 text-white",
  },
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

export function ChildTimelineClient({
  child,
  initialEvents,
  initialDate,
}: ChildTimelineClientProps) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let active = true;

    // Skip the first fetch since we have initialEvents
    if (selectedDate === initialDate) {
      return;
    }

    async function fetchEventsForDate() {
      setIsLoading(true);
      setIsError(false);
      try {
        const supabase = createClient();
        const startOfDay = `${selectedDate}T00:00:00.000Z`;
        const endOfDay = `${selectedDate}T23:59:59.999Z`;

        const { data: eventsData, error } = await supabase
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
          .gte("created_at", startOfDay)
          .lte("created_at", endOfDay)
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        if (active) {
          interface BaseEventQueryResult {
            id: string;
            event_type: string;
            note: string | null;
            meal_quality: string | null;
            start_time: string | null;
            end_time: string | null;
            activity_label: string | null;
            medication_name: string | null;
            severity: string | null;
            created_at: string;
            profiles: { full_name: string | null } | null;
          }

          const rawEvents = (eventsData as unknown as BaseEventQueryResult[]) || [];
          const mappedEvents = rawEvents.map((evt) => ({
            id: evt.id,
            event_type: evt.event_type,
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
          setEvents(mappedEvents);
          setIsError(false);
        }
      } catch (err) {
        console.error("Error fetching timeline events:", err);
        if (active) {
          setIsError(true);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    fetchEventsForDate();

    return () => {
      active = false;
    };
  }, [selectedDate, child.id, initialDate, initialEvents]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const formattedSelectedDate = format(parseISO(selectedDate), "EEEE d MMMM yyyy", {
    locale: fr,
  });

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex justify-between items-center">
        <SoleilButton asChild variant="outline" size="sm">
          <Link href="/parent" className="flex items-center gap-1">
            <ChevronLeft className="size-4" /> Retour à l{"'"}espace famille
          </Link>
        </SoleilButton>
      </div>

      {/* Child Information Header Card */}
      <Card className="p-6 border border-border shadow-soleil rounded-2xl bg-card">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="flex justify-center">
            <ChildAvatar child={child} className="size-24 md:size-28 shrink-0" />
          </div>

          <div className="flex-1 space-y-4 text-center md:text-left">
            <div>
              <div className="flex flex-col items-center gap-2 md:flex-row md:items-baseline md:gap-3">
                <h1 className="font-heading text-2xl font-bold tracking-tight text-soleil-text">
                  {child.first_name} {child.last_name}
                </h1>
                <SectionBadge section={child.section} />
              </div>
              <p className="text-sm text-soleil-text-muted mt-1">
                Suivi quotidien et événements partagés par la crèche.
              </p>
            </div>

            {/* Medical details/Allergies */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/20 text-left">
                <div className="text-xs font-bold text-rose-800 flex items-center gap-1.5 mb-1">
                  <Heart className="size-3.5 text-rose-500 fill-rose-500" />
                  Allergies
                </div>
                <p className="text-xs text-soleil-text font-semibold">
                  {child.allergies ? child.allergies : "Aucune allergie signalée"}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-cyan-100 bg-cyan-50/20 text-left">
                <div className="text-xs font-bold text-cyan-800 flex items-center gap-1.5 mb-1">
                  <Pill className="size-3.5 text-cyan-500" />
                  Autorisation médicaments
                </div>
                <p className="text-xs text-soleil-text font-semibold">
                  {child.medication_authorization
                    ? "Autorisation accordée ✅"
                    : "Non autorisée ❌"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Date Picker Section */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card border border-border p-4 rounded-xl shadow-soleil">
        <div className="flex items-center gap-2 text-soleil-text font-bold">
          <Calendar className="size-5 text-soleil-primary" />
          <span className="capitalize text-sm sm:text-base">{formattedSelectedDate}</span>
        </div>
        <div className="relative w-full sm:w-auto">
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="w-full sm:w-auto h-10 px-4 text-sm border border-input rounded-xl bg-background outline-none focus:border-ring placeholder:text-muted-foreground shadow-soleil"
          />
        </div>
      </div>

      {/* Timeline Events list */}
      <div className="relative">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-soleil-primary"></div>
          </div>
        ) : isError ? (
          <SoleilCard className="p-8 text-center border-soleil-error/30 bg-rose-50/30 flex flex-col items-center justify-center gap-4">
            <div className="p-3 bg-rose-100 text-rose-600 rounded-full">
              <AlertTriangle className="size-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading font-bold text-lg text-soleil-text">
                Oups ! Impossible de charger les événements
              </h3>
              <p className="text-sm text-soleil-text-muted">
                Un problème technique est survenu lors de la récupération de la timeline. 
                Veuillez rafraîchir ou choisir une autre date.
              </p>
            </div>
          </SoleilCard>
        ) : events.length > 0 ? (
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
            {events.map((evt) => {
              const conf = EVENT_CONFIGS[evt.event_type];
              if (!conf) return null;

              return (
                <div key={evt.id} className="relative group">
                  {/* Timeline point */}
                  <div
                    className={`absolute -left-9 sm:-left-11 top-1.5 rounded-full p-2 border-2 border-background shadow-sm transition-transform duration-200 group-hover:scale-110 ${conf.colorIcon}`}
                  >
                    {conf.icon}
                  </div>

                  {/* Event card details */}
                  <Card
                    className={`p-5 border border-border shadow-soleil rounded-xl transition-all hover:shadow-soleil-md ${conf.colorBg} ${conf.colorBorder}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-xs font-black uppercase tracking-wider ${conf.colorText}`}>
                            {conf.label}
                          </span>

                          {/* Repas Meal Details */}
                          {evt.event_type === "repas" && evt.meal_quality && (
                            <Badge
                              variant="outline"
                              className="bg-background/80 font-medium text-xs rounded-full border-emerald-200 text-emerald-800"
                            >
                              {getMealQualityLabel(evt.meal_quality)}
                            </Badge>
                          )}

                          {/* Activite Label details */}
                          {evt.event_type === "activite" && evt.activity_label && (
                            <Badge
                              variant="outline"
                              className="bg-background/80 font-bold text-xs rounded-full border-amber-200 text-amber-800"
                            >
                              {evt.activity_label}
                            </Badge>
                          )}

                          {/* Medicament label details */}
                          {evt.event_type === "medicament" && evt.medication_name && (
                            <Badge
                              variant="outline"
                              className="bg-background/80 font-bold text-xs rounded-full border-cyan-200 text-cyan-800"
                            >
                              {evt.medication_name}
                            </Badge>
                          )}

                          {/* Incident badge details */}
                          {evt.event_type === "incident" && evt.severity && (
                            <Badge
                              variant="outline"
                              className="bg-background/80 font-bold text-xs rounded-full border-rose-200 text-rose-800"
                            >
                              Incident {evt.severity}
                            </Badge>
                          )}
                        </div>

                        {/* Event Note */}
                        {evt.note && (
                          <div className="text-sm text-soleil-text leading-relaxed font-normal pt-1 whitespace-pre-wrap">
                            {evt.note}
                          </div>
                        )}

                        {/* Nap Times */}
                        {evt.event_type === "sieste" && (evt.start_time || evt.end_time) && (
                          <div className="flex flex-wrap items-center gap-2 text-xs text-indigo-800 font-bold bg-indigo-100/50 w-fit px-2.5 py-1 rounded-lg mt-1 border border-indigo-200/40">
                            <Clock className="size-3.5 text-indigo-600" />
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

                      {/* Created By Staff details & creation time */}
                      <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 text-[10px] text-muted-foreground border-t border-border/20 pt-2 sm:border-0 sm:pt-0">
                        <span className="flex items-center gap-1 font-bold bg-background/60 px-2 py-0.5 rounded-full border border-border/40">
                          <Clock className="size-3.5 text-soleil-primary" />
                          {new Date(evt.created_at).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        
                        <span className="flex items-center gap-1 font-bold bg-muted/50 px-2 py-0.5 rounded-full border border-border/20">
                          <User className="size-3" />
                          {evt.created_by_name}
                        </span>
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty Timeline state */
          <Card className="p-12 text-center border-dashed border-2 border-border/80 rounded-2xl bg-card/60 shadow-none flex flex-col items-center justify-center gap-4">
            <div className="p-4 bg-soleil-background text-soleil-primary rounded-full">
              <Calendar className="size-10 text-soleil-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading font-bold text-lg text-soleil-text">
                La journée de {child.first_name} n{"'"}a pas encore commencé
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Revenez un peu plus tard pour voir les événements partagés par la crèche aujourd{"'"}hui ou sélectionnez un autre jour.
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Livre du Soir component */}
      <LivreDuSoir childName={child.first_name} />
    </div>
  );
}

interface Book {
  title: string;
  author: string;
  coverUrl?: string;
  publishYear?: number;
}

const LOCAL_FALLBACK_BOOKS: Book[] = [
  {
    title: "La chenille qui fait des trous",
    author: "Eric Carle",
    publishYear: 1969,
  },
  {
    title: "Devine combien je t'aime",
    author: "Sam McBratney",
    publishYear: 1994,
  },
  {
    title: "Chien Bleu",
    author: "Nadja",
    publishYear: 1989,
  },
  {
    title: "Max et les Maximonstres",
    author: "Maurice Sendak",
    publishYear: 1963,
  },
  {
    title: "Le Petit Prince",
    author: "Antoine de Saint-Exupéry",
    publishYear: 1943,
  }
];

interface LivreDuSoirProps {
  childName: string;
}

function LivreDuSoir({ childName }: LivreDuSoirProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isApiFallback, setIsApiFallback] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 5000);

    async function fetchBooks() {
      try {
        const response = await fetch(
          "https://openlibrary.org/search.json?q=album+jeunesse&limit=5",
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error("HTTP error " + response.status);
        }

        const data = await response.json();
        const docs = data.docs || [];

        if (docs.length === 0) {
          throw new Error("No results found");
        }

        const mappedBooks: Book[] = docs.map((doc: any) => {
          const author = doc.author_name && doc.author_name.length > 0
            ? doc.author_name[0]
            : "Auteur inconnu";

          return {
            title: doc.title,
            author: author,
            coverUrl: doc.cover_i
              ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
              : undefined,
            publishYear: doc.first_publish_year,
          };
        });

        setBooks(mappedBooks);
        setIsApiFallback(false);
      } catch (err: any) {
        console.warn("Open Library fetch error or timeout, loading local recommendations:", err);
        setBooks(LOCAL_FALLBACK_BOOKS);
        setIsApiFallback(true);
      } finally {
        setLoading(false);
      }
    }

    fetchBooks();

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  useEffect(() => {
    setImgError(false);
  }, [currentIndex]);

  if (loading) {
    return (
      <Card className="p-6 border border-[#EFDFC5] bg-gradient-to-br from-[#FFFBF0] to-[#FFFDF5] rounded-2xl shadow-soleil flex flex-col md:flex-row items-center gap-6 animate-pulse mt-8">
        <div className="w-28 h-40 bg-muted/60 rounded-lg shrink-0" />
        <div className="flex-1 space-y-3 w-full">
          <div className="h-4 bg-muted/60 rounded w-1/4" />
          <div className="h-6 bg-muted/60 rounded w-3/4" />
          <div className="h-4 bg-muted/60 rounded w-1/2" />
          <div className="h-10 bg-muted/60 rounded w-1/3 pt-2" />
        </div>
      </Card>
    );
  }

  if (books.length === 0) {
    return null;
  }

  const currentBook = books[currentIndex];
  const showCover = currentBook.coverUrl && !imgError;

  const handleNextBook = () => {
    setCurrentIndex((prev) => (prev + 1) % books.length);
  };

  return (
    <Card className="p-6 border border-[#EFDFC5] bg-gradient-to-br from-[#FFFBF0] to-[#FFFDF5] rounded-2xl shadow-soleil mt-8 overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-soleil-primary via-soleil-accent to-soleil-secondary" />

      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 pt-2">
        <div className="w-28 sm:w-32 h-40 sm:h-44 shrink-0 transition-transform duration-300 hover:scale-102 flex-none shadow-md rounded-lg overflow-hidden bg-background relative border border-border">
          {showCover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentBook.coverUrl}
              alt={currentBook.title}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full p-3 bg-gradient-to-b from-[#FF8A65] to-[#FFB085] flex flex-col justify-between text-white font-heading">
              <div className="text-[10px] font-black tracking-widest uppercase opacity-75 text-center">
                Les Petits Pas 📖
              </div>
              <div className="my-auto text-center">
                <BookOpen className="size-8 mx-auto opacity-90 mb-1" />
                <div className="text-xs font-extrabold line-clamp-3 leading-tight px-1" title={currentBook.title}>
                  {currentBook.title}
                </div>
              </div>
              <div className="text-[9px] font-bold line-clamp-1 italic text-center opacity-90">
                {currentBook.author}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 text-center md:text-left flex flex-col justify-between h-full min-w-0">
          <div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
              <Badge variant="outline" className="bg-[#FF8A65]/10 border-[#FF8A65]/20 text-[#FF8A65] font-black text-[10px] uppercase py-0.5 tracking-wider rounded-full flex items-center gap-1">
                <Sparkles className="size-3 fill-[#FF8A65]" /> Rituel de l{"'"}histoire du soir
              </Badge>
              {isApiFallback && (
                <Badge variant="secondary" className="bg-muted text-muted-foreground font-semibold text-[9px] py-0.5 rounded-full">
                  Classique suggéré
                </Badge>
              )}
            </div>

            <h3 className="font-heading text-xl font-bold text-soleil-text leading-tight line-clamp-2" title={currentBook.title}>
              {currentBook.title}
            </h3>
            
            <p className="text-sm font-bold text-[#795548] mt-1">
              par <span className="text-[#FF8A65]">{currentBook.author}</span>
              {currentBook.publishYear && (
                <span className="text-muted-foreground font-normal text-xs"> ({currentBook.publishYear})</span>
              )}
            </p>

            <p className="text-xs sm:text-sm text-soleil-text-muted mt-3 leading-relaxed">
              Pour conclure la journée de <strong className="text-soleil-text font-bold">{childName}</strong> en toute douceur, avant d{"'"}éteindre la lumière, partagez un calme moment de lecture ensemble. Ce magnifique album est une excellente suggestion pour s{"'"}évader au pays des rêves ! ✨
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-dashed border-[#EFDFC5] flex flex-wrap gap-2 items-center justify-center md:justify-between w-full">
            <span className="text-[10px] font-semibold text-muted-foreground italic">
              📚 Recommandation • Open Library API
            </span>
            
            {books.length > 1 && (
              <SoleilButton
                variant="outline"
                size="sm"
                onClick={handleNextBook}
                className="h-8 text-xs font-bold rounded-xl border-[#EFDFC5] text-[#FF8A65] hover:bg-[#FF8A65]/10 gap-1"
              >
                <RefreshCw className="size-3.5 animate-spin-hover" /> Voir une autre idée
              </SoleilButton>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
