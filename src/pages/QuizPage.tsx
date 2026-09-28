import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
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
import { Clock, CheckCircle2, XCircle, Send, Pause, Play, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import type { Question, QuizAnswer, FontWeight } from '@/types/types';

const AUTO_NEXT_SECONDS = 5;
const QUIZ_DURATION     = 30 * 60; // 30 minutes in seconds

const FONT_WEIGHT_MAP: Record<FontWeight, string> = {
  regular: '400',
  medium:  '500',
  bold:    '700',
};

const formatTime = (secs: number) => {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export default function QuizPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const category = searchParams.get('category');
  const section = searchParams.get('section');
  const bunch = searchParams.get('bunch');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizTimeLeft, setQuizTimeLeft] = useState(QUIZ_DURATION);
  const [showFeedback, setShowFeedback] = useState(false);
  const [loading, setLoading] = useState(true);

  // Refs that mirror state — safe to read inside interval callbacks
  const questionsRef = useRef<Question[]>([]);
  const answersRef   = useRef<QuizAnswer[]>([]);

  // Font settings
  const [fontStyle, setFontStyle]   = useState('Inter');
  const [fontSize, setFontSize]     = useState(16);
  const [fontWeight, setFontWeight] = useState<FontWeight>('regular');

  // Auto-next countdown after feedback
  const [autoNextCount, setAutoNextCount] = useState(AUTO_NEXT_SECONDS);
  const [autoNextPaused, setAutoNextPaused] = useState(false);
  const autoNextPausedRef = useRef(false);
  const pendingAnswerRef  = useRef<QuizAnswer | null>(null);

  // Fetch questions + timer setting together
  useEffect(() => {
    if (!category || !section || !bunch) {
      navigate('/dashboard');
      return;
    }

    const fetchAll = async () => {
      // Fetch font settings
      const { data: settingsData } = await supabase
        .from('app_settings')
        .select('font_style, font_size, font_weight')
        .eq('id', 1)
        .maybeSingle();

      if (settingsData) {
        setFontStyle(settingsData.font_style ?? 'Inter');
        setFontSize(settingsData.font_size ?? 16);
        setFontWeight((settingsData.font_weight ?? 'regular') as FontWeight);
      }

      // Fetch questions
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('category', category)
        .eq('section', section)
        .eq('bunch', bunch);

      if (error) {
        toast.error('Failed to load questions');
        navigate('/dashboard');
        return;
      }

      if (!data || data.length === 0) {
        toast.error('No questions available for this bunch');
        navigate(`/section-selection?category=${encodeURIComponent(category)}&section=${encodeURIComponent(section)}`);
        return;
      }

      // Randomize question order
      const shuffled = [...data].sort(() => Math.random() - 0.5);
      questionsRef.current = shuffled;
      setQuestions(shuffled);
      setLoading(false);
    };

    fetchAll();
  }, [category, section, bunch, navigate]);

  // Single 30-minute quiz countdown — runs continuously once loaded, not paused during feedback
  useEffect(() => {
    if (loading) return;

    const timer = setInterval(() => {
      setQuizTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Time's up — build remaining empty answers from refs and auto-submit
          const currentAnswers = answersRef.current;
          const currentQuestions = questionsRef.current;
          const remaining: QuizAnswer[] = [];
          for (let i = currentAnswers.length; i < currentQuestions.length; i++) {
            remaining.push({
              question_id: currentQuestions[i].id,
              selected: [],
              correct: currentQuestions[i].correct,
              is_correct: false,
            });
          }
          finishQuiz([...currentAnswers, ...remaining]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading]);

  // Reset selection on question change
  useEffect(() => {
    setSelectedOption(null);
  }, [currentIndex]);

  const handleAnswerSelect = (optionIndex: number) => {
    if (showFeedback) return;
    setSelectedOption(optionIndex);
  };

  // Advance to next question or finish quiz
  const advanceQuiz = useCallback((latestAnswers: QuizAnswer[]) => {
    setShowFeedback(false);
    setAutoNextPaused(false);
    autoNextPausedRef.current = false;
    setAutoNextCount(AUTO_NEXT_SECONDS);
    pendingAnswerRef.current = null;

    const nextIdx = latestAnswers.length; // next unanswered index
    if (nextIdx < questions.length) {
      setCurrentIndex(nextIdx);
      setSelectedOption(null);
    } else {
      finishQuiz(latestAnswers);
    }
  }, [questions]);

  const handleSubmitAnswer = () => {
    if (selectedOption === null) {
      toast.error('Please select an answer');
      return;
    }

    const currentQuestion = questions[currentIndex];
    const isCorrect = currentQuestion.correct.includes(selectedOption);

    const answer: QuizAnswer = {
      question_id: currentQuestion.id,
      selected: [selectedOption],
      correct: currentQuestion.correct,
      is_correct: isCorrect,
    };

    const latestAnswers = [...answers, answer];
    answersRef.current = latestAnswers;
    setAnswers(latestAnswers);
    pendingAnswerRef.current = answer;
    setShowFeedback(true);
    setAutoNextCount(AUTO_NEXT_SECONDS);
    setAutoNextPaused(false);
    autoNextPausedRef.current = false;
  };

  const finishQuiz = async (finalAnswers: QuizAnswer[]) => {
    const score = finalAnswers.filter((a) => a.is_correct).length;
    const totalQuestions = questions.length;
    const percentage = (score / totalQuestions) * 100;

    let isFirstAttempt = false;

    if (user && category && section && bunch) {
      // Check whether a first-attempt record already exists for this user+quiz combo
      const { data: existingFlag } = await supabase.rpc('has_first_attempt', {
        p_user_id: user.id,
        p_category: category,
        p_section: section,
        p_bunch: bunch,
      });

      isFirstAttempt = !existingFlag;

      await supabase.from('quiz_results').insert({
        user_id: user.id,
        category,
        section,
        bunch,
        score,
        total_questions: totalQuestions,
        percentage: percentage.toFixed(2),
        is_first_attempt: isFirstAttempt,
      });
    }

    // Store quiz data in sessionStorage for review page
    const reviewData = {
      questions,
      answers: finalAnswers,
      score,
      totalQuestions,
      percentage: percentage.toFixed(2),
    };
    sessionStorage.setItem('quizReview', JSON.stringify(reviewData));

    navigate(
      `/result?score=${score}&total=${totalQuestions}&percentage=${percentage.toFixed(2)}` +
      `&first=${isFirstAttempt ? '1' : '0'}` +
      `&category=${encodeURIComponent(category ?? '')}` +
      `&section=${encodeURIComponent(section ?? '')}` +
      `&bunch=${encodeURIComponent(bunch ?? '')}`
    );
  };

  const handleSubmitQuiz = () => {
    const currentAnswers = answersRef.current;
    const remaining: QuizAnswer[] = [];
    for (let i = currentAnswers.length; i < questions.length; i++) {
      remaining.push({
        question_id: questions[i].id,
        selected: [],
        correct: questions[i].correct,
        is_correct: false,
      });
    }
    finishQuiz([...currentAnswers, ...remaining]);
  };

  // Auto-next countdown effect — runs only while feedback is showing
  useEffect(() => {
    if (!showFeedback) return;

    const interval = setInterval(() => {
      if (autoNextPausedRef.current) return;
      setAutoNextCount((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          advanceQuiz(answersRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showFeedback, advanceQuiz]);

  const handlePauseToggle = () => {
    autoNextPausedRef.current = !autoNextPausedRef.current;
    setAutoNextPaused(autoNextPausedRef.current);
  };

  const handleNextNow = () => {
    advanceQuiz(answersRef.current);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading questions…</p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const answeredCount = answers.length;

  // Full-quiz timer derived values
  const quizTimerUrgent  = quizTimeLeft <= 120;   // ≤ 2 min → red
  const quizTimerWarning = quizTimeLeft <= 300 && quizTimeLeft > 120; // ≤ 5 min → amber
  const quizTimePct      = (quizTimeLeft / QUIZ_DURATION) * 100;

  /* ── Submit dialog content (reused fragment) ─────────────────────────── */
  const submitDialogContent = (
    <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
      <AlertDialogHeader>
        <AlertDialogTitle>Submit Quiz?</AlertDialogTitle>
        <AlertDialogDescription>
          {answeredCount < questions.length
            ? `You have answered ${answeredCount} of ${questions.length} questions. Unanswered questions will be marked incorrect.`
            : `You have completed all ${questions.length} questions. Ready to submit?`}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Continue Quiz</AlertDialogCancel>
        <AlertDialogAction onClick={handleSubmitQuiz}>Submit Now</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );

  /* ── Option row ───────────────────────────────────────────────────────── */
  const renderOptions = (gapClass = 'space-y-3') => (
    <RadioGroup
      key={currentQuestion.id}
      value={selectedOption?.toString()}
      onValueChange={(val) => handleAnswerSelect(Number.parseInt(val))}
    >
      <div className={gapClass}>
        {currentQuestion.options.map((option, index) => {
          const isSelected = selectedOption === index;
          const isCorrect = currentQuestion.correct.includes(index);
          const showCorrect = showFeedback && isCorrect;
          const showWrong = showFeedback && isSelected && !isCorrect;

          return (
            <div
              key={index}
              className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 transition-all cursor-pointer select-none ${
                showCorrect
                  ? 'border-green-500 bg-green-50 dark:bg-green-950'
                  : showWrong
                    ? 'border-red-500 bg-red-50 dark:bg-red-950'
                    : isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40 hover:bg-muted/40'
              }`}
            >
              <RadioGroupItem value={index.toString()} id={`opt-${index}`} disabled={showFeedback} className="shrink-0" />
              <Label
                htmlFor={`opt-${index}`}
                className="flex-1 cursor-pointer leading-snug"
                style={{
                  fontFamily: fontStyle,
                  fontSize: `${Math.max(fontSize - 1, 12)}px`,
                  fontWeight: FONT_WEIGHT_MAP[fontWeight],
                }}
              >
                {option}
              </Label>
              {showCorrect && <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />}
              {showWrong   && <XCircle      className="h-5 w-5 shrink-0 text-red-600"   />}
            </div>
          );
        })}
      </div>
    </RadioGroup>
  );

  /* ── Explanation block ────────────────────────────────────────────────── */
  const explanationBlock = showFeedback && currentQuestion.explanation && (
    <div className="rounded-lg border border-border bg-muted/50 p-4">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Explanation</p>
      <p className="text-sm text-foreground leading-relaxed" style={{ fontFamily: fontStyle }}>
        {currentQuestion.explanation}
      </p>
    </div>
  );

  /* ── Auto-next countdown bar (shown after answer submitted) ──────────── */
  const autoNextBar = showFeedback && (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="flex items-center justify-between gap-4">
        {/* Countdown ring + label */}
        <div className="flex items-center gap-3 min-w-0">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-lg font-bold tabular-nums transition-colors ${
            autoNextPaused ? 'border-muted-foreground text-muted-foreground' : 'border-primary text-primary'
          }`}>
            {autoNextCount}
          </div>
          <p className="text-sm text-muted-foreground text-pretty">
            {autoNextPaused
              ? 'Paused — resume or go next'
              : `Next question in ${autoNextCount}s…`}
          </p>
        </div>

        {/* Controls */}
        <div className="flex shrink-0 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handlePauseToggle}
            className="gap-1.5"
          >
            {autoNextPaused
              ? <><Play className="h-3.5 w-3.5" />Resume</>
              : <><Pause className="h-3.5 w-3.5" />Pause</>}
          </Button>
          <Button
            size="sm"
            onClick={handleNextNow}
            className="gap-1.5"
          >
            <ChevronRight className="h-3.5 w-3.5" />
            Next
          </Button>
        </div>
      </div>

      {/* Progress strip */}
      <div className="mt-3 h-1 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${autoNextPaused ? 'bg-muted-foreground' : 'bg-primary'}`}
          style={{ width: `${(autoNextCount / AUTO_NEXT_SECONDS) * 100}%` }}
        />
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════════════
     MOBILE layout  (< md = below 768 px) — single column, compact
  ════════════════════════════════════════════════════════════════════════ */
  const mobileLayout = (
    <div className="flex min-h-screen w-full flex-col bg-background md:hidden">
      {/* Sticky top bar */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Q {currentIndex + 1} / {questions.length}</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Quiz timer pill */}
        <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold tabular-nums shrink-0 ${
          quizTimerUrgent  ? 'border-destructive text-destructive'
          : quizTimerWarning ? 'border-amber-500 text-amber-600 dark:text-amber-400'
          : 'border-border text-foreground'
        }`}>
          <Clock className="h-3.5 w-3.5" />
          {formatTime(quizTimeLeft)}
        </div>

        {/* Mobile submit */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="shrink-0 gap-1.5">
              <Send className="h-3.5 w-3.5" />
              <span className="sr-only">Submit</span>
            </Button>
          </AlertDialogTrigger>
          {submitDialogContent}
        </AlertDialog>
      </header>

      {/* Body */}
      <main className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {/* Question text */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Question {currentIndex + 1}
          </p>
          <p
            className="text-balance leading-relaxed"
            style={{
              fontFamily: fontStyle,
              fontSize: `${fontSize}px`,
              fontWeight: FONT_WEIGHT_MAP[fontWeight],
            }}
          >
            {currentQuestion.question}
          </p>
        </div>

        {currentQuestion.question_image_url && (
          <img src={currentQuestion.question_image_url} alt="Question" className="w-full rounded-lg" />
        )}

        {renderOptions('space-y-2.5')}
        {explanationBlock}
        {autoNextBar}

        {!showFeedback && (
          <Button
            onClick={handleSubmitAnswer}
            className="w-full"
            disabled={selectedOption === null}
          >
            Submit Answer
          </Button>
        )}
      </main>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════════════
     DESKTOP layout  (≥ md = 768 px+) — professional exam dashboard
  ════════════════════════════════════════════════════════════════════════ */
  const desktopLayout = (
    <div className="hidden md:flex min-h-screen w-full flex-col bg-background">

      {/* ── Top header bar ─────────────────────────────────────────────── */}
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto flex w-[92%] max-w-[1400px] items-center justify-between py-3 gap-6">
          {/* Branding */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-bold text-sm">Q</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-balance leading-none truncate">Quiz System</p>
              <p className="text-[10px] text-muted-foreground truncate">Vijay Sharma · Accountant / NWR</p>
            </div>
          </div>

          {/* Progress bar */}
// Progress bar max-w removed so it stretches full width
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span>{answeredCount} answered · {progress.toFixed(0)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Quiz timer */}
          <div className={`flex items-center gap-2 rounded-xl border px-4 py-2 shrink-0 ${
            quizTimerUrgent  ? 'border-destructive bg-destructive/5 text-destructive'
            : quizTimerWarning ? 'border-amber-500 bg-amber-50/60 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
            : 'border-border text-foreground'
          }`}>
            <Clock className="h-4 w-4" />
            <span className="text-xl font-bold tabular-nums">{formatTime(quizTimeLeft)}</span>
          </div>

          {/* Desktop header submit */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" className="shrink-0 gap-2">
                <Send className="h-4 w-4" />
                Submit Quiz
              </Button>
            </AlertDialogTrigger>
            {submitDialogContent}
          </AlertDialog>
        </div>
      </header>

      {/* ── Full-quiz timer bar under header ───────────────────────────── */}
      <div className="w-full h-1 bg-muted">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${
            quizTimerUrgent  ? 'bg-destructive'
            : quizTimerWarning ? 'bg-amber-500'
            : 'bg-primary'
          }`}
          style={{ width: `${quizTimePct}%` }}
        />
      </div>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-[92%] max-w-[1400px] py-8 lg:py-10">
          <div className="flex gap-8 lg:gap-12 items-start">

            {/* ── LEFT: question + options ─────────────────────────────── */}
            <div className="flex-1 min-w-0 space-y-7">

              {/* Question meta + text */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {currentIndex + 1}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-medium text-muted-foreground shrink-0">
                    {category} · {section}
                  </span>
                </div>

                <p
                  className="leading-relaxed text-balance"
                  style={{
                    fontFamily: fontStyle,
                    fontSize: `${Math.max(fontSize + 2, 16)}px`,
                    fontWeight: FONT_WEIGHT_MAP[fontWeight],
                    lineHeight: 1.65,
                  }}
                >
                  {currentQuestion.question}
                </p>

                {currentQuestion.question_image_url && (
                  <img
                    src={currentQuestion.question_image_url}
                    alt="Question"
                    className="w-full max-h-72 object-contain rounded-xl border border-border"
                  />
                )}
              </div>

              {/* Options */}
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  Select your answer
                </p>
                {renderOptions('space-y-3')}
              </div>

              {/* Explanation */}
              {explanationBlock}

              {/* Auto-next countdown */}
              {autoNextBar}

              {/* Submit answer */}
              {!showFeedback && (
                <Button
                  onClick={handleSubmitAnswer}
                  size="lg"
                  className="w-full text-base"
                  disabled={selectedOption === null}
                >
                  Submit Answer
                </Button>
              )}
            </div>

            {/* ── RIGHT: sidebar ───────────────────────────────────────── */}
            <aside className="hidden lg:flex w-64 xl:w-72 shrink-0 flex-col gap-5 sticky top-24">

              {/* Timer card — full quiz */}
              <Card className="overflow-hidden">
                <div className={`h-1.5 w-full ${quizTimerUrgent ? 'bg-destructive' : quizTimerWarning ? 'bg-amber-500' : 'bg-primary'}`} />
                <CardContent className="pt-5 pb-4 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Time Remaining</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-4xl font-bold tabular-nums leading-none ${quizTimerUrgent ? 'text-destructive' : quizTimerWarning ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                      {formatTime(quizTimeLeft)}
                    </span>
                    <span className="text-xs text-muted-foreground">/ 30:00</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                        quizTimerUrgent ? 'bg-destructive' : quizTimerWarning ? 'bg-amber-500' : 'bg-primary'
                      }`}
                      style={{ width: `${quizTimePct}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Session stats */}
              <Card>
                <CardContent className="pt-5 pb-4 space-y-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Session</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Total',     value: questions.length },
                      { label: 'Answered',  value: answeredCount },
                      { label: 'Remaining', value: questions.length - answeredCount },
                      { label: 'Correct',   value: answers.filter((a) => a.is_correct).length },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-lg bg-muted/50 p-3 text-center">
                        <p className="text-lg font-bold tabular-nums leading-none">{value}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground">{label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Question map */}
              <Card>
                <CardContent className="pt-5 pb-4 space-y-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Questions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {questions.map((_, i) => {
                      const isAnswered = answers[i] !== undefined;
                      const isCurrent  = i === currentIndex;
                      const isCorrect  = isAnswered && answers[i]?.is_correct;
                      return (
                        <div
                          key={i}
                          className={`flex h-7 w-7 items-center justify-center rounded text-[11px] font-medium transition-colors ${
                            isCurrent
                              ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1'
                              : isCorrect
                                ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                                : isAnswered
                                  ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                                  : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {i + 1}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Sidebar submit */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full gap-2">
                    <Send className="h-4 w-4" />
                    Submit Quiz
                  </Button>
                </AlertDialogTrigger>
                {submitDialogContent}
              </AlertDialog>
            </aside>

          </div>
        </div>
      </main>
    </div>
  );

  return (
    <>
      {mobileLayout}
      {desktopLayout}
    </>
  );
}
