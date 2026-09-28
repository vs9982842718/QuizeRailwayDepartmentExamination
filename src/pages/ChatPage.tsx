import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Send, Megaphone, Check, CheckCheck, Clock } from 'lucide-react';
import { toast } from 'sonner';
import type { Conversation, Message } from '@/types/types';

// ── helpers ────────────────────────────────────────────────────────────────────
function formatDateTime(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isToday) return time;
  return `${d.toLocaleDateString([], { day: 'numeric', month: 'short' })}, ${time}`;
}

function StatusIcon({ status }: { status: Message['msg_status'] }) {
  if (status === 'read')
    return <CheckCheck className="h-3.5 w-3.5 text-primary" />;
  if (status === 'delivered')
    return <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />;
  return <Check className="h-3.5 w-3.5 text-muted-foreground" />;
}

// ── component ──────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const { user, profile } = useAuth();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [announcements, setAnnouncements] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);
  const convIdRef = useRef<string | null>(null);

  // ── ensure conversation exists, then load messages ─────────────────────────
  const ensureConversation = useCallback(async () => {
    if (!user) return null;
    // try fetch first
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) return existing as Conversation;

    // create new
    const { data: created, error } = await supabase
      .from('conversations')
      .insert({ user_id: user.id })
      .select()
      .maybeSingle();

    if (error) { toast.error('Failed to start conversation.'); return null; }
    return created as Conversation;
  }, [user]);

  const loadMessages = useCallback(async (convId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (!error && data) setMessages(data as Message[]);
  }, []);

  const loadAnnouncements = useCallback(async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('is_announcement', true)
      .order('created_at', { ascending: false })
      .limit(5);
    if (data) setAnnouncements(data as Message[]);
  }, []);

  // ── mark incoming messages as delivered / read ─────────────────────────────
  const markDelivered = useCallback(async (convId: string) => {
    await supabase
      .from('messages')
      .update({ msg_status: 'delivered' })
      .eq('conversation_id', convId)
      .eq('msg_status', 'sent')
      .neq('sender_id', user!.id);
  }, [user]);

  const markRead = useCallback(async (convId: string) => {
    await supabase
      .from('messages')
      .update({ msg_status: 'read' })
      .eq('conversation_id', convId)
      .neq('sender_id', user!.id);
    // reset unread counter
    await supabase
      .from('conversations')
      .update({ unread_by_user: 0 })
      .eq('id', convId);
  }, [user]);

  // ── init ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      setLoading(true);
      const conv = await ensureConversation();
      if (!conv) { setLoading(false); return; }

      setConversation(conv);
      convIdRef.current = conv.id;
      await Promise.all([loadMessages(conv.id), loadAnnouncements()]);
      await markDelivered(conv.id);
      await markRead(conv.id);
      setLoading(false);

      // realtime subscription
      channel = supabase
        .channel(`chat-user-${conv.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conv.id}` },
          async (payload) => {
            if (payload.eventType === 'INSERT') {
              const msg = payload.new as Message;
              setMessages((prev) => {
                if (prev.find((m) => m.id === msg.id)) return prev;
                return [...prev, msg];
              });
              if (msg.sender_id !== user.id) {
                await markRead(conv.id);
              }
            } else if (payload.eventType === 'UPDATE') {
              setMessages((prev) =>
                prev.map((m) => (m.id === payload.new.id ? { ...m, ...payload.new } : m))
              );
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: 'is_announcement=eq.true' },
          (payload) => {
            setAnnouncements((prev) => [payload.new as Message, ...prev].slice(0, 5));
          }
        )
        .subscribe();
    })();

    return () => { channel?.unsubscribe(); };
  }, [user, ensureConversation, loadMessages, loadAnnouncements, markDelivered, markRead]);

  // ── scroll to bottom on new messages ───────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── send message ────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const content = text.trim();
    if (!content || !convIdRef.current || !user) return;
    setSending(true);
    const { error } = await supabase.from('messages').insert({
      conversation_id: convIdRef.current,
      sender_id: user.id,
      content,
      msg_status: 'sent',
      is_announcement: false,
    });
    if (error) { toast.error('Failed to send message.'); }
    else {
      setText('');
      // update last_message_at + unread for admin
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          unread_by_admin: (conversation?.unread_by_admin ?? 0) + 1,
          status: 'pending',
        })
        .eq('id', convIdRef.current);
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <div className="flex-1 flex flex-col px-4 py-8 md:px-8 md:py-10">
        <div className="mx-auto w-full max-w-2xl flex flex-col gap-6 flex-1">

          {/* Page heading */}
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance md:text-3xl">
              Contact Admin
            </h1>
            <p className="text-sm text-muted-foreground text-pretty">
              Send a message to the administrator — queries, issues, promotions.
            </p>
          </div>

          {/* Announcements */}
          {announcements.length > 0 && (
            <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Megaphone className="h-4 w-4 shrink-0" />
                Announcements
              </div>
              <ul className="space-y-2">
                {announcements.map((a) => (
                  <li key={a.id} className="text-sm text-muted-foreground border-l-2 border-primary/40 pl-3">
                    <p className="text-pretty">{a.content}</p>
                    <p className="text-[10px] mt-0.5">{formatDateTime(a.created_at)}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Chat window */}
          <div className="flex flex-col flex-1 rounded-xl border border-border bg-card overflow-hidden">
            {/* Status bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-medium text-foreground">Admin</span>
              </div>
              {conversation && (
                <Badge
                  variant={conversation.status === 'resolved' ? 'secondary' : 'outline'}
                  className="text-[10px] uppercase tracking-wide"
                >
                  {conversation.status}
                </Badge>
              )}
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 min-h-[340px] max-h-[50vh] px-4 py-4">
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className={`flex ${i % 2 ? 'justify-end' : 'justify-start'}`}>
                      <Skeleton className="h-10 w-48 rounded-2xl bg-muted" />
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2">
                  <p className="text-sm text-muted-foreground">No messages yet.</p>
                  <p className="text-xs text-muted-foreground">Send a message to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const isMine = msg.sender_id === user?.id;
                    return (
                      <div key={msg.id} className={`flex flex-col gap-0.5 ${isMine ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed text-pretty
                            ${isMine
                              ? 'bg-primary text-primary-foreground rounded-br-sm'
                              : 'bg-muted text-foreground rounded-bl-sm'
                            }`}
                        >
                          {msg.content}
                        </div>
                        <div className="flex items-center gap-1 px-1">
                          <span className="text-[10px] text-muted-foreground">{formatDateTime(msg.created_at)}</span>
                          {isMine && <StatusIcon status={msg.msg_status} />}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="border-t border-border p-4">
              <div className="flex gap-2 items-end">
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message… (Enter to send)"
                  className="resize-none min-h-[44px] max-h-32 text-sm flex-1"
                  rows={1}
                  disabled={sending}
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!text.trim() || sending}
                  className="h-11 w-11 shrink-0"
                >
                  {sending
                    ? <Clock className="h-4 w-4 animate-spin" />
                    : <Send className="h-4 w-4" />
                  }
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                Shift+Enter for new line · Enter to send
              </p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><Check className="h-3 w-3" /> Sent</span>
            <span className="flex items-center gap-1"><CheckCheck className="h-3 w-3" /> Delivered</span>
            <span className="flex items-center gap-1"><CheckCheck className="h-3 w-3 text-primary" /> Read</span>
          </div>

        </div>
      </div>
    </div>
  );
}
