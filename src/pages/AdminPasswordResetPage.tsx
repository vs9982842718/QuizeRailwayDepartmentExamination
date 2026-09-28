import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { ArrowLeft, Search, Trash2, Eye, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { PasswordResetRequest } from '@/types/types';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const formatDob = (dateStr: string) => {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

export default function AdminPasswordResetPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [requests, setRequests] = useState<PasswordResetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [viewItem, setViewItem] = useState<PasswordResetRequest | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PasswordResetRequest | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (profile?.role !== 'admin') { navigate('/dashboard'); return; }
    fetchRequests();
  }, [profile]);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('password_reset_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) { toast.error('Failed to load requests'); setLoading(false); return; }
    setRequests(data || []);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase
      .from('password_reset_requests')
      .delete()
      .eq('id', deleteTarget.id);

    if (error) { toast.error('Failed to delete request'); setDeleting(false); return; }
    toast.success('Request deleted');
    setDeleteTarget(null);
    setDeleting(false);
    fetchRequests();
  };

  if (profile?.role !== 'admin') return null;

  const filtered = requests.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.full_name.toLowerCase().includes(q) ||
      r.mobile_number.includes(q) ||
      (r.username ?? '').toLowerCase().includes(q)
    );
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex-1 p-6 md:p-12">
        <div className="mx-auto max-w-5xl space-y-8">

          {/* Header */}
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-semibold text-balance">Password Reset Requests</h1>
                  {pendingCount > 0 && (
                    <Badge variant="destructive">{pendingCount} Pending</Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-pretty">
                  Review and manage user password reset requests
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={fetchRequests} className="gap-2 shrink-0">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Full Name, Mobile Number, or Username…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 px-9"
            />
          </div>

          {/* List */}
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading requests…</p>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {search ? 'No requests match your search.' : 'No password reset requests yet.'}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((req) => (
                <Card key={req.id}>
                  <CardContent className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{req.full_name}</p>
                        <Badge variant={req.status === 'pending' ? 'destructive' : 'secondary'}>
                          {req.status === 'pending' ? 'Pending' : 'Resolved'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Mobile: {req.mobile_number}
                        {req.username && <> · Username: <span className="font-mono">{req.username}</span></>}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        DOB: {formatDob(req.date_of_birth)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Submitted: {formatDate(req.created_at)}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button size="sm" variant="outline" onClick={() => setViewItem(req)} className="gap-2">
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteTarget(req)}
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* View Dialog */}
      <Dialog open={!!viewItem} onOpenChange={(o) => { if (!o) setViewItem(null); }}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                {[
                  ['Full Name', viewItem.full_name],
                  ['Mobile Number', viewItem.mobile_number],
                  ['Date of Birth', formatDob(viewItem.date_of_birth)],
                  ['Username', viewItem.username || '—'],
                  ['Status', viewItem.status === 'pending' ? 'Pending' : 'Resolved'],
                  ['Request Date', formatDate(viewItem.created_at)],
                ].map(([label, value]) => (
                  <div key={label} className="col-span-2 md:col-span-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                    <p className="mt-0.5 font-medium">{value}</p>
                  </div>
                ))}
              </div>
              <Button className="w-full" onClick={() => setViewItem(null)}>Close</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the password reset request from{' '}
              <strong>{deleteTarget?.full_name}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
