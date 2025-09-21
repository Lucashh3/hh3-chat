export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      chats: {
        Row: {
          id: string;
          user_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          created_at: string;
          session_id: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          created_at?: string;
          session_id: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: "user" | "assistant" | "system";
          content?: string;
          created_at?: string;
          session_id?: string;
        };
      };
      chat_sessions: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      admin_settings: {
        Row: {
          key: string;
          value: string | null;
          updated_at: string;
        };
        Insert: {
          key: string;
          value?: string | null;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: string | null;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          active_plan: string;
          subscription_status: "active" | "past_due" | "canceled" | "trialing" | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          created_at: string;
          updated_at: string;
          cpf: string | null;
          phone: string | null;
          birth_date: string | null;
          is_blocked: boolean | null;
          is_admin: boolean | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          active_plan?: string;
          subscription_status?: "active" | "past_due" | "canceled" | "trialing" | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
          cpf?: string | null;
          phone?: string | null;
          birth_date?: string | null;
          is_blocked?: boolean | null;
          is_admin?: boolean | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          active_plan?: string;
          subscription_status?: "active" | "past_due" | "canceled" | "trialing" | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
          cpf?: string | null;
          phone?: string | null;
          birth_date?: string | null;
          is_blocked?: boolean | null;
          is_admin?: boolean | null;
        };
      };
      plans: {
        Row: {
          id: string;
          name: string;
          description: string;
          price_monthly: number;
          price_yearly: number | null;
          stripe_price_id: string | null;
          features: string[];
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          description: string;
          price_monthly?: number;
          price_yearly?: number | null;
          stripe_price_id?: string | null;
          features?: string[];
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          price_monthly?: number;
          price_yearly?: number | null;
          stripe_price_id?: string | null;
          features?: string[];
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      admin_prompts: {
        Row: {
          id: string;
          type: string;
          value: string;
          history: Json;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          value: string;
          history?: Json;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: string;
          value?: string;
          history?: Json;
          updated_at?: string;
        };
      };
      prompt_usage_logs: {
        Row: {
          id: string;
          user_id: string | null;
          session_id: string | null;
          duration_ms: number | null;
          success: boolean;
          error_text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          session_id?: string | null;
          duration_ms?: number | null;
          success?: boolean;
          error_text?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          session_id?: string | null;
          duration_ms?: number | null;
          success?: boolean;
          error_text?: string | null;
          created_at?: string;
        };
      };
      stripe_webhook_events: {
        Row: {
          id: string;
          stripe_event_id: string | null;
          type: string;
          status: string;
          error_message: string | null;
          payload: Json | null;
          received_at: string;
          processed_at: string | null;
        };
        Insert: {
          id?: string;
          stripe_event_id?: string | null;
          type: string;
          status: string;
          error_message?: string | null;
          payload?: Json | null;
          received_at?: string;
          processed_at?: string | null;
        };
        Update: {
          id?: string;
          stripe_event_id?: string | null;
          type?: string;
          status?: string;
          error_message?: string | null;
          payload?: Json | null;
          received_at?: string;
          processed_at?: string | null;
        };
      };
    };
    Views: {
      active_plans: {
        Row: {
          id: string;
          name: string;
          description: string;
          price_monthly: number;
          price_yearly: number | null;
          stripe_price_id: string | null;
          features: string[];
          sort_order: number | null;
          is_active: boolean;
          updated_at: string;
        };
      };
      prompt_usage_daily: {
        Row: {
          day: string;
          total_calls: number;
          avg_duration_ms: number | null;
          success_calls: number;
          failed_calls: number;
        };
      };
      profiles_signups_daily: {
        Row: {
          day: string;
          total_signups: number;
          paid_signups: number;
        };
      };
      chat_activity_daily: {
        Row: {
          day: string;
          user_messages: number;
          assistant_messages: number;
        };
      };
      stripe_webhook_status: {
        Row: {
          type: string;
          processed: number;
          errors: number;
          last_received: string | null;
          last_processed: string | null;
        };
      };
    };
    Functions: {};
    Enums: {};
  };
}
