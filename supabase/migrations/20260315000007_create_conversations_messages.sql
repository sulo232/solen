-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: create conversations + messages tables + Realtime
-- ─────────────────────────────────────────────────────────────────────────────

-- ── conversations ─────────────────────────────────────────────────────────────
CREATE TABLE public.conversations (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id           uuid        NOT NULL REFERENCES public.profiles(id),
  salon_id              uuid        NOT NULL REFERENCES public.salons(id),
  last_message_at       timestamptz,
  last_message_preview  text,
  unread_count_customer integer     NOT NULL DEFAULT 0,
  unread_count_salon    integer     NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (customer_id, salon_id)
);

CREATE INDEX idx_conversations_customer ON public.conversations (customer_id, last_message_at DESC NULLS LAST);
CREATE INDEX idx_conversations_salon    ON public.conversations (salon_id,    last_message_at DESC NULLS LAST);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations_customer_select"
  ON public.conversations FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "conversations_salon_owner_select"
  ON public.conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.salons s
      WHERE s.id = conversations.salon_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY "conversations_customer_insert"
  ON public.conversations FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "conversations_participants_update"
  ON public.conversations FOR UPDATE
  USING (
    customer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.salons s
      WHERE s.id = conversations.salon_id AND s.owner_id = auth.uid()
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- ── messages ──────────────────────────────────────────────────────────────────
CREATE TABLE public.messages (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid        NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       uuid        NOT NULL REFERENCES public.profiles(id),
  content         text        NOT NULL CHECK (char_length(content) <= 2000),
  message_type    text        NOT NULL DEFAULT 'text' CHECK (message_type IN ('text','image','booking_link')),
  image_url       text,
  read_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON public.messages (conversation_id, created_at DESC);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_participant_select"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (
          c.customer_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.salons s
            WHERE s.id = c.salon_id AND s.owner_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "messages_participant_insert"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (
          c.customer_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.salons s
            WHERE s.id = c.salon_id AND s.owner_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "messages_mark_read"
  ON public.messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (
          c.customer_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.salons s
            WHERE s.id = c.salon_id AND s.owner_id = auth.uid()
          )
        )
    )
  )
  WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
