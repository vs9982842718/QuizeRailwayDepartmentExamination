
-- ── conversations: one per user (user ↔ admin) ─────────────────────────────
CREATE TABLE conversations (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status           text        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'resolved')),
  last_message_at  timestamptz,
  unread_by_admin  int         NOT NULL DEFAULT 0,
  unread_by_user   int         NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- ── messages ────────────────────────────────────────────────────────────────
CREATE TABLE messages (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid        REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content         text        NOT NULL,
  msg_status      text        NOT NULL DEFAULT 'sent'
                              CHECK (msg_status IN ('sent', 'delivered', 'read')),
  is_announcement bool        NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ── RLS: conversations ───────────────────────────────────────────────────────
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Users: see only their own conversation
CREATE POLICY "conv_select_own" ON conversations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users: create their own conversation
CREATE POLICY "conv_insert_own" ON conversations
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users: update their own conversation (e.g. unread count reset)
CREATE POLICY "conv_update_own" ON conversations
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Admin helper: check role without self-referencing profiles RLS
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role = 'admin' FROM profiles WHERE id = auth.uid();
$$;

-- Admin: full access to conversations
CREATE POLICY "conv_admin_all" ON conversations
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ── RLS: messages ────────────────────────────────────────────────────────────
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users: see messages in their own conversation OR announcements
CREATE POLICY "msg_select_user" ON messages
  FOR SELECT TO authenticated
  USING (
    is_announcement = true
    OR EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );

-- Users: insert messages into their own conversation
CREATE POLICY "msg_insert_user" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );

-- Users: update status of messages in their conversation (mark as read)
CREATE POLICY "msg_update_user" ON messages
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );

-- Admin: full access to all messages
CREATE POLICY "msg_admin_all" ON messages
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ── Realtime ─────────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
