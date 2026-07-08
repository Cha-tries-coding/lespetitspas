"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Baby,
  Clock,
  Send,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { SoleilButton } from "@/components/layout/soleil-button";
import { createMessageAction } from "@/app/actions/messages";
import type { MessageStatus } from "@/lib/supabase/database.types";

type ChildOption = {
  id: string;
  first_name: string;
  last_name: string;
};

type SentMessageItem = {
  id: string;
  child_id: string;
  content: string;
  status: MessageStatus;
  created_at: string;
  child_name: string;
};

type NewMessageFormClientProps = {
  childrenList: ChildOption[];
  initialMessages: SentMessageItem[];
};

export function NewMessageFormClient({
  childrenList,
  initialMessages,
}: NewMessageFormClientProps) {
  const [messages, setMessages] = useState<SentMessageItem[]>(initialMessages);
  const [selectedChildId, setSelectedChildId] = useState<string>(
    childrenList.length > 0 ? childrenList[0].id : ""
  );
  const [content, setContent] = useState("");
  const [isSubmitting, setIsLoading] = useState(false);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  const characterCount = content.length;
  const isTooLong = characterCount > 500;

  const handleMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId) {
      setErrorInfo("Veuillez sélectionner un enfant.");
      return;
    }
    if (!content.trim()) {
      setErrorInfo("Veuillez saisir votre message.");
      return;
    }
    if (isTooLong) {
      setErrorInfo("Votre message ne peut pas dépasser 500 caractères.");
      return;
    }

    setIsLoading(true);
    setSuccessInfo(null);
    setErrorInfo(null);

    try {
      // Create message via Server Action
      const result = await createMessageAction(selectedChildId, content);

      // TODO Phase 7 : envoyer un email Resend au staff ici

      if (result.success && result.data) {
        // Success! Append to local state list so it updates instantly
        const childObj = childrenList.find((c) => c.id === selectedChildId);
        const childName = childObj
          ? `${childObj.first_name} ${childObj.last_name}`
          : "Enfant";

        const newMsg: SentMessageItem = {
          id: result.data.id,
          child_id: result.data.child_id,
          content: result.data.content,
          status: result.data.status,
          created_at: result.data.created_at,
          child_name: childName,
        };

        setMessages((prev) => [newMsg, ...prev]);
        setContent("");
        setSuccessInfo("Votre message a été transmis avec succès à l'équipe !");
      }
    } catch (err) {
      console.error("Message send error:", err);
      const message = err instanceof Error ? err.message : "Une erreur est survenue lors de l'envoi du message.";
      setErrorInfo(message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: MessageStatus) => {
    switch (status) {
      case "nouveau":
        return (
          <Badge className="bg-soleil-primary text-white border-none rounded-full px-2.5 font-bold animate-pulse">
            Nouveau
          </Badge>
        );
      case "lu":
        return (
          <Badge
            variant="outline"
            className="border-soleil-text-muted/30 text-soleil-text-muted rounded-full px-2.5 font-semibold bg-muted/20"
          >
            Lu
          </Badge>
        );
      case "traite":
        return (
          <Badge className="bg-soleil-secondary text-white border-none rounded-full px-2.5 font-bold flex items-center gap-1">
            ✓ Traité
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* Back to safety button */}
      <div>
        <SoleilButton asChild variant="outline" size="sm">
          <Link href="/parent" className="flex items-center gap-1">
            <ChevronLeft className="size-4" /> Retour à l{"'"}espace famille
          </Link>
        </SoleilButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form panel - 7 columns on desktop */}
        <div className="lg:col-span-7">
          <Card className="p-6 border border-border bg-card shadow-soleil rounded-2xl">
            <h2 className="font-heading font-bold text-xl text-soleil-text mb-5 flex items-center gap-2">
              <MessageSquare className="size-5 text-soleil-primary" />
              Écrire à l{"'"}équipe
            </h2>

            {/* Error banner */}
            {errorInfo && (
              <div className="mb-5 p-4 rounded-xl border border-rose-100 bg-rose-50/50 text-rose-800 text-sm font-semibold flex items-start gap-2.5">
                <AlertTriangle className="size-4.5 shrink-0 mt-0.5" />
                <div>{errorInfo}</div>
              </div>
            )}

            {/* Success banner */}
            {successInfo && (
              <div className="mb-5 p-4 rounded-xl border border-emerald-100 bg-emerald-50/50 text-emerald-800 text-sm font-medium flex items-start gap-2.5 shadow-sm">
                <CheckCircle2 className="size-4.5 shrink-0 mt-0.5 text-soleil-secondary" />
                <div>{successInfo}</div>
              </div>
            )}

            {childrenList.length === 0 ? (
              <div className="p-6 text-center border-dashed border-2 border-border/80 rounded-xl bg-muted/10 space-y-3">
                <Baby className="size-8 mx-auto text-muted-foreground/60" />
                <p className="text-sm text-soleil-text-muted">
                  Aucun enfant n{"'"}est rattaché à votre profil. Vous ne pouvez pas envoyer de messages.
                </p>
              </div>
            ) : (
              <form onSubmit={handleMessageSubmit} className="space-y-5">
                {/* Child Select Input */}
                <div className="space-y-2">
                  <Label htmlFor="child_select" className="text-sm font-bold text-soleil-text">
                    Pour quel enfant ?
                  </Label>
                  <select
                    id="child_select"
                    value={selectedChildId}
                    onChange={(e) => setSelectedChildId(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full h-11 px-3.5 border border-input rounded-xl bg-background text-soleil-text outline-none focus:border-ring hover:border-soleil-primary/45 focus:ring-1 focus:ring-ring/25 shadow-soleil transition-colors duration-150 text-sm font-medium cursor-pointer"
                  >
                    {childrenList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.first_name} {c.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Content Textarea Input */}
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <Label htmlFor="message_content" className="text-sm font-bold text-soleil-text">
                      Votre message (consigne, absence, retard...)
                    </Label>
                    <span
                      className={`text-[11px] font-bold ${
                        isTooLong ? "text-rose-600" : "text-slate-400"
                      }`}
                    >
                      {characterCount} / 500
                    </span>
                  </div>
                  <textarea
                    id="message_content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="Saisissez votre message ici (ex: retard d'un quart d'heure ce soir, absence pour maladie demain...)"
                    className="w-full min-h-[140px] p-3.5 border border-input rounded-xl bg-background text-soleil-text outline-none focus:border-ring hover:border-soleil-primary/45 focus:ring-1 focus:ring-ring/25 shadow-soleil transition-colors duration-150 text-sm leading-relaxed resize-none"
                  />
                </div>

                {/* Submission button */}
                <SoleilButton
                  type="submit"
                  disabled={isSubmitting || !content.trim() || isTooLong}
                  className="w-full bg-soleil-primary hover:bg-soleil-primary/90 text-white font-bold h-11 rounded-xl flex items-center justify-center gap-2 shadow-soleil disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none transition-all"
                >
                  <Send className="size-4" />
                  {isSubmitting ? "Envoi en cours..." : "Transmettre le message"}
                </SoleilButton>
              </form>
            )}
          </Card>
        </div>

        {/* History panel - 5 columns on desktop */}
        <div className="lg:col-span-5 space-y-5">
          <div className="space-y-1">
            <h3 className="font-heading font-black text-lg text-soleil-text flex items-center gap-2">
              <Clock className="size-4.5 text-soleil-text-muted" />
              Historique des envois
            </h3>
            <p className="text-xs text-soleil-text-muted font-medium">
              Retrouvez ici les derniers messages envoyés à l{"'"}équipe.
            </p>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {messages.length > 0 ? (
              messages.map((msg) => (
                <Card
                  key={msg.id}
                  className={`p-4 border border-border/80 shadow-soleil rounded-xl space-y-3 bg-card/90 transition-all ${
                    msg.status === "nouveau" ? "border-l-4 border-l-soleil-primary" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-soleil-text-muted">
                      <Baby className="size-3 text-soleil-primary" />
                      {msg.child_name}
                    </span>
                    {getStatusBadge(msg.status)}
                  </div>

                  <p className="text-xs text-soleil-text leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>

                  <div className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end pt-1">
                    <Clock className="size-3 text-soleil-primary" />
                    Le {new Date(msg.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    à{" "}
                    {new Date(msg.created_at).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center border-dashed border-2 border-border/80 rounded-xl bg-card shadow-none flex flex-col items-center justify-center gap-3">
                <div className="p-3 bg-soleil-background text-soleil-primary rounded-full">
                  <MessageSquare className="size-6 text-soleil-primary" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-sm text-soleil-text">
                    Vous n{"'"}avez pas encore envoyé de message à l{"'"}équipe
                  </h4>
                  <p className="text-[11px] text-muted-foreground max-w-[200px] mx-auto mt-1">
                    Vos messages envoyés s{"'"}afficheront ici pour vous permettre d{"'"}en suivre le statut.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
