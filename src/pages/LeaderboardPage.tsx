import { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Trophy, Medal, Award } from 'lucide-react';
import type { Category, Section, QuizResult } from '@/types/types';

const categories: Category[] = ['Appendix 2A', 'Appendix 3A', 'LDCE', 'Chapter Wise Questions'];
const sections: Section[] = ['Expenditure', 'Establishment', 'Stores', 'Books & Budget', 'Traffic', 'General'];

interface LeaderboardEntry extends QuizResult {
  username: string;
}

export default function LeaderboardPage() {
  const [results, setResults] = useState<LeaderboardEntry[]>([]);
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [section, setSection] = useState<Section | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [category, section]);

  const fetchResults = async () => {
    setLoading(true);

    let query = supabase
      .from('quiz_results')
      .select(`
        *,
        profiles!inner(username)
      `)
      .eq('is_first_attempt', true)
      .order('percentage', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);

    if (category !== 'all') {
      query = query.eq('category', category);
    }

    if (section !== 'all') {
      query = query.eq('section', section);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch leaderboard:', error);
      setLoading(false);
      return;
    }

    const formattedData = (data || []).map((item: any) => ({
      ...item,
      username: item.profiles.username,
    }));

    setResults(formattedData);
    setLoading(false);
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (index === 1) return <Medal className="h-6 w-6 text-gray-400" />;
    if (index === 2) return <Award className="h-6 w-6 text-amber-600" />;
    return <span className="text-lg font-semibold text-muted-foreground">{index + 1}</span>;
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <div className="flex-1 p-6 md:p-12">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-balance">Leaderboard</h1>
            <p className="text-muted-foreground text-pretty">Top performers across all quizzes</p>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={(val) => setCategory(val as Category | 'all')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Section</Label>
                  <Select value={section} onValueChange={(val) => setSection(val as Section | 'all')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sections</SelectItem>
                      {sections.map((sec) => (
                        <SelectItem key={sec} value={sec}>
                          {sec}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle>Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-muted-foreground">Loading...</p>
              ) : results.length === 0 ? (
                <p className="text-center text-muted-foreground">No results found</p>
              ) : (
                <div className="space-y-3">
                  {results.map((result, index) => (
                    <div
                      key={result.id}
                      className={`flex items-center gap-4 rounded-lg border p-4 ${
                        index < 3 ? 'border-primary/50 bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center">
                        {getRankIcon(index)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{result.username}</p>
                        <p className="text-sm text-muted-foreground">
                          {result.category} - {result.section}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-2xl font-bold text-primary">{result.percentage.toFixed(0)}%</p>
                        <p className="text-sm text-muted-foreground">
                          {result.score}/{result.total_questions}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
