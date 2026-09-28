import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/db/supabase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  BookOpen, FileText, Package, DollarSign, Users,
  BookOpen as BookBudget, AlertCircle, Car,
  ChevronRight, ChevronDown, Layers, LayoutGrid, HelpCircle, MessageCircle,
} from 'lucide-react';
import type { Category, Section, UserCategoryAccess } from '@/types/types';

// ── category meta ─────────────────────────────────────────────────────────────
const categories: {
  name: Category;
  description: string;
  icon: typeof BookOpen;
  color: string;
  iconColor: string;
}[] = [
  {
    name: 'Appendix 2A',
    description: 'Financial regulations and procedures',
    icon: FileText,
    color: 'bg-violet-100 dark:bg-violet-900/30',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
  {
    name: 'Appendix 3A',
    description: 'Administrative guidelines',
    icon: BookOpen,
    color: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    name: 'LDCE',
    description: 'Limited Departmental Competitive Examination',
    icon: Package,
    color: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    name: 'Chapter Wise Questions',
    description: 'Topic-wise chapter questions',
    icon: Layers,
    color: 'bg-sky-100 dark:bg-sky-900/30',
    iconColor: 'text-sky-600 dark:text-sky-400',
  },
];

// ── section meta ──────────────────────────────────────────────────────────────
const sections: {
  name: Section;
  description: string;
  icon: typeof DollarSign;
  color: string;
  iconColor: string;
}[] = [
  { name: 'Expenditure',    description: 'Financial spending & budgets',   icon: DollarSign, color: 'bg-blue-100 dark:bg-blue-900/30',    iconColor: 'text-blue-600 dark:text-blue-400' },
  { name: 'Establishment',  description: 'Org structure & HR',             icon: Users,      color: 'bg-purple-100 dark:bg-purple-900/30', iconColor: 'text-purple-600 dark:text-purple-400' },
  { name: 'Stores',         description: 'Inventory & supplies',           icon: Package,    color: 'bg-orange-100 dark:bg-orange-900/30', iconColor: 'text-orange-600 dark:text-orange-400' },
  { name: 'Books & Budget', description: 'Accounting & financial planning', icon: BookBudget, color: 'bg-teal-100 dark:bg-teal-900/30',    iconColor: 'text-teal-600 dark:text-teal-400' },
  { name: 'Traffic',        description: 'Traffic rules & regulations',    icon: Car,        color: 'bg-rose-100 dark:bg-rose-900/30',    iconColor: 'text-rose-600 dark:text-rose-400' },
];

// ── types ─────────────────────────────────────────────────────────────────────
interface CategoryStats {
  sections: number;
  bunches: number;
  questions: number;
}
// category → section → { bunches, questions }
type SectionStats = Record<string, Record<string, { bunches: number; questions: number }>>;

export default function DashboardPage() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();

  const [visibleCategories, setVisibleCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [catStats, setCatStats] = useState<Record<string, CategoryStats>>({});
  const [secStats, setSecStats] = useState<SectionStats>({});
  // Prevent duplicate fetches when auth state fires multiple events
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (user && profile && !fetchedRef.current) {
      fetchedRef.current = true;
      fetchCategoryAccess();
      fetchStats();
    }
  }, [user, profile]);

  // Use server-side aggregate RPCs — avoids the 1000-row client pagination limit
  const fetchStats = async () => {
    const [catRes, secRes] = await Promise.all([
      supabase.rpc('get_category_stats'),
      supabase.rpc('get_section_stats'),
    ]);

    if (catRes.data) {
      const catResult: Record<string, CategoryStats> = {};
      (catRes.data as { category: string; sections: number; bunches: number; questions: number }[])
        .forEach((row) => {
          catResult[row.category] = {
            sections: Number(row.sections),
            bunches:  Number(row.bunches),
            questions: Number(row.questions),
          };
        });
      setCatStats(catResult);
    }

    if (secRes.data) {
      const secResult: SectionStats = {};
      (secRes.data as { category: string; section: string; bunches: number; questions: number }[])
        .forEach((row) => {
          if (!secResult[row.category]) secResult[row.category] = {};
          secResult[row.category][row.section] = {
            bunches:  Number(row.bunches),
            questions: Number(row.questions),
          };
        });
      setSecStats(secResult);
    }
  };

  const fetchCategoryAccess = async () => {
    if (!user) return;

    if (profile?.role === 'admin') {
      setVisibleCategories(categories.map((c) => c.name));
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('user_category_access')
      .select('*')
      .eq('user_id', user.id);

    if (error || !data || data.length === 0) {
      setVisibleCategories(categories.map((c) => c.name));
      setLoading(false);
      return;
    }

    const visible = data
      .filter((a: UserCategoryAccess) => a.visible)
      .map((a: UserCategoryAccess) => a.category);

    setVisibleCategories(visible);
    setLoading(false);
  };

  const handleCategoryClick = (cat: Category) =>
    setSelectedCategory((prev) => (prev === cat ? null : cat));

  const handleSectionClick = (category: Category, section: Section) =>
    navigate(`/section-selection?category=${encodeURIComponent(category)}&section=${encodeURIComponent(section)}`);

  // ── pending approval ──────────────────────────────────────────────────────
  if (profile && !profile.approved && profile.role !== 'admin') {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <div className="flex-1 p-6 md:p-12">
          <div className="mx-auto max-w-2xl space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Account Pending Approval</AlertTitle>
              <AlertDescription>
                {"Your account is waiting for admin approval. You'll be able to access the quiz system once an administrator approves your account."}
              </AlertDescription>
            </Alert>
            <div className="flex items-center justify-center pt-2">
              <Button asChild className="gap-2">
                <Link to="/chat">
                  <MessageCircle className="h-4 w-4" />
                  Contact Admin
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const visibleCategoryList = categories.filter((c) => visibleCategories.includes(c.name));

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <div className="flex-1 px-4 py-8 md:px-8 md:py-10">
        <div className="mx-auto w-full max-w-[1600px] space-y-8">

          {/* ── Page heading ─────────────────────────────────────────── */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance md:text-3xl">
                Select Category &amp; Section
              </h1>
              <p className="text-sm text-muted-foreground text-pretty">
                Choose a category below, then pick a section to explore bunches
              </p>
            </div>
            <Button asChild variant="outline" className="gap-2 shrink-0">
              <Link to="/chat">
                <MessageCircle className="h-4 w-4" />
                Contact Admin
              </Link>
            </Button>
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground py-16">Loading categories…</p>
          ) : visibleCategoryList.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Categories Available</AlertTitle>
              <AlertDescription>
                You don't have access to any categories yet. Please contact an administrator.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-5">

              {/* ── Category cards ──────────────────────────────────── */}
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {visibleCategoryList.map((cat) => {
                  const Icon = cat.icon;
                  const s = catStats[cat.name];
                  const isOpen = selectedCategory === cat.name;
                  const hasData = !!s;

                  return (
                    <button
                      key={cat.name}
                      onClick={() => handleCategoryClick(cat.name)}
                      className={`group w-full text-left rounded-2xl border bg-card p-6 transition-all duration-200
                        hover:border-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                        ${isOpen ? 'border-primary shadow-md ring-1 ring-primary/20' : 'border-border shadow-sm'}`}
                    >
                      {/* Icon + title */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${cat.color}`}>
                            <Icon className={`h-7 w-7 ${cat.iconColor}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-lg text-foreground tracking-tight text-balance leading-snug">
                              {cat.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 text-pretty leading-relaxed">
                              {cat.description}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 mt-1">
                          {isOpen
                            ? <ChevronDown className="h-5 w-5 text-primary transition-transform duration-200" />
                            : <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-hover:text-primary group-hover:translate-x-0.5" />
                          }
                        </div>
                      </div>

                      {/* Stats row — sections always 5 (fixed set); bunches/questions from DB */}
                      <div className="mt-5 grid grid-cols-3 gap-3">
                        <StatPill
                          icon={Layers}
                          value={5}
                          label="Sections"
                        />
                        <StatPill
                          icon={LayoutGrid}
                          value={hasData ? s.bunches : 0}
                          label="Bunches"
                        />
                        <StatPill
                          icon={HelpCircle}
                          value={hasData ? s.questions.toLocaleString() : 0}
                          label="Questions"
                        />
                      </div>

                      {!hasData && (
                        <p className="mt-3 text-[11px] text-muted-foreground text-center">
                          Questions coming soon
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* ── Sections panel ───────────────────────────────────── */}
              {selectedCategory && (() => {
                const cat = categories.find((c) => c.name === selectedCategory)!;
                return (
                  <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
                    {/* Panel header */}
                    <div className="flex items-center gap-3 pb-1 border-b border-border">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${cat.color}`}>
                        <cat.icon className={`h-4 w-4 ${cat.iconColor}`} />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-foreground">{cat.name}</p>
                        <p className="text-xs text-muted-foreground">Select a section to view bunches</p>
                      </div>
                    </div>

                    {/* Section cards grid — bigger, full-width */}
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                      {sections.map((sec) => {
                        const SIcon = sec.icon;
                        const ss = secStats[selectedCategory]?.[sec.name];

                        return (
                          <button
                            key={sec.name}
                            onClick={() => handleSectionClick(selectedCategory, sec.name)}
                            className="group flex flex-col gap-4 rounded-2xl border border-border bg-background p-5
                              text-left transition-all duration-200
                              hover:border-primary hover:shadow-md hover:-translate-y-0.5
                              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {/* Icon */}
                            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${sec.color}`}>
                              <SIcon className={`h-6 w-6 ${sec.iconColor}`} />
                            </div>

                            {/* Name + description */}
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors text-balance leading-snug">
                                {sec.name}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 text-pretty">
                                {sec.description}
                              </p>
                            </div>

                            {/* Section stats — always show, 0 when none added yet */}
                            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/60">
                              <div className="text-center">
                                <p className="text-base font-bold tabular-nums text-foreground leading-none">
                                  {ss?.bunches ?? 0}
                                </p>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Bunches</p>
                              </div>
                              <div className="text-center">
                                <p className="text-base font-bold tabular-nums text-foreground leading-none">
                                  {ss?.questions.toLocaleString() ?? 0}
                                </p>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Questions</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Layers;
  value: number | string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-muted/40 px-2 py-3">
      <span className="text-lg font-bold tabular-nums text-foreground leading-none">{value}</span>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
    </div>
  );
}
