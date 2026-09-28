import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Pencil, X, Check, Search, ChevronLeft, ChevronRight, Trash2, Type, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { Question, Category, Section, FontWeight } from '@/types/types';

const CATEGORIES: Category[] = ['Appendix 2A', 'Appendix 3A', 'LDCE', 'Chapter Wise Questions'];
const SECTIONS: Section[] = ['Expenditure', 'Establishment', 'Stores', 'Books & Budget', 'Traffic', 'General'];
const PAGE_SIZE = 10;

const FONT_OPTIONS = [
  { label: 'Inter', value: 'Inter' },
  { label: 'Roboto', value: 'Roboto' },
  { label: 'Poppins', value: 'Poppins' },
  { label: 'Open Sans', value: 'Open Sans' },
  { label: 'Noto Sans', value: 'Noto Sans' },
  { label: 'Noto Sans Devanagari', value: 'Noto Sans Devanagari' },
];

const FONT_WEIGHT_OPTIONS: { label: string; value: FontWeight }[] = [
  { label: 'Regular', value: 'regular' },
  { label: 'Medium',  value: 'medium'  },
  { label: 'Bold',    value: 'bold'    },
];

const FONT_WEIGHT_MAP: Record<FontWeight, string> = {
  regular: '400',
  medium:  '500',
  bold:    '700',
};

interface EditState {
  question: string;
  options: string[];
  correct: number[];
  explanation: string;
}

