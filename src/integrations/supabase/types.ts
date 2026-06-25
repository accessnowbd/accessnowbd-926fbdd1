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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      abandoned_checkouts: {
        Row: {
          admin_note: string | null
          contacted_at: string | null
          coupon_code: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          items: Json
          last_seen_at: string
          metadata: Json
          page_url: string | null
          phone: string
          recovered_at: string | null
          recovered_order_id: string | null
          session_key: string | null
          source: string | null
          stage: string
          status: string
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_note?: string | null
          contacted_at?: string | null
          coupon_code?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          items?: Json
          last_seen_at?: string
          metadata?: Json
          page_url?: string | null
          phone?: string
          recovered_at?: string | null
          recovered_order_id?: string | null
          session_key?: string | null
          source?: string | null
          stage?: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_note?: string | null
          contacted_at?: string | null
          coupon_code?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          items?: Json
          last_seen_at?: string
          metadata?: Json
          page_url?: string | null
          phone?: string
          recovered_at?: string | null
          recovered_order_id?: string | null
          session_key?: string | null
          source?: string | null
          stage?: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      accessibility_reports: {
        Row: {
          created_at: string
          description: string
          id: string
          issue_type: string
          metadata: Json
          page_url: string | null
          priority: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          issue_type?: string
          metadata?: Json
          page_url?: string | null
          priority?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          issue_type?: string
          metadata?: Json
          page_url?: string | null
          priority?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
        }
        Relationships: []
      }
      admin_mfa_grants: {
        Row: {
          expires_at: string
          granted_at: string
          id: string
          ip: string | null
          method: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          expires_at: string
          granted_at?: string
          id?: string
          ip?: string | null
          method: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          expires_at?: string
          granted_at?: string
          id?: string
          ip?: string | null
          method?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_otp_codes: {
        Row: {
          attempts: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          user_id: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          user_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_records: {
        Row: {
          created_at: string
          data: Json
          id: string
          is_active: boolean
          kind: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          is_active?: boolean
          kind: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          is_active?: boolean
          kind?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string
          description: string
          id: string
          is_active: boolean
          logo_url: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
          website: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          logo_url?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
          website?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          logo_url?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
          website?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string
          id: string
          image_url: string
          is_active: boolean
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          description: string
          ends_at: string | null
          id: string
          is_active: boolean
          max_discount: number | null
          min_subtotal: number
          starts_at: string | null
          type: string
          updated_at: string
          usage_limit: number | null
          used_count: number
          value: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_subtotal?: number
          starts_at?: string | null
          type?: string
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          value?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_subtotal?: number
          starts_at?: string | null
          type?: string
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          value?: number
        }
        Relationships: []
      }
      digital_downloads_log: {
        Row: {
          downloaded_at: string
          file_id: string | null
          id: string
          ip: string
          order_id: string | null
          product_slug: string
          user_id: string | null
        }
        Insert: {
          downloaded_at?: string
          file_id?: string | null
          id?: string
          ip?: string
          order_id?: string | null
          product_slug: string
          user_id?: string | null
        }
        Update: {
          downloaded_at?: string
          file_id?: string | null
          id?: string
          ip?: string
          order_id?: string | null
          product_slug?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "digital_downloads_log_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "product_digital_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_downloads_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_downloads_log_product_slug_fkey"
            columns: ["product_slug"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["slug"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      live_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
          user_id: string | null
          visitor_label: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
          user_id?: string | null
          visitor_label?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
          user_id?: string | null
          visitor_label?: string | null
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          source: string | null
          status: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name?: string | null
          source?: string | null
          status?: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          source?: string | null
          status?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read_status: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read_status?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read_status?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          admin_note: string | null
          created_at: string
          delivered_at: string | null
          delivered_credentials: Json | null
          email: string
          full_name: string
          id: string
          items: Json
          payment_method: string
          payment_screenshot_url: string | null
          payment_status: string
          phone: string
          status: string
          total: number
          transaction_id: string
          updated_at: string
          user_id: string
          whatsapp_sent: boolean
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          delivered_at?: string | null
          delivered_credentials?: Json | null
          email: string
          full_name: string
          id?: string
          items: Json
          payment_method: string
          payment_screenshot_url?: string | null
          payment_status?: string
          phone: string
          status?: string
          total: number
          transaction_id: string
          updated_at?: string
          user_id: string
          whatsapp_sent?: boolean
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          delivered_at?: string | null
          delivered_credentials?: Json | null
          email?: string
          full_name?: string
          id?: string
          items?: Json
          payment_method?: string
          payment_screenshot_url?: string | null
          payment_status?: string
          phone?: string
          status?: string
          total?: number
          transaction_id?: string
          updated_at?: string
          user_id?: string
          whatsapp_sent?: boolean
        }
        Relationships: []
      }
      product_digital_files: {
        Row: {
          content_type: string
          created_at: string
          download_limit_per_order: number
          file_name: string
          file_path: string
          id: string
          product_slug: string
          size_bytes: number
        }
        Insert: {
          content_type?: string
          created_at?: string
          download_limit_per_order?: number
          file_name: string
          file_path: string
          id?: string
          product_slug: string
          size_bytes?: number
        }
        Update: {
          content_type?: string
          created_at?: string
          download_limit_per_order?: number
          file_name?: string
          file_path?: string
          id?: string
          product_slug?: string
          size_bytes?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_digital_files_product_slug_fkey"
            columns: ["product_slug"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["slug"]
          },
        ]
      }
      product_license_keys: {
        Row: {
          assigned_at: string | null
          assigned_order_id: string | null
          assigned_user_id: string | null
          created_at: string
          id: string
          license_key: string
          note: string
          product_slug: string
          status: Database["public"]["Enums"]["license_key_status"]
          variant_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_order_id?: string | null
          assigned_user_id?: string | null
          created_at?: string
          id?: string
          license_key: string
          note?: string
          product_slug: string
          status?: Database["public"]["Enums"]["license_key_status"]
          variant_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_order_id?: string | null
          assigned_user_id?: string | null
          created_at?: string
          id?: string
          license_key?: string
          note?: string
          product_slug?: string
          status?: Database["public"]["Enums"]["license_key_status"]
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_license_keys_assigned_order_id_fkey"
            columns: ["assigned_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_license_keys_product_slug_fkey"
            columns: ["product_slug"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "product_license_keys_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_media: {
        Row: {
          alt: string
          created_at: string
          id: string
          is_primary: boolean
          product_slug: string
          sort_order: number
          url: string
        }
        Insert: {
          alt?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          product_slug: string
          sort_order?: number
          url: string
        }
        Update: {
          alt?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          product_slug?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_media_product_slug_fkey"
            columns: ["product_slug"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["slug"]
          },
        ]
      }
      product_reviews: {
        Row: {
          comment: string
          created_at: string
          id: string
          is_approved: boolean
          product_slug: string
          rating: number
          reviewer_name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          is_approved?: boolean
          product_slug: string
          rating: number
          reviewer_name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          product_slug?: string
          rating?: number
          reviewer_name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      product_tags: {
        Row: {
          product_slug: string
          tag_id: string
        }
        Insert: {
          product_slug: string
          tag_id: string
        }
        Update: {
          product_slug?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_tags_product_slug_fkey"
            columns: ["product_slug"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "product_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          compare_at_price: number | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          options: Json
          price: number | null
          product_slug: string
          sku: string | null
          sort_order: number
          stock: number
          updated_at: string
        }
        Insert: {
          compare_at_price?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          options?: Json
          price?: number | null
          product_slug: string
          sku?: string | null
          sort_order?: number
          stock?: number
          updated_at?: string
        }
        Update: {
          compare_at_price?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          options?: Json
          price?: number | null
          product_slug?: string
          sku?: string | null
          sort_order?: number
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_slug_fkey"
            columns: ["product_slug"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["slug"]
          },
        ]
      }
      products: {
        Row: {
          badge: string | null
          brand_id: string | null
          canonical_url: string
          category: string
          category_id: string | null
          created_at: string
          delivery_time: string
          description: string
          download_limit: number
          emoji: string
          features: Json
          gradient: string
          image_url: string
          is_active: boolean
          is_digital: boolean
          meta: Json
          name: string
          og_image: string
          plans: Json
          scheduled_publish_at: string | null
          seo_description: string
          seo_keywords: string
          seo_title: string
          short_description: string
          sku: string | null
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["product_status"]
          stock_status: string
          tagline: string
          updated_at: string
          views: number
          warranty: string
          whatsapp_order_text: string
        }
        Insert: {
          badge?: string | null
          brand_id?: string | null
          canonical_url?: string
          category: string
          category_id?: string | null
          created_at?: string
          delivery_time?: string
          description?: string
          download_limit?: number
          emoji?: string
          features?: Json
          gradient?: string
          image_url?: string
          is_active?: boolean
          is_digital?: boolean
          meta?: Json
          name: string
          og_image?: string
          plans?: Json
          scheduled_publish_at?: string | null
          seo_description?: string
          seo_keywords?: string
          seo_title?: string
          short_description?: string
          sku?: string | null
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["product_status"]
          stock_status?: string
          tagline?: string
          updated_at?: string
          views?: number
          warranty?: string
          whatsapp_order_text?: string
        }
        Update: {
          badge?: string | null
          brand_id?: string | null
          canonical_url?: string
          category?: string
          category_id?: string | null
          created_at?: string
          delivery_time?: string
          description?: string
          download_limit?: number
          emoji?: string
          features?: Json
          gradient?: string
          image_url?: string
          is_active?: boolean
          is_digital?: boolean
          meta?: Json
          name?: string
          og_image?: string
          plans?: Json
          scheduled_publish_at?: string | null
          seo_description?: string
          seo_keywords?: string
          seo_title?: string
          short_description?: string
          sku?: string | null
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["product_status"]
          stock_status?: string
          tagline?: string
          updated_at?: string
          views?: number
          warranty?: string
          whatsapp_order_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          country: string | null
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      promotions: {
        Row: {
          badge: string | null
          code: string | null
          created_at: string
          description: string
          discount_percent: number | null
          ends_at: string | null
          id: string
          is_active: boolean
          product_slug: string | null
          starts_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          badge?: string | null
          code?: string | null
          created_at?: string
          description?: string
          discount_percent?: number | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          product_slug?: string | null
          starts_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          badge?: string | null
          code?: string | null
          created_at?: string
          description?: string
          discount_percent?: number | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          product_slug?: string | null
          starts_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotions_product_slug_fkey"
            columns: ["product_slug"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["slug"]
          },
        ]
      }
      renewal_reminders_sent: {
        Row: {
          expiry_date: string
          id: string
          item_key: string
          order_id: string
          recipient_email: string
          sent_at: string
        }
        Insert: {
          expiry_date: string
          id?: string
          item_key: string
          order_id: string
          recipient_email: string
          sent_at?: string
        }
        Update: {
          expiry_date?: string
          id?: string
          item_key?: string
          order_id?: string
          recipient_email?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "renewal_reminders_sent_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          id: string
          message: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          id?: string
          message: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          id?: string
          message?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          email: string
          id: string
          name: string
          role: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email: string
          id?: string
          name: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string
          id?: string
          name?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          sender_role: string
          sender_user_id: string
          ticket_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          sender_role: string
          sender_user_id: string
          ticket_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          sender_role?: string
          sender_user_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_events_log: {
        Row: {
          created_at: string
          error_message: string | null
          event_name: string
          id: string
          payload: Json
          provider: string
          response: Json | null
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_name: string
          id?: string
          payload?: Json
          provider: string
          response?: Json | null
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_name?: string
          id?: string
          payload?: Json
          provider?: string
          response?: Json | null
          status?: string
        }
        Relationships: []
      }
      tracking_pixels: {
        Row: {
          access_token: string | null
          account_id: string | null
          conversion_label: string | null
          created_at: string
          custom_script: string | null
          enabled: boolean
          events_config: Json
          id: string
          label: string | null
          notes: string | null
          pixel_id: string | null
          provider: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          account_id?: string | null
          conversion_label?: string | null
          created_at?: string
          custom_script?: string | null
          enabled?: boolean
          events_config?: Json
          id?: string
          label?: string | null
          notes?: string | null
          pixel_id?: string | null
          provider: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          account_id?: string | null
          conversion_label?: string | null
          created_at?: string
          custom_script?: string | null
          enabled?: boolean
          events_config?: Json
          id?: string
          label?: string | null
          notes?: string | null
          pixel_id?: string | null
          provider?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_topups: {
        Row: {
          admin_note: string | null
          amount: number
          created_at: string
          id: string
          method: string
          note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          screenshot_path: string | null
          sender_number: string | null
          status: Database["public"]["Enums"]["wallet_topup_status"]
          txn_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount: number
          created_at?: string
          id?: string
          method: string
          note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_path?: string | null
          sender_number?: string | null
          status?: Database["public"]["Enums"]["wallet_topup_status"]
          txn_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          created_at?: string
          id?: string
          method?: string
          note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_path?: string | null
          sender_number?: string | null
          status?: Database["public"]["Enums"]["wallet_topup_status"]
          txn_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          created_by: string | null
          id: string
          reason: string | null
          ref_order_id: string | null
          ref_topup_id: string | null
          type: Database["public"]["Enums"]["wallet_txn_type"]
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          created_by?: string | null
          id?: string
          reason?: string | null
          ref_order_id?: string | null
          ref_topup_id?: string | null
          type: Database["public"]["Enums"]["wallet_txn_type"]
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          created_by?: string | null
          id?: string
          reason?: string | null
          ref_order_id?: string | null
          ref_topup_id?: string | null
          type?: Database["public"]["Enums"]["wallet_txn_type"]
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      promotions_public: {
        Row: {
          badge: string | null
          created_at: string | null
          description: string | null
          discount_percent: number | null
          ends_at: string | null
          id: string | null
          is_active: boolean | null
          product_slug: string | null
          starts_at: string | null
          title: string | null
        }
        Insert: {
          badge?: string | null
          created_at?: string | null
          description?: string | null
          discount_percent?: number | null
          ends_at?: string | null
          id?: string | null
          is_active?: boolean | null
          product_slug?: string | null
          starts_at?: string | null
          title?: string | null
        }
        Update: {
          badge?: string | null
          created_at?: string | null
          description?: string | null
          discount_percent?: number | null
          ends_at?: string | null
          id?: string | null
          is_active?: boolean | null
          product_slug?: string | null
          starts_at?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promotions_product_slug_fkey"
            columns: ["product_slug"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["slug"]
          },
        ]
      }
      tracking_pixels_public: {
        Row: {
          account_id: string | null
          conversion_label: string | null
          custom_script: string | null
          enabled: boolean | null
          events_config: Json | null
          id: string | null
          pixel_id: string | null
          provider: string | null
          sort_order: number | null
        }
        Insert: {
          account_id?: string | null
          conversion_label?: string | null
          custom_script?: string | null
          enabled?: boolean | null
          events_config?: Json | null
          id?: string | null
          pixel_id?: string | null
          provider?: string | null
          sort_order?: number | null
        }
        Update: {
          account_id?: string | null
          conversion_label?: string | null
          custom_script?: string | null
          enabled?: boolean | null
          events_config?: Json | null
          id?: string | null
          pixel_id?: string | null
          provider?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      v_has_role_permissions: {
        Row: {
          can_execute: boolean | null
          grantee: string | null
          signature: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _wallet_apply: {
        Args: {
          _created_by: string
          _delta: number
          _reason: string
          _ref_order: string
          _ref_topup: string
          _type: Database["public"]["Enums"]["wallet_txn_type"]
          _user_id: string
        }
        Returns: {
          amount: number
          balance_after: number
          created_at: string
          created_by: string | null
          id: string
          reason: string | null
          ref_order_id: string | null
          ref_topup_id: string | null
          type: Database["public"]["Enums"]["wallet_txn_type"]
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "wallet_transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_adjust_wallet: {
        Args: { _amount: number; _reason: string; _user_id: string }
        Returns: {
          amount: number
          balance_after: number
          created_at: string
          created_by: string | null
          id: string
          reason: string | null
          ref_order_id: string | null
          ref_topup_id: string | null
          type: Database["public"]["Enums"]["wallet_txn_type"]
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "wallet_transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_credit_wallet: {
        Args: {
          _amount: number
          _reason: string
          _ref_order?: string
          _type: Database["public"]["Enums"]["wallet_txn_type"]
          _user_id: string
        }
        Returns: {
          amount: number
          balance_after: number
          created_at: string
          created_by: string | null
          id: string
          reason: string | null
          ref_order_id: string | null
          ref_topup_id: string | null
          type: Database["public"]["Enums"]["wallet_txn_type"]
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "wallet_transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      approve_wallet_topup: {
        Args: { _admin_note?: string; _topup_id: string }
        Returns: {
          amount: number
          balance_after: number
          created_at: string
          created_by: string | null
          id: string
          reason: string | null
          ref_order_id: string | null
          ref_topup_id: string | null
          type: Database["public"]["Enums"]["wallet_txn_type"]
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "wallet_transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      redeem_coupon: { Args: { _code: string }; Returns: undefined }
      reject_wallet_topup: {
        Args: { _admin_note?: string; _topup_id: string }
        Returns: undefined
      }
      spend_wallet: {
        Args: { _amount: number; _reason?: string; _ref_order?: string }
        Returns: {
          amount: number
          balance_after: number
          created_at: string
          created_by: string | null
          id: string
          reason: string | null
          ref_order_id: string | null
          ref_topup_id: string | null
          type: Database["public"]["Enums"]["wallet_txn_type"]
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "wallet_transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      validate_coupon: {
        Args: { _code: string; _subtotal: number }
        Returns: {
          code: string
          discount: number
          label: string
          reason: string
          valid: boolean
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      license_key_status: "available" | "assigned" | "revoked"
      product_status: "draft" | "scheduled" | "published" | "archived"
      wallet_topup_status: "pending" | "approved" | "rejected"
      wallet_txn_type:
        | "topup"
        | "refund"
        | "cashback"
        | "referral"
        | "spend"
        | "adjustment"
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
      app_role: ["admin", "user"],
      license_key_status: ["available", "assigned", "revoked"],
      product_status: ["draft", "scheduled", "published", "archived"],
      wallet_topup_status: ["pending", "approved", "rejected"],
      wallet_txn_type: [
        "topup",
        "refund",
        "cashback",
        "referral",
        "spend",
        "adjustment",
      ],
    },
  },
} as const
