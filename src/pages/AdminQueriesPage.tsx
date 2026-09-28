import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Send, Search, CheckCircle2, Clock4, Trash2, Megaphone,
  ChevronRight, Bell, Check, CheckCheck,
} from 'lucide-react';
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
  if (status === 'read') return <CheckCheck className="h-3.5 w-3.5 text-primary" />;
  if (status === 'delivered') return <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />;
  return <Check className="h-3.5 w-3.5 text-muted-foreground" />;
}

interface ConvWithProfile extends Conversation {
  profile: { username: string; email: string | null };
}

// ── component ──────────────────────────────────────────────────────────────────
export default function AdminQueriesPage() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();

  const [conversations, setConversations] = useState<ConvWithProfile[]>([]);
  const [filtered, setFiltered] = useState<ConvWithProfile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<ConvWithProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Message | null>(null);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── guard ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (profile && profile.role !== 'admin') navigate('/dashboard');
  }, [profile, navigate]);

  // ── load conversations ──────────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('conversations')
      .select('*, profile:profiles!conversations_user_id_fkey(username, email)')
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (!error && data) {
      const rows = data as ConvWithProfile[];
      setConversations(rows);
      setFiltered(rows);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // ── search filter ───────────────────────────────────────────────────────────
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      conversations.filter(
        (c) =>
          c.profile?.username?.toLowerCase().includes(q) ||
          c.profile?.email?.toLowerCase().includes(q)
      )
    );
  }, [search, conversations]);

  // ── load messages for selected conversation ─────────────────────────────────
  const loadMessages = useCallback(async (convId: string) => {
    setMsgLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    if (!error && data) setMessages(data as Message[]);
    setMsgLoading(false);

    // Mark messages from user as read
    await supabase
      .from('messages')
      .update({ msg_status: 'read' })
      .eq('conversation_id', convId)
      .eq('msg_status', 'delivered');

    // Reset admin unread
    await supabase
      .from('conversations')
      .update({ unread_by_admin: 0 })
      .eq('id', convId);

    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, unread_by_admin: 0 } : c))
    );
    setFiltered((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, unread_by_admin: 0 } : c))
    );
  }, []);

  // ── select conversation + subscribe realtime ────────────────────────────────
  const handleSelect = useCallback(
    async (conv: ConvWithProfile) => {
      setSelected(conv);
      channelRef.current?.unsubscribe();

      await loadMessages(conv.id);

      channelRef.current = supabase
        .channel(`admin-chat-${conv.id}`)
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
              // If from user, mark as read immediately
              if (msg.sender_id !== user?.id) {
                await supabase
                  .from('messages')
                  .update({ msg_status: 'read' })
                  .eq('id', msg.id);
                await supabase
                  .from('conversations')
                  .update({ unread_by_admin: 0 })
                  .eq('id', conv.id);
              }
            } else if (payload.eventType === 'UPDATE') {
              setMessages((prev) =>
                prev.map((m) => (m.id === payload.new.id ? { ...m, ...payload.new } : m))
              );
            } else if (payload.eventType === 'DELETE') {
              setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
            }
          }
        )
        .subscribe();
    },
    [loadMessages, user]
  );

  // ── global realtime for conversation list ───────────────────────────────────
  useEffect(() => {
    const ch = supabase
      .channel('admin-conv-list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            loadConversations();
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as ConvWithProfile;
            setConversations((prev) =>
              prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
            );
            setFiltered((prev) =>
              prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
            );
            setSelected((prev) => (prev?.id === updated.id ? { ...prev, ...updated } : prev));
          }
        }
      )
      .subscribe();
    return () => { ch.unsubscribe(); };
  }, [loadConversations]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ── send reply ──────────────────────────────────────────────────────────────
  const handleReply = async () => {
    const content = replyText.trim();
    if (!content || !selected || !user) return;
    setSending(true);
    const { error } = await supabase.from('messages').insert({
      conversation_id: selected.id,
      sender_id: user.id,
      content,
      msg_status: 'sent',
      is_announcement: false,
    });
    if (error) { toast.error('Failed to send reply.'); }
    else {
      setReplyText('');
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          unread_by_user: (selected.unread_by_user ?? 0) + 1,
        })
        .eq('id', selected.id);
    }
    setSending(false);
  };

  // ── mark resolved / pending ─────────────────────────────────────────────────
  const toggleStatus = async (conv: ConvWithProfile) => {
    const next = conv.status === 'resolved' ? 'pending' : 'resolved';
    const { error } = await supabase
      .from('conversations')
      .update({ status: next })
      .eq('id', conv.id);
    if (error) { toast.error('Failed to update status.'); return; }
    toast.success(`Marked as ${next}.`);
    setSelected((prev) => (prev?.id === conv.id ? { ...prev, status: next } : prev));
  };

  // ── delete message ──────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from('messages').delete().eq('id', deleteTarget.id);
    if (error) { toast.error('Failed to delete message.'); }
    else {
      setMessages((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      toast.success('Message deleted.');
    }
    setDeleteTarget(null);
  };

  // ── broadcast announcement ──────────────────────────────────────────────────
  const handleBroadcast = async () => {
    const content = announcementText.trim();
    if (!content || !user) return;
    setBroadcasting(true);
    const { error } = await supabase.from('messages').insert({
      conversation_id: null,
      sender_id: user.id,
      content,
      msg_status: 'sent',
      is_announcement: true,
    });
    if (error) { toast.error('Failed to send announcement.'); }
    else { toast.success('Announcement sent to all users.'); setAnnouncementText(''); setAnnouncementOpen(false); }
    setBroadcasting(false);
  };

  const totalUnread = conversations.reduce((s, c) => s + (c.unread_by_admin ?? 0), 0);

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <div className="flex-1 flex flex-col px-4 py-8 md:px-8 md:py-10">
        <div className="mx-auto w-full max-w-[1400px] flex flex-col gap-6 flex-1">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                  User Queries
                </h1>
                {totalUnread > 0 && (
                  <span className="flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
                    <Bell className="h-3 w-3" />
                    {totalUnread} new
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                View and respond to user messages
              </p>
            </div>
            <Button
              variant="outline"
              className="gap-2 shrink-0"
              onClick={() => setAnnouncementOpen(true)}
            >
              <Megaphone className="h-4 w-4" />
              Send Announcement
            </Button>
          </div>

          {/* Main layout: conversation list + chat */}
          <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-[600px]">

            {/* ── Conversation list ──────────────────────────────────────── */}
            <div className="md:w-72 shrink-0 flex flex-col gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search username or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>

              {/* List */}
              <ScrollArea className="flex-1 rounded-xl border border-border bg-card">
                {loading ? (
                  <div className="p-4 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-14 w-full rounded-lg bg-muted" />
                    ))}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-sm text-muted-foreground">No conversations found.</p>
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {filtered.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => handleSelect(conv)}
                        className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors
                          hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                          ${selected?.id === conv.id ? 'bg-muted' : ''}`}
                      >
                        {/* Avatar */}
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm uppercase">
                          {conv.profile?.username?.[0] ?? '?'}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-sm font-medium text-foreground truncate">
                              {conv.profile?.username ?? 'Unknown'}
                            </p>
                            {conv.unread_by_admin > 0 && (
                              <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                {conv.unread_by_admin}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-[11px] text-muted-foreground truncate">
                              {conv.profile?.email ?? '—'}
                            </p>
                            <Badge
                              variant={conv.status === 'resolved' ? 'secondary' : 'outline'}
                              className="text-[9px] shrink-0 px-1.5"
                            >
                              {conv.status}
                            </Badge>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* ── Chat panel ─────────────────────────────────────────────── */}
            <div className="flex-1 min-w-0 flex flex-col rounded-xl border border-border bg-card overflow-hidden">
              {!selected ? (
                <div className="flex flex-1 items-center justify-center h-full">
                  <div className="text-center space-y-2">
                    <p className="text-sm font-medium text-foreground">Select a conversation</p>
                    <p className="text-xs text-muted-foreground">Choose a user from the list to view messages</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Chat header */}
                  <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm uppercase">
                        {selected.profile?.username?.[0] ?? '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{selected.profile?.username}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{selected.profile?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={selected.status === 'resolved' ? 'secondary' : 'outline'}
                        className="text-[10px] uppercase tracking-wide"
                      >
                        {selected.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 text-xs"
                        onClick={() => toggleStatus(selected)}
                      >
                        {selected.status === 'resolved'
                          ? <><Clock4 className="h-3.5 w-3.5" /> Mark Pending</>
                          : <><CheckCircle2 className="h-3.5 w-3.5" /> Mark Resolved</>
                        }
                      </Button>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 px-5 py-4">
                    {msgLoading ? (
                      <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className={`flex ${i % 2 ? 'justify-end' : 'justify-start'}`}>
                            <Skeleton className="h-10 w-48 rounded-2xl bg-muted" />
                          </div>
                        ))}
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex items-center justify-center h-32">
                        <p className="text-sm text-muted-foreground">No messages yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {messages.map((msg) => {
                          const isMine = msg.sender_id === user?.id;
                          return (
                            <div
                              key={msg.id}
                              className={`group flex flex-col gap-0.5 ${isMine ? 'items-end' : 'items-start'}`}
                            >
                              <div className="flex items-end gap-1.5">
                                {!isMine && (
                                  <button
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10"
                                    onClick={() => setDeleteTarget(msg)}
                                    title="Delete spam"
                                  >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </button>
                                )}
                                <div
                                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed text-pretty
                                    ${isMine
                                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                                      : 'bg-muted text-foreground rounded-bl-sm'
                                    }`}
                                >
                                  {msg.content}
                                </div>
                                {isMine && (
                                  <button
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10"
                                    onClick={() => setDeleteTarget(msg)}
                                    title="Delete"
                                  >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </button>
                                )}
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

                  {/* Reply input */}
                  <div className="border-t border-border p-4 shrink-0">
                    <div className="flex gap-2 items-end">
                      <Textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); }
                        }}
                        placeholder="Type a reply… (Enter to send)"
                        className="resize-none min-h-[44px] max-h-28 text-sm flex-1"
                        rows={1}
                        disabled={sending}
                      />
                      <Button
                        size="icon"
                        onClick={handleReply}
                        disabled={!replyText.trim() || sending}
                        className="h-11 w-11 shrink-0"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ── Announcement dialog ──────────────────────────────────────────────── */}
      <Dialog open={announcementOpen} onOpenChange={setAnnouncementOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              Send Announcement
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This message will be displayed to all users in their chat screen.
          </p>
          <Textarea
            value={announcementText}
            onChange={(e) => setAnnouncementText(e.target.value)}
            placeholder="Write your announcement…"
            className="resize-none min-h-[100px] text-sm"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnnouncementOpen(false)}>Cancel</Button>
            <Button onClick={handleBroadcast} disabled={!announcementText.trim() || broadcasting} className="gap-2">
              <Megaphone className="h-4 w-4" />
              {broadcasting ? 'Sending…' : 'Send to All'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation ──────────────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete message?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The message will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
