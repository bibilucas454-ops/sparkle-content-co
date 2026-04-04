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
  public: {
    Tables: {
      audio_merges: {
        Row: {
          audio_upload_id: string | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          merged_upload_id: string | null
          music_fade_in: number | null
          music_fade_out: number | null
          music_volume: number | null
          publication_id: string | null
          status: string
          video_upload_id: string
        }
        Insert: {
          audio_upload_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          merged_upload_id?: string | null
          music_fade_in?: number | null
          music_fade_out?: number | null
          music_volume?: number | null
          publication_id?: string | null
          status?: string
          video_upload_id: string
        }
        Update: {
          audio_upload_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          merged_upload_id?: string | null
          music_fade_in?: number | null
          music_fade_out?: number | null
          music_volume?: number | null
          publication_id?: string | null
          status?: string
          video_upload_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audio_merges_audio_upload_id_fkey"
            columns: ["audio_upload_id"]
            isOneToOne: false
            referencedRelation: "uploads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audio_merges_merged_upload_id_fkey"
            columns: ["merged_upload_id"]
            isOneToOne: false
            referencedRelation: "uploads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audio_merges_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "publication_metrics"
            referencedColumns: ["publication_id"]
          },
          {
            foreignKeyName: "audio_merges_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "publications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audio_merges_video_upload_id_fkey"
            columns: ["video_upload_id"]
            isOneToOne: false
            referencedRelation: "uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      content_music: {
        Row: {
          artist: string | null
          external_id: string | null
          id: string
          preview_url: string | null
          publication_id: string | null
          selected_at: string | null
          source_platform: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          artist?: string | null
          external_id?: string | null
          id?: string
          preview_url?: string | null
          publication_id?: string | null
          selected_at?: string | null
          source_platform?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          artist?: string | null
          external_id?: string | null
          id?: string
          preview_url?: string | null
          publication_id?: string | null
          selected_at?: string | null
          source_platform?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_music_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "publication_metrics"
            referencedColumns: ["publication_id"]
          },
          {
            foreignKeyName: "content_music_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "publications"
            referencedColumns: ["id"]
          },
        ]
      }
      content_music_selection: {
        Row: {
          created_at: string | null
          id: string
          music_catalog_id: string | null
          publication_id: string | null
          selected_by_user: boolean | null
          selected_from_trending: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          music_catalog_id?: string | null
          publication_id?: string | null
          selected_by_user?: boolean | null
          selected_from_trending?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          music_catalog_id?: string | null
          publication_id?: string | null
          selected_by_user?: boolean | null
          selected_from_trending?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_music_selection_music_catalog_id_fkey"
            columns: ["music_catalog_id"]
            isOneToOne: false
            referencedRelation: "music_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_music_selection_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "publication_metrics"
            referencedColumns: ["publication_id"]
          },
          {
            foreignKeyName: "content_music_selection_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "publications"
            referencedColumns: ["id"]
          },
        ]
      }
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
      integration_events: {
        Row: {
          correlation_id: string | null
          created_at: string
          event_type: string
          id: string
          payload: Json | null
          platform: string
          user_id: string
        }
        Insert: {
          correlation_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          payload?: Json | null
          platform: string
          user_id: string
        }
        Update: {
          correlation_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json | null
          platform?: string
          user_id?: string
        }
        Relationships: []
      }
      music_catalog: {
        Row: {
          album_name: string | null
          artist: string | null
          category: string | null
          cover_image_url: string | null
          created_at: string | null
          duration_seconds: number | null
          external_id: string | null
          id: string
          is_active: boolean | null
          is_trending: boolean | null
          last_synced_at: string | null
          locale: string | null
          metadata: Json | null
          preview_url: string | null
          source_platform: string | null
          title: string
          trend_score: number | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          album_name?: string | null
          artist?: string | null
          category?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          external_id?: string | null
          id?: string
          is_active?: boolean | null
          is_trending?: boolean | null
          last_synced_at?: string | null
          locale?: string | null
          metadata?: Json | null
          preview_url?: string | null
          source_platform?: string | null
          title: string
          trend_score?: number | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          album_name?: string | null
          artist?: string | null
          category?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          external_id?: string | null
          id?: string
          is_active?: boolean | null
          is_trending?: boolean | null
          last_synced_at?: string | null
          locale?: string | null
          metadata?: Json | null
          preview_url?: string | null
          source_platform?: string | null
          title?: string
          trend_score?: number | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      music_library: {
        Row: {
          artist: string
          category: string | null
          cover_url: string | null
          created_at: string
          duration: number | null
          id: string
          title: string
          url: string
        }
        Insert: {
          artist: string
          category?: string | null
          cover_url?: string | null
          created_at?: string
          duration?: number | null
          id?: string
          title: string
          url: string
        }
        Update: {
          artist?: string
          category?: string | null
          cover_url?: string | null
          created_at?: string
          duration?: number | null
          id?: string
          title?: string
          url?: string
        }
        Relationships: []
      }
      music_sync_jobs: {
        Row: {
          created_at: string | null
          error_log: string | null
          finished_at: string | null
          id: string
          records_fetched: number | null
          records_inserted: number | null
          records_updated: number | null
          source: string
          started_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          error_log?: string | null
          finished_at?: string | null
          id?: string
          records_fetched?: number | null
          records_inserted?: number | null
          records_updated?: number | null
          source: string
          started_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          error_log?: string | null
          finished_at?: string | null
          id?: string
          records_fetched?: number | null
          records_inserted?: number | null
          records_updated?: number | null
          source?: string
          started_at?: string | null
          status?: string | null
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
          audio_upload_id: string | null
          created_at: string
          id: string
          media_type: string
          publication_id: string
          sort_order: number
          upload_id: string
        }
        Insert: {
          audio_upload_id?: string | null
          created_at?: string
          id?: string
          media_type?: string
          publication_id: string
          sort_order?: number
          upload_id: string
        }
        Update: {
          audio_upload_id?: string | null
          created_at?: string
          id?: string
          media_type?: string
          publication_id?: string
          sort_order?: number
          upload_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_media_audio_upload_id_fkey"
            columns: ["audio_upload_id"]
            isOneToOne: false
            referencedRelation: "uploads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_media_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "publication_metrics"
            referencedColumns: ["publication_id"]
          },
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
          idempotency_key: string | null
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
          idempotency_key?: string | null
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
          idempotency_key?: string | null
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
            referencedRelation: "publication_metrics"
            referencedColumns: ["target_id"]
          },
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
            referencedRelation: "publication_metrics"
            referencedColumns: ["target_id"]
          },
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
            referencedRelation: "publication_metrics"
            referencedColumns: ["publication_id"]
          },
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
          approval_status: string
          caption: string | null
          content_format: string
          created_at: string
          cta: string | null
          hashtags: string | null
          id: string
          music_fade_in: number | null
          music_fade_out: number | null
          music_metadata: Json | null
          music_volume: number | null
          overall_status: string | null
          scheduled_for: string | null
          thumbnail_path: string | null
          title: string
          updated_at: string | null
          upload_id: string | null
          user_id: string
        }
        Insert: {
          approval_status?: string
          caption?: string | null
          content_format?: string
          created_at?: string
          cta?: string | null
          hashtags?: string | null
          id?: string
          music_fade_in?: number | null
          music_fade_out?: number | null
          music_metadata?: Json | null
          music_volume?: number | null
          overall_status?: string | null
          scheduled_for?: string | null
          thumbnail_path?: string | null
          title: string
          updated_at?: string | null
          upload_id?: string | null
          user_id: string
        }
        Update: {
          approval_status?: string
          caption?: string | null
          content_format?: string
          created_at?: string
          cta?: string | null
          hashtags?: string | null
          id?: string
          music_fade_in?: number | null
          music_fade_out?: number | null
          music_metadata?: Json | null
          music_volume?: number | null
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
      publish_logs: {
        Row: {
          content_type: string
          created_at: string
          endpoint: string
          error_message: string | null
          id: string
          method: string
          platform: string
          publication_target_id: string | null
          request_body: Json | null
          response_body: Json | null
          response_status: number | null
          success: boolean
        }
        Insert: {
          content_type: string
          created_at?: string
          endpoint: string
          error_message?: string | null
          id?: string
          method: string
          platform: string
          publication_target_id?: string | null
          request_body?: Json | null
          response_body?: Json | null
          response_status?: number | null
          success?: boolean
        }
        Update: {
          content_type?: string
          created_at?: string
          endpoint?: string
          error_message?: string | null
          id?: string
          method?: string
          platform?: string
          publication_target_id?: string | null
          request_body?: Json | null
          response_body?: Json | null
          response_status?: number | null
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "publish_logs_publication_target_id_fkey"
            columns: ["publication_target_id"]
            isOneToOne: false
            referencedRelation: "publication_metrics"
            referencedColumns: ["target_id"]
          },
          {
            foreignKeyName: "publish_logs_publication_target_id_fkey"
            columns: ["publication_target_id"]
            isOneToOne: false
            referencedRelation: "publication_targets"
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
          last_error: string | null
          last_error_code: string | null
          last_refreshed_at: string | null
          last_sync_at: string | null
          platform: string
          raw_response: Json | null
          refresh_expires_at: string | null
          refresh_token_encrypted: string | null
          scope: string | null
          status: string | null
          token_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_encrypted: string
          account_id?: string | null
          account_name?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          last_error?: string | null
          last_error_code?: string | null
          last_refreshed_at?: string | null
          last_sync_at?: string | null
          platform: string
          raw_response?: Json | null
          refresh_expires_at?: string | null
          refresh_token_encrypted?: string | null
          scope?: string | null
          status?: string | null
          token_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_encrypted?: string
          account_id?: string | null
          account_name?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          last_error?: string | null
          last_error_code?: string | null
          last_refreshed_at?: string | null
          last_sync_at?: string | null
          platform?: string
          raw_response?: Json | null
          refresh_expires_at?: string | null
          refresh_token_encrypted?: string | null
          scope?: string | null
          status?: string | null
          token_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      story_generations: {
        Row: {
          created_at: string | null
          cta_principal: string
          dor_principal: string
          id: string
          iteracoes: number | null
          nicho: string
          nivel_publico: string | null
          objetivo: string | null
          produto: string | null
          promessa: string
          score_abertura: number | null
          score_cta: number | null
          score_diversidade: number | null
          score_estrutura: number | null
          score_ritmo: number | null
          score_vocabulario: number | null
          status: string | null
          stories: Json
          tipo_sequence: string
          tom_voz: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          cta_principal: string
          dor_principal: string
          id?: string
          iteracoes?: number | null
          nicho: string
          nivel_publico?: string | null
          objetivo?: string | null
          produto?: string | null
          promessa: string
          score_abertura?: number | null
          score_cta?: number | null
          score_diversidade?: number | null
          score_estrutura?: number | null
          score_ritmo?: number | null
          score_vocabulario?: number | null
          status?: string | null
          stories?: Json
          tipo_sequence: string
          tom_voz: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          cta_principal?: string
          dor_principal?: string
          id?: string
          iteracoes?: number | null
          nicho?: string
          nivel_publico?: string | null
          objetivo?: string | null
          produto?: string | null
          promessa?: string
          score_abertura?: number | null
          score_cta?: number | null
          score_diversidade?: number | null
          score_estrutura?: number | null
          score_ritmo?: number | null
          score_vocabulario?: number | null
          status?: string | null
          stories?: Json
          tipo_sequence?: string
          tom_voz?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      trending_sounds: {
        Row: {
          artist: string | null
          created_at: string | null
          external_id: string | null
          id: string
          is_active: boolean | null
          popularity_score: number | null
          preview_url: string | null
          source_platform: string | null
          title: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          artist?: string | null
          created_at?: string | null
          external_id?: string | null
          id?: string
          is_active?: boolean | null
          popularity_score?: number | null
          preview_url?: string | null
          source_platform?: string | null
          title: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          artist?: string | null
          created_at?: string | null
          external_id?: string | null
          id?: string
          is_active?: boolean | null
          popularity_score?: number | null
          preview_url?: string | null
          source_platform?: string | null
          title?: string
          updated_at?: string | null
          usage_count?: number | null
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
      platform_metrics: {
        Row: {
          failed_posts: number | null
          platform: string | null
          success_rate_percent: number | null
          successful_posts: number | null
          total_attempts: number | null
          unique_publications: number | null
        }
        Relationships: []
      }
      publication_metrics: {
        Row: {
          attempt_count: number | null
          error_message: string | null
          overall_status: string | null
          platform: string | null
          platform_post_url: string | null
          publication_created_at: string | null
          publication_id: string | null
          published_at: string | null
          scheduled_for: string | null
          target_id: string | null
          target_status: string | null
          title: string | null
          user_id: string | null
        }
        Relationships: []
      }
      story_generation_stats: {
        Row: {
          avg_iterations: number | null
          avg_score: number | null
          failed_generations: number | null
          first_generation: string | null
          last_generation: string | null
          max_score: number | null
          min_score: number | null
          nicho: string | null
          successful_generations: number | null
          tipo_sequence: string | null
          total_generations: number | null
          user_id: string | null
        }
        Relationships: []
      }
      user_publication_summary: {
        Row: {
          failed_count: number | null
          failed_posts: number | null
          pending_count: number | null
          published_count: number | null
          success_rate_percent: number | null
          successful_posts: number | null
          total_publications: number | null
          total_targets: number | null
          user_id: string | null
        }
        Relationships: []
      }
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
      log_audit_event: {
        Args: {
          p_correlation_id?: string
          p_error_code?: string
          p_event_type: string
          p_message?: string
          p_payload?: Json
          p_provider?: string
          p_publication_id?: string
          p_user_id: string
        }
        Returns: string
      }
      log_integration_event: {
        Args: {
          p_event_type: string
          p_payload?: Json
          p_platform: string
          p_user_id: string
        }
        Returns: string
      }
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
  public: {
    Enums: {},
  },
} as const
