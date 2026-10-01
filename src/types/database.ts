export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          role: 'member' | 'admin'
          created_at: string
        }
        Insert: {
          id: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          role?: 'member' | 'admin'
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          role?: 'member' | 'admin'
          created_at?: string
        }
      }
      videos: {
        Row: {
          id: string
          owner_id: string
          title: string
          caption: string | null
          video_path: string
          thumbnail_path: string | null
          duration_seconds: number | null
          width: number | null
          height: number | null
          size_bytes: number | null
          like_count: number
          status: 'published' | 'hidden'
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          title: string
          caption?: string | null
          video_path: string
          thumbnail_path?: string | null
          duration_seconds?: number | null
          width?: number | null
          height?: number | null
          size_bytes?: number | null
          like_count?: number
          status?: 'published' | 'hidden'
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          title?: string
          caption?: string | null
          video_path?: string
          thumbnail_path?: string | null
          duration_seconds?: number | null
          width?: number | null
          height?: number | null
          size_bytes?: number | null
          like_count?: number
          status?: 'published' | 'hidden'
          created_at?: string
        }
      }
      tracks: {
        Row: {
          id: string
          owner_id: string
          title: string
          artist: string
          album: string | null
          audio_path: string
          cover_path: string | null
          duration_seconds: number | null
          size_bytes: number | null
          like_count: number
          status: 'published' | 'hidden'
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          title: string
          artist: string
          album?: string | null
          audio_path: string
          cover_path?: string | null
          duration_seconds?: number | null
          size_bytes?: number | null
          like_count?: number
          status?: 'published' | 'hidden'
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          title?: string
          artist?: string
          album?: string | null
          audio_path?: string
          cover_path?: string | null
          duration_seconds?: number | null
          size_bytes?: number | null
          like_count?: number
          status?: 'published' | 'hidden'
          created_at?: string
        }
      }
      images: {
        Row: {
          id: string
          owner_id: string
          caption: string | null
          image_path: string
          thumbnail_path: string | null
          width: number | null
          height: number | null
          size_bytes: number | null
          like_count: number
          status: 'published' | 'hidden'
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          caption?: string | null
          image_path: string
          thumbnail_path?: string | null
          width?: number | null
          height?: number | null
          size_bytes?: number | null
          like_count?: number
          status?: 'published' | 'hidden'
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          caption?: string | null
          image_path?: string
          thumbnail_path?: string | null
          width?: number | null
          height?: number | null
          size_bytes?: number | null
          like_count?: number
          status?: 'published' | 'hidden'
          created_at?: string
        }
      }
      likes: {
        Row: {
          user_id: string
          item_type: 'video' | 'track' | 'image'
          item_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          item_type: 'video' | 'track' | 'image'
          item_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          item_type?: 'video' | 'track' | 'image'
          item_id?: string
          created_at?: string
        }
      }
      playlists: {
        Row: {
          id: string
          owner_id: string
          name: string
          is_public: boolean
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          is_public?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          is_public?: boolean
          created_at?: string
        }
      }
      playlist_tracks: {
        Row: {
          playlist_id: string
          track_id: string
          position: number
          added_at: string
        }
        Insert: {
          playlist_id: string
          track_id: string
          position: number
          added_at?: string
        }
        Update: {
          playlist_id?: string
          track_id?: string
          position?: number
          added_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          item_type: 'video' | 'track' | 'image'
          item_id: string
          reason: string
          note: string | null
          status: 'open' | 'reviewed'
          created_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          item_type: 'video' | 'track' | 'image'
          item_id: string
          reason: string
          note?: string | null
          status?: 'open' | 'reviewed'
          created_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          item_type?: 'video' | 'track' | 'image'
          item_id?: string
          reason?: string
          note?: string | null
          status?: 'open' | 'reviewed'
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
