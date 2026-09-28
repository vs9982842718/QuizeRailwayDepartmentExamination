import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ArrowLeft, Plus, ChevronRight, Star } from 'lucide-react';
import { toast } from 'sonner';
import type { Bunch } from '@/types/types';

export default function SectionSelectionPage() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category');
  const section = searchParams.get('section');

  const [bunches, setBunches] = useState<Bunch[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBunchName, setNewBunchName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // Set of bunch names the current user has already attempted
  const [attemptedBunches, setAttemptedBunches] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!category || !section) {
      navigate('/dashboard');
      return;
    }
    fetchBunches();
    if (user) fetchAttempted();
  }, [category, section, user]);

  const fetchAttempted = async () => {
    if (!user || !category || !section) return;
    const { data } = await supabase
      .from('quiz_results')
      .select('bunch')
      .eq('user_id', user.id)
      .eq('category', category)
      .eq('section', section);
    if (data) {
      setAttemptedBunches(new Set(data.map((r) => r.bunch).filter(Boolean)));
    }
  };

  const fetchBunches = async () => {
    if (!category || !section) return;
    setLoading(true);

    const isAdmin = profile?.role === 'admin';

    // Use server-side RPC to avoid the 1000-row client pagination limit.
    // Traffic alone has 1,574 questions — a plain .select() would silently
    // truncate rows, giving wrong counts and missing bunches entirely.
    const { data, error } = await supabase.rpc('get_bunch_stats', {
      p_category:     category,
      p_section:      section,
      p_visible_only: !isAdmin,
    });

    if (error) {
      console.error('Failed to fetch bunches:', error);
      setLoading(false);
      return;
    }

    const bunchList: Bunch[] = (
      data as { bunch: string; question_count: number; has_visible: boolean }[]
    ).map((row) => ({
      name:           row.bunch,
      question_count: Number(row.question_count),
      visible:        row.has_visible,
    }));

    // Ordering is already handled in the RPC (natural / series sort)
    setBunches(bunchList);
    setLoading(false);
  };

  const handleAddBunch = async () => {
    if (!newBunchName.trim()) {
      toast.error('Please enter a bunch name');
      return;
    }
    if (bunches.some((b) => b.name === newBunchName.trim())) {
      toast.error('A bunch with this name already exists');
      return;
    }
    toast.success(`Bunch "${newBunchName}" created! Add questions to it.`);
    setNewBunchName('');
    setIsDialogOpen(false);
    fetchBunches();
  };

  const handleBunchClick = (bunchName: string) => {
    navigate(
      `/bunch-detail?category=${encodeURIComponent(category!)}&section=${encodeURIComponent(section!)}&bunch=${encodeURIComponent(bunchName)}`
    );
  };

  if (!category || !section) return null;

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <div className="flex-1 px-4 py-8 md:px-8 md:py-10">
        <div className="mx-auto w-full max-w-[1600px] space-y-8">

          {/* ── Back button ─────────────────────────────────────────── */}
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Categories
          </Button>

          {/* ── Page header ─────────────────────────────────────────── */}
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1.5 min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance md:text-3xl">
                {category} · {section}
              </h1>
              <p className="text-sm text-muted-foreground text-pretty">
                {bunches.length} {bunches.length === 1 ? 'bunch' : 'bunches'} in this section
                {attemptedBunches.size > 0 && (
                  <span className="ml-2 inline-flex items-center gap-1 text-amber-500">
                    <Star className="h-3 w-3 fill-amber-500" />
                    {attemptedBunches.size} attempted
                  </span>
                )}
              </p>
            </div>

            {profile?.role === 'admin' && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 shrink-0">
                    <Plus className="h-4 w-4" />
                    Add Bunch
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create New Bunch</DialogTitle>
                    <DialogDescription>Enter a name for your question set</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="bunch-name">Bunch Name</Label>
                      <Input
                        id="bunch-name"
                        placeholder="e.g., 01, 02, Set A"
                        value={newBunchName}
                        onChange={(e) => setNewBunchName(e.target.value)}
                        className="px-3"
                      />
                    </div>
                    <Button onClick={handleAddBunch} className="w-full">
                      Create Bunch
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* ── Bunch grid ──────────────────────────────────────────── */}
          {loading ? (
            <p className="text-center text-muted-foreground py-16">Loading bunches…</p>
          ) : bunches.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <p className="text-center text-muted-foreground text-sm">
                  No bunches yet. Create your first bunch to get started!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div
              className="grid gap-4 md:gap-5"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
            >
              {bunches.map((bunch) => {
                const attempted = attemptedBunches.has(bunch.name);
                return (
                  <Card
                    key={bunch.name}
                    className={`group cursor-pointer h-full flex flex-col transition-all duration-200
                      hover:shadow-md hover:-translate-y-0.5
                      ${attempted
                        ? 'border-amber-400/70 dark:border-amber-500/50 hover:border-amber-500'
                        : 'hover:border-primary'
                      }`}
                    onClick={() => handleBunchClick(bunch.name)}
                  >
                    <CardHeader className="flex-1 pb-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-xl font-semibold tracking-tight text-balance transition-colors group-hover:text-primary">
                              {bunch.name}
                            </CardTitle>
                            {attempted && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400 shrink-0">
                                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                Attempted
                              </span>
                            )}
                          </div>
                          <CardDescription className="mt-1.5 text-sm">
                            {bunch.question_count}{' '}
                            {bunch.question_count === 1 ? 'question' : 'questions'}
                          </CardDescription>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary mt-1" />
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

