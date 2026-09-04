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
      account_actions: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string | null
          id: string
          reason: string
          resolved_at: string | null
          salon_id: string
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string | null
          id?: string
          reason: string
          resolved_at?: string | null
          salon_id: string
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string | null
          id?: string
          reason?: string
          resolved_at?: string | null
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_actions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profile_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_actions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_actions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_actions_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      account_warnings: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          reason: string
          salon_id: string | null
          severity: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          reason: string
          salon_id?: string | null
          severity: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          reason?: string
          salon_id?: string | null
          severity?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "account_warnings_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_warnings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_warnings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_warnings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      addons: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          name: string
          price: number | null
          store_id: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id: string
          name: string
          price?: number | null
          store_id: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name?: string
          price?: number | null
          store_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_id?: string | null
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profile_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_slots: {
        Row: {
          block_reason: string | null
          booked_by: string | null
          booking_id: string | null
          client_id: string | null
          created_at: string | null
          ends_at: string
          id: string
          last_minute_discount_percent: number | null
          price_override: number | null
          salon_id: string
          service_id: string
          staff_member_id: string | null
          starts_at: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          block_reason?: string | null
          booked_by?: string | null
          booking_id?: string | null
          client_id?: string | null
          created_at?: string | null
          ends_at: string
          id?: string
          last_minute_discount_percent?: number | null
          price_override?: number | null
          salon_id: string
          service_id: string
          staff_member_id?: string | null
          starts_at: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          block_reason?: string | null
          booked_by?: string | null
          booking_id?: string | null
          client_id?: string | null
          created_at?: string | null
          ends_at?: string
          id?: string
          last_minute_discount_percent?: number | null
          price_override?: number | null
          salon_id?: string
          service_id?: string
          staff_member_id?: string | null
          starts_at?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_slots_booked_by_fkey"
            columns: ["booked_by"]
            isOneToOne: false
            referencedRelation: "profile_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_slots_booked_by_fkey"
            columns: ["booked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_slots_booked_by_fkey"
            columns: ["booked_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_slots_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "salon_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_slots_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_slots_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_slots_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_slots_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_ratings_view"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "fk_slots_booking"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      barber_chairs: {
        Row: {
          buffer_minutes: number | null
          chair_count: number
          created_at: string | null
          id: string
          salon_id: string
        }
        Insert: {
          buffer_minutes?: number | null
          chair_count?: number
          created_at?: string | null
          id?: string
          salon_id: string
        }
        Update: {
          buffer_minutes?: number | null
          chair_count?: number
          created_at?: string | null
          id?: string
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "barber_chairs_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: true
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      barber_cut_history: {
        Row: {
          beard_style: string | null
          booking_id: string | null
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          fade_type: string | null
          hair_design: string | null
          id: string
          lineup: boolean | null
          notes: string | null
          photo_url: string | null
          product_used: string | null
          salon_id: string
          side_length: string | null
          staff_member_id: string | null
          top_style: string | null
          walkin_id: string | null
        }
        Insert: {
          beard_style?: string | null
          booking_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          fade_type?: string | null
          hair_design?: string | null
          id?: string
          lineup?: boolean | null
          notes?: string | null
          photo_url?: string | null
          product_used?: string | null
          salon_id: string
          side_length?: string | null
          staff_member_id?: string | null
          top_style?: string | null
          walkin_id?: string | null
        }
        Update: {
          beard_style?: string | null
          booking_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          fade_type?: string | null
          hair_design?: string | null
          id?: string
          lineup?: boolean | null
          notes?: string | null
          photo_url?: string | null
          product_used?: string | null
          salon_id?: string
          side_length?: string | null
          staff_member_id?: string | null
          top_style?: string | null
          walkin_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "barber_cut_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barber_cut_history_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barber_cut_history_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barber_cut_history_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_ratings_view"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "barber_cut_history_walkin_id_fkey"
            columns: ["walkin_id"]
            isOneToOne: false
            referencedRelation: "barber_walkin_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      barber_loyalty_cards: {
        Row: {
          created_at: string | null
          customer_id: string
          id: string
          program_id: string
          qr_token: string
          redeemed_at: string | null
          salon_id: string
          stamps: number
          status: string
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          id?: string
          program_id: string
          qr_token: string
          redeemed_at?: string | null
          salon_id: string
          stamps?: number
          status?: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          id?: string
          program_id?: string
          qr_token?: string
          redeemed_at?: string | null
          salon_id?: string
          stamps?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "barber_loyalty_cards_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "barber_loyalty_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barber_loyalty_cards_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      barber_loyalty_history: {
        Row: {
          card_id: string
          completed_at: string
          created_at: string | null
          customer_id: string
          id: string
          redeemed_at: string | null
          reward_type: string
          reward_value: number | null
          salon_id: string
          stamps_collected: number
        }
        Insert: {
          card_id: string
          completed_at: string
          created_at?: string | null
          customer_id: string
          id?: string
          redeemed_at?: string | null
          reward_type: string
          reward_value?: number | null
          salon_id: string
          stamps_collected: number
        }
        Update: {
          card_id?: string
          completed_at?: string
          created_at?: string | null
          customer_id?: string
          id?: string
          redeemed_at?: string | null
          reward_type?: string
          reward_value?: number | null
          salon_id?: string
          stamps_collected?: number
        }
        Relationships: [
          {
            foreignKeyName: "barber_loyalty_history_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "barber_loyalty_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barber_loyalty_history_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      barber_loyalty_programs: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          reward_service_id: string | null
          reward_type: string
          reward_value: number | null
          salon_id: string
          stamps_required: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          reward_service_id?: string | null
          reward_type?: string
          reward_value?: number | null
          salon_id: string
          stamps_required?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          reward_service_id?: string | null
          reward_type?: string
          reward_value?: number | null
          salon_id?: string
          stamps_required?: number
        }
        Relationships: [
          {
            foreignKeyName: "barber_loyalty_programs_reward_service_id_fkey"
            columns: ["reward_service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barber_loyalty_programs_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: true
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      barber_walkin_queue: {
        Row: {
          assigned_barber_id: string | null
          called_at: string | null
          completed_at: string | null
          converted_to_booking: boolean | null
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          estimated_wait_minutes: number | null
          id: string
          join_method: string | null
          joined_at: string | null
          payment_intent_id: string | null
          position: number
          preferred_barber_id: string | null
          salon_id: string
          service_id: string | null
          started_at: string | null
          status: string
          ticket_code: string | null
          tracking_token: string | null
          tracking_token_hash: string | null
        }
        Insert: {
          assigned_barber_id?: string | null
          called_at?: string | null
          completed_at?: string | null
          converted_to_booking?: boolean | null
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          estimated_wait_minutes?: number | null
          id?: string
          join_method?: string | null
          joined_at?: string | null
          payment_intent_id?: string | null
          position: number
          preferred_barber_id?: string | null
          salon_id: string
          service_id?: string | null
          started_at?: string | null
          status?: string
          ticket_code?: string | null
          tracking_token?: string | null
          tracking_token_hash?: string | null
        }
        Update: {
          assigned_barber_id?: string | null
          called_at?: string | null
          completed_at?: string | null
          converted_to_booking?: boolean | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          estimated_wait_minutes?: number | null
          id?: string
          join_method?: string | null
          joined_at?: string | null
          payment_intent_id?: string | null
          position?: number
          preferred_barber_id?: string | null
          salon_id?: string
          service_id?: string | null
          started_at?: string | null
          status?: string
          ticket_code?: string | null
          tracking_token?: string | null
          tracking_token_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "barber_walkin_queue_assigned_barber_id_fkey"
            columns: ["assigned_barber_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barber_walkin_queue_assigned_barber_id_fkey"
            columns: ["assigned_barber_id"]
            isOneToOne: false
            referencedRelation: "staff_ratings_view"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "barber_walkin_queue_preferred_barber_id_fkey"
            columns: ["preferred_barber_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barber_walkin_queue_preferred_barber_id_fkey"
            columns: ["preferred_barber_id"]
            isOneToOne: false
            referencedRelation: "staff_ratings_view"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "barber_walkin_queue_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barber_walkin_queue_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_disputes: {
        Row: {
          admin_responded_at: string | null
          admin_response: string | null
          booking_id: string
          created_at: string | null
          customer_responded_at: string | null
          customer_response: string | null
          description: string | null
          direction: string
          eligibility: string | null
          escalated_at: string | null
          expires_at: string | null
          fast_track_recommended: boolean
          guest_email: string | null
          guest_name: string | null
          guest_phone: string | null
          id: string
          idempotency_key: string | null
          issue_type: string
          mediation_deadline_at: string | null
          mediation_started_at: string | null
          reason_code: string | null
          reported_id: string | null
          reporter_id: string | null
          requested_amount: number | null
          requested_by_user_id: string | null
          resolution: string | null
          resolved_amount: number | null
          resolved_at: string | null
          resolved_by: string | null
          salon_responded_at: string | null
          salon_response: string | null
          status: string
          stripe_refund_id: string | null
          updated_at: string | null
        }
        Insert: {
          admin_responded_at?: string | null
          admin_response?: string | null
          booking_id: string
          created_at?: string | null
          customer_responded_at?: string | null
          customer_response?: string | null
          description?: string | null
          direction?: string
          eligibility?: string | null
          escalated_at?: string | null
          expires_at?: string | null
          fast_track_recommended?: boolean
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          idempotency_key?: string | null
          issue_type?: string
          mediation_deadline_at?: string | null
          mediation_started_at?: string | null
          reason_code?: string | null
          reported_id?: string | null
          reporter_id?: string | null
          requested_amount?: number | null
          requested_by_user_id?: string | null
          resolution?: string | null
          resolved_amount?: number | null
          resolved_at?: string | null
          resolved_by?: string | null
          salon_responded_at?: string | null
          salon_response?: string | null
          status?: string
          stripe_refund_id?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_responded_at?: string | null
          admin_response?: string | null
          booking_id?: string
          created_at?: string | null
          customer_responded_at?: string | null
          customer_response?: string | null
          description?: string | null
          direction?: string
          eligibility?: string | null
          escalated_at?: string | null
          expires_at?: string | null
          fast_track_recommended?: boolean
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          idempotency_key?: string | null
          issue_type?: string
          mediation_deadline_at?: string | null
          mediation_started_at?: string | null
          reason_code?: string | null
          reported_id?: string | null
          reporter_id?: string | null
          requested_amount?: number | null
          requested_by_user_id?: string | null
          resolution?: string | null
          resolved_amount?: number | null
          resolved_at?: string | null
          resolved_by?: string | null
          salon_responded_at?: string | null
          salon_response?: string | null
          status?: string
          stripe_refund_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_disputes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_waitlist: {
        Row: {
          created_at: string | null
          id: string
          preferred_date: string | null
          salon_id: string
          service_id: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          preferred_date?: string | null
          salon_id: string
          service_id?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          preferred_date?: string | null
          salon_id?: string
          service_id?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_waitlist_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_waitlist_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          access_token_expires_at: string | null
          access_token_hash: string | null
          acquisition_source: string | null
          anonymized_at: string | null
          applied_tier: string | null
          arrived_at: string | null
          attributed_search_event_id: string | null
          bundle_id: string | null
          cancel_link_used_at: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          completed_at: string | null
          confirm_link_used_at: string | null
          consumed_at: string | null
          created_at: string | null
          crm_photo_url: string | null
          customer_note: string | null
          deposit_amount: number | null
          ends_at: string
          estimated_price: number | null
          extras_addons: string | null
          extras_bleaching: boolean | null
          fee_charge_claimed_at: string | null
          fee_charge_intent_id: string | null
          fee_charge_kind: string | null
          fee_charge_status: string | null
          fee_charged_amount: number | null
          final_price: number | null
          gcal_event_id: string | null
          group_booking_id: string | null
          guest_email: string | null
          guest_name: string | null
          guest_phone: string | null
          id: string
          is_express_rebook: boolean | null
          is_first_visit: boolean
          is_recurring: boolean | null
          member_discount_reserved: boolean
          net_amount: number | null
          outlook_event_id: string | null
          paid_amount: number | null
          paid_via: string | null
          payment_intent_id: string | null
          payment_status: string | null
          platform_fee: number | null
          policy_accepted_at: string | null
          policy_snapshot: Json | null
          price_confirmed_at: string | null
          price_increase_approved: boolean | null
          price_increase_requested_at: string | null
          price_paid: number
          promo_code: string | null
          promo_counted_at: string | null
          promo_use_released: boolean
          promo_use_reserved: boolean
          rebooked_from_id: string | null
          recurring_group_id: string | null
          reference_code: string | null
          referral_code: string | null
          refunded_amount: number
          remaining_at_salon: number | null
          reschedule_requested_at: string | null
          reschedule_status: string | null
          reschedule_to: string | null
          review_prompt_sent: boolean | null
          salon_id: string
          service_id: string
          service_revenue: number | null
          slot_id: string
          email_sent_1h: boolean | null
          email_sent_24h: boolean | null
          sms_sent_1h: boolean | null
          sms_sent_24h: boolean | null
          staff_member_id: string | null
          starts_at: string
          status: string | null
          stripe_customer_id: string | null
          stripe_payment_method_id: string | null
          stripe_setup_intent_id: string | null
          tier_discount_amount: number | null
          updated_at: string | null
          user_id: string | null
          vat_amount: number | null
          vat_rate: number | null
          voucher_code: string | null
          walkin_queue_id: string | null
        }
        Insert: {
          access_token_expires_at?: string | null
          access_token_hash?: string | null
          acquisition_source?: string | null
          anonymized_at?: string | null
          applied_tier?: string | null
          arrived_at?: string | null
          attributed_search_event_id?: string | null
          bundle_id?: string | null
          cancel_link_used_at?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          confirm_link_used_at?: string | null
          consumed_at?: string | null
          created_at?: string | null
          crm_photo_url?: string | null
          customer_note?: string | null
          deposit_amount?: number | null
          ends_at: string
          estimated_price?: number | null
          extras_addons?: string | null
          extras_bleaching?: boolean | null
          fee_charge_claimed_at?: string | null
          fee_charge_intent_id?: string | null
          fee_charge_kind?: string | null
          fee_charge_status?: string | null
          fee_charged_amount?: number | null
          final_price?: number | null
          gcal_event_id?: string | null
          group_booking_id?: string | null
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          is_express_rebook?: boolean | null
          is_first_visit?: boolean
          is_recurring?: boolean | null
          member_discount_reserved?: boolean
          net_amount?: number | null
          outlook_event_id?: string | null
          paid_amount?: number | null
          paid_via?: string | null
          payment_intent_id?: string | null
          payment_status?: string | null
          platform_fee?: number | null
          policy_accepted_at?: string | null
          policy_snapshot?: Json | null
          price_confirmed_at?: string | null
          price_increase_approved?: boolean | null
          price_increase_requested_at?: string | null
          price_paid: number
          promo_code?: string | null
          promo_counted_at?: string | null
          promo_use_released?: boolean
          promo_use_reserved?: boolean
          rebooked_from_id?: string | null
          recurring_group_id?: string | null
          reference_code?: string | null
          referral_code?: string | null
          refunded_amount?: number
          remaining_at_salon?: number | null
          reschedule_requested_at?: string | null
          reschedule_status?: string | null
          reschedule_to?: string | null
          review_prompt_sent?: boolean | null
          salon_id: string
          service_id: string
          service_revenue?: number | null
          slot_id: string
          email_sent_1h?: boolean | null
          email_sent_24h?: boolean | null
          sms_sent_1h?: boolean | null
          sms_sent_24h?: boolean | null
          staff_member_id?: string | null
          starts_at: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string | null
          stripe_setup_intent_id?: string | null
          tier_discount_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
          vat_amount?: number | null
          vat_rate?: number | null
          voucher_code?: string | null
          walkin_queue_id?: string | null
        }
        Update: {
          access_token_expires_at?: string | null
          access_token_hash?: string | null
          acquisition_source?: string | null
          anonymized_at?: string | null
          applied_tier?: string | null
          arrived_at?: string | null
          attributed_search_event_id?: string | null
          bundle_id?: string | null
          cancel_link_used_at?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          confirm_link_used_at?: string | null
          consumed_at?: string | null
          created_at?: string | null
          crm_photo_url?: string | null
          customer_note?: string | null
          deposit_amount?: number | null
          ends_at?: string
          estimated_price?: number | null
          extras_addons?: string | null
          extras_bleaching?: boolean | null
          fee_charge_claimed_at?: string | null
          fee_charge_intent_id?: string | null
          fee_charge_kind?: string | null
          fee_charge_status?: string | null
          fee_charged_amount?: number | null
          final_price?: number | null
          gcal_event_id?: string | null
          group_booking_id?: string | null
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          is_express_rebook?: boolean | null
          is_first_visit?: boolean
          is_recurring?: boolean | null
          member_discount_reserved?: boolean
          net_amount?: number | null
          outlook_event_id?: string | null
          paid_amount?: number | null
          paid_via?: string | null
          payment_intent_id?: string | null
          payment_status?: string | null
          platform_fee?: number | null
          policy_accepted_at?: string | null
          policy_snapshot?: Json | null
          price_confirmed_at?: string | null
          price_increase_approved?: boolean | null
          price_increase_requested_at?: string | null
          price_paid?: number
          promo_code?: string | null
          promo_counted_at?: string | null
          promo_use_released?: boolean
          promo_use_reserved?: boolean
          rebooked_from_id?: string | null
          recurring_group_id?: string | null
          reference_code?: string | null
          referral_code?: string | null
          refunded_amount?: number
          remaining_at_salon?: number | null
          reschedule_requested_at?: string | null
          reschedule_status?: string | null
          reschedule_to?: string | null
          review_prompt_sent?: boolean | null
          salon_id?: string
          service_id?: string
          service_revenue?: number | null
          slot_id?: string
          email_sent_1h?: boolean | null
          email_sent_24h?: boolean | null
          sms_sent_1h?: boolean | null
          sms_sent_24h?: boolean | null
          staff_member_id?: string | null
          starts_at?: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string | null
          stripe_setup_intent_id?: string | null
          tier_discount_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
          vat_amount?: number | null
          vat_rate?: number | null
          voucher_code?: string | null
          walkin_queue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_attributed_search_event_id_fkey"
            columns: ["attributed_search_event_id"]
            isOneToOne: false
            referencedRelation: "search_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "service_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_rebooked_from_id_fkey"
            columns: ["rebooked_from_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "availability_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "availability_slots_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_ratings_view"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_walkin_queue_id_fkey"
            columns: ["walkin_queue_id"]
            isOneToOne: false
            referencedRelation: "barber_walkin_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_group_booking"
            columns: ["group_booking_id"]
            isOneToOne: false
            referencedRelation: "group_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bridal_workflows: {
        Row: {
          approved_look_photo_url: string | null
          client_id: string
          created_at: string | null
          event_date: string
          event_type: string | null
          final_booking_id: string | null
          id: string
          inspiration_urls: string[] | null
          notes: string | null
          salon_id: string
          status: string | null
          trial_booking_id: string | null
        }
        Insert: {
          approved_look_photo_url?: string | null
          client_id: string
          created_at?: string | null
          event_date: string
          event_type?: string | null
          final_booking_id?: string | null
          id?: string
          inspiration_urls?: string[] | null
          notes?: string | null
          salon_id: string
          status?: string | null
          trial_booking_id?: string | null
        }
        Update: {
          approved_look_photo_url?: string | null
          client_id?: string
          created_at?: string | null
          event_date?: string
          event_type?: string | null
          final_booking_id?: string | null
          id?: string
          inspiration_urls?: string[] | null
          notes?: string | null
          salon_id?: string
          status?: string | null
          trial_booking_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bridal_workflows_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profile_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bridal_workflows_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bridal_workflows_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bridal_workflows_final_booking_id_fkey"
            columns: ["final_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bridal_workflows_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bridal_workflows_trial_booking_id_fkey"
            columns: ["trial_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_tokens: {
        Row: {
          access_token: string
          created_at: string | null
          expires_at: string
          id: string
          provider: string
          refresh_token: string | null
          scope: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          expires_at: string
          id?: string
          provider: string
          refresh_token?: string | null
          scope?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          provider?: string
          refresh_token?: string | null
          scope?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      case_events: {
        Row: {
          action: string
          actor_role: string
          actor_user_id: string | null
          amount: number | null
          created_at: string
          dispute_id: string
          from_status: string | null
          id: string
          note: string | null
          to_status: string | null
        }
        Insert: {
          action: string
          actor_role: string
          actor_user_id?: string | null
          amount?: number | null
          created_at?: string
          dispute_id: string
          from_status?: string | null
          id?: string
          note?: string | null
          to_status?: string | null
        }
        Update: {
          action?: string
          actor_role?: string
          actor_user_id?: string | null
          amount?: number | null
          created_at?: string
          dispute_id?: string
          from_status?: string | null
          id?: string
          note?: string | null
          to_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_events_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "booking_disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_templates: {
        Row: {
          created_at: string | null
          id: string
          salon_id: string
          sort_order: number | null
          text: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          salon_id: string
          sort_order?: number | null
          text: string
        }
        Update: {
          created_at?: string | null
          id?: string
          salon_id?: string
          sort_order?: number | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_templates_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          latitude: number
          longitude: number
          name_de: string
          name_en: string
          name_fr: string
          name_it: string
          radius_km: number | null
          slug: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          latitude: number
          longitude: number
          name_de: string
          name_en: string
          name_fr: string
          name_it: string
          radius_km?: number | null
          slug: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          latitude?: number
          longitude?: number
          name_de?: string
          name_en?: string
          name_fr?: string
          name_it?: string
          radius_km?: number | null
          slug?: string
        }
        Relationships: []
      }
      client_formulas: {
        Row: {
          after_photo_url: string | null
          before_photo_url: string | null
          booking_id: string | null
          brand: string | null
          created_at: string | null
          customer_id: string | null
          developer_volume: string | null
          ends_formula: Json | null
          id: string
          mid_lengths_formula: Json | null
          mix_formula: string
          notes: string | null
          processing_minutes: number | null
          product_line: string | null
          root_formula: Json | null
          salon_id: string
          shade_code: string | null
          staff_member_id: string | null
          updated_at: string | null
        }
        Insert: {
          after_photo_url?: string | null
          before_photo_url?: string | null
          booking_id?: string | null
          brand?: string | null
          created_at?: string | null
          customer_id?: string | null
          developer_volume?: string | null
          ends_formula?: Json | null
          id?: string
          mid_lengths_formula?: Json | null
          mix_formula: string
          notes?: string | null
          processing_minutes?: number | null
          product_line?: string | null
          root_formula?: Json | null
          salon_id: string
          shade_code?: string | null
          staff_member_id?: string | null
          updated_at?: string | null
        }
        Update: {
          after_photo_url?: string | null
          before_photo_url?: string | null
          booking_id?: string | null
          brand?: string | null
          created_at?: string | null
          customer_id?: string | null
          developer_volume?: string | null
          ends_formula?: Json | null
          id?: string
          mid_lengths_formula?: Json | null
          mix_formula?: string
          notes?: string | null
          processing_minutes?: number | null
          product_line?: string | null
          root_formula?: Json | null
          salon_id?: string
          shade_code?: string | null
          staff_member_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_formulas_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_formulas_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_formulas_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_ratings_view"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      client_notes: {
        Row: {
          booking_id: string | null
          created_at: string | null
          created_by: string
          customer_id: string
          id: string
          note: string
          note_type: string | null
          salon_id: string
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          created_by: string
          customer_id: string
          id?: string
          note: string
          note_type?: string | null
          salon_id: string
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          created_by?: string
          customer_id?: string
          id?: string
          note?: string
          note_type?: string | null
          salon_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_notes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_notes_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      client_photos: {
        Row: {
          booking_id: string | null
          created_at: string | null
          customer_id: string | null
          discovery_item_id: string | null
          id: string
          photo_type: string | null
          photo_url: string
          published_to_discovery: boolean | null
          salon_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          discovery_item_id?: string | null
          id?: string
          photo_type?: string | null
          photo_url: string
          published_to_discovery?: boolean | null
          salon_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          discovery_item_id?: string | null
          id?: string
          photo_type?: string | null
          photo_url?: string
          published_to_discovery?: boolean | null
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_photos_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      client_tags: {
        Row: {
          color: string | null
          created_at: string | null
          customer_id: string
          id: string
          salon_id: string
          tag: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          customer_id: string
          id?: string
          salon_id: string
          tag: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          customer_id?: string
          id?: string
          salon_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_tags_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profile_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_tags_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_tags_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_tags_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_notes: {
        Row: {
          allergies: string | null
          booking_id: string | null
          client_id: string
          created_at: string | null
          current_dislikes: string | null
          desired_outcome: string | null
          hair_condition: string | null
          id: string
          notes: string | null
          salon_id: string
          scalp_condition: string | null
        }
        Insert: {
          allergies?: string | null
          booking_id?: string | null
          client_id: string
          created_at?: string | null
          current_dislikes?: string | null
          desired_outcome?: string | null
          hair_condition?: string | null
          id?: string
          notes?: string | null
          salon_id: string
          scalp_condition?: string | null
        }
        Update: {
          allergies?: string | null
          booking_id?: string | null
          client_id?: string
          created_at?: string | null
          current_dislikes?: string | null
          desired_outcome?: string | null
          hair_condition?: string | null
          id?: string
          notes?: string | null
          salon_id?: string
          scalp_condition?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultation_notes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profile_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_notes_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      content_reports: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          details: string | null
          id: string
          reason: string
          reporter_id: string | null
          status: string | null
          target_id: string
          target_type: string
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          details?: string | null
          id?: string
          reason: string
          reporter_id?: string | null
          status?: string | null
          target_id: string
          target_type: string
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string | null
          status?: string | null
          target_id?: string
          target_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profile_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          customer_id: string
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          salon_id: string
          unread_count_customer: number | null
          unread_count_salon: number | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          salon_id: string
          unread_count_customer?: number | null
          unread_count_salon?: number | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          salon_id?: string
          unread_count_customer?: number | null
          unread_count_salon?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profile_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_redemptions: {
        Row: {
          amount_redeemed: number
          booking_id: string | null
          created_at: string | null
          credit_id: string
          id: string
          stripe_payment_intent_id: string | null
          user_id: string
        }
        Insert: {
          amount_redeemed: number
          booking_id?: string | null
          created_at?: string | null
          credit_id: string
          id?: string
          stripe_payment_intent_id?: string | null
          user_id: string
        }
        Update: {
          amount_redeemed?: number
          booking_id?: string | null
          created_at?: string | null
          credit_id?: string
          id?: string
          stripe_payment_intent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_redemptions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_redemptions_credit_id_fkey"
            columns: ["credit_id"]
            isOneToOne: false
            referencedRelation: "user_credits"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_runs: {
        Row: {
          duration_ms: number | null
          errors: Json | null
          id: string
          name: string
          ok: boolean
          processed: number | null
          ran_at: string
        }
        Insert: {
          duration_ms?: number | null
          errors?: Json | null
          id?: string
          name: string
          ok: boolean
          processed?: number | null
          ran_at?: string
        }
        Update: {
          duration_ms?: number | null
          errors?: Json | null
          id?: string
          name?: string
          ok?: boolean
          processed?: number | null
          ran_at?: string
        }
        Relationships: []
      }
      csp_violation_reports: {
        Row: {
          blocked_origin: string
          disposition: string | null
          effective_directive: string
          first_seen_at: string
          id: string
          last_seen_at: string
          report_count: number
          sample_blocked_uri: string | null
        }
        Insert: {
          blocked_origin: string
          disposition?: string | null
          effective_directive: string
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          report_count?: number
          sample_blocked_uri?: string | null
        }
        Update: {
          blocked_origin?: string
          disposition?: string | null
          effective_directive?: string
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          report_count?: number
          sample_blocked_uri?: string | null
        }
        Relationships: []
      }
      customer_segment_members: {
        Row: {
          computed_at: string | null
          segment_id: string
          user_id: string
        }
        Insert: {
          computed_at?: string | null
          segment_id: string
          user_id: string
        }
        Update: {
          computed_at?: string | null
          segment_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_segment_members_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "customer_segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_segment_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_segment_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_segment_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_segments: {
        Row: {
          auto_rule: Json
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          auto_rule: Json
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          auto_rule?: Json
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      data_deletion_log: {
        Row: {
          completed_at: string | null
          id: string
          requested_at: string | null
          tables_cleared: string[] | null
          user_email: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          requested_at?: string | null
          tables_cleared?: string[] | null
          user_email: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          requested_at?: string | null
          tables_cleared?: string[] | null
          user_email?: string
        }
        Relationships: []
      }
      discovery_board_pins: {
        Row: {
          board_id: string
          item_id: string
          sort_order: number | null
        }
        Insert: {
          board_id: string
          item_id: string
          sort_order?: number | null
        }
        Update: {
          board_id?: string
          item_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "discovery_board_pins_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "discovery_boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discovery_board_pins_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "discovery_items"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_boards: {
        Row: {
          category: string | null
          cover_images: string[] | null
          created_at: string | null
          description: string | null
          gender: string | null
          id: string
          is_active: boolean | null
          name: string
          name_de: string | null
          name_en: string | null
          name_fr: string | null
          name_it: string | null
          pin_count: number | null
          slug: string
          sort_order: number | null
          style_name: string | null
          texture: string | null
        }
        Insert: {
          category?: string | null
          cover_images?: string[] | null
          created_at?: string | null
          description?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_de?: string | null
          name_en?: string | null
          name_fr?: string | null
          name_it?: string | null
          pin_count?: number | null
          slug: string
          sort_order?: number | null
          style_name?: string | null
          texture?: string | null
        }
        Update: {
          category?: string | null
          cover_images?: string[] | null
          created_at?: string | null
          description?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_de?: string | null
          name_en?: string | null
          name_fr?: string | null
          name_it?: string | null
          pin_count?: number | null
          slug?: string
          sort_order?: number | null
          style_name?: string | null
          texture?: string | null
        }
        Relationships: []
      }
      discovery_collections: {
        Row: {
          created_at: string | null
          id: string
          is_public: boolean | null
          name: string
          share_token: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          share_token?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          share_token?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      discovery_comments: {
        Row: {
          created_at: string | null
          flag_reason: string | null
          id: string
          is_flagged: boolean | null
          is_hidden: boolean | null
          item_id: string | null
          text: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          flag_reason?: string | null
          id?: string
          is_flagged?: boolean | null
          is_hidden?: boolean | null
          item_id?: string | null
          text: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          flag_reason?: string | null
          id?: string
          is_flagged?: boolean | null
          is_hidden?: boolean | null
          item_id?: string | null
          text?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discovery_comments_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "discovery_items"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_interactions: {
        Row: {
          action: string
          created_at: string | null
          duration_ms: number | null
          id: string
          item_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          duration_ms?: number | null
          id?: string
          item_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          duration_ms?: number | null
          id?: string
          item_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discovery_interactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "discovery_items"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_items: {
        Row: {
          ai_analysis: Json | null
          alt_text: string | null
          author_name: string | null
          author_url: string | null
          category: string
          content_type: string
          created_at: string | null
          cut_guide: string | null
          description: string | null
          description_de: string | null
          description_en: string | null
          description_fr: string | null
          description_it: string | null
          face_shapes: string[] | null
          flag_reason: string | null
          gender: string | null
          hair_type_match: string[] | null
          id: string
          image_url: string | null
          is_active: boolean | null
          length_category: string | null
          like_count: number | null
          maintenance: string | null
          makeup_style: string | null
          media_type: string | null
          nail_shape: string | null
          nail_style: string | null
          name: string | null
          name_de: string | null
          name_en: string | null
          name_fr: string | null
          name_it: string | null
          occasion: string | null
          owner_salon_id: string | null
          owner_user_id: string | null
          price_max: number | null
          price_min: number | null
          products_de: string[] | null
          products_en: string[] | null
          products_fr: string[] | null
          products_it: string[] | null
          products_needed: string[] | null
          salon_script: string | null
          salon_script_de: string | null
          salon_script_en: string | null
          salon_script_fr: string | null
          salon_script_it: string | null
          save_count: number | null
          skin_tone: string | null
          sort_order: number | null
          source: string | null
          source_id: string | null
          source_url: string | null
          status: string | null
          style_name: string | null
          tags: string[] | null
          texture: string | null
          tiktok_embed_html: string | null
          tiktok_thumbnail_url: string | null
          tiktok_url: string | null
          updated_at: string | null
          uploaded_by: string | null
          vibe: string | null
          view_count: number | null
          wax_area: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          alt_text?: string | null
          author_name?: string | null
          author_url?: string | null
          category: string
          content_type: string
          created_at?: string | null
          cut_guide?: string | null
          description?: string | null
          description_de?: string | null
          description_en?: string | null
          description_fr?: string | null
          description_it?: string | null
          face_shapes?: string[] | null
          flag_reason?: string | null
          gender?: string | null
          hair_type_match?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          length_category?: string | null
          like_count?: number | null
          maintenance?: string | null
          makeup_style?: string | null
          media_type?: string | null
          nail_shape?: string | null
          nail_style?: string | null
          name?: string | null
          name_de?: string | null
          name_en?: string | null
          name_fr?: string | null
          name_it?: string | null
          occasion?: string | null
          owner_salon_id?: string | null
          owner_user_id?: string | null
          price_max?: number | null
          price_min?: number | null
          products_de?: string[] | null
          products_en?: string[] | null
          products_fr?: string[] | null
          products_it?: string[] | null
          products_needed?: string[] | null
          salon_script?: string | null
          salon_script_de?: string | null
          salon_script_en?: string | null
          salon_script_fr?: string | null
          salon_script_it?: string | null
          save_count?: number | null
          skin_tone?: string | null
          sort_order?: number | null
          source?: string | null
          source_id?: string | null
          source_url?: string | null
          status?: string | null
          style_name?: string | null
          tags?: string[] | null
          texture?: string | null
          tiktok_embed_html?: string | null
          tiktok_thumbnail_url?: string | null
          tiktok_url?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          vibe?: string | null
          view_count?: number | null
          wax_area?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          alt_text?: string | null
          author_name?: string | null
          author_url?: string | null
          category?: string
          content_type?: string
          created_at?: string | null
          cut_guide?: string | null
          description?: string | null
          description_de?: string | null
          description_en?: string | null
          description_fr?: string | null
          description_it?: string | null
          face_shapes?: string[] | null
          flag_reason?: string | null
          gender?: string | null
          hair_type_match?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          length_category?: string | null
          like_count?: number | null
          maintenance?: string | null
          makeup_style?: string | null
          media_type?: string | null
          nail_shape?: string | null
          nail_style?: string | null
          name?: string | null
          name_de?: string | null
          name_en?: string | null
          name_fr?: string | null
          name_it?: string | null
          occasion?: string | null
          owner_salon_id?: string | null
          owner_user_id?: string | null
          price_max?: number | null
          price_min?: number | null
          products_de?: string[] | null
          products_en?: string[] | null
          products_fr?: string[] | null
          products_it?: string[] | null
          products_needed?: string[] | null
          salon_script?: string | null
          salon_script_de?: string | null
          salon_script_en?: string | null
          salon_script_fr?: string | null
          salon_script_it?: string | null
          save_count?: number | null
          skin_tone?: string | null
          sort_order?: number | null
          source?: string | null
          source_id?: string | null
          source_url?: string | null
          status?: string | null
          style_name?: string | null
          tags?: string[] | null
          texture?: string | null
          tiktok_embed_html?: string | null
          tiktok_thumbnail_url?: string | null
          tiktok_url?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          vibe?: string | null
          view_count?: number | null
          wax_area?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discovery_items_owner_salon_id_fkey"
            columns: ["owner_salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_likes: {
        Row: {
          created_at: string | null
          item_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          item_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discovery_likes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "discovery_items"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_product_recommendations: {
        Row: {
          item_id: string
          product_id: string
          sort_order: number | null
        }
        Insert: {
          item_id: string
          product_id: string
          sort_order?: number | null
        }
        Update: {
          item_id?: string
          product_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "discovery_product_recommendations_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "discovery_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discovery_product_recommendations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "discovery_products"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_products: {
        Row: {
          application_guide: string | null
          category: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          texture_match: string[] | null
        }
        Insert: {
          application_guide?: string | null
          category?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          texture_match?: string[] | null
        }
        Update: {
          application_guide?: string | null
          category?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          texture_match?: string[] | null
        }
        Relationships: []
      }
      discovery_saves: {
        Row: {
          collection_id: string | null
          created_at: string | null
          id: string
          item_id: string | null
          user_id: string | null
        }
        Insert: {
          collection_id?: string | null
          created_at?: string | null
          id?: string
          item_id?: string | null
          user_id?: string | null
        }
        Update: {
          collection_id?: string | null
          created_at?: string | null
          id?: string
          item_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discovery_saves_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "discovery_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discovery_saves_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "discovery_items"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_search_events: {
        Row: {
          created_at: string
          id: number
          normalized: string
          term: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: never
          normalized: string
          term: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: never
          normalized?: string
          term?: string
          user_id?: string | null
        }
        Relationships: []
      }
      discovery_staging: {
        Row: {
          ai_description: string | null
          alt_text: string | null
          api_tags: string[] | null
          approved_by: string | null
          author_name: string | null
          author_url: string | null
          auto_category: string | null
          auto_gender: string | null
          auto_style: string | null
          auto_tags: string[] | null
          auto_texture: string | null
          batch_id: string | null
          category: string | null
          created_at: string | null
          id: string
          image_url: string | null
          media_type: string | null
          rejected_reason: string | null
          source: string
          source_id: string
          source_url: string | null
          status: string | null
          thumbnail_url: string | null
          tiktok_embed_html: string | null
          tiktok_url: string | null
        }
        Insert: {
          ai_description?: string | null
          alt_text?: string | null
          api_tags?: string[] | null
          approved_by?: string | null
          author_name?: string | null
          author_url?: string | null
          auto_category?: string | null
          auto_gender?: string | null
          auto_style?: string | null
          auto_tags?: string[] | null
          auto_texture?: string | null
          batch_id?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          media_type?: string | null
          rejected_reason?: string | null
          source: string
          source_id: string
          source_url?: string | null
          status?: string | null
          thumbnail_url?: string | null
          tiktok_embed_html?: string | null
          tiktok_url?: string | null
        }
        Update: {
          ai_description?: string | null
          alt_text?: string | null
          api_tags?: string[] | null
          approved_by?: string | null
          author_name?: string | null
          author_url?: string | null
          auto_category?: string | null
          auto_gender?: string | null
          auto_style?: string | null
          auto_tags?: string[] | null
          auto_texture?: string | null
          batch_id?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          media_type?: string | null
          rejected_reason?: string | null
          source?: string
          source_id?: string
          source_url?: string | null
          status?: string | null
          thumbnail_url?: string | null
          tiktok_embed_html?: string | null
          tiktok_url?: string | null
        }
        Relationships: []
      }
      fade_blueprints: {
        Row: {
          back_guard: string | null
          beard_style: string | null
          booking_id: string | null
          client_id: string
          created_at: string | null
          fade_type: string | null
          id: string
          lineup: boolean | null
          neckline_style: string | null
          notes: string | null
          photo_url: string | null
          products_used: string[] | null
          salon_id: string
          sides_guard: string | null
          staff_member_id: string | null
          top_guard: string | null
        }
        Insert: {
          back_guard?: string | null
          beard_style?: string | null
          booking_id?: string | null
          client_id: string
          created_at?: string | null
          fade_type?: string | null
          id?: string
          lineup?: boolean | null
          neckline_style?: string | null
          notes?: string | null
          photo_url?: string | null
          products_used?: string[] | null
          salon_id: string
          sides_guard?: string | null
          staff_member_id?: string | null
          top_guard?: string | null
        }
        Update: {
          back_guard?: string | null
          beard_style?: string | null
          booking_id?: string | null
          client_id?: string
          created_at?: string | null
          fade_type?: string | null
          id?: string
          lineup?: boolean | null
          neckline_style?: string | null
          notes?: string | null
          photo_url?: string | null
          products_used?: string[] | null
          salon_id?: string
          sides_guard?: string | null
          staff_member_id?: string | null
          top_guard?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fade_blueprints_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fade_blueprints_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profile_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fade_blueprints_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fade_blueprints_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fade_blueprints_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fade_blueprints_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fade_blueprints_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_ratings_view"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          salon_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          salon_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          salon_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          description: string | null
          enabled: boolean
          key: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          enabled?: boolean
          key: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          enabled?: boolean
          key?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profile_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_flags_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_flags_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_requests: {
        Row: {
          admin_id: string | null
          claude_prompt: string | null
          component_hint: string | null
          created_at: string
          description: string
          element_selector: string | null
          element_tag: string | null
          element_text: string | null
          generated_roadmap: string | null
          id: string
          page_url: string
          priority: string
          roadmap_version: number
          status: string
          token_usage: Json | null
          updated_at: string
        }
        Insert: {
          admin_id?: string | null
          claude_prompt?: string | null
          component_hint?: string | null
          created_at?: string
          description: string
          element_selector?: string | null
          element_tag?: string | null
          element_text?: string | null
          generated_roadmap?: string | null
          id?: string
          page_url: string
          priority?: string
          roadmap_version?: number
          status?: string
          token_usage?: Json | null
          updated_at?: string
        }
        Update: {
          admin_id?: string | null
          claude_prompt?: string | null
          component_hint?: string | null
          created_at?: string
          description?: string
          element_selector?: string | null
          element_tag?: string | null
          element_text?: string | null
          generated_roadmap?: string | null
          id?: string
          page_url?: string
          priority?: string
          roadmap_version?: number
          status?: string
          token_usage?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_requests_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profile_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_requests_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_requests_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_cards: {
        Row: {
          code: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          message: string | null
          original_amount: number
          purchaser_email: string | null
          purchaser_user_id: string | null
          recipient_email: string | null
          recipient_name: string | null
          remaining_amount: number
          salon_id: string
          stripe_payment_intent_id: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string | null
          original_amount: number
          purchaser_email?: string | null
          purchaser_user_id?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          remaining_amount: number
          salon_id: string
          stripe_payment_intent_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string | null
          original_amount?: number
          purchaser_email?: string | null
          purchaser_user_id?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          remaining_amount?: number
          salon_id?: string
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gift_cards_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      group_bookings: {
        Row: {
          created_at: string | null
          event_type: string | null
          group_size: number
          id: string
          notes: string | null
          organizer_name: string
          organizer_phone: string | null
          organizer_user_id: string | null
          salon_id: string
          stripe_payment_intent_id: string | null
          total_amount: number | null
        }
        Insert: {
          created_at?: string | null
          event_type?: string | null
          group_size: number
          id?: string
          notes?: string | null
          organizer_name: string
          organizer_phone?: string | null
          organizer_user_id?: string | null
          salon_id: string
          stripe_payment_intent_id?: string | null
          total_amount?: number | null
        }
        Update: {
          created_at?: string | null
          event_type?: string | null
          group_size?: number
          id?: string
          notes?: string | null
          organizer_name?: string
          organizer_phone?: string | null
          organizer_user_id?: string | null
          salon_id?: string
          stripe_payment_intent_id?: string | null
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "group_bookings_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_bookings: {
        Row: {
          account_created: boolean | null
          booking_id: string | null
          created_at: string | null
          guest_email: string | null
          guest_name: string
          guest_phone: string
          id: string
        }
        Insert: {
          account_created?: boolean | null
          booking_id?: string | null
          created_at?: string | null
          guest_email?: string | null
          guest_name: string
          guest_phone: string
          id?: string
        }
        Update: {
          account_created?: boolean | null
          booking_id?: string | null
          created_at?: string | null
          guest_email?: string | null
          guest_name?: string
          guest_phone?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      hand_chart_notes: {
        Row: {
          created_at: string | null
          created_by: string | null
          customer_id: string
          id: string
          notes: Json
          salon_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          id?: string
          notes?: Json
          salon_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          id?: string
          notes?: Json
          salon_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hand_chart_notes_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      help_articles: {
        Row: {
          category: string
          content: string
          created_at: string | null
          id: string
          locale: string
          published: boolean | null
          slug: string
          sort_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          id?: string
          locale?: string
          published?: boolean | null
          slug: string
          sort_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          id?: string
          locale?: string
          published?: boolean | null
          slug?: string
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      intake_form_responses: {
        Row: {
          ai_recommendation: string | null
          customer_id: string | null
          filled_at: string | null
          id: string
          responses: Json
          salon_id: string
          template_key: string
        }
        Insert: {
          ai_recommendation?: string | null
          customer_id?: string | null
          filled_at?: string | null
          id?: string
          responses?: Json
          salon_id: string
          template_key: string
        }
        Update: {
          ai_recommendation?: string | null
          customer_id?: string | null
          filled_at?: string | null
          id?: string
          responses?: Json
          salon_id?: string
          template_key?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          min_stock: number | null
          name: string
          price: number | null
          salon_id: number
          stock: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          min_stock?: number | null
          name: string
          price?: number | null
          salon_id: number
          stock?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          min_stock?: number | null
          name?: string
          price?: number | null
          salon_id?: number
          stock?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      loyalty_cards: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          reward_text: string
          salon_id: string
          stamps_needed: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          reward_text?: string
          salon_id: string
          stamps_needed?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          reward_text?: string
          salon_id?: string
          stamps_needed?: number
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_cards_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: true
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_stamps: {
        Row: {
          booking_id: string | null
          customer_id: string
          id: string
          loyalty_card_id: string
          stamped_at: string | null
        }
        Insert: {
          booking_id?: string | null
          customer_id: string
          id?: string
          loyalty_card_id: string
          stamped_at?: string | null
        }
        Update: {
          booking_id?: string | null
          customer_id?: string
          id?: string
          loyalty_card_id?: string
          stamped_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_stamps_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_stamps_loyalty_card_id_fkey"
            columns: ["loyalty_card_id"]
            isOneToOne: false
            referencedRelation: "loyalty_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_status: {
        Row: {
          next_threshold: number | null
          next_tier: string | null
          source: string
          tier: string
          to_next: number | null
          updated_at: string
          user_id: string
          valid_through: string | null
          visits: number
          window_start: string
        }
        Insert: {
          next_threshold?: number | null
          next_tier?: string | null
          source?: string
          tier?: string
          to_next?: number | null
          updated_at?: string
          user_id: string
          valid_through?: string | null
          visits?: number
          window_start?: string
        }
        Update: {
          next_threshold?: number | null
          next_tier?: string | null
          source?: string
          tier?: string
          to_next?: number | null
          updated_at?: string
          user_id?: string
          valid_through?: string | null
          visits?: number
          window_start?: string
        }
        Relationships: []
      }
      makeup_face_charts: {
        Row: {
          booking_id: string | null
          client_id: string
          created_at: string | null
          eye_look: string | null
          foundation_brand: string | null
          foundation_shade: string | null
          id: string
          lip_colour: string | null
          notes: string | null
          products_used: Json | null
          reference_photo_url: string | null
          salon_id: string
          undertone: string | null
          zones: Json | null
        }
        Insert: {
          booking_id?: string | null
          client_id: string
          created_at?: string | null
          eye_look?: string | null
          foundation_brand?: string | null
          foundation_shade?: string | null
          id?: string
          lip_colour?: string | null
          notes?: string | null
          products_used?: Json | null
          reference_photo_url?: string | null
          salon_id: string
          undertone?: string | null
          zones?: Json | null
        }
        Update: {
          booking_id?: string | null
          client_id?: string
          created_at?: string | null
          eye_look?: string | null
          foundation_brand?: string | null
          foundation_shade?: string | null
          id?: string
          lip_colour?: string | null
          notes?: string | null
          products_used?: Json | null
          reference_photo_url?: string | null
          salon_id?: string
          undertone?: string | null
          zones?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "makeup_face_charts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "makeup_face_charts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profile_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "makeup_face_charts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "makeup_face_charts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "makeup_face_charts_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      makeup_kit_items: {
        Row: {
          brand: string
          category: string | null
          cost_per_unit: number | null
          created_at: string | null
          expiry_date: string | null
          id: string
          is_active: boolean | null
          product_name: string
          quantity: number | null
          salon_id: string
          shade: string | null
        }
        Insert: {
          brand: string
          category?: string | null
          cost_per_unit?: number | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          product_name: string
          quantity?: number | null
          salon_id: string
          shade?: string | null
        }
        Update: {
          brand?: string
          category?: string | null
          cost_per_unit?: number | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          product_name?: string
          quantity?: number | null
          salon_id?: string
          shade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "makeup_kit_items_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          image_url: string | null
          message_type: string | null
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          message_type?: string | null
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          message_type?: string | null
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profile_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nail_client_preferences: {
        Row: {
          allergies: string[] | null
          allergy_notes: string | null
          allergy_severity: string | null
          customer_id: string | null
          id: string
          notes: string | null
          preferred_brand: string | null
          preferred_length: string | null
          preferred_material: string | null
          preferred_shape: string | null
          salon_id: string
          skin_sensitivity: string | null
          updated_at: string | null
        }
        Insert: {
          allergies?: string[] | null
          allergy_notes?: string | null
          allergy_severity?: string | null
          customer_id?: string | null
          id?: string
          notes?: string | null
          preferred_brand?: string | null
          preferred_length?: string | null
          preferred_material?: string | null
          preferred_shape?: string | null
          salon_id: string
          skin_sensitivity?: string | null
          updated_at?: string | null
        }
        Update: {
          allergies?: string[] | null
          allergy_notes?: string | null
          allergy_severity?: string | null
          customer_id?: string | null
          id?: string
          notes?: string | null
          preferred_brand?: string | null
          preferred_length?: string | null
          preferred_material?: string | null
          preferred_shape?: string | null
          salon_id?: string
          skin_sensitivity?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nail_client_preferences_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      nail_design_history: {
        Row: {
          booking_id: string | null
          color_brand: string | null
          color_primary: string | null
          color_secondary: string | null
          created_at: string | null
          customer_id: string | null
          id: string
          length: string | null
          material: string | null
          notes: string | null
          photo_url: string | null
          salon_id: string
          shape: string | null
          staff_member_id: string | null
          style_category: string | null
        }
        Insert: {
          booking_id?: string | null
          color_brand?: string | null
          color_primary?: string | null
          color_secondary?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          length?: string | null
          material?: string | null
          notes?: string | null
          photo_url?: string | null
          salon_id: string
          shape?: string | null
          staff_member_id?: string | null
          style_category?: string | null
        }
        Update: {
          booking_id?: string | null
          color_brand?: string | null
          color_primary?: string | null
          color_secondary?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          length?: string | null
          material?: string | null
          notes?: string | null
          photo_url?: string | null
          salon_id?: string
          shape?: string | null
          staff_member_id?: string | null
          style_category?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nail_design_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nail_design_history_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nail_design_history_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nail_design_history_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_ratings_view"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      nail_dynamic_pricing_rules: {
        Row: {
          created_at: string | null
          day_of_week: number | null
          end_time: string | null
          id: string
          is_active: boolean | null
          label_de: string | null
          label_en: string | null
          label_fr: string | null
          label_it: string | null
          price_modifier: number
          rule_type: string
          salon_id: string
          start_time: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week?: number | null
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          label_de?: string | null
          label_en?: string | null
          label_fr?: string | null
          label_it?: string | null
          price_modifier: number
          rule_type: string
          salon_id: string
          start_time?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number | null
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          label_de?: string | null
          label_en?: string | null
          label_fr?: string | null
          label_it?: string | null
          price_modifier?: number
          rule_type?: string
          salon_id?: string
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nail_dynamic_pricing_rules_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      nail_inspo_boards: {
        Row: {
          created_at: string | null
          id: string
          is_public: boolean | null
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      nail_inspo_images: {
        Row: {
          board_id: string | null
          booking_id: string | null
          created_at: string | null
          id: string
          image_url: string
          notes: string | null
          source_url: string | null
          user_id: string
        }
        Insert: {
          board_id?: string | null
          booking_id?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          notes?: string | null
          source_url?: string | null
          user_id: string
        }
        Update: {
          board_id?: string | null
          booking_id?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          notes?: string | null
          source_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nail_inspo_images_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "nail_inspo_boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nail_inspo_images_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      nail_retail_products: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          low_stock_threshold: number
          name: string
          price: number
          salon_id: string
          stock_count: number
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          low_stock_threshold?: number
          name: string
          price: number
          salon_id: string
          stock_count?: number
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          low_stock_threshold?: number
          name?: string
          price?: number
          salon_id?: string
          stock_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "nail_retail_products_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      nail_stations: {
        Row: {
          created_at: string | null
          has_uv_lamps: boolean | null
          id: string
          salon_id: string
          station_count: number
          sterilization_buffer_minutes: number | null
          uv_lamp_count: number | null
        }
        Insert: {
          created_at?: string | null
          has_uv_lamps?: boolean | null
          id?: string
          salon_id: string
          station_count?: number
          sterilization_buffer_minutes?: number | null
          uv_lamp_count?: number | null
        }
        Update: {
          created_at?: string | null
          has_uv_lamps?: boolean | null
          id?: string
          salon_id?: string
          station_count?: number
          sterilization_buffer_minutes?: number | null
          uv_lamp_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nail_stations_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: true
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          deals_enabled: boolean | null
          rebooking_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          deals_enabled?: boolean | null
          rebooking_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          deals_enabled?: boolean | null
          rebooking_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string | null
          data: Json | null
          id: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          data?: Json | null
          id?: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          data?: Json | null
          id?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      off_peak_slots: {
        Row: {
          created_at: string | null
          day_of_week: number
          discount_percent: number
          end_time: string
          id: string
          is_active: boolean | null
          salon_id: string
          start_time: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          discount_percent: number
          end_time: string
          id?: string
          is_active?: boolean | null
          salon_id: string
          start_time: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          discount_percent?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          salon_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "off_peak_slots_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      package_purchases: {
        Row: {
          expires_at: string | null
          id: string
          package_id: string
          paid_amount: number | null
          purchased_at: string | null
          refunded_amount: number
          salon_id: string
          sessions_total: number
          sessions_used: number | null
          stripe_payment_intent_id: string | null
          user_id: string | null
        }
        Insert: {
          expires_at?: string | null
          id?: string
          package_id: string
          paid_amount?: number | null
          purchased_at?: string | null
          refunded_amount?: number
          salon_id: string
          sessions_total: number
          sessions_used?: number | null
          stripe_payment_intent_id?: string | null
          user_id?: string | null
        }
        Update: {
          expires_at?: string | null
          id?: string
          package_id?: string
          paid_amount?: number | null
          purchased_at?: string | null
          refunded_amount?: number
          salon_id?: string
          sessions_total?: number
          sessions_used?: number | null
          stripe_payment_intent_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "package_purchases_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "service_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_purchases_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_leads: {
        Row: {
          created_at: string
          email: string
          id: string
          salon_name: string
          source: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          salon_name: string
          source?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          salon_name?: string
          source?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "platform_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profile_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_stats: {
        Row: {
          computed_at: string | null
          key: string
          value: number | null
        }
        Insert: {
          computed_at?: string | null
          key: string
          value?: number | null
        }
        Update: {
          computed_at?: string | null
          key?: string
          value?: number | null
        }
        Relationships: []
      }
      price_disputes: {
        Row: {
          admin_amount: number | null
          admin_decision: string | null
          auto_approve_at: string | null
          booking_id: string
          created_at: string | null
          customer_response: string | null
          id: string
          original_amount: number
          requested_amount: number
          resolved_at: string | null
          resolved_by: string | null
          salon_reason: string
          status: string | null
        }
        Insert: {
          admin_amount?: number | null
          admin_decision?: string | null
          auto_approve_at?: string | null
          booking_id: string
          created_at?: string | null
          customer_response?: string | null
          id?: string
          original_amount: number
          requested_amount: number
          resolved_at?: string | null
          resolved_by?: string | null
          salon_reason: string
          status?: string | null
        }
        Update: {
          admin_amount?: number | null
          admin_decision?: string | null
          auto_approve_at?: string | null
          booking_id?: string
          created_at?: string | null
          customer_response?: string | null
          id?: string
          original_amount?: number
          requested_amount?: number
          resolved_at?: string | null
          resolved_by?: string | null
          salon_reason?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_disputes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      price_offers: {
        Row: {
          amount_chf: number
          conversation_id: string
          created_at: string | null
          customer_id: string
          description: string
          expires_at: string | null
          id: string
          photo_url: string | null
          salon_id: string
          status: string | null
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount_chf: number
          conversation_id: string
          created_at?: string | null
          customer_id: string
          description: string
          expires_at?: string | null
          id?: string
          photo_url?: string | null
          salon_id: string
          status?: string | null
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount_chf?: number
          conversation_id?: string
          created_at?: string | null
          customer_id?: string
          description?: string
          expires_at?: string | null
          id?: string
          photo_url?: string | null
          salon_id?: string
          status?: string | null
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_offers_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_offers_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_rules: {
        Row: {
          created_at: string
          day_of_week: number | null
          id: string
          is_active: boolean
          modifier_type: string
          modifier_value: number
          rule_type: string
          salon_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week?: number | null
          id?: string
          is_active?: boolean
          modifier_type: string
          modifier_value: number
          rule_type: string
          salon_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number | null
          id?: string
          is_active?: boolean
          modifier_type?: string
          modifier_value?: number
          rule_type?: string
          salon_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_rules_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      processed_webhook_events: {
        Row: {
          event_id: string
          processed_at: string
        }
        Insert: {
          event_id: string
          processed_at?: string
        }
        Update: {
          event_id?: string
          processed_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: string
          age_group: string | null
          age_range: string | null
          analytics_consent: boolean | null
          avatar_url: string | null
          ban_reason: string | null
          banned_at: string | null
          bio: string | null
          color_treated: boolean | null
          created_at: string | null
          current_style_id: string | null
          customer_preferences: Json | null
          dashboard_notifications_read_at: string | null
          date_of_birth: string | null
          deletion_requested_at: string | null
          disc_face_shape: string | null
          disc_gender: string | null
          disc_hair_length: string | null
          disc_hair_texture: string | null
          disc_nail_shape: string | null
          disc_profile_set: boolean | null
          disc_skin_tone: string | null
          display_name: string
          email: string | null
          gender: string | null
          hair_beard: string | null
          hair_condition: string | null
          hair_length: string | null
          hair_thickness: string | null
          hair_type: string | null
          id: string
          is_admin: boolean | null
          is_first_visit_default: boolean | null
          is_suspended: boolean | null
          locale: string | null
          neighbourhood: string | null
          no_show_count: number
          notification_email: boolean | null
          notification_sms: boolean | null
          onboarding_completed: boolean | null
          phone_number: string | null
          preferred_city: string | null
          preferred_services: string[] | null
          profile_complete: boolean | null
          role: string
          staff_salon_id: string | null
          stripe_customer_id: string | null
          stylist_notes: string | null
          tos_accepted_at: string | null
          tos_accepted_version: string | null
          updated_at: string | null
        }
        Insert: {
          account_status?: string
          age_group?: string | null
          age_range?: string | null
          analytics_consent?: boolean | null
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          bio?: string | null
          color_treated?: boolean | null
          created_at?: string | null
          current_style_id?: string | null
          customer_preferences?: Json | null
          dashboard_notifications_read_at?: string | null
          date_of_birth?: string | null
          deletion_requested_at?: string | null
          disc_face_shape?: string | null
          disc_gender?: string | null
          disc_hair_length?: string | null
          disc_hair_texture?: string | null
          disc_nail_shape?: string | null
          disc_profile_set?: boolean | null
          disc_skin_tone?: string | null
          display_name?: string
          email?: string | null
          gender?: string | null
          hair_beard?: string | null
          hair_condition?: string | null
          hair_length?: string | null
          hair_thickness?: string | null
          hair_type?: string | null
          id: string
          is_admin?: boolean | null
          is_first_visit_default?: boolean | null
          is_suspended?: boolean | null
          locale?: string | null
          neighbourhood?: string | null
          no_show_count?: number
          notification_email?: boolean | null
          notification_sms?: boolean | null
          onboarding_completed?: boolean | null
          phone_number?: string | null
          preferred_city?: string | null
          preferred_services?: string[] | null
          profile_complete?: boolean | null
          role?: string
          staff_salon_id?: string | null
          stripe_customer_id?: string | null
          stylist_notes?: string | null
          tos_accepted_at?: string | null
          tos_accepted_version?: string | null
          updated_at?: string | null
        }
        Update: {
          account_status?: string
          age_group?: string | null
          age_range?: string | null
          analytics_consent?: boolean | null
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          bio?: string | null
          color_treated?: boolean | null
          created_at?: string | null
          current_style_id?: string | null
          customer_preferences?: Json | null
          dashboard_notifications_read_at?: string | null
          date_of_birth?: string | null
          deletion_requested_at?: string | null
          disc_face_shape?: string | null
          disc_gender?: string | null
          disc_hair_length?: string | null
          disc_hair_texture?: string | null
          disc_nail_shape?: string | null
          disc_profile_set?: boolean | null
          disc_skin_tone?: string | null
          display_name?: string
          email?: string | null
          gender?: string | null
          hair_beard?: string | null
          hair_condition?: string | null
          hair_length?: string | null
          hair_thickness?: string | null
          hair_type?: string | null
          id?: string
          is_admin?: boolean | null
          is_first_visit_default?: boolean | null
          is_suspended?: boolean | null
          locale?: string | null
          neighbourhood?: string | null
          no_show_count?: number
          notification_email?: boolean | null
          notification_sms?: boolean | null
          onboarding_completed?: boolean | null
          phone_number?: string | null
          preferred_city?: string | null
          preferred_services?: string[] | null
          profile_complete?: boolean | null
          role?: string
          staff_salon_id?: string | null
          stripe_customer_id?: string | null
          stylist_notes?: string | null
          tos_accepted_at?: string | null
          tos_accepted_version?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_current_style_id_fkey"
            columns: ["current_style_id"]
            isOneToOne: false
            referencedRelation: "discovery_items"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          current_uses: number | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          is_purchased_voucher: boolean | null
          max_uses: number | null
          min_booking_amount: number | null
          min_tier: string | null
          per_user_limit: number | null
          salon_id: string | null
          stripe_coupon_id: string | null
          stripe_promotion_code_id: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          is_purchased_voucher?: boolean | null
          max_uses?: number | null
          min_booking_amount?: number | null
          min_tier?: string | null
          per_user_limit?: number | null
          salon_id?: string | null
          stripe_coupon_id?: string | null
          stripe_promotion_code_id?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          is_purchased_voucher?: boolean | null
          max_uses?: number | null
          min_booking_amount?: number | null
          min_tier?: string | null
          per_user_limit?: number | null
          salon_id?: string | null
          stripe_coupon_id?: string | null
          stripe_promotion_code_id?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_redemptions: {
        Row: {
          booking_id: string
          code: string
          id: string
          redeemed_at: string
          redeemer_key: string
        }
        Insert: {
          booking_id: string
          code: string
          id?: string
          redeemed_at?: string
          redeemer_key: string
        }
        Update: {
          booking_id?: string
          code?: string
          id?: string
          redeemed_at?: string
          redeemer_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_redemptions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          keys_auth: string | null
          keys_p256dh: string | null
          subscription_json: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          keys_auth?: string | null
          keys_p256dh?: string | null
          subscription_json: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          keys_auth?: string | null
          keys_p256dh?: string | null
          subscription_json?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      quartier_subscriptions: {
        Row: {
          email: string
          id: string
          notified_at: string | null
          quartier: string
          subscribed_at: string | null
        }
        Insert: {
          email: string
          id?: string
          notified_at?: string | null
          quartier: string
          subscribed_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          notified_at?: string | null
          quartier?: string
          subscribed_at?: string | null
        }
        Relationships: []
      }
      recurring_booking_rules: {
        Row: {
          created_at: string | null
          custom_interval_days: number | null
          frequency: string
          id: string
          is_active: boolean | null
          next_booking_date: string
          preferred_day: string | null
          preferred_time: string | null
          salon_id: string
          service_id: string
          staff_member_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          custom_interval_days?: number | null
          frequency: string
          id?: string
          is_active?: boolean | null
          next_booking_date: string
          preferred_day?: string | null
          preferred_time?: string | null
          salon_id: string
          service_id: string
          staff_member_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          custom_interval_days?: number | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          next_booking_date?: string
          preferred_day?: string | null
          preferred_time?: string | null
          salon_id?: string
          service_id?: string
          staff_member_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_booking_rules_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_booking_rules_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_booking_rules_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_booking_rules_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_ratings_view"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "recurring_booking_rules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_booking_rules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_booking_rules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          code: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          max_uses: number | null
          referral_code: string
          referred_user_id: string | null
          referrer_id: string
          reward_amount: number | null
          status: string | null
        }
        Insert: {
          code?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          max_uses?: number | null
          referral_code: string
          referred_user_id?: string | null
          referrer_id: string
          reward_amount?: number | null
          status?: string | null
        }
        Update: {
          code?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          max_uses?: number | null
          referral_code?: string
          referred_user_id?: string | null
          referrer_id?: string
          reward_amount?: number | null
          status?: string | null
        }
        Relationships: []
      }
      retail_purchases: {
        Row: {
          created_at: string | null
          id: string
          net_amount: number | null
          paid_amount: number | null
          product_ids: string[]
          refunded_amount: number
          salon_id: string
          status: string
          stripe_payment_intent_id: string | null
          user_id: string | null
          vat_amount: number | null
          vat_rate: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          net_amount?: number | null
          paid_amount?: number | null
          product_ids?: string[]
          refunded_amount?: number
          salon_id: string
          status?: string
          stripe_payment_intent_id?: string | null
          user_id?: string | null
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          net_amount?: number | null
          paid_amount?: number | null
          product_ids?: string[]
          refunded_amount?: number
          salon_id?: string
          status?: string
          stripe_payment_intent_id?: string | null
          user_id?: string | null
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "retail_purchases_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      retail_sales: {
        Row: {
          booking_id: string | null
          created_at: string
          customer_id: string | null
          id: string
          product_id: string | null
          product_name: string | null
          quantity: number
          salon_id: string
          sold_at: string
          total_price: number
          unit_price: number
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          product_id?: string | null
          product_name?: string | null
          quantity?: number
          salon_id: string
          sold_at?: string
          total_price?: number
          unit_price?: number
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          product_id?: string | null
          product_name?: string | null
          quantity?: number
          salon_id?: string
          sold_at?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "retail_sales_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retail_sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "nail_retail_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retail_sales_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      review_attributes: {
        Row: {
          attribute_key: string
          created_at: string
          id: string
          review_id: string
        }
        Insert: {
          attribute_key: string
          created_at?: string
          id?: string
          review_id: string
        }
        Update: {
          attribute_key?: string
          created_at?: string
          id?: string
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_attributes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_photos: {
        Row: {
          created_at: string
          id: string
          photo_url: string
          review_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          photo_url: string
          review_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          photo_url?: string
          review_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "review_photos_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_replies: {
        Row: {
          created_at: string | null
          id: string
          is_public: boolean | null
          reply_text: string
          review_id: string
          salon_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          reply_text: string
          review_id: string
          salon_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          reply_text?: string
          review_id?: string
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_replies_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: true
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_replies_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      review_translations: {
        Row: {
          created_at: string
          id: string
          locale: string
          review_id: string
          source_locale: string
          translated: string
        }
        Insert: {
          created_at?: string
          id?: string
          locale: string
          review_id: string
          source_locale?: string
          translated: string
        }
        Update: {
          created_at?: string
          id?: string
          locale?: string
          review_id?: string
          source_locale?: string
          translated?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_translations_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          admin_response: string | null
          admin_response_at: string | null
          booking_id: string | null
          comment: string | null
          created_at: string | null
          flag_reason: string | null
          id: string
          is_flagged: boolean | null
          is_hidden: boolean | null
          moderation_status: string
          rating: number
          removal_reason: string | null
          salon_id: string
          salon_response: string | null
          salon_response_at: string | null
          staff_member_id: string | null
          user_id: string | null
          walkin_queue_id: string | null
        }
        Insert: {
          admin_response?: string | null
          admin_response_at?: string | null
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          flag_reason?: string | null
          id?: string
          is_flagged?: boolean | null
          is_hidden?: boolean | null
          moderation_status?: string
          rating: number
          removal_reason?: string | null
          salon_id: string
          salon_response?: string | null
          salon_response_at?: string | null
          staff_member_id?: string | null
          user_id?: string | null
          walkin_queue_id?: string | null
        }
        Update: {
          admin_response?: string | null
          admin_response_at?: string | null
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          flag_reason?: string | null
          id?: string
          is_flagged?: boolean | null
          is_hidden?: boolean | null
          moderation_status?: string
          rating?: number
          removal_reason?: string | null
          salon_id?: string
          salon_response?: string | null
          salon_response_at?: string | null
          staff_member_id?: string | null
          user_id?: string | null
          walkin_queue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_ratings_view"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_walkin_queue_id_fkey"
            columns: ["walkin_queue_id"]
            isOneToOne: false
            referencedRelation: "barber_walkin_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_line_items: {
        Row: {
          created_at: string | null
          description: string
          id: string
          price: number
          quantity: number | null
          sale_id: string
          service_id: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          price?: number
          quantity?: number | null
          sale_id: string
          service_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          price?: number
          quantity?: number | null
          sale_id?: string
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sale_line_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_line_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          client_id: string | null
          created_at: string | null
          id: string
          note: string | null
          payment_method: string | null
          salon_id: string
          slot_id: string | null
          staff_member_id: string | null
          status: string | null
          total: number
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          note?: string | null
          payment_method?: string | null
          salon_id: string
          slot_id?: string | null
          staff_member_id?: string | null
          status?: string | null
          total?: number
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          note?: string | null
          payment_method?: string | null
          salon_id?: string
          slot_id?: string | null
          staff_member_id?: string | null
          status?: string | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "salon_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "availability_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "availability_slots_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_ratings_view"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      salon_analytics: {
        Row: {
          avg_booking_price: number | null
          avg_rating: number | null
          cancellation_count: number | null
          cancellation_rate: number | null
          created_at: string | null
          id: string
          last_minute_bookings: number | null
          last_minute_conversion_rate: number | null
          most_popular_service: string | null
          most_popular_time: string | null
          new_customers: number | null
          period_end: string
          period_start: string
          returning_customers: number | null
          salon_id: string
          total_bookings: number | null
          total_revenue: number | null
          total_reviews: number | null
          unique_customers: number | null
        }
        Insert: {
          avg_booking_price?: number | null
          avg_rating?: number | null
          cancellation_count?: number | null
          cancellation_rate?: number | null
          created_at?: string | null
          id?: string
          last_minute_bookings?: number | null
          last_minute_conversion_rate?: number | null
          most_popular_service?: string | null
          most_popular_time?: string | null
          new_customers?: number | null
          period_end: string
          period_start: string
          returning_customers?: number | null
          salon_id: string
          total_bookings?: number | null
          total_revenue?: number | null
          total_reviews?: number | null
          unique_customers?: number | null
        }
        Update: {
          avg_booking_price?: number | null
          avg_rating?: number | null
          cancellation_count?: number | null
          cancellation_rate?: number | null
          created_at?: string | null
          id?: string
          last_minute_bookings?: number | null
          last_minute_conversion_rate?: number | null
          most_popular_service?: string | null
          most_popular_time?: string | null
          new_customers?: number | null
          period_end?: string
          period_start?: string
          returning_customers?: number | null
          salon_id?: string
          total_bookings?: number | null
          total_revenue?: number | null
          total_reviews?: number | null
          unique_customers?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "salon_analytics_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_badge_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          badge_id: string
          is_override_removal: boolean | null
          salon_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          badge_id: string
          is_override_removal?: boolean | null
          salon_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          badge_id?: string
          is_override_removal?: boolean | null
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "salon_badge_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profile_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_badge_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_badge_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_badge_assignments_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "salon_badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_badge_assignments_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_badges: {
        Row: {
          auto_rule: Json | null
          bg_color: string
          color: string
          created_at: string | null
          icon: string
          id: string
          is_system: boolean | null
          name_de: string
          name_en: string
          name_fr: string | null
          name_it: string | null
        }
        Insert: {
          auto_rule?: Json | null
          bg_color?: string
          color?: string
          created_at?: string | null
          icon?: string
          id?: string
          is_system?: boolean | null
          name_de: string
          name_en: string
          name_fr?: string | null
          name_it?: string | null
        }
        Update: {
          auto_rule?: Json | null
          bg_color?: string
          color?: string
          created_at?: string | null
          icon?: string
          id?: string
          is_system?: boolean | null
          name_de?: string
          name_en?: string
          name_fr?: string | null
          name_it?: string | null
        }
        Relationships: []
      }
      salon_clients: {
        Row: {
          allergies: string | null
          created_at: string | null
          email: string | null
          id: string
          is_vip: boolean | null
          name: string
          no_show_count: number | null
          notes: string | null
          phone: string | null
          profile_id: string | null
          salon_id: string
          updated_at: string | null
        }
        Insert: {
          allergies?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_vip?: boolean | null
          name: string
          no_show_count?: number | null
          notes?: string | null
          phone?: string | null
          profile_id?: string | null
          salon_id: string
          updated_at?: string | null
        }
        Update: {
          allergies?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_vip?: boolean | null
          name?: string
          no_show_count?: number | null
          notes?: string | null
          phone?: string | null
          profile_id?: string | null
          salon_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salon_clients_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profile_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_clients_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_clients_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_clients_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_closures: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          reason: string | null
          salon_id: string
          start_date: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          reason?: string | null
          salon_id: string
          start_date: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          reason?: string | null
          salon_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "salon_closures_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_directory: {
        Row: {
          address: string | null
          categories: string[] | null
          city_id: string | null
          claim_verification_code: string | null
          claim_verification_expires_at: string | null
          claimed_salon_id: string | null
          created_at: string | null
          email: string | null
          google_maps_url: string | null
          google_place_id: string | null
          google_rating: number | null
          google_review_count: number | null
          id: string
          is_claimed: boolean | null
          name: string
          opening_hours: Json | null
          outreach_email_opened: boolean | null
          outreach_email_sent_at: string | null
          phone: string | null
          photo_url: string | null
          postal_code: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          categories?: string[] | null
          city_id?: string | null
          claim_verification_code?: string | null
          claim_verification_expires_at?: string | null
          claimed_salon_id?: string | null
          created_at?: string | null
          email?: string | null
          google_maps_url?: string | null
          google_place_id?: string | null
          google_rating?: number | null
          google_review_count?: number | null
          id?: string
          is_claimed?: boolean | null
          name: string
          opening_hours?: Json | null
          outreach_email_opened?: boolean | null
          outreach_email_sent_at?: string | null
          phone?: string | null
          photo_url?: string | null
          postal_code?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          categories?: string[] | null
          city_id?: string | null
          claim_verification_code?: string | null
          claim_verification_expires_at?: string | null
          claimed_salon_id?: string | null
          created_at?: string | null
          email?: string | null
          google_maps_url?: string | null
          google_place_id?: string | null
          google_rating?: number | null
          google_review_count?: number | null
          id?: string
          is_claimed?: boolean | null
          name?: string
          opening_hours?: Json | null
          outreach_email_opened?: boolean | null
          outreach_email_sent_at?: string | null
          phone?: string | null
          photo_url?: string | null
          postal_code?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salon_directory_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_directory_claimed_salon_id_fkey"
            columns: ["claimed_salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_documents: {
        Row: {
          admin_note: string | null
          document_type: string
          file_name: string
          file_url: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          salon_id: string
          status: string | null
          uploaded_at: string | null
        }
        Insert: {
          admin_note?: string | null
          document_type: string
          file_name: string
          file_url: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          salon_id: string
          status?: string | null
          uploaded_at?: string | null
        }
        Update: {
          admin_note?: string | null
          document_type?: string
          file_name?: string
          file_url?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          salon_id?: string
          status?: string | null
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salon_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profile_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_documents_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_drafts: {
        Row: {
          current_step: number | null
          draft_data: Json
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          current_step?: number | null
          draft_data?: Json
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          current_step?: number | null
          draft_data?: Json
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      salon_engagement: {
        Row: {
          bookings: number
          favorites: number
          reviews: number
          salon_id: string
          score: number
          updated_at: string
        }
        Insert: {
          bookings?: number
          favorites?: number
          reviews?: number
          salon_id: string
          score?: number
          updated_at?: string
        }
        Update: {
          bookings?: number
          favorites?: number
          reviews?: number
          salon_id?: string
          score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "salon_engagement_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: true
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_groups: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          slug: string
          website: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          website?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          website?: string | null
        }
        Relationships: []
      }
      salon_last_minute_settings: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          global_discount_percent: number | null
          id: string
          salon_id: string
          service_overrides: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          global_discount_percent?: number | null
          id?: string
          salon_id: string
          service_overrides?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          global_discount_percent?: number | null
          id?: string
          salon_id?: string
          service_overrides?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salon_last_minute_settings_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: true
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_of_month_winners: {
        Row: {
          id: string
          is_current: boolean
          month: string
          reason: string | null
          salon_id: string
          selected_at: string
          selected_by: string | null
        }
        Insert: {
          id?: string
          is_current?: boolean
          month: string
          reason?: string | null
          salon_id: string
          selected_at?: string
          selected_by?: string | null
        }
        Update: {
          id?: string
          is_current?: boolean
          month?: string
          reason?: string | null
          salon_id?: string
          selected_at?: string
          selected_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salon_of_month_winners_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_of_month_winners_selected_by_fkey"
            columns: ["selected_by"]
            isOneToOne: false
            referencedRelation: "profile_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_of_month_winners_selected_by_fkey"
            columns: ["selected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_of_month_winners_selected_by_fkey"
            columns: ["selected_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_pace: {
        Row: {
          pace_minutes: number | null
          salon_id: string
          sample_count: number
          updated_at: string | null
        }
        Insert: {
          pace_minutes?: number | null
          salon_id: string
          sample_count?: number
          updated_at?: string | null
        }
        Update: {
          pace_minutes?: number | null
          salon_id?: string
          sample_count?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salon_pace_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: true
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_page_views: {
        Row: {
          created_at: string
          id: string
          salon_id: string
          source: string
        }
        Insert: {
          created_at?: string
          id?: string
          salon_id: string
          source?: string
        }
        Update: {
          created_at?: string
          id?: string
          salon_id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "salon_page_views_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_payouts: {
        Row: {
          booking_id: string | null
          commission_amount: number
          commission_percent: number
          created_at: string | null
          gross_amount: number
          id: string
          lost_dispute_id: string | null
          net_amount: number
          salon_id: string
          status: string
          stripe_payment_intent_id: string | null
        }
        Insert: {
          booking_id?: string | null
          commission_amount?: number
          commission_percent?: number
          created_at?: string | null
          gross_amount?: number
          id?: string
          lost_dispute_id?: string | null
          net_amount?: number
          salon_id: string
          status?: string
          stripe_payment_intent_id?: string | null
        }
        Update: {
          booking_id?: string | null
          commission_amount?: number
          commission_percent?: number
          created_at?: string | null
          gross_amount?: number
          id?: string
          lost_dispute_id?: string | null
          net_amount?: number
          salon_id?: string
          status?: string
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salon_payouts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_payouts_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_photos: {
        Row: {
          created_at: string | null
          height: number | null
          id: string
          is_cover: boolean | null
          photo_type: string | null
          salon_id: number
          sort_order: number | null
          storage_path: string | null
          uploaded_by: string | null
          url: string
          width: number | null
        }
        Insert: {
          created_at?: string | null
          height?: number | null
          id?: string
          is_cover?: boolean | null
          photo_type?: string | null
          salon_id: number
          sort_order?: number | null
          storage_path?: string | null
          uploaded_by?: string | null
          url: string
          width?: number | null
        }
        Update: {
          created_at?: string | null
          height?: number | null
          id?: string
          is_cover?: boolean | null
          photo_type?: string | null
          salon_id?: number
          sort_order?: number | null
          storage_path?: string | null
          uploaded_by?: string | null
          url?: string
          width?: number | null
        }
        Relationships: []
      }
      salon_portfolio_images: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          image_url: string
          salon_id: string
          sort_order: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          salon_id: string
          sort_order?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          salon_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "salon_portfolio_images_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salons: {
        Row: {
          about_text_de: string | null
          about_text_en: string | null
          about_text_fr: string | null
          about_text_it: string | null
          accepts_online_payment: boolean | null
          acquisition_source: string | null
          address: string
          approved_at: string | null
          approved_by: string | null
          auto_assign_method: string | null
          auto_complete_enabled: boolean
          average_rating: number | null
          booking_confirmation_mode: string | null
          calendar_color_by: string
          cancellation_fee_type: string | null
          cancellation_fee_value: number | null
          cancellation_hours: number | null
          cancellation_window_hours: number | null
          categories: string[]
          category_colors: Json | null
          city_id: string | null
          cover_photo_url: string | null
          created_at: string | null
          daily_limit: number | null
          daily_limit_enabled: boolean | null
          deposit_max: number | null
          deposit_min: number | null
          deposit_percent: number | null
          description_de: string | null
          description_en: string | null
          description_fr: string | null
          description_it: string | null
          email: string | null
          explore_score: number | null
          facebook_url: string | null
          family_owned: boolean | null
          free_cancel_hours: number | null
          frozen_at: string | null
          frozen_reason: string | null
          gallery_urls: string[] | null
          google_place_id: string | null
          group_id: string | null
          id: string
          instagram_url: string | null
          instant_booking_enabled: boolean | null
          is_active: boolean | null
          is_featured: boolean | null
          is_test: boolean
          is_top_pick: boolean
          kid_friendly: boolean | null
          last_minute_discount_percent: number | null
          last_minute_window_hours: number | null
          last_verified_at: string | null
          late_cancel_fee_percent: number | null
          latitude: number
          lgbtq_friendly: boolean | null
          listed_on_marketplace: boolean | null
          longitude: number
          member_commission_waiver_rate: number
          name: string
          near_public_transport: boolean | null
          no_show_deposit_amount: number | null
          no_show_fee_type: string | null
          no_show_fee_value: number | null
          onboarding_goals: string[] | null
          online_booking_enabled: boolean | null
          opening_hours: Json | null
          owner_id: string
          parent_salon_id: string | null
          payment_mode: string | null
          payment_mode_admin: string | null
          payment_mode_enforced: boolean
          pet_friendly: boolean | null
          phone: string | null
          postal_code: string | null
          quartier: string | null
          registration_completed: boolean | null
          rejected_at: string | null
          rejection_reason: string | null
          review_count: number | null
          review_photos_enabled: boolean
          reviews_enabled: boolean
          score_details: Json | null
          search_doc: unknown
          slug: string
          sms_reminder_1h: boolean | null
          sms_reminder_24h: boolean | null
          solen_score: number | null
          solen_tier: string | null
          stripe_account_id: string | null
          student_discount: boolean | null
          team_size: string | null
          tiktok_url: string | null
          timezone: string | null
          updated_at: string | null
          vacation_end: string | null
          vacation_start: string | null
          vat_number: string | null
          vat_rate: number | null
          vat_registered: boolean | null
          verification_token: string | null
          verification_token_expires_at: string | null
          verification_warnings: number | null
          walkin_enabled: boolean | null
          walkin_mode: string | null
          walkin_paused: boolean | null
          walkin_ticket_seq: number
          warning_count: number | null
          website_url: string | null
          wheelchair_accessible: boolean | null
          wifi_friendly: boolean | null
          woman_owned: boolean | null
        }
        Insert: {
          about_text_de?: string | null
          about_text_en?: string | null
          about_text_fr?: string | null
          about_text_it?: string | null
          accepts_online_payment?: boolean | null
          acquisition_source?: string | null
          address: string
          approved_at?: string | null
          approved_by?: string | null
          auto_assign_method?: string | null
          auto_complete_enabled?: boolean
          average_rating?: number | null
          booking_confirmation_mode?: string | null
          calendar_color_by?: string
          cancellation_fee_type?: string | null
          cancellation_fee_value?: number | null
          cancellation_hours?: number | null
          cancellation_window_hours?: number | null
          categories?: string[]
          category_colors?: Json | null
          city_id?: string | null
          cover_photo_url?: string | null
          created_at?: string | null
          daily_limit?: number | null
          daily_limit_enabled?: boolean | null
          deposit_max?: number | null
          deposit_min?: number | null
          deposit_percent?: number | null
          description_de?: string | null
          description_en?: string | null
          description_fr?: string | null
          description_it?: string | null
          email?: string | null
          explore_score?: number | null
          facebook_url?: string | null
          family_owned?: boolean | null
          free_cancel_hours?: number | null
          frozen_at?: string | null
          frozen_reason?: string | null
          gallery_urls?: string[] | null
          google_place_id?: string | null
          group_id?: string | null
          id?: string
          instagram_url?: string | null
          instant_booking_enabled?: boolean | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_test?: boolean
          is_top_pick?: boolean
          kid_friendly?: boolean | null
          last_minute_discount_percent?: number | null
          last_minute_window_hours?: number | null
          last_verified_at?: string | null
          late_cancel_fee_percent?: number | null
          latitude: number
          lgbtq_friendly?: boolean | null
          listed_on_marketplace?: boolean | null
          longitude: number
          member_commission_waiver_rate?: number
          name: string
          near_public_transport?: boolean | null
          no_show_deposit_amount?: number | null
          no_show_fee_type?: string | null
          no_show_fee_value?: number | null
          onboarding_goals?: string[] | null
          online_booking_enabled?: boolean | null
          opening_hours?: Json | null
          owner_id: string
          parent_salon_id?: string | null
          payment_mode?: string | null
          payment_mode_admin?: string | null
          payment_mode_enforced?: boolean
          pet_friendly?: boolean | null
          phone?: string | null
          postal_code?: string | null
          quartier?: string | null
          registration_completed?: boolean | null
          rejected_at?: string | null
          rejection_reason?: string | null
          review_count?: number | null
          review_photos_enabled?: boolean
          reviews_enabled?: boolean
          score_details?: Json | null
          search_doc?: unknown
          slug: string
          sms_reminder_1h?: boolean | null
          sms_reminder_24h?: boolean | null
          solen_score?: number | null
          solen_tier?: string | null
          stripe_account_id?: string | null
          student_discount?: boolean | null
          team_size?: string | null
          tiktok_url?: string | null
          timezone?: string | null
          updated_at?: string | null
          vacation_end?: string | null
          vacation_start?: string | null
          vat_number?: string | null
          vat_rate?: number | null
          vat_registered?: boolean | null
          verification_token?: string | null
          verification_token_expires_at?: string | null
          verification_warnings?: number | null
          walkin_enabled?: boolean | null
          walkin_mode?: string | null
          walkin_paused?: boolean | null
          walkin_ticket_seq?: number
          warning_count?: number | null
          website_url?: string | null
          wheelchair_accessible?: boolean | null
          wifi_friendly?: boolean | null
          woman_owned?: boolean | null
        }
        Update: {
          about_text_de?: string | null
          about_text_en?: string | null
          about_text_fr?: string | null
          about_text_it?: string | null
          accepts_online_payment?: boolean | null
          acquisition_source?: string | null
          address?: string
          approved_at?: string | null
          approved_by?: string | null
          auto_assign_method?: string | null
          auto_complete_enabled?: boolean
          average_rating?: number | null
          booking_confirmation_mode?: string | null
          calendar_color_by?: string
          cancellation_fee_type?: string | null
          cancellation_fee_value?: number | null
          cancellation_hours?: number | null
          cancellation_window_hours?: number | null
          categories?: string[]
          category_colors?: Json | null
          city_id?: string | null
          cover_photo_url?: string | null
          created_at?: string | null
          daily_limit?: number | null
          daily_limit_enabled?: boolean | null
          deposit_max?: number | null
          deposit_min?: number | null
          deposit_percent?: number | null
          description_de?: string | null
          description_en?: string | null
          description_fr?: string | null
          description_it?: string | null
          email?: string | null
          explore_score?: number | null
          facebook_url?: string | null
          family_owned?: boolean | null
          free_cancel_hours?: number | null
          frozen_at?: string | null
          frozen_reason?: string | null
          gallery_urls?: string[] | null
          google_place_id?: string | null
          group_id?: string | null
          id?: string
          instagram_url?: string | null
          instant_booking_enabled?: boolean | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_test?: boolean
          is_top_pick?: boolean
          kid_friendly?: boolean | null
          last_minute_discount_percent?: number | null
          last_minute_window_hours?: number | null
          last_verified_at?: string | null
          late_cancel_fee_percent?: number | null
          latitude?: number
          lgbtq_friendly?: boolean | null
          listed_on_marketplace?: boolean | null
          longitude?: number
          member_commission_waiver_rate?: number
          name?: string
          near_public_transport?: boolean | null
          no_show_deposit_amount?: number | null
          no_show_fee_type?: string | null
          no_show_fee_value?: number | null
          onboarding_goals?: string[] | null
          online_booking_enabled?: boolean | null
          opening_hours?: Json | null
          owner_id?: string
          parent_salon_id?: string | null
          payment_mode?: string | null
          payment_mode_admin?: string | null
          payment_mode_enforced?: boolean
          pet_friendly?: boolean | null
          phone?: string | null
          postal_code?: string | null
          quartier?: string | null
          registration_completed?: boolean | null
          rejected_at?: string | null
          rejection_reason?: string | null
          review_count?: number | null
          review_photos_enabled?: boolean
          reviews_enabled?: boolean
          score_details?: Json | null
          search_doc?: unknown
          slug?: string
          sms_reminder_1h?: boolean | null
          sms_reminder_24h?: boolean | null
          solen_score?: number | null
          solen_tier?: string | null
          stripe_account_id?: string | null
          student_discount?: boolean | null
          team_size?: string | null
          tiktok_url?: string | null
          timezone?: string | null
          updated_at?: string | null
          vacation_end?: string | null
          vacation_start?: string | null
          vat_number?: string | null
          vat_rate?: number | null
          vat_registered?: boolean | null
          verification_token?: string | null
          verification_token_expires_at?: string | null
          verification_warnings?: number | null
          walkin_enabled?: boolean | null
          walkin_mode?: string | null
          walkin_paused?: boolean | null
          walkin_ticket_seq?: number
          warning_count?: number | null
          website_url?: string | null
          wheelchair_accessible?: boolean | null
          wifi_friendly?: boolean | null
          woman_owned?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "salons_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profile_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salons_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salons_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salons_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salons_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "salon_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salons_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profile_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salons_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salons_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salons_parent_salon_id_fkey"
            columns: ["parent_salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      search_embeddings: {
        Row: {
          category: string
          embedding: string | null
          entity_id: string
          entity_type: string
          id: string
          text_content: string
          updated_at: string | null
        }
        Insert: {
          category: string
          embedding?: string | null
          entity_id: string
          entity_type: string
          id?: string
          text_content: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          embedding?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          text_content?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      search_events: {
        Row: {
          booked: boolean
          city_id: string | null
          clicked_id: string | null
          clicked_position: number | null
          clicked_type: string | null
          consent_given: boolean
          created_at: string
          id: string
          locale: string | null
          query: string | null
          query_norm: string | null
          results_count: number | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          booked?: boolean
          city_id?: string | null
          clicked_id?: string | null
          clicked_position?: number | null
          clicked_type?: string | null
          consent_given?: boolean
          created_at?: string
          id?: string
          locale?: string | null
          query?: string | null
          query_norm?: string | null
          results_count?: number | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          booked?: boolean
          city_id?: string | null
          clicked_id?: string | null
          clicked_position?: number | null
          clicked_type?: string | null
          consent_given?: boolean
          created_at?: string
          id?: string
          locale?: string | null
          query?: string | null
          query_norm?: string | null
          results_count?: number | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "search_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "search_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "search_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      search_ranking_weights: {
        Row: {
          bayes_global_c: number
          bayes_prior_m: number
          id: number
          updated_at: string
          vec_threshold: number
          vec_topk: number
          w_affinity: number
          w_avail: number
          w_exact: number
          w_fts: number
          w_fuzzy: number
          w_geo: number
          w_popularity: number
          w_rating: number
          w_vector: number
        }
        Insert: {
          bayes_global_c?: number
          bayes_prior_m?: number
          id?: number
          updated_at?: string
          vec_threshold?: number
          vec_topk?: number
          w_affinity?: number
          w_avail?: number
          w_exact?: number
          w_fts?: number
          w_fuzzy?: number
          w_geo?: number
          w_popularity?: number
          w_rating?: number
          w_vector?: number
        }
        Update: {
          bayes_global_c?: number
          bayes_prior_m?: number
          id?: number
          updated_at?: string
          vec_threshold?: number
          vec_topk?: number
          w_affinity?: number
          w_avail?: number
          w_exact?: number
          w_fts?: number
          w_fuzzy?: number
          w_geo?: number
          w_popularity?: number
          w_rating?: number
          w_vector?: number
        }
        Relationships: []
      }
      search_synonyms: {
        Row: {
          canonical: string
          created_at: string
          id: string
          is_active: boolean
          locale: string
          price_canonical: string | null
          source: string
          term: string
          weight: number
        }
        Insert: {
          canonical: string
          created_at?: string
          id?: string
          is_active?: boolean
          locale?: string
          price_canonical?: string | null
          source?: string
          term: string
          weight?: number
        }
        Update: {
          canonical?: string
          created_at?: string
          id?: string
          is_active?: boolean
          locale?: string
          price_canonical?: string | null
          source?: string
          term?: string
          weight?: number
        }
        Relationships: []
      }
      service_addons: {
        Row: {
          addon_service_id: string
          created_at: string | null
          id: string
          service_id: string
          sort_order: number | null
        }
        Insert: {
          addon_service_id: string
          created_at?: string | null
          id?: string
          service_id: string
          sort_order?: number | null
        }
        Update: {
          addon_service_id?: string
          created_at?: string | null
          id?: string
          service_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "service_addons_addon_service_id_fkey"
            columns: ["addon_service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_addons_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_bundle_items: {
        Row: {
          bundle_id: string
          service_id: string
          sort_order: number
        }
        Insert: {
          bundle_id: string
          service_id: string
          sort_order?: number
        }
        Update: {
          bundle_id?: string
          service_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_bundle_items_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "service_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_bundle_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_bundles: {
        Row: {
          created_at: string
          custom_price: number | null
          id: string
          is_active: boolean
          name: string
          percent_off: number | null
          pricing_mode: string
          salon_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          custom_price?: number | null
          id?: string
          is_active?: boolean
          name: string
          percent_off?: number | null
          pricing_mode?: string
          salon_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          custom_price?: number | null
          id?: string
          is_active?: boolean
          name?: string
          percent_off?: number | null
          pricing_mode?: string
          salon_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_bundles_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          created_at: string | null
          icon_name: string | null
          id: string
          level: number | null
          name_de: string
          name_en: string | null
          name_fr: string | null
          name_it: string | null
          parent_id: string | null
          slug: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          icon_name?: string | null
          id?: string
          level?: number | null
          name_de: string
          name_en?: string | null
          name_fr?: string | null
          name_it?: string | null
          parent_id?: string | null
          slug: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          icon_name?: string | null
          id?: string
          level?: number | null
          name_de?: string
          name_en?: string | null
          name_fr?: string | null
          name_it?: string | null
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "service_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      service_options: {
        Row: {
          created_at: string
          duration_minutes: number
          id: string
          name_de: string
          name_en: string
          name_fr: string | null
          name_it: string | null
          price: number
          service_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          duration_minutes?: number
          id?: string
          name_de: string
          name_en: string
          name_fr?: string | null
          name_it?: string | null
          price?: number
          service_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          id?: string
          name_de?: string
          name_en?: string
          name_fr?: string | null
          name_it?: string | null
          price?: number
          service_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_options_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_packages: {
        Row: {
          bonus_sessions: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          salon_id: string
          service_id: string
          total_sessions: number
        }
        Insert: {
          bonus_sessions?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          salon_id: string
          service_id: string
          total_sessions: number
        }
        Update: {
          bonus_sessions?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          salon_id?: string
          service_id?: string
          total_sessions?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_packages_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_packages_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          buffer_minutes: number | null
          category: string
          created_at: string | null
          curing_minutes: number | null
          daily_limit_per_staff: number | null
          description_de: string | null
          description_en: string | null
          description_fr: string | null
          description_it: string | null
          duration_minutes: number
          finishing_minutes: number | null
          id: string
          is_active: boolean | null
          material_type: string | null
          name_de: string
          name_en: string
          name_fr: string | null
          name_it: string | null
          photo_urls: string[] | null
          price: number
          processing_minutes: number | null
          reminder_cycle_days: number | null
          salon_id: string
          search_doc: unknown
          sort_order: number | null
          station_required: boolean | null
          subcategory: string | null
          suitable_for: string[] | null
          suitable_gender: string[] | null
        }
        Insert: {
          buffer_minutes?: number | null
          category: string
          created_at?: string | null
          curing_minutes?: number | null
          daily_limit_per_staff?: number | null
          description_de?: string | null
          description_en?: string | null
          description_fr?: string | null
          description_it?: string | null
          duration_minutes: number
          finishing_minutes?: number | null
          id?: string
          is_active?: boolean | null
          material_type?: string | null
          name_de: string
          name_en: string
          name_fr?: string | null
          name_it?: string | null
          photo_urls?: string[] | null
          price: number
          processing_minutes?: number | null
          reminder_cycle_days?: number | null
          salon_id: string
          search_doc?: unknown
          sort_order?: number | null
          station_required?: boolean | null
          subcategory?: string | null
          suitable_for?: string[] | null
          suitable_gender?: string[] | null
        }
        Update: {
          buffer_minutes?: number | null
          category?: string
          created_at?: string | null
          curing_minutes?: number | null
          daily_limit_per_staff?: number | null
          description_de?: string | null
          description_en?: string | null
          description_fr?: string | null
          description_it?: string | null
          duration_minutes?: number
          finishing_minutes?: number | null
          id?: string
          is_active?: boolean | null
          material_type?: string | null
          name_de?: string
          name_en?: string
          name_fr?: string | null
          name_it?: string | null
          photo_urls?: string[] | null
          price?: number
          processing_minutes?: number | null
          reminder_cycle_days?: number | null
          salon_id?: string
          search_doc?: unknown
          sort_order?: number | null
          station_required?: boolean | null
          subcategory?: string | null
          suitable_for?: string[] | null
          suitable_gender?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "services_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      site_content: {
        Row: {
          auto_override: string | null
          category: string | null
          content_type: string | null
          is_auto: boolean | null
          key: string
          sort_order: number | null
          updated_at: string | null
          updated_by: string | null
          value_de: string | null
          value_en: string | null
          value_fr: string | null
          value_it: string | null
        }
        Insert: {
          auto_override?: string | null
          category?: string | null
          content_type?: string | null
          is_auto?: boolean | null
          key: string
          sort_order?: number | null
          updated_at?: string | null
          updated_by?: string | null
          value_de?: string | null
          value_en?: string | null
          value_fr?: string | null
          value_it?: string | null
        }
        Update: {
          auto_override?: string | null
          category?: string | null
          content_type?: string | null
          is_auto?: boolean | null
          key?: string
          sort_order?: number | null
          updated_at?: string | null
          updated_by?: string | null
          value_de?: string | null
          value_en?: string | null
          value_fr?: string | null
          value_it?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_content_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profile_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_content_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_content_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_reminders: {
        Row: {
          booking_id: string | null
          created_at: string | null
          error_msg: string | null
          id: string
          message: string
          phone: string
          salon_id: number
          scheduled_for: string
          sent_at: string | null
          status: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          error_msg?: string | null
          id?: string
          message: string
          phone: string
          salon_id: number
          scheduled_for: string
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          error_msg?: string | null
          id?: string
          message?: string
          phone?: string
          salon_id?: number
          scheduled_for?: string
          sent_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      spa_treatment_outcomes: {
        Row: {
          booking_id: string | null
          client_id: string | null
          created_at: string
          follow_up_notes: string | null
          id: string
          next_visit_date: string | null
          products_used: string[] | null
          salon_id: string
          satisfaction_rating: number | null
          skin_after: string | null
          skin_before: string | null
          staff_member_id: string | null
        }
        Insert: {
          booking_id?: string | null
          client_id?: string | null
          created_at?: string
          follow_up_notes?: string | null
          id?: string
          next_visit_date?: string | null
          products_used?: string[] | null
          salon_id: string
          satisfaction_rating?: number | null
          skin_after?: string | null
          skin_before?: string | null
          staff_member_id?: string | null
        }
        Update: {
          booking_id?: string | null
          client_id?: string | null
          created_at?: string
          follow_up_notes?: string | null
          id?: string
          next_visit_date?: string | null
          products_used?: string[] | null
          salon_id?: string
          satisfaction_rating?: number | null
          skin_after?: string | null
          skin_before?: string | null
          staff_member_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spa_treatment_outcomes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spa_treatment_outcomes_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spa_treatment_outcomes_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spa_treatment_outcomes_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_ratings_view"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      spa_treatment_rooms: {
        Row: {
          capacity: number | null
          cooldown_buffer_minutes: number | null
          created_at: string | null
          equipment: string[] | null
          id: string
          is_active: boolean | null
          name: string
          prep_buffer_minutes: number | null
          room_type: string | null
          salon_id: string
          sort_order: number | null
        }
        Insert: {
          capacity?: number | null
          cooldown_buffer_minutes?: number | null
          created_at?: string | null
          equipment?: string[] | null
          id?: string
          is_active?: boolean | null
          name: string
          prep_buffer_minutes?: number | null
          room_type?: string | null
          salon_id: string
          sort_order?: number | null
        }
        Update: {
          capacity?: number | null
          cooldown_buffer_minutes?: number | null
          created_at?: string | null
          equipment?: string[] | null
          id?: string
          is_active?: boolean | null
          name?: string
          prep_buffer_minutes?: number | null
          room_type?: string | null
          salon_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "spa_treatment_rooms_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_breaks: {
        Row: {
          created_at: string | null
          day_of_week: number | null
          end_time: string
          id: string
          reason: string | null
          salon_id: string
          specific_date: string | null
          staff_member_id: string | null
          start_time: string
        }
        Insert: {
          created_at?: string | null
          day_of_week?: number | null
          end_time: string
          id?: string
          reason?: string | null
          salon_id: string
          specific_date?: string | null
          staff_member_id?: string | null
          start_time: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number | null
          end_time?: string
          id?: string
          reason?: string | null
          salon_id?: string
          specific_date?: string | null
          staff_member_id?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_breaks_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_breaks_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_breaks_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_ratings_view"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      staff_calendars: {
        Row: {
          block_type: string | null
          created_at: string | null
          date: string
          end_time: string | null
          id: string
          note: string | null
          salon_id: number
          staff_name: string
          start_time: string | null
        }
        Insert: {
          block_type?: string | null
          created_at?: string | null
          date: string
          end_time?: string | null
          id?: string
          note?: string | null
          salon_id: number
          staff_name: string
          start_time?: string | null
        }
        Update: {
          block_type?: string | null
          created_at?: string | null
          date?: string
          end_time?: string | null
          id?: string
          note?: string | null
          salon_id?: number
          staff_name?: string
          start_time?: string | null
        }
        Relationships: []
      }
      staff_invites: {
        Row: {
          accepted_by: string | null
          access_role: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          permissions: Json | null
          salon_id: string
          staff_member_id: string | null
          staff_name: string | null
          status: string | null
          token: string
        }
        Insert: {
          accepted_by?: string | null
          access_role?: string | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          permissions?: Json | null
          salon_id: string
          staff_member_id?: string | null
          staff_name?: string | null
          status?: string | null
          token: string
        }
        Update: {
          accepted_by?: string | null
          access_role?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          permissions?: Json | null
          salon_id?: string
          staff_member_id?: string | null
          staff_name?: string | null
          status?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_invites_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_invites_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_invites_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_ratings_view"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      staff_members: {
        Row: {
          accent_color: string | null
          access_role: string | null
          appointments_completed: number
          avatar_url: string | null
          average_rating: number | null
          bio: string | null
          clients_served: number
          commission_rate: number | null
          cover_photo_url: string | null
          created_at: string | null
          id: string
          instagram_url: string | null
          is_active: boolean | null
          is_publicly_listed: boolean
          languages: string[] | null
          name: string
          permissions: Json | null
          review_count: number
          salon_id: string
          slug: string | null
          specialties: string[] | null
          user_id: string | null
          years_experience: number | null
        }
        Insert: {
          accent_color?: string | null
          access_role?: string | null
          appointments_completed?: number
          avatar_url?: string | null
          average_rating?: number | null
          bio?: string | null
          clients_served?: number
          commission_rate?: number | null
          cover_photo_url?: string | null
          created_at?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          is_publicly_listed?: boolean
          languages?: string[] | null
          name: string
          permissions?: Json | null
          review_count?: number
          salon_id: string
          slug?: string | null
          specialties?: string[] | null
          user_id?: string | null
          years_experience?: number | null
        }
        Update: {
          accent_color?: string | null
          access_role?: string | null
          appointments_completed?: number
          avatar_url?: string | null
          average_rating?: number | null
          bio?: string | null
          clients_served?: number
          commission_rate?: number | null
          cover_photo_url?: string | null
          created_at?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          is_publicly_listed?: boolean
          languages?: string[] | null
          name?: string
          permissions?: Json | null
          review_count?: number
          salon_id?: string
          slug?: string | null
          specialties?: string[] | null
          user_id?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_members_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_portfolio_images: {
        Row: {
          barber_style: string | null
          before_photo_url: string | null
          created_at: string
          fade_type: string | null
          id: string
          image_url: string
          is_before_after: boolean | null
          nail_material: string | null
          nail_shape: string | null
          nail_style: string | null
          sort_order: number
          staff_id: string
          tags: string[] | null
        }
        Insert: {
          barber_style?: string | null
          before_photo_url?: string | null
          created_at?: string
          fade_type?: string | null
          id?: string
          image_url: string
          is_before_after?: boolean | null
          nail_material?: string | null
          nail_shape?: string | null
          nail_style?: string | null
          sort_order?: number
          staff_id: string
          tags?: string[] | null
        }
        Update: {
          barber_style?: string | null
          before_photo_url?: string | null
          created_at?: string
          fade_type?: string | null
          id?: string
          image_url?: string
          is_before_after?: boolean | null
          nail_material?: string | null
          nail_shape?: string | null
          nail_style?: string | null
          sort_order?: number
          staff_id?: string
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_portfolio_images_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_portfolio_images_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_ratings_view"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      staff_schedules: {
        Row: {
          alternate_week_parity: number | null
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          is_alternate_week: boolean | null
          is_working: boolean | null
          salon_id: string
          staff_member_id: string | null
          start_time: string
          updated_at: string | null
        }
        Insert: {
          alternate_week_parity?: number | null
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          is_alternate_week?: boolean | null
          is_working?: boolean | null
          salon_id: string
          staff_member_id?: string | null
          start_time: string
          updated_at?: string | null
        }
        Update: {
          alternate_week_parity?: number | null
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          is_alternate_week?: boolean | null
          is_working?: boolean | null
          salon_id?: string
          staff_member_id?: string | null
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_schedules_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_schedules_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_schedules_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_ratings_view"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      staff_services: {
        Row: {
          price_override: number | null
          service_id: string
          staff_member_id: string
          tier_label: string | null
        }
        Insert: {
          price_override?: number | null
          service_id: string
          staff_member_id: string
          tier_label?: string | null
        }
        Update: {
          price_override?: number | null
          service_id?: string
          staff_member_id?: string
          tier_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_services_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_services_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_ratings_view"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      staff_time_off: {
        Row: {
          approved_by: string | null
          created_at: string | null
          end_date: string
          id: string
          reason: string | null
          salon_id: string
          staff_member_id: string | null
          start_date: string
          status: string | null
        }
        Insert: {
          approved_by?: string | null
          created_at?: string | null
          end_date: string
          id?: string
          reason?: string | null
          salon_id: string
          staff_member_id?: string | null
          start_date: string
          status?: string | null
        }
        Update: {
          approved_by?: string | null
          created_at?: string | null
          end_date?: string
          id?: string
          reason?: string | null
          salon_id?: string
          staff_member_id?: string | null
          start_date?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_time_off_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_time_off_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_time_off_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_ratings_view"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      tier_perks: {
        Row: {
          cancel_grace_per_month: number
          discount_pct: number
          max_discount_uses_per_window: number | null
          prime_time_early_access: boolean
          reschedule_free: boolean
          tier: string
          tier_up_gift: boolean
          updated_at: string
          walkin_priority: boolean
        }
        Insert: {
          cancel_grace_per_month?: number
          discount_pct?: number
          max_discount_uses_per_window?: number | null
          prime_time_early_access?: boolean
          reschedule_free?: boolean
          tier: string
          tier_up_gift?: boolean
          updated_at?: string
          walkin_priority?: boolean
        }
        Update: {
          cancel_grace_per_month?: number
          discount_pct?: number
          max_discount_uses_per_window?: number | null
          prime_time_early_access?: boolean
          reschedule_free?: boolean
          tier?: string
          tier_up_gift?: boolean
          updated_at?: string
          walkin_priority?: boolean
        }
        Relationships: []
      }
      tips: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string | null
          id: string
          salon_id: string
          staff_member_id: string | null
          status: string
          stripe_payment_intent_id: string | null
          user_id: string | null
          walkin_queue_id: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string | null
          id?: string
          salon_id: string
          staff_member_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          user_id?: string | null
          walkin_queue_id?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string | null
          id?: string
          salon_id?: string
          staff_member_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          user_id?: string | null
          walkin_queue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tips_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tips_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tips_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_ratings_view"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      user_credits: {
        Row: {
          amount: number
          created_at: string | null
          expires_at: string | null
          id: string
          remaining: number
          source: string
          source_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          remaining: number
          source: string
          source_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          remaining?: number
          source?: string
          source_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          avg_booking_interval_days: number | null
          booking_intervals: Json | null
          created_at: string | null
          dismissed_nudges: Json | null
          favorite_quartier_ids: string[] | null
          favorite_service_slugs: string[] | null
          last_booked_service: string | null
          last_nudge_sent_at: string | null
          quartier_visit_counts: Json | null
          updated_at: string | null
          user_id: string
          view_preference: string | null
          welcome_step: number | null
        }
        Insert: {
          avg_booking_interval_days?: number | null
          booking_intervals?: Json | null
          created_at?: string | null
          dismissed_nudges?: Json | null
          favorite_quartier_ids?: string[] | null
          favorite_service_slugs?: string[] | null
          last_booked_service?: string | null
          last_nudge_sent_at?: string | null
          quartier_visit_counts?: Json | null
          updated_at?: string | null
          user_id: string
          view_preference?: string | null
          welcome_step?: number | null
        }
        Update: {
          avg_booking_interval_days?: number | null
          booking_intervals?: Json | null
          created_at?: string | null
          dismissed_nudges?: Json | null
          favorite_quartier_ids?: string[] | null
          favorite_service_slugs?: string[] | null
          last_booked_service?: string | null
          last_nudge_sent_at?: string | null
          quartier_visit_counts?: Json | null
          updated_at?: string | null
          user_id?: string
          view_preference?: string | null
          welcome_step?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profile_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_salon_affinity: {
        Row: {
          books: number
          clicks: number
          last_event_at: string | null
          salon_id: string
          score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          books?: number
          clicks?: number
          last_event_at?: string | null
          salon_id: string
          score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          books?: number
          clicks?: number
          last_event_at?: string | null
          salon_id?: string
          score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_salon_affinity_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_style_affinity: {
        Row: {
          attr_type: string
          attr_value: string
          events: number
          last_event_at: string | null
          score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          attr_type: string
          attr_value: string
          events?: number
          last_event_at?: string | null
          score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          attr_type?: string
          attr_value?: string
          events?: number
          last_event_at?: string | null
          score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      voucher_purchases: {
        Row: {
          amount_paid: number
          created_at: string | null
          customer_id: string
          id: string
          is_gift: boolean | null
          promo_code_id: string | null
          recipient_email: string | null
          stripe_payment_intent_id: string
        }
        Insert: {
          amount_paid: number
          created_at?: string | null
          customer_id: string
          id?: string
          is_gift?: boolean | null
          promo_code_id?: string | null
          recipient_email?: string | null
          stripe_payment_intent_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string | null
          customer_id?: string
          id?: string
          is_gift?: boolean | null
          promo_code_id?: string | null
          recipient_email?: string | null
          stripe_payment_intent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voucher_purchases_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      voucher_redemptions: {
        Row: {
          amount_redeemed: number
          booking_id: string | null
          created_at: string | null
          id: string
          stripe_payment_intent_id: string | null
          user_id: string | null
          voucher_id: string
        }
        Insert: {
          amount_redeemed: number
          booking_id?: string | null
          created_at?: string | null
          id?: string
          stripe_payment_intent_id?: string | null
          user_id?: string | null
          voucher_id: string
        }
        Update: {
          amount_redeemed?: number
          booking_id?: string | null
          created_at?: string | null
          id?: string
          stripe_payment_intent_id?: string | null
          user_id?: string | null
          voucher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voucher_redemptions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voucher_redemptions_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      vouchers: {
        Row: {
          amount: number
          buyer_email: string | null
          buyer_id: string | null
          code: string
          created_at: string | null
          expires_at: string | null
          id: string
          message: string | null
          recipient_email: string
          recipient_name: string | null
          redeemed_at: string | null
          redeemed_by: string | null
          remaining_amount: number | null
          salon_id: string
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount: number
          buyer_email?: string | null
          buyer_id?: string | null
          code?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          message?: string | null
          recipient_email: string
          recipient_name?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          remaining_amount?: number | null
          salon_id: string
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount?: number
          buyer_email?: string | null
          buyer_id?: string | null
          code?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          message?: string | null
          recipient_email?: string
          recipient_name?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          remaining_amount?: number | null
          salon_id?: string
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vouchers_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          booked_at: string | null
          created_at: string | null
          id: string
          notified_at: string | null
          preferred_date: string | null
          preferred_time_range: string | null
          salon_id: string | null
          service_id: string | null
          staff_member_id: string | null
          user_id: string | null
        }
        Insert: {
          booked_at?: string | null
          created_at?: string | null
          id?: string
          notified_at?: string | null
          preferred_date?: string | null
          preferred_time_range?: string | null
          salon_id?: string | null
          service_id?: string | null
          staff_member_id?: string | null
          user_id?: string | null
        }
        Update: {
          booked_at?: string | null
          created_at?: string | null
          id?: string
          notified_at?: string | null
          preferred_date?: string | null
          preferred_time_range?: string | null
          salon_id?: string | null
          service_id?: string | null
          staff_member_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_ratings_view"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "waitlist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      warnings: {
        Row: {
          created_at: string | null
          dispute_id: string | null
          id: string
          issued_by: string | null
          reason: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          dispute_id?: string | null
          id?: string
          issued_by?: string | null
          reason: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          dispute_id?: string | null
          id?: string
          issued_by?: string | null
          reason?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warnings_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profile_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warnings_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warnings_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warnings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warnings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warnings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      waxing_sensitivity_log: {
        Row: {
          affected_zones: string[] | null
          aftercare_provided: string | null
          booking_id: string | null
          client_id: string
          created_at: string | null
          id: string
          medications: string | null
          notes: string | null
          reaction_level: string
          salon_id: string
          sun_exposure_recent: boolean | null
        }
        Insert: {
          affected_zones?: string[] | null
          aftercare_provided?: string | null
          booking_id?: string | null
          client_id: string
          created_at?: string | null
          id?: string
          medications?: string | null
          notes?: string | null
          reaction_level: string
          salon_id: string
          sun_exposure_recent?: boolean | null
        }
        Update: {
          affected_zones?: string[] | null
          aftercare_provided?: string | null
          booking_id?: string | null
          client_id?: string
          created_at?: string | null
          id?: string
          medications?: string | null
          notes?: string | null
          reaction_level?: string
          salon_id?: string
          sun_exposure_recent?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "waxing_sensitivity_log_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waxing_sensitivity_log_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profile_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waxing_sensitivity_log_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waxing_sensitivity_log_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waxing_sensitivity_log_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      waxing_zone_packages: {
        Row: {
          created_at: string | null
          discount_percent: number
          id: string
          name: string
          salon_id: string
          zones: string[]
        }
        Insert: {
          created_at?: string | null
          discount_percent?: number
          id?: string
          name: string
          salon_id: string
          zones: string[]
        }
        Update: {
          created_at?: string | null
          discount_percent?: number
          id?: string
          name?: string
          salon_id?: string
          zones?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "waxing_zone_packages_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      waxing_zone_preferences: {
        Row: {
          booking_id: string | null
          client_id: string
          created_at: string | null
          id: string
          salon_id: string
          wax_type_preferences: Json | null
          zones_selected: string[]
        }
        Insert: {
          booking_id?: string | null
          client_id: string
          created_at?: string | null
          id?: string
          salon_id: string
          wax_type_preferences?: Json | null
          zones_selected: string[]
        }
        Update: {
          booking_id?: string | null
          client_id?: string
          created_at?: string | null
          id?: string
          salon_id?: string
          wax_type_preferences?: Json | null
          zones_selected?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "waxing_zone_preferences_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waxing_zone_preferences_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profile_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waxing_zone_preferences_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waxing_zone_preferences_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waxing_zone_preferences_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_journals: {
        Row: {
          aftercare_notes: string | null
          booking_id: string | null
          client_id: string
          created_at: string | null
          id: string
          notes: string | null
          pain_level: number | null
          pressure_preference: string | null
          products_used: string[] | null
          salon_id: string
          skin_condition: string | null
          staff_member_id: string | null
          tension_areas: string[] | null
        }
        Insert: {
          aftercare_notes?: string | null
          booking_id?: string | null
          client_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          pain_level?: number | null
          pressure_preference?: string | null
          products_used?: string[] | null
          salon_id: string
          skin_condition?: string | null
          staff_member_id?: string | null
          tension_areas?: string[] | null
        }
        Update: {
          aftercare_notes?: string | null
          booking_id?: string | null
          client_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          pain_level?: number | null
          pressure_preference?: string | null
          products_used?: string[] | null
          salon_id?: string
          skin_condition?: string | null
          staff_member_id?: string | null
          tension_areas?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "wellness_journals_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wellness_journals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profile_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wellness_journals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wellness_journals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wellness_journals_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wellness_journals_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wellness_journals_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_ratings_view"
            referencedColumns: ["staff_id"]
          },
        ]
      }
    }
    Views: {
      availability_slots_public: {
        Row: {
          ends_at: string | null
          id: string | null
          last_minute_discount_percent: number | null
          salon_id: string | null
          service_id: string | null
          staff_member_id: string | null
          starts_at: string | null
          status: string | null
        }
        Insert: {
          ends_at?: string | null
          id?: string | null
          last_minute_discount_percent?: number | null
          salon_id?: string | null
          service_id?: string | null
          staff_member_id?: string | null
          starts_at?: string | null
          status?: string | null
        }
        Update: {
          ends_at?: string | null
          id?: string | null
          last_minute_discount_percent?: number | null
          salon_id?: string | null
          service_id?: string | null
          staff_member_id?: string | null
          starts_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_slots_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_slots_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_slots_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_slots_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_ratings_view"
            referencedColumns: ["staff_id"]
          },
        ]
      }
      profile_summaries: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          id: string | null
        }
        Insert: {
          avatar_url?: string | null
          display_name?: string | null
          id?: string | null
        }
        Update: {
          avatar_url?: string | null
          display_name?: string | null
          id?: string | null
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          id: string | null
        }
        Insert: {
          avatar_url?: string | null
          display_name?: string | null
          id?: string | null
        }
        Update: {
          avatar_url?: string | null
          display_name?: string | null
          id?: string | null
        }
        Relationships: []
      }
      search_popularity: {
        Row: {
          popularity: number | null
          salon_id: string | null
          sessions: number | null
        }
        Relationships: []
      }
      search_zero_results: {
        Row: {
          hits: number | null
          last_seen: string | null
          locale: string | null
          query_norm: string | null
        }
        Relationships: []
      }
      staff_ratings_view: {
        Row: {
          average_rating: number | null
          review_count: number | null
          staff_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      booking_counts_by_salon: {
        Args: { p_since: string }
        Returns: {
          cnt: number
          salon_id: string
        }[]
      }
      booking_revenue_sum: {
        Args: { p_salon_id: string; p_since: string }
        Returns: number
      }
      create_group_booking: {
        Args: {
          p_event_type: string
          p_group_size: number
          p_members: Json
          p_organizer_name: string
          p_salon_id: string
        }
        Returns: string
      }
      current_user_tier: { Args: { uid?: string }; Returns: string }
      decrement_retail_stock: {
        Args: { p_product_id: string }
        Returns: string
      }
      discovery_boards_for_you: {
        Args: { p_user_id: string }
        Returns: {
          category: string | null
          cover_images: string[] | null
          created_at: string | null
          description: string | null
          gender: string | null
          id: string
          is_active: boolean | null
          name: string
          name_de: string | null
          name_en: string | null
          name_fr: string | null
          name_it: string | null
          pin_count: number | null
          slug: string
          sort_order: number | null
          style_name: string | null
          texture: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "discovery_boards"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      discovery_chip_terms: {
        Args: { p_category?: string; p_limit?: number }
        Returns: {
          image_url: string
          item_id: string
          n: number
          term: string
          tiktok_thumbnail_url: string
          tiktok_url: string
        }[]
      }
      discovery_feed: {
        Args: {
          p_category?: string
          p_creator?: string
          p_gender?: string
          p_limit?: number
          p_offset?: number
          p_style?: string
          p_tags_any?: string[]
          p_texture?: string
          p_user_gender?: string
        }
        Returns: {
          alt_text: string
          author_name: string
          content_type: string
          id: string
          image_url: string
          media_type: string
          price_min: number
          source: string
          style_name: string
          tags: string[]
          tiktok_embed_html: string
          tiktok_thumbnail_url: string
          tiktok_url: string
          total_count: number
        }[]
      }
      discovery_feed_for_you: {
        Args: { p_limit?: number; p_offset?: number; p_user_id: string }
        Returns: {
          alt_text: string
          author_name: string
          content_type: string
          id: string
          image_url: string
          media_type: string
          price_min: number
          source: string
          style_name: string
          tags: string[]
          tiktok_embed_html: string
          tiktok_thumbnail_url: string
          tiktok_url: string
          total_count: number
        }[]
      }
      discovery_feed_v2: {
        Args: {
          p_category?: string
          p_creator?: string
          p_cursor_created_at?: string
          p_cursor_id?: string
          p_cursor_rank?: number
          p_cursor_sort_order?: number
          p_gender?: string
          p_limit?: number
          p_offset?: number
          p_style?: string
          p_tags_any?: string[]
          p_texture?: string
          p_user_gender?: string
        }
        Returns: {
          alt_text: string
          author_name: string
          content_type: string
          created_at_key: string
          id: string
          image_url: string
          media_type: string
          price_min: number
          rank_key: number
          sort_order_key: number
          source: string
          style_name: string
          tags: string[]
          tiktok_embed_html: string
          tiktok_thumbnail_url: string
          tiktok_url: string
          total_count: number
        }[]
      }
      discovery_fts_doc: {
        Args: {
          p_author: string
          p_description: string
          p_name: string
          p_style: string
          p_tags: string[]
        }
        Returns: unknown
      }
      discovery_recent_searches: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          image_url: string
          item_id: string
          term: string
          tiktok_thumbnail_url: string
          tiktok_url: string
        }[]
      }
      discovery_resolve_thumb: {
        Args: { p_term: string }
        Returns: {
          image_url: string
          item_id: string
          tiktok_thumbnail_url: string
          tiktok_url: string
        }[]
      }
      discovery_style_suggest: {
        Args: { p_limit?: number; q: string }
        Returns: {
          image_url: string
          item_id: string
          term: string
          tiktok_thumbnail_url: string
          tiktok_url: string
        }[]
      }
      discovery_trending_terms: {
        Args: { p_days?: number; p_limit?: number; p_min?: number }
        Returns: {
          image_url: string
          item_id: string
          n: number
          term: string
          tiktok_thumbnail_url: string
          tiktok_url: string
        }[]
      }
      earliest_slots_by_service: {
        Args: {
          p_from: string
          p_per: number
          p_service_ids: string[]
          p_to: string
        }
        Returns: {
          service_id: string
          starts_at: string
        }[]
      }
      earth: { Args: never; Returns: number }
      f_unaccent: { Args: { "": string }; Returns: string }
      fn_sibling_salons: {
        Args: { p_salon_id: string }
        Returns: {
          about_text_de: string | null
          about_text_en: string | null
          about_text_fr: string | null
          about_text_it: string | null
          accepts_online_payment: boolean | null
          acquisition_source: string | null
          address: string
          approved_at: string | null
          approved_by: string | null
          auto_assign_method: string | null
          auto_complete_enabled: boolean
          average_rating: number | null
          booking_confirmation_mode: string | null
          calendar_color_by: string
          cancellation_fee_type: string | null
          cancellation_fee_value: number | null
          cancellation_hours: number | null
          cancellation_window_hours: number | null
          categories: string[]
          category_colors: Json | null
          city_id: string | null
          cover_photo_url: string | null
          created_at: string | null
          daily_limit: number | null
          daily_limit_enabled: boolean | null
          deposit_max: number | null
          deposit_min: number | null
          deposit_percent: number | null
          description_de: string | null
          description_en: string | null
          description_fr: string | null
          description_it: string | null
          email: string | null
          explore_score: number | null
          facebook_url: string | null
          family_owned: boolean | null
          free_cancel_hours: number | null
          frozen_at: string | null
          frozen_reason: string | null
          gallery_urls: string[] | null
          google_place_id: string | null
          group_id: string | null
          id: string
          instagram_url: string | null
          instant_booking_enabled: boolean | null
          is_active: boolean | null
          is_featured: boolean | null
          is_test: boolean
          is_top_pick: boolean
          kid_friendly: boolean | null
          last_minute_discount_percent: number | null
          last_minute_window_hours: number | null
          last_verified_at: string | null
          late_cancel_fee_percent: number | null
          latitude: number
          lgbtq_friendly: boolean | null
          listed_on_marketplace: boolean | null
          longitude: number
          member_commission_waiver_rate: number
          name: string
          near_public_transport: boolean | null
          no_show_deposit_amount: number | null
          no_show_fee_type: string | null
          no_show_fee_value: number | null
          onboarding_goals: string[] | null
          online_booking_enabled: boolean | null
          opening_hours: Json | null
          owner_id: string
          parent_salon_id: string | null
          payment_mode: string | null
          payment_mode_admin: string | null
          payment_mode_enforced: boolean
          pet_friendly: boolean | null
          phone: string | null
          postal_code: string | null
          quartier: string | null
          registration_completed: boolean | null
          rejected_at: string | null
          rejection_reason: string | null
          review_count: number | null
          review_photos_enabled: boolean
          reviews_enabled: boolean
          score_details: Json | null
          search_doc: unknown
          slug: string
          sms_reminder_1h: boolean | null
          sms_reminder_24h: boolean | null
          solen_score: number | null
          solen_tier: string | null
          stripe_account_id: string | null
          student_discount: boolean | null
          team_size: string | null
          tiktok_url: string | null
          timezone: string | null
          updated_at: string | null
          vacation_end: string | null
          vacation_start: string | null
          vat_number: string | null
          vat_rate: number | null
          vat_registered: boolean | null
          verification_token: string | null
          verification_token_expires_at: string | null
          verification_warnings: number | null
          walkin_enabled: boolean | null
          walkin_mode: string | null
          walkin_paused: boolean | null
          walkin_ticket_seq: number
          warning_count: number | null
          website_url: string | null
          wheelchair_accessible: boolean | null
          wifi_friendly: boolean | null
          woman_owned: boolean | null
        }[]
        SetofOptions: {
          from: "*"
          to: "salons"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_last_minute_slots: {
        Args: { p_category?: string; p_quartier?: string }
        Returns: {
          discount_percent: number
          discounted_price: number
          ends_at: string
          original_price: number
          salon_average_rating: number
          salon_cover_photo_url: string
          salon_id: string
          salon_name: string
          salon_quartier: string
          salon_slug: string
          service_category: string
          service_duration_minutes: number
          service_id: string
          service_name_de: string
          service_name_en: string
          slot_id: string
          staff_avatar_url: string
          staff_member_id: string
          staff_name: string
          starts_at: string
        }[]
      }
      get_nearby_salon_ids: {
        Args: { lat: number; lng: number; max_dist_meters?: number }
        Returns: {
          distance_meters: number
          salon_id: string
        }[]
      }
      increment_promo_use: { Args: { p_code: string }; Returns: number }
      increment_retail_stock: {
        Args: { p_product_id: string }
        Returns: string
      }
      increment_unread: {
        Args: { conv_id: string; is_customer_sender: boolean }
        Returns: undefined
      }
      match_search_embeddings: {
        Args: {
          match_category?: string
          match_city_id?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          category: string
          entity_id: string
          entity_type: string
          similarity: number
          text_content: string
        }[]
      }
      next_available_dates: {
        Args: { p_after: string; p_salon_ids: string[] }
        Returns: {
          next_date: string
          salon_id: string
        }[]
      }
      next_walkin_ticket_seq: { Args: { p_salon_id: string }; Returns: number }
      purge_past_available_slots: {
        Args: { p_days?: number; p_limit?: number }
        Returns: number
      }
      recompute_loyalty_status: { Args: never; Returns: number }
      recompute_salon_engagement: { Args: never; Returns: number }
      recompute_user_salon_affinity: { Args: never; Returns: number }
      recompute_user_style_affinity: { Args: never; Returns: number }
      record_csp_violation: {
        Args: {
          p_directive: string
          p_disposition: string
          p_origin: string
          p_sample: string
        }
        Returns: undefined
      }
      redeem_user_credits: {
        Args: {
          p_amount: number
          p_booking: string
          p_pi: string
          p_user: string
        }
        Returns: number
      }
      redeem_voucher: {
        Args: {
          p_amount: number
          p_booking: string
          p_code: string
          p_pi: string
          p_salon_id: string
          p_user: string
        }
        Returns: number
      }
      release_member_discount: {
        Args: { p_booking: string }
        Returns: undefined
      }
      release_promo_use: { Args: { p_booking: string }; Returns: undefined }
      resequence_walkin_queue: {
        Args: { p_salon_id: string }
        Returns: undefined
      }
      reserve_member_discount: {
        Args: {
          p_booking: string
          p_tier: string
          p_user: string
          p_window_months: number
        }
        Returns: boolean
      }
      reserve_promo_use: {
        Args: { p_booking: string; p_code: string }
        Returns: boolean
      }
      restore_user_credits: { Args: { p_pi: string }; Returns: number }
      restore_voucher: { Args: { p_pi: string }; Returns: number }
      salon_client_summary: {
        Args: { p_salon_id: string }
        Returns: {
          last_cut_date: string
          preferred_barber: string
          user_id: string
          visit_count: number
        }[]
      }
      salon_search_doc: {
        Args: { p_desc_de: string; p_desc_en: string; p_name: string }
        Returns: unknown
      }
      salons_with_slot_in_hours: {
        Args: {
          p_end_hour: number
          p_from: string
          p_start_hour: number
          p_to: string
        }
        Returns: {
          salon_id: string
        }[]
      }
      save_service_bundle: {
        Args: {
          p_bundle_id: string
          p_custom_price: number
          p_is_active: boolean
          p_name: string
          p_percent_off: number
          p_pricing_mode: string
          p_salon_id: string
          p_service_ids: string[]
        }
        Returns: string
      }
      search_discovery: {
        Args: {
          p_category?: string
          p_gender?: string
          p_limit?: number
          p_offset?: number
          p_style?: string
          p_texture?: string
          q: string
        }
        Returns: {
          alt_text: string
          author_name: string
          content_type: string
          id: string
          image_url: string
          media_type: string
          price_min: number
          source: string
          style_name: string
          tags: string[]
          tiktok_embed_html: string
          tiktok_thumbnail_url: string
          tiktok_url: string
          total_count: number
        }[]
      }
      search_salons_ranked: {
        Args: { p_limit?: number; p_q: string; p_query_embedding?: string }
        Returns: {
          salon_id: string
          score: number
        }[]
      }
      search_suggest: {
        Args: { p_category?: string; p_city_id?: string; p_q: string }
        Returns: Json
      }
      service_search_doc: {
        Args: {
          p_category: string
          p_desc_de: string
          p_desc_en: string
          p_name_de: string
          p_name_en: string
          p_subcategory: string
        }
        Returns: unknown
      }
      set_customer_persona: { Args: { p_persona: Json }; Returns: undefined }
      toggle_discovery_like: {
        Args: { p_item_id: string; p_user_id: string }
        Returns: boolean
      }
      toggle_discovery_save: {
        Args: { p_collection_id?: string; p_item_id: string; p_user_id: string }
        Returns: boolean
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
