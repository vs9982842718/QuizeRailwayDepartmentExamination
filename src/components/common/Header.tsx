import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, User, LogOut, Plus, Upload, Image, FileText, Trophy, Users, Settings, HelpCircle, ListChecks, MessageCircle, Bell, KeyRound } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/db/supabase';

export default function Header() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingResetCount, setPendingResetCount] = useState(0);
  // Prevent duplicate subscriptions when auth fires multiple events
  const subscribedRef = useRef(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const isAdmin = profile?.role === 'admin';

  // Fetch unread count and subscribe to realtime updates
  useEffect(() => {
    if (!user || !profile || subscribedRef.current) return;
    subscribedRef.current = true;

    const fetchUnread = async () => {
      if (isAdmin) {
        // Admin: sum of all unread_by_admin across conversations
        const { data } = await supabase
          .from('conversations')
          .select('unread_by_admin');
        if (data) setUnreadCount(data.reduce((s, c) => s + (c.unread_by_admin ?? 0), 0));
      } else {
        // User: their own conversation unread_by_user
        const { data } = await supabase
          .from('conversations')
          .select('unread_by_user')
          .eq('user_id', user.id)
          .maybeSingle();
        setUnreadCount(data?.unread_by_user ?? 0);
      }
    };

    fetchUnread();

    // Admin: also fetch pending password reset count
    const fetchPendingResets = async () => {
      if (!isAdmin) return;
      const { count } = await supabase
        .from('password_reset_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      setPendingResetCount(count ?? 0);
    };
    fetchPendingResets();

    const ch = supabase
      .channel(`header-unread-${user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations' }, () => {
        fetchUnread();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'password_reset_requests' }, () => {
        fetchPendingResets();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'password_reset_requests' }, () => {
        fetchPendingResets();
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'password_reset_requests' }, () => {
        fetchPendingResets();
      })
      .subscribe();

    return () => { ch.unsubscribe(); };  }, [user, profile, isAdmin]);

  const questionManagementLinks = [
    { to: '/add-question', label: 'Add Question', icon: Plus },
    { to: '/bulk-upload', label: 'Bulk Upload', icon: Upload },
    { to: '/image-upload', label: 'Image Upload', icon: Image },
    { to: '/pdf-import', label: 'PDF Import', icon: FileText },
  ];

  const chatPath = isAdmin ? '/admin/queries' : '/chat';
  const chatLabel = isAdmin ? 'User Queries' : 'Contact Admin';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 px-6">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-lg font-bold">Q</span>
          </div>
          <div className="hidden flex-col md:flex">
            <span className="font-semibold leading-tight text-[#060625] bg-[#e1606000] bg-none">Quiz System</span>
            <span className="text-xs leading-tight">
              Created by <span className="font-bold bg-[#3c661c00] bg-none">Vijay Sharma (Accountant/NWR)</span>
            </span>
          </div>
        </Link>

        <div className="flex flex-1 items-center justify-end gap-4 bg-[#e4636300] bg-none">
          {user ? (
            <>
              {/* Desktop Navigation */}
              <nav className="hidden items-center gap-2 md:flex">
                <Button variant="ghost" asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/leaderboard" className="gap-2">
                    <Trophy className="h-4 w-4" />
                    Leaderboard
                  </Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/help" className="gap-2">
                    <HelpCircle className="h-4 w-4" />
                    Help Desk
                  </Link>
                </Button>
                {isAdmin && (
                  <>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost">Manage Questions</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {questionManagementLinks.map((link) => {
                          const Icon = link.icon;
                          return (
                            <DropdownMenuItem key={link.to} asChild>
                              <Link to={link.to} className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {link.label}
                              </Link>
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="ghost" asChild>
                      <Link to="/admin/users" className="gap-2">
                        <Users className="h-4 w-4" />
                        Users
                      </Link>
                    </Button>
                    <Button variant="ghost" asChild>
                      <Link to="/admin/questions" className="gap-2">
                        <ListChecks className="h-4 w-4" />
                        Questions
                      </Link>
                    </Button>
                    <Button variant="ghost" asChild>
                      <Link to="/admin/password-resets" className="gap-2 relative">
                        <KeyRound className="h-4 w-4" />
                        Password Resets
                        {pendingResetCount > 0 && (
                          <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                            {pendingResetCount > 9 ? '9+' : pendingResetCount}
                          </span>
                        )}
                      </Link>
                    </Button>
                  </>
                )}
              </nav>

              {/* Bell / Chat icon with unread badge */}
              <Button variant="ghost" size="icon" className="relative hidden md:flex" asChild>
                <Link to={chatPath}>
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hidden md:flex">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{profile?.username}</p>
                    <p className="text-xs text-muted-foreground">{profile?.role}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="gap-2 text-destructive">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden relative">
                    <Menu className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <div className="flex flex-col gap-4 py-4">
                    <div className="px-2">
                      <p className="text-sm font-medium">{profile?.username}</p>
                      <p className="text-xs text-muted-foreground">{profile?.role}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button variant="ghost" asChild className="justify-start">
                        <Link to="/dashboard">Dashboard</Link>
                      </Button>
                      <Button variant="ghost" asChild className="justify-start gap-2">
                        <Link to="/leaderboard">
                          <Trophy className="h-4 w-4" />
                          Leaderboard
                        </Link>
                      </Button>
                      <Button variant="ghost" asChild className="justify-start gap-2">
                        <Link to="/help">
                          <HelpCircle className="h-4 w-4" />
                          Help Desk
                        </Link>
                      </Button>
                      {/* Chat / Queries link */}
                      <Button variant="ghost" asChild className="justify-start gap-2 relative">
                        <Link to={chatPath}>
                          <MessageCircle className="h-4 w-4" />
                          {chatLabel}
                          {unreadCount > 0 && (
                            <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          )}
                        </Link>
                      </Button>
                      {isAdmin && (
                        <>
                          <div className="my-2 border-t" />
                          <p className="px-2 text-sm font-medium text-muted-foreground">Manage Questions</p>
                          {questionManagementLinks.map((link) => {
                            const Icon = link.icon;
                            return (
                              <Button key={link.to} variant="ghost" asChild className="justify-start gap-2">
                                <Link to={link.to}>
                                  <Icon className="h-4 w-4" />
                                  {link.label}
                                </Link>
                              </Button>
                            );
                          })}
                          <div className="my-2 border-t" />
                          <Button variant="ghost" asChild className="justify-start gap-2">
                            <Link to="/admin/users">
                              <Users className="h-4 w-4" />
                              Manage Users
                            </Link>
                          </Button>
                          <Button variant="ghost" asChild className="justify-start gap-2">
                            <Link to="/admin/questions">
                              <ListChecks className="h-4 w-4" />
                              Questions
                            </Link>
                          </Button>
                          <Button variant="ghost" asChild className="justify-start gap-2">
                            <Link to="/admin/password-resets">
                              <KeyRound className="h-4 w-4" />
                              Password Resets
                              {pendingResetCount > 0 && (
                                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                                  {pendingResetCount > 9 ? '9+' : pendingResetCount}
                                </span>
                              )}
                            </Link>
                          </Button>
                        </>
                      )}
                      <div className="my-2 border-t" />
                      <Button variant="ghost" asChild className="justify-start gap-2">
                        <Link to="/profile">
                          <Settings className="h-4 w-4" />
                          Profile Settings
                        </Link>
                      </Button>
                      <div className="my-2 border-t" />
                      <Button variant="ghost" onClick={handleLogout} className="justify-start gap-2 text-destructive">
                        <LogOut className="h-4 w-4" />
                        Logout
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link to="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
