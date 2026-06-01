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
          booked_by: string | null
          booking_id: string | null
          client_id: string | null
          created_at: string | null
          ends_at: string
          id: string
          price_override: number | null
          salon_id: string
          service_id: string
          staff_member_id: string | null
          starts_at: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          booked_by?: string | null
          booking_id?: string | null
          client_id?: string | null
          created_at?: string | null
          ends_at: string
          id?: string
          price_override?: number | null
          salon_id: string
          service_id: string
          staff_member_id?: string | null
          starts_at: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          booked_by?: string | null
          booking_id?: string | null
          client_id?: string | null
          created_at?: string | null
          ends_at?: string
          id?: string
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
          tracking_token: string
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
          tracking_token: string
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
          tracking_token?: string
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
      bookings: {
        Row: {
          access_token_expires_at: string | null
          access_token_hash: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string | null
          deposit_amount: number | null
          ends_at: string
          estimated_price: number | null
          fee_charge_intent_id: string | null
          fee_charge_kind: string | null
          fee_charge_status: string | null
          fee_charged_amount: number | null
          final_price: number | null
          gcal_event_id: string | null
          guest_email: string | null
          guest_name: string | null
          guest_phone: string | null
          id: string
          is_express_rebook: boolean | null
          is_first_visit: boolean
          is_recurring: boolean | null
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
          rebooked_from_id: string | null
          recurring_group_id: string | null
          reference_code: string | null
          refunded_amount: number
          reschedule_requested_at: string | null
          reschedule_status: string | null
          reschedule_to: string | null
          salon_id: string
          service_id: string
          slot_id: string
          staff_member_id: string | null
          starts_at: string
          status: string | null
          stripe_customer_id: string | null
          stripe_payment_method_id: string | null
          stripe_setup_intent_id: string | null
          updated_at: string | null
          user_id: string | null
          walkin_queue_id: string | null
        }
        Insert: {
          access_token_expires_at?: string | null
          access_token_hash?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          deposit_amount?: number | null
          ends_at: string
          estimated_price?: number | null
          fee_charge_intent_id?: string | null
          fee_charge_kind?: string | null
          fee_charge_status?: string | null
          fee_charged_amount?: number | null
          final_price?: number | null
          gcal_event_id?: string | null
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          is_express_rebook?: boolean | null
          is_first_visit?: boolean
          is_recurring?: boolean | null
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
          rebooked_from_id?: string | null
          recurring_group_id?: string | null
          reference_code?: string | null
          refunded_amount?: number
          reschedule_requested_at?: string | null
          reschedule_status?: string | null
          reschedule_to?: string | null
          salon_id: string
          service_id: string
          slot_id: string
          staff_member_id?: string | null
          starts_at: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string | null
          stripe_setup_intent_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          walkin_queue_id?: string | null
        }
        Update: {
          access_token_expires_at?: string | null
          access_token_hash?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          deposit_amount?: number | null
          ends_at?: string
          estimated_price?: number | null
          fee_charge_intent_id?: string | null
          fee_charge_kind?: string | null
          fee_charge_status?: string | null
          fee_charged_amount?: number | null
          final_price?: number | null
          gcal_event_id?: string | null
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          is_express_rebook?: boolean | null
          is_first_visit?: boolean
          is_recurring?: boolean | null
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
          rebooked_from_id?: string | null
          recurring_group_id?: string | null
          reference_code?: string | null
          refunded_amount?: number
          reschedule_requested_at?: string | null
          reschedule_status?: string | null
          reschedule_to?: string | null
          salon_id?: string
          service_id?: string
          slot_id?: string
          staff_member_id?: string | null
          starts_at?: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string | null
          stripe_setup_intent_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          walkin_queue_id?: string | null
        }
        Relationships: [
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
          products_needed: string[] | null
          salon_script: string | null
          salon_script_de: string | null
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
          products_needed?: string[] | null
          salon_script?: string | null
          salon_script_de?: string | null
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
          products_needed?: string[] | null
          salon_script?: string | null
          salon_script_de?: string | null
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
          age_group: string | null
          age_range: string | null
          avatar_url: string | null
          ban_reason: string | null
          banned_at: string | null
          bio: string | null
          color_treated: boolean | null
          created_at: string | null
          current_style_id: string | null
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
          updated_at: string | null
        }
        Insert: {
          age_group?: string | null
          age_range?: string | null
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          bio?: string | null
          color_treated?: boolean | null
          created_at?: string | null
          current_style_id?: string | null
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
          updated_at?: string | null
        }
        Update: {
          age_group?: string | null
          age_range?: string | null
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          bio?: string | null
          color_treated?: boolean | null
          created_at?: string | null
          current_style_id?: string | null
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
      review_photos: {
        Row: {
          created_at: string
          id: string
          photo_url: string
          review_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          photo_url: string
          review_id: string
        }
        Update: {
          created_at?: string
          id?: string
          photo_url?: string
          review_id?: string
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
          rating: number
          salon_id: string
          salon_response: string | null
          salon_response_at: string | null
          staff_member_id: string | null
          user_id: string | null
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
          rating: number
          salon_id: string
          salon_response?: string | null
          salon_response_at?: string | null
          staff_member_id?: string | null
          user_id?: string | null
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
          rating?: number
          salon_id?: string
          salon_response?: string | null
          salon_response_at?: string | null
          staff_member_id?: string | null
          user_id?: string | null
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
      salons: {
        Row: {
          about_text_de: string | null
          about_text_en: string | null
          about_text_fr: string | null
          about_text_it: string | null
          accepts_online_payment: boolean | null
          address: string
          approved_at: string | null
          approved_by: string | null
          average_rating: number | null
          booking_confirmation_mode: string | null
          calendar_color_by: string
          cancellation_fee_type: string | null
          cancellation_fee_value: number | null
          cancellation_window_hours: number | null
          categories: string[]
          category_colors: Json | null
          city_id: string | null
          cover_photo_url: string | null
          created_at: string | null
          deposit_max: number | null
          deposit_min: number | null
          description_de: string | null
          description_en: string | null
          explore_score: number | null
          family_owned: boolean | null
          free_cancel_hours: number | null
          frozen_at: string | null
          frozen_reason: string | null
          gallery_urls: string[] | null
          id: string
          instagram_url: string | null
          instant_booking_enabled: boolean | null
          is_active: boolean | null
          is_featured: boolean | null
          is_test: boolean
          kid_friendly: boolean | null
          last_minute_discount_percent: number | null
          last_minute_window_hours: number | null
          last_verified_at: string | null
          latitude: number
          lgbtq_friendly: boolean | null
          longitude: number
          name: string
          near_public_transport: boolean | null
          no_show_deposit_amount: number | null
          no_show_fee_type: string | null
          no_show_fee_value: number | null
          opening_hours: Json | null
          owner_id: string
          parent_salon_id: string | null
          pet_friendly: boolean | null
          phone: string | null
          postal_code: string | null
          quartier: string | null
          registration_completed: boolean | null
          rejection_reason: string | null
          review_count: number | null
          score_details: Json | null
          slug: string
          solen_score: number | null
          solen_tier: string | null
          stripe_account_id: string | null
          student_discount: boolean | null
          tiktok_url: string | null
          updated_at: string | null
          verification_warnings: number | null
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
          address: string
          approved_at?: string | null
          approved_by?: string | null
          average_rating?: number | null
          booking_confirmation_mode?: string | null
          calendar_color_by?: string
          cancellation_fee_type?: string | null
          cancellation_fee_value?: number | null
          cancellation_window_hours?: number | null
          categories?: string[]
          category_colors?: Json | null
          city_id?: string | null
          cover_photo_url?: string | null
          created_at?: string | null
          deposit_max?: number | null
          deposit_min?: number | null
          description_de?: string | null
          description_en?: string | null
          explore_score?: number | null
          family_owned?: boolean | null
          free_cancel_hours?: number | null
          frozen_at?: string | null
          frozen_reason?: string | null
          gallery_urls?: string[] | null
          id?: string
          instagram_url?: string | null
          instant_booking_enabled?: boolean | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_test?: boolean
          kid_friendly?: boolean | null
          last_minute_discount_percent?: number | null
          last_minute_window_hours?: number | null
          last_verified_at?: string | null
          latitude: number
          lgbtq_friendly?: boolean | null
          longitude: number
          name: string
          near_public_transport?: boolean | null
          no_show_deposit_amount?: number | null
          no_show_fee_type?: string | null
          no_show_fee_value?: number | null
          opening_hours?: Json | null
          owner_id: string
          parent_salon_id?: string | null
          pet_friendly?: boolean | null
          phone?: string | null
          postal_code?: string | null
          quartier?: string | null
          registration_completed?: boolean | null
          rejection_reason?: string | null
          review_count?: number | null
          score_details?: Json | null
          slug: string
          solen_score?: number | null
          solen_tier?: string | null
          stripe_account_id?: string | null
          student_discount?: boolean | null
          tiktok_url?: string | null
          updated_at?: string | null
          verification_warnings?: number | null
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
          address?: string
          approved_at?: string | null
          approved_by?: string | null
          average_rating?: number | null
          booking_confirmation_mode?: string | null
          calendar_color_by?: string
          cancellation_fee_type?: string | null
          cancellation_fee_value?: number | null
          cancellation_window_hours?: number | null
          categories?: string[]
          category_colors?: Json | null
          city_id?: string | null
          cover_photo_url?: string | null
          created_at?: string | null
          deposit_max?: number | null
          deposit_min?: number | null
          description_de?: string | null
          description_en?: string | null
          explore_score?: number | null
          family_owned?: boolean | null
          free_cancel_hours?: number | null
          frozen_at?: string | null
          frozen_reason?: string | null
          gallery_urls?: string[] | null
          id?: string
          instagram_url?: string | null
          instant_booking_enabled?: boolean | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_test?: boolean
          kid_friendly?: boolean | null
          last_minute_discount_percent?: number | null
          last_minute_window_hours?: number | null
          last_verified_at?: string | null
          latitude?: number
          lgbtq_friendly?: boolean | null
          longitude?: number
          name?: string
          near_public_transport?: boolean | null
          no_show_deposit_amount?: number | null
          no_show_fee_type?: string | null
          no_show_fee_value?: number | null
          opening_hours?: Json | null
          owner_id?: string
          parent_salon_id?: string | null
          pet_friendly?: boolean | null
          phone?: string | null
          postal_code?: string | null
          quartier?: string | null
          registration_completed?: boolean | null
          rejection_reason?: string | null
          review_count?: number | null
          score_details?: Json | null
          slug?: string
          solen_score?: number | null
          solen_tier?: string | null
          stripe_account_id?: string | null
          student_discount?: boolean | null
          tiktok_url?: string | null
          updated_at?: string | null
          verification_warnings?: number | null
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
      service_options: {
        Row: {
          created_at: string
          duration_minutes: number
          id: string
          name_de: string
          name_en: string
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
      services: {
        Row: {
          category: string
          created_at: string | null
          description_de: string | null
          description_en: string | null
          duration_minutes: number
          id: string
          is_active: boolean | null
          name_de: string
          name_en: string
          price: number
          salon_id: string
          subcategory: string | null
          suitable_for: string[] | null
          suitable_gender: string[] | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description_de?: string | null
          description_en?: string | null
          duration_minutes: number
          id?: string
          is_active?: boolean | null
          name_de: string
          name_en: string
          price: number
          salon_id: string
          subcategory?: string | null
          suitable_for?: string[] | null
          suitable_gender?: string[] | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description_de?: string | null
          description_en?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          name_de?: string
          name_en?: string
          price?: number
          salon_id?: string
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
          cover_photo_url: string | null
          created_at: string | null
          id: string
          instagram_url: string | null
          is_active: boolean | null
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
          cover_photo_url?: string | null
          created_at?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
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
          cover_photo_url?: string | null
          created_at?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
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
          sort_order: number
          staff_id: string
        }
        Insert: {
          barber_style?: string | null
          before_photo_url?: string | null
          created_at?: string
          fade_type?: string | null
          id?: string
          image_url: string
          is_before_after?: boolean | null
          sort_order?: number
          staff_id: string
        }
        Update: {
          barber_style?: string | null
          before_photo_url?: string | null
          created_at?: string
          fade_type?: string | null
          id?: string
          image_url?: string
          is_before_after?: boolean | null
          sort_order?: number
          staff_id?: string
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
          service_id: string
          staff_member_id: string
        }
        Insert: {
          service_id: string
          staff_member_id: string
        }
        Update: {
          service_id?: string
          staff_member_id?: string
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
      test_table: {
        Row: {
          id: number | null
        }
        Insert: {
          id?: number | null
        }
        Update: {
          id?: number | null
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
    }
    Views: {
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
      discovery_chip_terms: {
        Args: { p_limit?: number }
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
      fn_sibling_salons: {
        Args: { p_salon_id: string }
        Returns: {
          about_text_de: string | null
          about_text_en: string | null
          about_text_fr: string | null
          about_text_it: string | null
          accepts_online_payment: boolean | null
          address: string
          approved_at: string | null
          approved_by: string | null
          average_rating: number | null
          booking_confirmation_mode: string | null
          calendar_color_by: string
          cancellation_fee_type: string | null
          cancellation_fee_value: number | null
          cancellation_window_hours: number | null
          categories: string[]
          category_colors: Json | null
          city_id: string | null
          cover_photo_url: string | null
          created_at: string | null
          deposit_max: number | null
          deposit_min: number | null
          description_de: string | null
          description_en: string | null
          explore_score: number | null
          family_owned: boolean | null
          free_cancel_hours: number | null
          frozen_at: string | null
          frozen_reason: string | null
          gallery_urls: string[] | null
          id: string
          instagram_url: string | null
          instant_booking_enabled: boolean | null
          is_active: boolean | null
          is_featured: boolean | null
          is_test: boolean
          kid_friendly: boolean | null
          last_minute_discount_percent: number | null
          last_minute_window_hours: number | null
          last_verified_at: string | null
          latitude: number
          lgbtq_friendly: boolean | null
          longitude: number
          name: string
          near_public_transport: boolean | null
          no_show_deposit_amount: number | null
          no_show_fee_type: string | null
          no_show_fee_value: number | null
          opening_hours: Json | null
          owner_id: string
          parent_salon_id: string | null
          pet_friendly: boolean | null
          phone: string | null
          postal_code: string | null
          quartier: string | null
          registration_completed: boolean | null
          rejection_reason: string | null
          review_count: number | null
          score_details: Json | null
          slug: string
          solen_score: number | null
          solen_tier: string | null
          stripe_account_id: string | null
          student_discount: boolean | null
          tiktok_url: string | null
          updated_at: string | null
          verification_warnings: number | null
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
      resequence_walkin_queue: {
        Args: { p_salon_id: string }
        Returns: undefined
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
