import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import type { Question, QuizAnswer } from '@/types/types';

interface QuizReviewData {
  questions: Question[];
  answers: QuizAnswer[];
  score: number;
  totalQuestions: number;
  percentage: string;
}

export default function QuizReviewPage() {
  const navigate = useNavigate();
  const [reviewData, setReviewData] = useState<QuizReviewData | null>(null);

  useEffect(() => {
    const storedData = sessionStorage.getItem('quizReview');
    if (!storedData) {
      navigate('/dashboard');
      return;
    }

    try {
      const data = JSON.parse(storedData) as QuizReviewData;
      setReviewData(data);
    } catch (error) {
      console.error('Failed to parse quiz review data:', error);
      navigate('/dashboard');
    }
  }, [navigate]);

  if (!reviewData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading review...</p>
      </div>
    );
  }

  const { questions, answers } = reviewData;

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <div className="flex-1 p-6 md:p-12">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold text-balance">Quiz Review</h1>
              <p className="text-muted-foreground text-pretty">
                Review your answers and see the correct solutions
              </p>
            </div>
          </div>

          {/* Score Summary */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-center md:text-left">
                  <p className="text-sm text-muted-foreground">Your Score</p>
                  <p className="text-4xl font-bold">
                    {reviewData.score}/{reviewData.totalQuestions}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {reviewData.percentage}% Correct
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="text-center">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-2xl font-semibold">{reviewData.score}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Correct</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-2 text-red-600">
                      <XCircle className="h-5 w-5" />
                      <span className="text-2xl font-semibold">
                        {reviewData.totalQuestions - reviewData.score}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Wrong</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions Review */}
          <div className="space-y-6">
            {questions.map((question, index) => {
              const answer = answers[index];
              const isCorrect = answer?.is_correct || false;
              const userSelected = answer?.selected || [];
              const correctAnswers = question.correct;

              return (
                <Card key={question.id} className={isCorrect ? 'border-green-500' : 'border-red-500'}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <CardTitle className="text-lg text-balance whitespace-pre-wrap">
                        Question {index + 1}: {question.question}
                      </CardTitle>
                      <Badge variant={isCorrect ? 'default' : 'destructive'} className="shrink-0">
                        {isCorrect ? 'Correct' : 'Wrong'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {question.question_image_url && (
                      <img
                        src={question.question_image_url}
                        alt="Question"
                        className="w-full rounded-lg"
                      />
                    )}

                    {/* Options */}
                    <div className="space-y-3">
                      {question.options.map((option, optionIndex) => {
                        const isUserSelected = userSelected.includes(optionIndex);
                        const isCorrectOption = correctAnswers.includes(optionIndex);
                        
                        let borderColor = 'border-border';
                        let bgColor = 'bg-background';
                        let icon = null;

                        if (isCorrectOption) {
                          borderColor = 'border-green-500';
                          bgColor = 'bg-green-50 dark:bg-green-950';
                          icon = <CheckCircle2 className="h-5 w-5 text-green-600" />;
                        } else if (isUserSelected && !isCorrectOption) {
                          borderColor = 'border-red-500';
                          bgColor = 'bg-red-50 dark:bg-red-950';
                          icon = <XCircle className="h-5 w-5 text-red-600" />;
                        }

                        return (
                          <div
                            key={optionIndex}
                            className={`flex items-center gap-3 rounded-lg border-2 p-4 ${borderColor} ${bgColor}`}
                          >
                            <div className="flex-1 text-base">{option}</div>
                            {icon}
                            {isUserSelected && (
                              <Badge variant="outline" className="shrink-0">
                                Your Answer
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {question.explanation && (
                      <div className="rounded-lg bg-muted p-4">
                        <p className="text-sm font-medium mb-2">Explanation:</p>
                        <p className="text-sm text-muted-foreground text-pretty">
                          {question.explanation}
                        </p>
                      </div>
                    )}

                    {/* No answer selected */}
                    {userSelected.length === 0 && (
                      <div className="rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-500 p-4">
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          You did not answer this question
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Bottom Actions */}
          <div className="flex justify-center">
            <Button onClick={() => navigate('/dashboard')} size="lg">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
