import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { parseTxtQuestions } from '@/utils/txtParser';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Category, Section } from '@/types/types';

const categories: Category[] = ['Appendix 2A', 'Appendix 3A', 'LDCE', 'Chapter Wise Questions'];
const sections: Section[] = ['Expenditure', 'Establishment', 'Stores', 'Books & Budget', 'Traffic', 'General'];

export default function PdfImportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  
  const [category, setCategory] = useState<Category | ''>(searchParams.get('category') as Category || '');
  const [section, setSection] = useState<Section | ''>(searchParams.get('section') as Section || '');
  const [bunch, setBunch] = useState(searchParams.get('bunch') || '');
  const [extractedText, setExtractedText] = useState('');
  const [parseResult, setParseResult] = useState<{ valid: number; invalid: number } | null>(null);
  const [errors, setErrors] = useState<{ block: string; reason: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const handleParse = () => {
    if (!extractedText.trim()) {
      toast.error('Please paste extracted text');
      return;
    }

    const result = parseTxtQuestions(extractedText);

    setParseResult({
      valid: result.valid.length,
      invalid: result.invalid.length,
    });
    setErrors(result.invalid);

    if (result.valid.length === 0) {
      toast.error('No valid questions found');
    } else {
      toast.success(`Parsed ${result.valid.length} valid questions`);
    }
  };

  const handleImport = async () => {
    if (!category || !section) {
      toast.error('Please select category and section');
      return;
    }

    if (!bunch.trim()) {
      toast.error('Please enter a bunch name');
      return;
    }

    if (!extractedText.trim()) {
      toast.error('Please paste extracted text');
      return;
    }

    setLoading(true);

    try {
      const result = parseTxtQuestions(extractedText);

      if (result.valid.length === 0) {
        toast.error('No valid questions to import');
        setLoading(false);
        return;
      }

      // Insert all valid questions
      const questionsToInsert = result.valid.map((q) => ({
        category,
        section,
        bunch: bunch.trim(),
        question: q.question,
        options: q.options,
        correct: q.correct,
        explanation: q.explanation || null,
        created_by: user?.id,
      }));

      const { error } = await supabase.from('questions').insert(questionsToInsert);

      if (error) {
        toast.error('Failed to import questions');
        setLoading(false);
        return;
      }

      toast.success(`Successfully imported ${result.valid.length} questions!`);

      // Reset form
      setExtractedText('');
      setParseResult(null);
      setErrors([]);
    } catch (error) {
      toast.error('Failed to import questions');
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <div className="flex-1 p-6 md:p-12">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-balance">PDF Import</h1>
            <p className="text-muted-foreground text-pretty">
              Extract text from PDF and import questions
            </p>
          </div>

          <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
            <CardHeader>
              <CardTitle className="text-base">How to Use</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>1. Open your PDF file in a PDF reader</p>
              <p>2. Select and copy the text content</p>
              <p>3. Paste the text in the text area below</p>
              <p>4. The text should follow the TXT format rules</p>
              <p>5. Click Parse to validate, then Import to save</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Import Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Format Guide */}
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <h3 className="mb-2 font-medium">TXT Format Requirements</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Questions separated by ONE empty line</li>
                  <li>• Correct answers marked with <code className="rounded bg-muted px-1">*</code></li>
                  <li>• Wrong answers marked with <code className="rounded bg-muted px-1">-</code></li>
                  <li>• Explanation (optional) marked with <code className="rounded bg-muted px-1">&gt;</code></li>
                  <li>• Minimum 2 options, at least 1 correct answer required</li>
                </ul>
              </div>

              {/* Category and Section */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={(val) => setCategory(val as Category)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
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
                  <Select value={section} onValueChange={(val) => setSection(val as Section)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((sec) => (
                        <SelectItem key={sec} value={sec}>
                          {sec}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Bunch Name */}
              <div className="space-y-2">
                <Label>Bunch Name</Label>
                <Input
                  placeholder="e.g., Starter Set, Advanced Topics"
                  value={bunch}
                  onChange={(e) => setBunch(e.target.value)}
                  className="px-3"
                />
              </div>

              {/* Extracted Text */}
              <div className="space-y-2">
                <Label>Paste Extracted Text from PDF</Label>
                <Textarea
                  placeholder="Paste the text content from your PDF here..."
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                  rows={12}
                  className="px-3 font-mono text-sm"
                />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handleParse} disabled={!extractedText.trim()}>
                    Parse Text
                  </Button>
                </div>
              </div>

              {/* Parse Result */}
              {parseResult && (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
                      <CardContent className="flex items-center gap-3 p-4">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">Valid Questions</p>
                          <p className="text-2xl font-semibold">{parseResult.valid}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
                      <CardContent className="flex items-center gap-3 p-4">
                        <XCircle className="h-8 w-8 text-red-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">Invalid Questions</p>
                          <p className="text-2xl font-semibold">{parseResult.invalid}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Error Details */}
                  {errors.length > 0 && (
                    <Card className="border-destructive/50">
                      <CardHeader>
                        <CardTitle className="text-base">Parsing Errors</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="max-h-64 space-y-3 overflow-y-auto">
                          {errors.map((error, index) => (
                            <div key={index} className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                              <p className="text-sm font-medium text-destructive">{error.reason}</p>
                              <p className="mt-1 text-xs text-muted-foreground">{error.block}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={handleImport}
                  disabled={!extractedText.trim() || !category || !section || !bunch.trim() || loading || parseResult?.valid === 0}
                  className="flex-1"
                >
                  {loading ? 'Importing...' : 'Import Questions'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Format Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Text Format Requirements
              </CardTitle>
              <CardDescription>The extracted text must follow these rules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  <li>Questions separated by exactly ONE empty line</li>
                  <li>Question text can be multi-line (no blank lines within)</li>
                  <li>Options start with * (correct) or - (wrong)</li>
                  <li>All options must be continuous (no blank lines between)</li>
                  <li>Explanation is optional, starts with &gt;</li>
                </ul>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <p className="mb-2 text-sm font-medium">Example:</p>
                <pre className="text-xs">
{`What is the capital of France?
-London
*Paris
-Berlin
-Madrid

> Paris is the capital and largest city of France.`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
