import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { parseTxtQuestions } from '@/utils/txtParser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Category, Section } from '@/types/types';

const categories: Category[] = ['Appendix 2A', 'Appendix 3A', 'LDCE', 'Chapter Wise Questions'];
const sections: Section[] = ['Expenditure', 'Establishment', 'Stores', 'Books & Budget', 'Traffic', 'General'];

export default function BulkUploadPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  
  const [category, setCategory] = useState<Category | ''>(searchParams.get('category') as Category || '');
  const [section, setSection] = useState<Section | ''>(searchParams.get('section') as Section || '');
  const [bunch, setBunch] = useState(searchParams.get('bunch') || '');
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<{ valid: number; invalid: number } | null>(null);
  const [errors, setErrors] = useState<{ block: string; reason: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const handleCategoryChange = (val: Category) => {
    setCategory(val);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.txt')) {
        toast.error('Please select a .txt file');
        return;
      }
      setFile(selectedFile);
      setParseResult(null);
      setErrors([]);
    }
  };

  const handleParse = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setLoading(true);

    try {
      const content = await file.text();
      const result = parseTxtQuestions(content);

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
    } catch (error) {
      toast.error('Failed to parse file');
    }

    setLoading(false);
  };

  const handleUpload = async () => {
    if (!category || !section) {
      toast.error('Please select category and section');
      return;
    }

    if (!bunch.trim()) {
      toast.error('Please enter a bunch name');
      return;
    }

    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setLoading(true);

    try {
      const content = await file.text();
      const result = parseTxtQuestions(content);

      if (result.valid.length === 0) {
        toast.error('No valid questions to upload');
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
        toast.error('Failed to upload questions');
        setLoading(false);
        return;
      }

      toast.success(`Successfully uploaded ${result.valid.length} questions!`);
      
      // Reset form
      setFile(null);
      setParseResult(null);
      setErrors([]);
      
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      toast.error('Failed to upload questions');
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <div className="flex-1 p-6 md:p-12">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-balance">Bulk Upload Questions</h1>
            <p className="text-muted-foreground text-pretty">Upload multiple questions from a TXT file</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Upload Configuration</CardTitle>
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
                  <li>• Question numbering (1), 2), etc.) is optional and will be removed</li>
                  <li>• Multi-line questions supported (e.g., English + Hindi)</li>
                  <li>• Minimum 2 options, at least 1 correct answer required</li>
                </ul>
                <p className="mt-3 text-sm">
                  <strong>Example 1 (Simple):</strong>
                </p>
                <pre className="mt-2 overflow-x-auto rounded bg-muted p-3 text-xs">
{`Which animal lives in water?
-Cat
-Dog
*Fish
-Horse
> Fish are aquatic animals.`}
                </pre>
                <p className="mt-3 text-sm">
                  <strong>Example 2 (With numbering & bilingual):</strong>
                </p>
                <pre className="mt-2 overflow-x-auto rounded bg-muted p-3 text-xs">
{`1) SSS stands for __________
SSS का अर्थ __________ है
- Single Standard Service
* Similar Single Service
- Specific Single Service

2) GFR stands for _______________
जीएफआर का अर्थ _______________ है
* General Financial Rules
- Government Financial Rules`}
                </pre>
              </div>

              {/* Category and Section */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={(val) => handleCategoryChange(val as Category)}>
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

              {/* File Upload */}
              <div className="space-y-2">
                <Label>TXT File</Label>
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="file-input"
                    className="flex h-10 flex-1 cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-border px-4 hover:border-primary"
                  >
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {file ? file.name : 'Choose a TXT file'}
                    </span>
                  </label>
                  <input
                    id="file-input"
                    type="file"
                    accept=".txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button type="button" variant="outline" onClick={handleParse} disabled={!file || loading}>
                    Parse
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
                  onClick={handleUpload}
                  disabled={!file || !category || !section || !bunch.trim() || loading || parseResult?.valid === 0}
                  className="flex-1"
                >
                  {loading ? 'Uploading...' : 'Upload Questions'}
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
                TXT Format Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Rules:</p>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  <li>Questions separated by exactly ONE empty line</li>
                  <li>Question text can be multi-line (no blank lines within)</li>
                  <li>Options start with * (correct) or - (wrong)</li>
                  <li>All options must be continuous (no blank lines between)</li>
                  <li>Explanation is optional, starts with &gt;</li>
                  <li>Explanation must come immediately after options</li>
                </ul>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <p className="mb-2 text-sm font-medium">Example:</p>
                <pre className="text-xs">
{`Which animals can fly?
*Pigeon
-Dog
*Eagle

> Birds have wings and can fly.

What color is the sky?
-Red
*Blue
-Green`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
