"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Check,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  User,
  Baby,
  Search,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SoleilButton } from "@/components/layout/soleil-button";
import {
  markMessageReadAction,
  markMessageProcessedAction,
} from "@/app/actions/messages";
import type { MessageStatus } from "@/lib/supabase/database.types";

type MessageItem = {
  id: string;
  child_id: string;
  sender_id: string;
  content: string;
  status: MessageStatus;
  created_at: string;
  sender_name: string;
  child_first_name: string;
};

type MessagesClientProps = {
  initialMessages: MessageItem[];
};

export function MessagesClient({ initialMessages }: MessagesClientProps) {
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages);
  const [activeTab, setActiveTab] = useState<"tous" | "nouveau" | "lu" | "traite">("tous");
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleToggleExpand = async (msg: MessageItem) => {
    if (expandedMessageId === msg.id) {
      setExpandedMessageId(null);
    } else {
      setExpandedMessageId(msg.id);
      
      // If message is new, mark as read on open
      if (msg.status === "nouveau") {
        try {
          // Optimistic local state update
          setMessages((prev) =>
            prev.map((m) => (m.id === msg.id ? { ...m, status: "lu" } : m))
          );
          await markMessageReadAction(msg.id);
        } catch (err) {
          console.error("Failed to mark message as read:", err);
        }
      }
    }
  };

  const handleMarkProcessed = async (e: React.MouseEvent, messageId: string) => {
    e.stopPropagation(); // Avoid toggling expansion
    try {
      // Optimistic local state update
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, status: "traite" } : m))
      );
      await markMessageProcessedAction(messageId);
    } catch (err) {
      console.error("Failed to mark message as processed:", err);
      alert("Une erreur est survenue lors du marquage comme traité.");
    }
  };

  // Get counts for badges
  const countNew = messages.filter((m) => m.status === "nouveau").length;
  const countRead = messages.filter((m) => m.status === "lu").length;
  const countProcessed = messages.filter((m) => m.status === "traite").length;

  // Filter messages
  const filteredMessages = messages.filter((msg) => {
    // Tab filter
    if (activeTab !== "tous" && msg.status !== activeTab) {
      return false;
    }
    // Search query filter (search by sender, child name, or content)
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchSender = msg.sender_name.toLowerCase().includes(q);
      const matchChild = msg.child_first_name.toLowerCase().includes(q);
      const matchContent = msg.content.toLowerCase().includes(q);
      return matchSender || matchChild || matchContent;
    }
    return true;
  });

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
          <Badge variant="outline" className="border-soleil-text-muted/30 text-soleil-text-muted rounded-full px-2.5 font-medium bg-muted/30">
            Lu
          </Badge>
        );
      case "traite":
        return (
          <Badge className="bg-soleil-secondary text-white border-none rounded-full px-2.5 font-bold flex items-center gap-1">
            <Check className="size-3" /> Traité
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex justify-between items-center">
        <SoleilButton asChild variant="outline" size="sm">
          <Link href="/staff" className="flex items-center gap-1">
            <ChevronLeft className="size-4" /> Retour à la liste des enfants
          </Link>
        </SoleilButton>
      </div>

      {/* Search and Filters Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Tab filters */}
        <div className="flex flex-wrap gap-1.5 bg-card/60 p-1.5 rounded-xl border border-border shadow-soleil w-fit">
          <button
            onClick={() => setActiveTab("tous")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "tous"
                ? "bg-soleil-primary text-white shadow-sm"
                : "text-soleil-text-muted hover:bg-muted hover:text-soleil-text"
            }`}
          >
            Tous ({messages.length})
          </button>
          <button
            onClick={() => setActiveTab("nouveau")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "nouveau"
                ? "bg-soleil-primary text-white shadow-sm"
                : "text-soleil-text-muted hover:bg-muted hover:text-soleil-text"
            }`}
          >
            Nouveaux
            <span className={`inline-flex items-center justify-center size-5 rounded-full text-[10px] ${activeTab === "nouveau" ? "bg-white text-soleil-primary" : "bg-soleil-primary/10 text-soleil-primary"} font-extrabold`}>
              {countNew}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("lu")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "lu"
                ? "bg-soleil-primary text-white shadow-sm"
                : "text-soleil-text-muted hover:bg-muted hover:text-soleil-text"
            }`}
          >
            Lus
            <span className={`inline-flex items-center justify-center size-5 rounded-full text-[10px] ${activeTab === "lu" ? "bg-white text-soleil-primary" : "bg-muted text-soleil-text-muted"} font-bold`}>
              {countRead}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("traite")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "traite"
                ? "bg-soleil-primary text-white shadow-sm"
                : "text-soleil-text-muted hover:bg-muted hover:text-soleil-text"
            }`}
          >
            Traités
            <span className={`inline-flex items-center justify-center size-5 rounded-full text-[10px] ${activeTab === "traite" ? "bg-white text-soleil-primary" : "bg-muted text-soleil-text-muted"} font-bold`}>
              {countProcessed}
            </span>
          </button>
        </div>

        {/* Search bar */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un message, parent..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-4 text-sm border border-input rounded-xl bg-card outline-none focus:border-ring placeholder:text-muted-foreground shadow-soleil"
          />
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-4">
        {filteredMessages.length > 0 ? (
          filteredMessages.map((msg) => {
            const isExpanded = expandedMessageId === msg.id;
            return (
              <Card
                key={msg.id}
                onClick={() => handleToggleExpand(msg)}
                className={`p-5 border border-border shadow-soleil rounded-2xl cursor-pointer hover:shadow-soleil-md transition-all ${
                  msg.status === "nouveau"
                    ? "border-l-4 border-l-soleil-primary bg-card"
                    : "bg-card/90"
                }`}
              >
                <div className="flex flex-col gap-3">
                  {/* Message Header */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-heading font-bold text-base text-soleil-text flex items-center gap-1">
                          <User className="size-4 text-soleil-text-muted" />
                          {msg.sender_name}
                        </span>
                        <span className="text-xs text-muted-foreground font-normal">•</span>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-soleil-secondary bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 px-2 py-0.5 rounded-full">
                          <Baby className="size-3" />
                          {msg.child_first_name}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="size-3" />
                        Le {new Date(msg.created_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}{" "}
                        à{" "}
                        {new Date(msg.created_at).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(msg.status)}
                      <div className="text-muted-foreground p-1 hover:bg-muted rounded-lg">
                        {isExpanded ? (
                          <ChevronUp className="size-4" />
                        ) : (
                          <ChevronDown className="size-4" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="text-sm text-soleil-text leading-relaxed whitespace-pre-wrap">
                    {isExpanded ? (
                      msg.content
                    ) : (
                      <p className="line-clamp-2 text-soleil-text-muted">
                        {msg.content}
                      </p>
                    )}
                  </div>

                  {/* Actions Footer when Expanded */}
                  {isExpanded && msg.status !== "traite" && (
                    <div className="flex justify-end pt-3 border-t border-border/60 animate-in fade-in duration-200">
                      <SoleilButton
                        variant="secondary"
                        size="sm"
                        onClick={(e) => handleMarkProcessed(e, msg.id)}
                        className="bg-soleil-secondary hover:bg-soleil-secondary/90 text-white rounded-xl font-bold"
                      >
                        <CheckCircle2 className="size-4 mr-1.5" /> Marquer comme traité
                      </SoleilButton>
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        ) : (
          /* Empty State */
          <Card className="p-12 text-center border-dashed border-2 border-border/80 rounded-2xl bg-card/50 shadow-none flex flex-col items-center justify-center gap-4">
            <div className="p-4 bg-muted rounded-full text-muted-foreground/60">
              <MessageSquare className="size-10 text-soleil-primary/75" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading font-bold text-lg text-soleil-text">
                Aucun message trouvé
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                {"Il n'y a aucun message correspondant aux critères de recherche actuels."}
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
