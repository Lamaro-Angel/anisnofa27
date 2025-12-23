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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      academic_years: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          is_current: boolean | null
          name: string
          start_date: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          is_current?: boolean | null
          name: string
          start_date: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          is_current?: boolean | null
          name?: string
          start_date?: string
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      announcements: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_pinned: boolean | null
          target_classes: string[] | null
          target_roles: Database["public"]["Enums"]["app_role"][] | null
          title: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_pinned?: boolean | null
          target_classes?: string[] | null
          target_roles?: Database["public"]["Enums"]["app_role"][] | null
          title: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_pinned?: boolean | null
          target_classes?: string[] | null
          target_roles?: Database["public"]["Enums"]["app_role"][] | null
          title?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          class_subject_id: string
          created_at: string | null
          date: string
          id: string
          notes: string | null
          recorded_by: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Insert: {
          class_subject_id: string
          created_at?: string | null
          date: string
          id?: string
          notes?: string | null
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Update: {
          class_subject_id?: string
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_class_subject_id_fkey"
            columns: ["class_subject_id"]
            isOneToOne: false
            referencedRelation: "class_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      class_subjects: {
        Row: {
          class_id: string
          created_at: string | null
          id: string
          schedule: Json | null
          subject_id: string
          teacher_id: string | null
        }
        Insert: {
          class_id: string
          created_at?: string | null
          id?: string
          schedule?: Json | null
          subject_id: string
          teacher_id?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string | null
          id?: string
          schedule?: Json | null
          subject_id?: string
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_subjects_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          academic_year_id: string | null
          capacity: number | null
          created_at: string | null
          grade_level: string
          id: string
          name: string
          room: string | null
        }
        Insert: {
          academic_year_id?: string | null
          capacity?: number | null
          created_at?: string | null
          grade_level: string
          id?: string
          name: string
          room?: string | null
        }
        Update: {
          academic_year_id?: string | null
          capacity?: number | null
          created_at?: string | null
          grade_level?: string
          id?: string
          name?: string
          room?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_requests: {
        Row: {
          created_at: string | null
          id: string
          is_resolved: boolean | null
          message: string
          resolved_at: string | null
          resolved_by: string | null
          sender_id: string
          subject: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_resolved?: boolean | null
          message: string
          resolved_at?: string | null
          resolved_by?: string | null
          sender_id: string
          subject: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_resolved?: boolean | null
          message?: string
          resolved_at?: string | null
          resolved_by?: string | null
          sender_id?: string
          subject?: string
        }
        Relationships: []
      }
      grades: {
        Row: {
          class_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          grade: number | null
          id: string
          period: Database["public"]["Enums"]["grade_period"]
          student_id: string
          subject_id: string
          updated_at: string | null
        }
        Insert: {
          class_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          grade?: number | null
          id?: string
          period: Database["public"]["Enums"]["grade_period"]
          student_id: string
          subject_id: string
          updated_at?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          grade?: number | null
          id?: string
          period?: Database["public"]["Enums"]["grade_period"]
          student_id?: string
          subject_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grades_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      guardian_students: {
        Row: {
          created_at: string | null
          guardian_id: string
          id: string
          is_primary: boolean | null
          student_id: string
        }
        Insert: {
          created_at?: string | null
          guardian_id: string
          id?: string
          is_primary?: boolean | null
          student_id: string
        }
        Update: {
          created_at?: string | null
          guardian_id?: string
          id?: string
          is_primary?: boolean | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardian_students_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardian_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      guardians: {
        Row: {
          created_at: string | null
          id: string
          occupation: string | null
          relationship: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          occupation?: string | null
          relationship?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          occupation?: string | null
          relationship?: string | null
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          birth_date: string | null
          created_at: string | null
          email: string
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"] | null
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string | null
          email: string
          full_name: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      students: {
        Row: {
          class_id: string | null
          created_at: string | null
          enrollment_date: string | null
          id: string
          student_number: string | null
          user_id: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          enrollment_date?: string | null
          id?: string
          student_number?: string | null
          user_id: string
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          enrollment_date?: string | null
          id?: string
          student_number?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string | null
          created_at: string | null
          credits: number | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          credits?: number | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string | null
          created_at?: string | null
          credits?: number | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      teachers: {
        Row: {
          created_at: string | null
          department: string | null
          employee_number: string | null
          hire_date: string | null
          id: string
          specialization: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          employee_number?: string | null
          hire_date?: string | null
          id?: string
          specialization?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          department?: string | null
          employee_number?: string | null
          hire_date?: string | null
          id?: string
          specialization?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "professor" | "aluno" | "encarregado"
      attendance_status: "presente" | "falta" | "justificado" | "atraso"
      gender_type: "masculino" | "feminino" | "outro"
      grade_period: "1_trimestre" | "2_trimestre" | "3_trimestre" | "final"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "professor", "aluno", "encarregado"],
      attendance_status: ["presente", "falta", "justificado", "atraso"],
      gender_type: ["masculino", "feminino", "outro"],
      grade_period: ["1_trimestre", "2_trimestre", "3_trimestre", "final"],
    },
  },
} as const
