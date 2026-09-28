import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, BookOpen, HelpCircle, Mail, Phone, Edit, Save, X } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import type { HelpDeskInstructions } from '@/types/types';

export default function HelpDeskPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [instructions, setInstructions] = useState<HelpDeskInstructions | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInstructions();
  }, []);

  const loadInstructions = async () => {
    try {
      const { data, error } = await supabase
        .from('help_desk_instructions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setInstructions(data);
      if (data) setEditContent(data.content);
    } catch (error) {
      console.error('Error loading instructions:', error);
    }
  };

  const handleSave = async () => {
    if (!instructions) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('help_desk_instructions')
        .update({
          content: editContent,
          updated_by: profile?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', instructions.id);

      if (error) throw error;

      toast.success('Instructions updated successfully');
      setIsEditing(false);
      await loadInstructions();
    } catch (error) {
      console.error('Error updating instructions:', error);
      toast.error('Failed to update instructions');
    }
    setLoading(false);
  };

  const handleCancel = () => {
    setEditContent(instructions?.content || '');
    setIsEditing(false);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <div className="flex-1 space-y-6 p-4 md:p-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-balance">Help Desk</h1>
          <p className="text-muted-foreground text-pretty">
            Get help and support for using the Quiz Management System
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* General Help */}
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <HelpCircle className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-balance">Getting Started</CardTitle>
                  <CardDescription>Basic information for all users</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">How to Take a Quiz</h3>
                <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                  <li>Login with your username and password</li>
                  <li>Select a category from the dashboard</li>
                  <li>Choose a quiz to attempt</li>
                  <li>Answer all questions carefully</li>
                  <li>Submit to see your results</li>
                </ol>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Account Management</h3>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  <li>Update your profile from Settings</li>
                  <li>Change password anytime</li>
                  <li>View your quiz history</li>
                  <li>Track your progress</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Contact Support */}
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-balance">Contact Support</CardTitle>
                  <CardDescription>Need additional help?</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">Phone Support</p>
                    <p className="text-sm text-muted-foreground">Available Mon-Fri, 9 AM - 5 PM</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">Email Support</p>
                    <p className="text-sm text-muted-foreground">Response within 24 hours</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-sm font-semibold">Created by</p>
                <p className="text-base font-bold text-primary">
                  Vijay Sharma (Accountant/NWR)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Admin Instructions */}
          {isAdmin && (
            <>
              <Card className="h-full md:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-balance">Admin Instructions</CardTitle>
                        <CardDescription>Important guidelines for administrators</CardDescription>
                      </div>
                    </div>
                    {!isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="shrink-0"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[400px] font-mono text-sm"
                        placeholder="Enter admin instructions here..."
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSave}
                          disabled={loading}
                          size="sm"
                        >
                          <Save className="mr-2 h-4 w-4" />
                          {loading ? 'Saving...' : 'Save'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancel}
                          disabled={loading}
                          size="sm"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {instructions?.content || 'No instructions available. Click Edit to add instructions.'}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Regular users see read-only instructions */}
          {!isAdmin && instructions && (
            <Card className="h-full md:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <AlertCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-balance">Instructions</CardTitle>
                    <CardDescription>Important information from administrators</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {instructions.content}
                </div>
              </CardContent>
            </Card>
          )}

          {/* FAQ */}
          <Card className="h-full md:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-balance">Frequently Asked Questions</CardTitle>
                  <CardDescription>Common questions and answers</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Q: How do I reset my password?</h3>
                <p className="text-sm text-muted-foreground">
                  A: Go to Profile Settings and use the "Change Password" option. You'll need to enter your current password and new password.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Q: Can I retake a quiz?</h3>
                <p className="text-sm text-muted-foreground">
                  A: Yes, you can attempt any quiz multiple times. Your best score will be recorded.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Q: Why can't I see certain categories?</h3>
                <p className="text-sm text-muted-foreground">
                  A: Category visibility is controlled by administrators. Contact your admin if you need access to additional categories.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Q: How is my score calculated?</h3>
                <p className="text-sm text-muted-foreground">
                  A: Your score is calculated as (Correct Answers / Total Questions) × 100. Each question has equal weight.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
