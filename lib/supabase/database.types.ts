export type ProfileRole = "staff" | "parent";

export type EventType =
  | "repas"
  | "sieste"
  | "activite"
  | "medicament"
  | "incident";

export type MessageStatus = "nouveau" | "lu" | "traite";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: ProfileRole;
          full_name: string;
          email: string;
        };
        Insert: {
          id: string;
          role: ProfileRole;
          full_name: string;
          email: string;
        };
        Update: {
          id?: string;
          role?: ProfileRole;
          full_name?: string;
          email?: string;
        };
        Relationships: [];
      };
      children: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          section: string;
          allergies: string | null;
          medication_authorization: boolean;
          photo_url: string | null;
          created_by: string;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          section: string;
          allergies?: string | null;
          medication_authorization: boolean;
          photo_url?: string | null;
          created_by: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          section?: string;
          allergies?: string | null;
          medication_authorization?: boolean;
          photo_url?: string | null;
          created_by?: string;
        };
        Relationships: [];
      };
      family_members: {
        Row: {
          id: string;
          child_id: string;
          profile_id: string;
        };
        Insert: {
          id?: string;
          child_id: string;
          profile_id: string;
        };
        Update: {
          id?: string;
          child_id?: string;
          profile_id?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
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
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          child_id: string;
          event_type: EventType;
          note?: string | null;
          meal_quality?: string | null;
          start_time?: string | null;
          end_time?: string | null;
          activity_label?: string | null;
          medication_name?: string | null;
          severity?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          child_id?: string;
          event_type?: EventType;
          note?: string | null;
          meal_quality?: string | null;
          start_time?: string | null;
          end_time?: string | null;
          activity_label?: string | null;
          medication_name?: string | null;
          severity?: string | null;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          child_id: string;
          sender_id: string;
          content: string;
          status: MessageStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          child_id: string;
          sender_id: string;
          content: string;
          status?: MessageStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          child_id?: string;
          sender_id?: string;
          content?: string;
          status?: MessageStatus;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      profile_role: ProfileRole;
      event_type: EventType;
      message_status: MessageStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
