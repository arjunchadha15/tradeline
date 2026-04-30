export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      bookings: {
        Row: {
          actual_value_usd: number | null;
          call_id: string | null;
          client_id: string;
          created_at: string | null;
          customer_address: string | null;
          customer_name: string;
          customer_phone: string;
          duration_min: number | null;
          estimated_value_usd: number | null;
          external_event_id: string | null;
          id: string;
          problem_summary: string | null;
          scheduled_at: string;
          status: string | null;
        };
        Insert: {
          actual_value_usd?: number | null;
          call_id?: string | null;
          client_id: string;
          created_at?: string | null;
          customer_address?: string | null;
          customer_name: string;
          customer_phone: string;
          duration_min?: number | null;
          estimated_value_usd?: number | null;
          external_event_id?: string | null;
          id?: string;
          problem_summary?: string | null;
          scheduled_at: string;
          status?: string | null;
        };
        Update: {
          actual_value_usd?: number | null;
          call_id?: string | null;
          client_id?: string;
          created_at?: string | null;
          customer_address?: string | null;
          customer_name?: string;
          customer_phone?: string;
          duration_min?: number | null;
          estimated_value_usd?: number | null;
          external_event_id?: string | null;
          id?: string;
          problem_summary?: string | null;
          scheduled_at?: string;
          status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_call_id_fkey";
            columns: ["call_id"];
            isOneToOne: false;
            referencedRelation: "calls";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      calls: {
        Row: {
          audio_url: string | null;
          caller_address: string | null;
          caller_name: string | null;
          caller_phone: string | null;
          client_id: string;
          cost_usd: number | null;
          created_at: string | null;
          duration_sec: number | null;
          ended_at: string | null;
          id: string;
          outcome: string | null;
          problem_summary: string | null;
          started_at: string | null;
          structured_data: Json | null;
          summary: string | null;
          transcript: string | null;
          urgency: string | null;
          vapi_call_id: string | null;
        };
        Insert: {
          audio_url?: string | null;
          caller_address?: string | null;
          caller_name?: string | null;
          caller_phone?: string | null;
          client_id: string;
          cost_usd?: number | null;
          created_at?: string | null;
          duration_sec?: number | null;
          ended_at?: string | null;
          id?: string;
          outcome?: string | null;
          problem_summary?: string | null;
          started_at?: string | null;
          structured_data?: Json | null;
          summary?: string | null;
          transcript?: string | null;
          urgency?: string | null;
          vapi_call_id?: string | null;
        };
        Update: {
          audio_url?: string | null;
          caller_address?: string | null;
          caller_name?: string | null;
          caller_phone?: string | null;
          client_id?: string;
          cost_usd?: number | null;
          created_at?: string | null;
          duration_sec?: number | null;
          ended_at?: string | null;
          id?: string;
          outcome?: string | null;
          problem_summary?: string | null;
          started_at?: string | null;
          structured_data?: Json | null;
          summary?: string | null;
          transcript?: string | null;
          urgency?: string | null;
          vapi_call_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "calls_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      clients: {
        Row: {
          after_hours_mode: boolean | null;
          agent_name: string | null;
          avg_ticket_usd: number | null;
          business_hours: Json | null;
          business_name: string;
          close_rate: number | null;
          created_at: string | null;
          emergency_keywords: string[] | null;
          google_access_token: string | null;
          google_calendar_id: string | null;
          google_refresh_token: string | null;
          google_token_expires_at: string | null;
          greeting: string | null;
          id: string;
          owner_name: string;
          owner_phone: string;
          owner_user_id: string | null;
          plan: string | null;
          pricing_json: Json | null;
          status: string | null;
          trade: string;
          twilio_number: string | null;
          updated_at: string | null;
          vapi_assistant_id: string | null;
        };
        Insert: {
          after_hours_mode?: boolean | null;
          agent_name?: string | null;
          avg_ticket_usd?: number | null;
          business_hours?: Json | null;
          business_name: string;
          close_rate?: number | null;
          created_at?: string | null;
          emergency_keywords?: string[] | null;
          google_access_token?: string | null;
          google_calendar_id?: string | null;
          google_refresh_token?: string | null;
          google_token_expires_at?: string | null;
          greeting?: string | null;
          id?: string;
          owner_name: string;
          owner_phone: string;
          owner_user_id?: string | null;
          plan?: string | null;
          pricing_json?: Json | null;
          status?: string | null;
          trade: string;
          twilio_number?: string | null;
          updated_at?: string | null;
          vapi_assistant_id?: string | null;
        };
        Update: {
          after_hours_mode?: boolean | null;
          agent_name?: string | null;
          avg_ticket_usd?: number | null;
          business_hours?: Json | null;
          business_name?: string;
          close_rate?: number | null;
          created_at?: string | null;
          emergency_keywords?: string[] | null;
          google_access_token?: string | null;
          google_calendar_id?: string | null;
          google_refresh_token?: string | null;
          google_token_expires_at?: string | null;
          greeting?: string | null;
          id?: string;
          owner_name?: string;
          owner_phone?: string;
          owner_user_id?: string | null;
          plan?: string | null;
          pricing_json?: Json | null;
          status?: string | null;
          trade?: string;
          twilio_number?: string | null;
          updated_at?: string | null;
          vapi_assistant_id?: string | null;
        };
        Relationships: [];
      };
      emergencies: {
        Row: {
          acknowledged_at: string | null;
          call_id: string | null;
          client_id: string;
          created_at: string | null;
          id: string;
          sms_sent_at: string | null;
          sms_sid: string | null;
          summary: string | null;
          trigger_keyword: string | null;
        };
        Insert: {
          acknowledged_at?: string | null;
          call_id?: string | null;
          client_id: string;
          created_at?: string | null;
          id?: string;
          sms_sent_at?: string | null;
          sms_sid?: string | null;
          summary?: string | null;
          trigger_keyword?: string | null;
        };
        Update: {
          acknowledged_at?: string | null;
          call_id?: string | null;
          client_id?: string;
          created_at?: string | null;
          id?: string;
          sms_sent_at?: string | null;
          sms_sid?: string | null;
          summary?: string | null;
          trigger_keyword?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "emergencies_call_id_fkey";
            columns: ["call_id"];
            isOneToOne: false;
            referencedRelation: "calls";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "emergencies_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      prompt_versions: {
        Row: {
          active: boolean | null;
          client_id: string;
          created_at: string | null;
          id: string;
          system_prompt: string;
          version: number;
        };
        Insert: {
          active?: boolean | null;
          client_id: string;
          created_at?: string | null;
          id?: string;
          system_prompt: string;
          version: number;
        };
        Update: {
          active?: boolean | null;
          client_id?: string;
          created_at?: string | null;
          id?: string;
          system_prompt?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "prompt_versions_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
