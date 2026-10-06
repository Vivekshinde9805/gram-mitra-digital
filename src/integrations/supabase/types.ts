export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          address: string
          admin_remark: string | null
          applicant_name: string
          created_at: string
          description: string | null
          documents: string[]
          id: string
          mobile: string
          ref_no: string
          service_type: string
          status: Database["public"]["Enums"]["app_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          admin_remark?: string | null
          applicant_name: string
          created_at?: string
          description?: string | null
          documents?: string[]
          id?: string
          mobile: string
          ref_no?: string
          service_type: string
          status?: Database["public"]["Enums"]["app_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          admin_remark?: string | null
          applicant_name?: string
          created_at?: string
          description?: string | null
          documents?: string[]
          id?: string
          mobile?: string
          ref_no?: string
          service_type?: string
          status?: Database["public"]["Enums"]["app_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      complaints: {
        Row: {
          admin_remark: string | null
          category: string
          created_at: string
          description: string
          id: string
          status: Database["public"]["Enums"]["app_status"]
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_remark?: string | null
          category: string
          created_at?: string
          description: string
          id?: string
          status?: Database["public"]["Enums"]["app_status"]
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_remark?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          status?: Database["public"]["Enums"]["app_status"]
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notices: {
        Row: {
          body: string | null
          body_mr: string | null
          created_at: string
          id: string
          title: string
          title_mr: string | null
        }
        Insert: {
          body?: string | null
          body_mr?: string | null
          created_at?: string
          id?: string
          title: string
          title_mr?: string | null
        }
        Update: {
          body?: string | null
          body_mr?: string | null
          created_at?: string
          id?: string
          title?: string
          title_mr?: string | null
        }
        Relationships: []
      }
      panchayat_info: {
        Row: {
          about: string | null
          about_mr: string | null
          address: string | null
          area_sq_km: number | null
          district: string | null
          email: string | null
          households: number | null
          id: number
          name: string | null
          name_mr: string | null
          office_hours: string | null
          phone: string | null
          population: number | null
          state: string | null
          taluka: string | null
          updated_at: string
          upi_id: string | null
          upi_name: string | null
          village: string | null
        }
        Insert: {
          about?: string | null
          about_mr?: string | null
          address?: string | null
          area_sq_km?: number | null
          district?: string | null
          email?: string | null
          households?: number | null
          id?: number
          name?: string | null
          name_mr?: string | null
          office_hours?: string | null
          phone?: string | null
          population?: number | null
          state?: string | null
          taluka?: string | null
          updated_at?: string
          upi_id?: string | null
          upi_name?: string | null
          village?: string | null
        }
        Update: {
          about?: string | null
          about_mr?: string | null
          address?: string | null
          area_sq_km?: number | null
          district?: string | null
          email?: string | null
          households?: number | null
          id?: number
          name?: string | null
          name_mr?: string | null
          office_hours?: string | null
          phone?: string | null
          population?: number | null
          state?: string | null
          taluka?: string | null
          updated_at?: string
          upi_id?: string | null
          upi_name?: string | null
          village?: string | null
        }
        Relationships: []
      }
      panchayat_members: {
        Row: {
          created_at: string
          designation: string
          designation_mr: string | null
          id: string
          name: string
          phone: string | null
          sort_order: number | null
          ward: string | null
        }
        Insert: {
          created_at?: string
          designation: string
          designation_mr?: string | null
          id?: string
          name: string
          phone?: string | null
          sort_order?: number | null
          ward?: string | null
        }
        Update: {
          created_at?: string
          designation?: string
          designation_mr?: string | null
          id?: string
          name?: string
          phone?: string | null
          sort_order?: number | null
          ward?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          mobile: string | null
          updated_at: string
          village: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          mobile?: string | null
          updated_at?: string
          village?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          mobile?: string | null
          updated_at?: string
          village?: string | null
        }
        Relationships: []
      }
      tax_records: {
        Row: {
          amount: number
          created_at: string
          due_date: string | null
          financial_year: string
          id: string
          paid_at: string | null
          payment_method: string | null
          receipt_no: string | null
          status: string
          submitted_at: string | null
          tax_type: string
          user_id: string
          utr: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          due_date?: string | null
          financial_year: string
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          receipt_no?: string | null
          status?: string
          submitted_at?: string | null
          tax_type: string
          user_id: string
          utr?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string | null
          financial_year?: string
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          receipt_no?: string | null
          status?: string
          submitted_at?: string | null
          tax_type?: string
          user_id?: string
          utr?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      submit_tax_payment: {
        Args: { _id: string; _utr: string }
        Returns: {
          amount: number
          created_at: string
          due_date: string | null
          financial_year: string
          id: string
          paid_at: string | null
          payment_method: string | null
          receipt_no: string | null
          status: string
          submitted_at: string | null
          tax_type: string
          user_id: string
          utr: string | null
        }
        SetofOptions: {
          from: "*"
          to: "tax_records"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "admin" | "user"
      app_status:
        | "pending"
        | "in_review"
        | "approved"
        | "rejected"
        | "completed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      app_status: ["pending", "in_review", "approved", "rejected", "completed"],
    },
  },
} as const
