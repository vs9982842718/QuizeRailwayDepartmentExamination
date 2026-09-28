import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { ArrowLeft, Play, FileEdit, Upload, Image as ImageIcon, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function BunchDetailPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category');
  const section = searchParams.get('section');
  const bunch = searchParams.get('bunch');

  const [questionCount, setQuestionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!category || !section || !bunch) {
      navigate('/dashboard');
      return;
    }
    fetchQuestionCount();
  }, [category, section, bunch]);

  const fetchQuestionCount = async () => {
    if (!category || !section || !bunch) return;

    setLoading(true);

    const { data, count, error } = await supabase
      .from('questions')
      .select('visible', { count: 'exact' })
      .eq('category', category)
      .eq('section', section)
      .eq('bunch', bunch)
      .limit(1);

    if (error) {
      console.error('Failed to fetch question count:', error);
      setLoading(false);
      return;
    }

    setQuestionCount(count || 0);
    
    // Get visibility status from first question
    if (data && data.length > 0) {
      setIsVisible(data[0].visible);
    }
    
    setLoading(false);
  };

  const handleStartQuiz = () => {
    navigate(
      `/quiz?category=${encodeURIComponent(category!)}&section=${encodeURIComponent(section!)}&bunch=${encodeURIComponent(bunch!)}`
    );
  };

  const handleAddQuestion = (method: 'manual' | 'bulk' | 'image') => {
    const params = new URLSearchParams({
      category: category!,
      section: section!,
      bunch: bunch!,
    });

    if (method === 'manual') {
      navigate(`/add-question?${params.toString()}`);
    } else if (method === 'bulk') {
      navigate(`/bulk-upload?${params.toString()}`);
    } else if (method === 'image') {
      navigate(`/image-upload?${params.toString()}`);
    }
  };

  const handleDeleteBunch = async () => {
    if (!category || !section || !bunch) return;

    setDeleting(true);

    try {
      // Delete all questions in this bunch
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('category', category)
        .eq('section', section)
        .eq('bunch', bunch);

      if (error) {
        console.error('Failed to delete bunch:', error);
        toast.error('Failed to delete bunch');
        setDeleting(false);
        return;
      }

      toast.success(`Bunch "${bunch}" deleted successfully`);
      
      // Navigate back to section selection
      navigate(`/section-selection?category=${encodeURIComponent(category)}&section=${encodeURIComponent(section)}`);
    } catch (error) {
      console.error('Error deleting bunch:', error);
      toast.error('Failed to delete bunch');
      setDeleting(false);
    }
  };

  const handleToggleVisibility = async () => {
    if (!category || !section || !bunch) return;

    setToggling(true);

    try {
      const newVisibility = !isVisible;
      
      // Update all questions in this bunch
      const { error } = await supabase
        .from('questions')
        .update({ visible: newVisibility })
        .eq('category', category)
        .eq('section', section)
        .eq('bunch', bunch);

      if (error) {
        console.error('Failed to toggle visibility:', error);
        toast.error('Failed to update visibility');
        setToggling(false);
        return;
      }

      setIsVisible(newVisibility);
      toast.success(`Bunch ${newVisibility ? 'shown' : 'hidden'} successfully`);
      setToggling(false);
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast.error('Failed to update visibility');
      setToggling(false);
    }
  };

  if (!category || !section || !bunch) return null;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex-1 p-6 md:p-12 bg-[#13111161] bg-none">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="space-y-4">
            <Button
              variant="ghost"
              onClick={() =>
                navigate(`/section-selection?category=${encodeURIComponent(category)}&section=${encodeURIComponent(section)}`)
              }
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Bunches
            </Button>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-semibold text-balance">{bunch}</h1>
                  {profile?.role === 'admin' && !loading && (
                    <Badge variant={isVisible ? 'default' : 'secondary'}>
                      {isVisible ? 'Visible' : 'Hidden'}
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-pretty">
                  {category} · {section}
                </p>
                {!loading && (
                  <p className="text-sm text-muted-foreground">
                    {questionCount} {questionCount === 1 ? 'question' : 'questions'}
                  </p>
                )}
              </div>
              
              {/* Admin Actions */}
              {profile?.role === 'admin' && (
                <div className="flex shrink-0 gap-2">
                  {/* Toggle Visibility Button */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleToggleVisibility}
                    disabled={toggling}
                    title={isVisible ? 'Hide this test from users' : 'Show this test to users'}
                  >
                    {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  
                  {/* Delete Button */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive hover:text-destructive-foreground">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Bunch</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the bunch "{bunch}"? This will permanently delete all {questionCount} {questionCount === 1 ? 'question' : 'questions'} in this bunch. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteBunch}
                          disabled={deleting}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deleting ? 'Deleting...' : 'Delete Bunch'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground">Loading...</p>
          ) : (
            <div className="space-y-6">
              {/* Start Quiz Card */}
              {questionCount > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-balance">Start Quiz</CardTitle>
                    <CardDescription>30 seconds per question · randomized</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={handleStartQuiz} className="w-full gap-2">
                      <Play className="h-4 w-4" />
                      Start Quiz
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Add Questions Card - Admin Only */}
              {profile?.role === 'admin' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-balance">Add Questions</CardTitle>
                    <CardDescription>Choose a method to add questions to this bunch</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      variant="outline"
                      onClick={() => handleAddQuestion('manual')}
                      className="h-auto w-full flex-col gap-2 py-4"
                    >
                      <FileEdit className="h-5 w-5" />
                      <div className="text-center">
                        <p className="font-medium">Add question manually</p>
                        <p className="text-xs text-muted-foreground">Type a question and mark the correct answers</p>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => handleAddQuestion('bulk')}
                      className="h-auto w-full flex-col gap-2 py-4"
                    >
                      <Upload className="h-5 w-5" />
                      <div className="text-center">
                        <p className="font-medium">Upload TXT or PDF</p>
                        <p className="text-xs text-muted-foreground">Bulk-import questions in the strict format</p>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => handleAddQuestion('image')}
                      className="h-auto w-full flex-col gap-2 py-4"
                    >
                      <ImageIcon className="h-5 w-5" />
                      <div className="text-center">
                        <p className="font-medium">Add image-based question</p>
                        <p className="text-xs text-muted-foreground">Same form as Add, with image fields ready to use</p>
                      </div>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
