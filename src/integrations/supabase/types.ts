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
    PostgrestVersion: "14.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      contents: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json | null
          platform: string | null
          topic: string
          type: string
          user_id: string
          viral_score: number | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          platform?: string | null
          topic: string
          type: string
          user_id: string
          viral_score?: number | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          platform?: string | null
          topic?: string
          type?: string
          user_id?: string
          viral_score?: number | null
        }
        Relationships: []
      }
      drafts: {
        Row: {
          caption: string | null
          content_format: string
          created_at: string | null
          cta: string | null
          hashtags: string | null
          id: string
          scheduled_for: string | null
          selected_platforms: Json | null
          title: string | null
          updated_at: string | null
          upload_id: string | null
          user_id: string
        }
        Insert: {
          caption?: string | null
          content_format?: string
          created_at?: string | null
          cta?: string | null
          hashtags?: string | null
          id?: string
          scheduled_for?: string | null
          selected_platforms?: Json | null
          title?: string | null
          updated_at?: string | null
          upload_id?: string | null
          user_id: string
        }
        Update: {
          caption?: string | null
          content_format?: string
          created_at?: string | null
          cta?: string | null
          hashtags?: string | null
          id?: string
          scheduled_for?: string | null
          selected_platforms?: Json | null
          title?: string | null
          updated_at?: string | null
          upload_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drafts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      hooks: {
        Row: {
          category: string
          created_at: string
          hook_text: string
          id: string
          is_public: boolean | null
          platform: string | null
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string
          hook_text: string
          id?: string
          is_public?: boolean | null
          platform?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          hook_text?: string
          id?: string
          is_public?: boolean | null
          platform?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      oauth_states: {
        Row: {
          created_at: string
          id: string
          platform: string
          redirect_uri: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform: string
          redirect_uri: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          redirect_uri?: string
          user_id?: string
        }
        Relationships: []
      }
      post_media: {
        Row: {
          created_at: string
          id: string
          media_type: string
          publication_id: string
          sort_order: number
          upload_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          media_type?: string
          publication_id: string
          sort_order?: number
          upload_id: string
        }
        Update: {
          created_at?: string
          id?: string
          media_type?: string
          publication_id?: string
          sort_order?: number
          upload_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_media_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "publications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_media_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          plan: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          plan?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          plan?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      publication_attempts: {
        Row: {
          attempt_number: number
          created_at: string
          error_message: string | null
          http_status: number | null
          id: string
          publication_job_id: string
        }
        Insert: {
          attempt_number: number
          created_at?: string
          error_message?: string | null
          http_status?: number | null
          id?: string
          publication_job_id: string
        }
        Update: {
          attempt_number?: number
          created_at?: string
          error_message?: string | null
          http_status?: number | null
          id?: string
          publication_job_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "publication_attempts_publication_job_id_fkey"
            columns: ["publication_job_id"]
            isOneToOne: false
            referencedRelation: "publication_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      publication_jobs: {
        Row: {
          attempt_count: number
          created_at: string
          id: string
          last_error: string | null
          locked_at: string | null
          publication_target_id: string
          run_at: string
          status: string
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          id?: string
          last_error?: string | null
          locked_at?: string | null
          publication_target_id: string
          run_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          id?: string
          last_error?: string | null
          locked_at?: string | null
          publication_target_id?: string
          run_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "publication_jobs_publication_target_id_fkey"
            columns: ["publication_target_id"]
            isOneToOne: true
            referencedRelation: "publication_targets"
            referencedColumns: ["id"]
          },
        ]
      }
      publication_logs: {
        Row: {
          created_at: string
          details: string | null
          event: string
          id: string
          publication_target_id: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          event: string
          id?: string
          publication_target_id: string
        }
        Update: {
          created_at?: string
          details?: string | null
          event?: string
          id?: string
          publication_target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "publication_logs_publication_target_id_fkey"
            columns: ["publication_target_id"]
            isOneToOne: false
            referencedRelation: "publication_targets"
            referencedColumns: ["id"]
          },
        ]
      }
      publication_targets: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          platform: string
          platform_post_id: string | null
          platform_post_url: string | null
          platform_specific_caption: string | null
          content_format: string
          platform_specific_title: string | null
          privacy_status: string | null
          publication_id: string
          published_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          platform: string
          platform_post_id?: string | null
          platform_post_url?: string | null
          platform_specific_caption?: string | null
          content_format?: string
          platform_specific_title?: string | null
          privacy_status?: string | null
          publication_id: string
          published_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          platform?: string
          platform_post_id?: string | null
          platform_post_url?: string | null
          platform_specific_caption?: string | null
          content_format?: string
          platform_specific_title?: string | null
          privacy_status?: string | null
          publication_id?: string
          published_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "publication_targets_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "publications"
            referencedColumns: ["id"]
          },
        ]
      }
      publications: {
        Row: {
          caption: string | null
          content_format: string
          created_at: string
          cta: string | null
          hashtags: string | null
          id: string
          music_metadata: Json | null
          overall_status: string | null
          scheduled_for: string | null
          thumbnail_path: string | null
          title: string
          updated_at: string | null
          upload_id: string | null
          user_id: string
        }
        Insert: {
          caption?: string | null
          content_format?: string
          created_at?: string
          cta?: string | null
          hashtags?: string | null
          id?: string
          music_metadata?: Json | null
          overall_status?: string | null
          scheduled_for?: string | null
          thumbnail_path?: string | null
          title: string
          updated_at?: string | null
          upload_id?: string | null
          user_id: string
        }
        Update: {
          caption?: string | null
          content_format?: string
          created_at?: string
          cta?: string | null
          hashtags?: string | null
          id?: string
          music_metadata?: Json | null
          overall_status?: string | null
          scheduled_for?: string | null
          thumbnail_path?: string | null
          title?: string
          updated_at?: string | null
          upload_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "publications_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      social_accounts: {
        Row: {
          access_token_encrypted: string | null
          account_id: string | null
          account_name: string | null
          created_at: string
          id: string
          platform: string
          refresh_token_encrypted: string | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token_encrypted?: string | null
          account_id?: string | null
          account_name?: string | null
          created_at?: string
          id?: string
          platform: string
          refresh_token_encrypted?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token_encrypted?: string | null
          account_id?: string | null
          account_name?: string | null
          created_at?: string
          id?: string
          platform?: string
          refresh_token_encrypted?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      social_tokens: {
        Row: {
          access_token_encrypted: string
          account_id: string | null
          account_name: string | null
          created_at: string
          expires_at: string | null
          id: string
          last_refreshed_at: string | null
          platform: string
          refresh_token_encrypted: string | null
          updated_at: string
          user_id: string
          status: string | null
          last_sync_at: string | null
          last_error: string | null
          last_error_code: string | null
        }
        Insert: {
          access_token_encrypted: string
          account_id?: string | null
          account_name?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          last_refreshed_at?: string | null
          platform: string
          refresh_token_encrypted?: string | null
          updated_at?: string
          user_id: string
          status?: string | null
          last_sync_at?: string | null
          last_error?: string | null
          last_error_code?: string | null
        }
        Update: {
          access_token_encrypted?: string
          account_id?: string | null
          account_name?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          last_refreshed_at?: string | null
          platform?: string
          refresh_token_encrypted?: string | null
          updated_at?: string
          user_id?: string
          status?: string | null
          last_sync_at?: string | null
          last_error?: string | null
          last_error_code?: string | null
        }
        Relationships: []
      }
      trends: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          format: string | null
          hashtags: string | null
          hook: string | null
          id: string
          platform: string
          topic: string
          trending_score: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          format?: string | null
          hashtags?: string | null
          hook?: string | null
          id?: string
          platform: string
          topic: string
          trending_score?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          format?: string | null
          hashtags?: string | null
          hook?: string | null
          id?: string
          platform?: string
          topic?: string
          trending_score?: number | null
        }
        Relationships: []
      }
      uploads: {
        Row: {
          aspect_ratio: string | null
          created_at: string
          duration_seconds: number | null
          file_name: string
          file_path: string
          id: string
          mime_type: string | null
          size_bytes: number | null
          thumbnail_path: string | null
          user_id: string
        }
        Insert: {
          aspect_ratio?: string | null
          created_at?: string
          duration_seconds?: number | null
          file_name: string
          file_path: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          thumbnail_path?: string | null
          user_id: string
        }
        Update: {
          aspect_ratio?: string | null
          created_at?: string
          duration_seconds?: number | null
          file_name?: string
          file_path?: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          thumbnail_path?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      audit_publication_queue: {
        Args: never
        Returns: {
          count: number
          status: string
          table_name: string
        }[]
      }
      invoke_cron_scheduler: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
