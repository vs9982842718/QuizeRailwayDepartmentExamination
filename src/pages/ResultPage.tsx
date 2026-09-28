import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Award, FileText, RotateCcw, Star, ArrowLeft } from 'lucide-react';

export default function ResultPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const score       = Number.parseInt(searchParams.get('score')      || '0');
  const total       = Number.parseInt(searchParams.get('total')      || '0');
  const percentage  = Number.parseFloat(searchParams.get('percentage') || '0');
  const isFirst     = searchParams.get('first') === '1';
  const category    = searchParams.get('category') || '';
  const section     = searchParams.get('section')  || '';
  const bunch       = searchParams.get('bunch')     || '';

  const getPerformanceMessage = () => {
    if (percentage >= 90) return 'Excellent! Outstanding performance!';
    if (percentage >= 75) return 'Great job! Well done!';
    if (percentage >= 60) return 'Good effort! Keep practicing!';
    return 'Keep learning and try again!';
  };

  const handleReattempt = () => {
    navigate(
      `/quiz?category=${encodeURIComponent(category)}&section=${encodeURIComponent(section)}&bunch=${encodeURIComponent(bunch)}`
    );
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Trophy className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-semibold text-balance">Quiz Complete!</CardTitle>
            {isFirst ? (
              <Badge className="gap-1.5 px-3 py-1 text-xs font-medium">
                <Star className="h-3 w-3" />
                First Attempt — Score saved to Leaderboard
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs font-medium">
                Reattempt — Leaderboard score unchanged
              </Badge>
            )}
          </div>
          <CardDescription className="text-lg text-pretty">{getPerformanceMessage()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Score Display */}
          <div className="space-y-6">
            <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-8 text-center">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Your Score</p>
                <p className="text-6xl font-bold text-primary">{percentage.toFixed(0)}%</p>
                <p className="text-lg text-muted-foreground">
                  {score} out of {total} correct
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-950">
                    <Award className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Correct Answers</p>
                    <p className="text-2xl font-semibold">{score}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950">
                    <Award className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Incorrect Answers</p>
                    <p className="text-2xl font-semibold">{total - score}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {/* Primary: View Result (review answers) */}
            <Button onClick={() => navigate('/quiz-review')} size="lg" className="gap-2">
              <FileText className="h-4 w-4" />
              View Result
            </Button>

            {/* Reattempt */}
            {bunch && (
              <Button onClick={handleReattempt} variant="secondary" size="lg" className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Reattempt Quiz
              </Button>
            )}

            <div className="flex flex-col gap-3 md:flex-row">
              <Button
                onClick={() =>
                  navigate(
                    `/section-selection?category=${encodeURIComponent(category)}&section=${encodeURIComponent(section)}`
                  )
                }
                variant="outline"
                className="flex-1 gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button onClick={() => navigate('/leaderboard')} variant="outline" className="flex-1 gap-2">
                <Trophy className="h-4 w-4" />
                View Leaderboard
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