export default function AdminQuestionsPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  // Font settings
  const [fontStyle, setFontStyle]   = useState('Inter');
  const [fontSize, setFontSize]     = useState(16);
  const [fontWeight, setFontWeight] = useState<FontWeight>('regular');
  const [savingFont, setSavingFont] = useState(false);

  // Filters
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSection, setFilterSection] = useState<string>('all');
  const [filterBunch, setFilterBunch] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [bunches, setBunches] = useState<string[]>([]);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({
    question: '',
    options: [],
    correct: [],
    explanation: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [profile, navigate]);

  // Fetch timer + font settings once
  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();
      if (data) {
        setFontStyle(data.font_style ?? 'Inter');
        setFontSize(data.font_size ?? 16);
        setFontWeight((data.font_weight ?? 'regular') as FontWeight);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveFontSettings = async () => {
    setSavingFont(true);
    const { error } = await supabase
      .from('app_settings')
      .update({
        font_style: fontStyle,
        font_size: fontSize,
        font_weight: fontWeight,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);
    if (error) {
      toast.error('Failed to save font settings');
    } else {
      toast.success('Font settings saved');
    }
    setSavingFont(false);
  };

  const fetchBunches = useCallback(async () => {
    let q = supabase.from('questions').select('bunch').order('bunch');
    if (filterCategory !== 'all') q = q.eq('category', filterCategory);
    if (filterSection !== 'all') q = q.eq('section', filterSection);
    const { data } = await q;
    if (data) {
      const unique = [...new Set(data.map((r) => r.bunch).filter(Boolean))];
      setBunches(unique);
    }
  }, [filterCategory, filterSection]);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    let countQ = supabase
      .from('questions')
      .select('id', { count: 'exact', head: true });
    let dataQ = supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    if (filterCategory !== 'all') {
      countQ = countQ.eq('category', filterCategory);
      dataQ = dataQ.eq('category', filterCategory);
    }
    if (filterSection !== 'all') {
      countQ = countQ.eq('section', filterSection);
      dataQ = dataQ.eq('section', filterSection);
    }
    if (filterBunch !== 'all') {
      countQ = countQ.eq('bunch', filterBunch);
      dataQ = dataQ.eq('bunch', filterBunch);
    }
    if (searchQuery.trim()) {
      countQ = countQ.ilike('question', `%${searchQuery.trim()}%`);
      dataQ = dataQ.ilike('question', `%${searchQuery.trim()}%`);
    }

    const [{ count }, { data, error }] = await Promise.all([countQ, dataQ]);

    if (error) {
      toast.error('Failed to load questions');
    } else {
      setQuestions(Array.isArray(data) ? data : []);
      setTotal(count ?? 0);
    }
    setLoading(false);
  }, [filterCategory, filterSection, filterBunch, searchQuery, page]);

  useEffect(() => {
    fetchBunches();
  }, [fetchBunches]);

  useEffect(() => {
    setPage(0);
  }, [filterCategory, filterSection, filterBunch, searchQuery]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const startEdit = (q: Question) => {
    setEditingId(q.id);
    setEditState({
      question: q.question,
      options: [...q.options],
      correct: [...q.correct],
      explanation: q.explanation ?? '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...editState.options];
    newOptions[index] = value;
    setEditState({ ...editState, options: newOptions });
  };

  const toggleCorrect = (index: number) => {
    const exists = editState.correct.includes(index);
    const newCorrect = exists
      ? editState.correct.filter((c) => c !== index)
      : [...editState.correct, index];
    setEditState({ ...editState, correct: newCorrect });
  };

  const addOption = () => {
    setEditState({ ...editState, options: [...editState.options, ''] });
  };

  const removeOption = (index: number) => {
    if (editState.options.length <= 2) {
      toast.error('Minimum 2 options required');
      return;
    }
    const newOptions = editState.options.filter((_, i) => i !== index);
    const newCorrect = editState.correct
      .filter((c) => c !== index)
      .map((c) => (c > index ? c - 1 : c));
    setEditState({ ...editState, options: newOptions, correct: newCorrect });
  };

  const saveEdit = async () => {
    if (!editingId) return;

    // Validate
    if (!editState.question.trim()) {
      toast.error('Question text cannot be empty');
      return;
    }
    if (editState.options.some((o) => !o.trim())) {
      toast.error('All options must have text');
      return;
    }
    if (editState.correct.length === 0) {
      toast.error('At least one correct answer is required');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('questions')
      .update({
        question: editState.question.trim(),
        options: editState.options.map((o) => o.trim()),
        correct: editState.correct,
        explanation: editState.explanation.trim() || null,
      })
      .eq('id', editingId);

    if (error) {
      toast.error('Failed to save question');
    } else {
      toast.success('Question updated successfully');
      setEditingId(null);
      fetchQuestions();
    }
    setSaving(false);
  };

  const deleteQuestion = async (id: string) => {
    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete question');
    } else {
      toast.success('Question deleted');
      fetchQuestions();
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <div className="flex-1 p-6 md:p-8">
        <div className="mx-auto max-w-5xl space-y-6">
          {/* Header */}
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-balance">Question Management</h1>
            <p className="text-sm text-muted-foreground text-pretty">
              View, edit, and manage all quiz questions
            </p>
          </div>

          <Separator />

          {/* Font Settings */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Quiz Font Settings</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Controls the appearance of question text across the quiz. Supports English &amp; Hindi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-3">
                {/* Font Style */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Font Style</Label>
                  <Select value={fontStyle} onValueChange={setFontStyle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          <span style={{ fontFamily: f.value }}>{f.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Live preview */}
                  <p
                    className="truncate rounded border border-dashed border-border px-3 py-2 text-sm"
                    style={{
                      fontFamily: fontStyle,
                      fontSize: `${fontSize}px`,
                      fontWeight: FONT_WEIGHT_MAP[fontWeight],
                    }}
                  >
                    Quiz question preview अभ्यास
                  </p>
                </div>

                {/* Font Size */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Font Size</Label>
                    <span className="text-xs font-medium tabular-nums">{fontSize} px</span>
                  </div>
                  <div className="pt-2">
                    <Slider
                      min={5}
                      max={24}
                      step={1}
                      value={[fontSize]}
                      onValueChange={([v]) => setFontSize(v)}
                    />
                    <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                      <span>5 px</span>
                      <span>24 px</span>
                    </div>
                  </div>
                </div>

                {/* Font Weight */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Font Weight</Label>
                  <div className="flex gap-2">
                    {FONT_WEIGHT_OPTIONS.map((w) => (
                      <Button
                        key={w.value}
                        variant={fontWeight === w.value ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => setFontWeight(w.value)}
                      >
                        {w.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleSaveFontSettings}
                  disabled={savingFont}
                  className="gap-1.5"
                >
                  <Save className="h-3.5 w-3.5" />
                  {savingFont ? 'Saving…' : 'Save Font Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Filters */}
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                {/* Search */}
                <div className="relative sm:col-span-2 md:col-span-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search questions…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {/* Category filter */}
                <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v); setFilterBunch('all'); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Section filter */}
                <Select value={filterSection} onValueChange={(v) => { setFilterSection(v); setFilterBunch('all'); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Sections" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sections</SelectItem>
                    {SECTIONS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Bunch filter */}
                <Select value={filterBunch} onValueChange={setFilterBunch}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Bunches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Bunches</SelectItem>
                    {bunches.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Results count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {loading ? 'Loading…' : `${total} question${total !== 1 ? 's' : ''} found`}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page + 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Question List */}
          <div className="space-y-4">
            {loading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Loading questions…</div>
            ) : questions.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">No questions found.</div>
            ) : (
              questions.map((q, idx) => {
                const isEditing = editingId === q.id;
                return (
                  <Card key={q.id} className={isEditing ? 'border-primary' : ''}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3 min-w-0">
                        <div className="flex items-start gap-2 min-w-0">
                          <span className="shrink-0 mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                            {page * PAGE_SIZE + idx + 1}
                          </span>
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap gap-1.5">
                              <Badge variant="secondary" className="text-xs">{q.category}</Badge>
                              <Badge variant="secondary" className="text-xs">{q.section}</Badge>
                              <Badge variant="outline" className="text-xs">{q.bunch}</Badge>
                            </div>
                          </div>
                        </div>
                        {!isEditing && (
                          <div className="flex shrink-0 items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEdit(q)}
                              className="h-8 gap-1.5 text-xs"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 text-destructive hover:text-destructive">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Question?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete this question. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteQuestion(q.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {isEditing ? (
                        /* ── EDIT MODE ── */
                        <div className="space-y-5">
                          {/* Question text */}
                          <div className="space-y-1.5">
                            <Label>Question</Label>
                            <Textarea
                              value={editState.question}
                              onChange={(e) => setEditState({ ...editState, question: e.target.value })}
                              rows={3}
                              className="resize-none"
                            />
                          </div>

                          {/* Options */}
                          <div className="space-y-2">
                            <Label>Answer Options <span className="text-muted-foreground text-xs">(check correct answer(s))</span></Label>
                            <div className="space-y-2">
                              {editState.options.map((opt, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <Checkbox
                                    checked={editState.correct.includes(i)}
                                    onCheckedChange={() => toggleCorrect(i)}
                                    id={`correct-${q.id}-${i}`}
                                    className="shrink-0"
                                  />
                                  <Label
                                    htmlFor={`correct-${q.id}-${i}`}
                                    className="sr-only"
                                  >
                                    Option {i + 1} correct
                                  </Label>
                                  <Input
                                    value={opt}
                                    onChange={(e) => handleOptionChange(i, e.target.value)}
                                    placeholder={`Option ${i + 1}`}
                                    className="flex-1 min-w-0"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                                    onClick={() => removeOption(i)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={addOption}
                              className="text-xs"
                            >
                              + Add Option
                            </Button>
                          </div>

                          {/* Explanation */}
                          <div className="space-y-1.5">
                            <Label>Explanation <span className="text-muted-foreground text-xs">(optional)</span></Label>
                            <Textarea
                              value={editState.explanation}
                              onChange={(e) => setEditState({ ...editState, explanation: e.target.value })}
                              rows={2}
                              placeholder="Optional explanation for the correct answer"
                              className="resize-none"
                            />
                          </div>

                          {/* Actions */}
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={cancelEdit}>
                              Cancel
                            </Button>
                            <Button size="sm" onClick={saveEdit} disabled={saving} className="gap-1.5">
                              <Check className="h-3.5 w-3.5" />
                              {saving ? 'Saving…' : 'Save Changes'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* ── VIEW MODE ── */
                        <div className="space-y-3">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap text-pretty">{q.question}</p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {q.options.map((opt, i) => (
                              <div
                                key={i}
                                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                                  q.correct.includes(i)
                                    ? 'border-green-500 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-300'
                                    : 'border-border'
                                }`}
                              >
                                {q.correct.includes(i) ? (
                                  <Check className="h-3.5 w-3.5 shrink-0 text-green-600" />
                                ) : (
                                  <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-muted-foreground/40" />
                                )}
                                <span className="min-w-0 break-words">{opt}</span>
                              </div>
                            ))}
                          </div>
                          {q.explanation && (
                            <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">Explanation: </span>
                              {q.explanation}
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Bottom Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2 pb-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
