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
          active_plan: "free" | "pro" | "vip";
          subscription_status: "active" | "past_due" | "canceled" | "trialing" | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          created_at: string;
          updated_at: string;
          cpf: string | null;
          phone: string | null;
          birth_date: string | null;
          is_blocked: boolean | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          active_plan?: "free" | "pro" | "vip";
          subscription_status?: "active" | "past_due" | "canceled" | "trialing" | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
          cpf?: string | null;
          phone?: string | null;
          birth_date?: string | null;
          is_blocked?: boolean | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          active_plan?: "free" | "pro" | "vip";
          subscription_status?: "active" | "past_due" | "canceled" | "trialing" | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
          cpf?: string | null;
          phone?: string | null;
          birth_date?: string | null;
          is_blocked?: boolean | null;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
