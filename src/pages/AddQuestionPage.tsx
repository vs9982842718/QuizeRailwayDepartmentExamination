import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Category, Section } from '@/types/types';

const categories: Category[] = ['Appendix 2A', 'Appendix 3A', 'LDCE', 'Chapter Wise Questions'];
const sections: Section[] = ['Expenditure', 'Establishment', 'Stores', 'Books & Budget', 'Traffic', 'General'];

export default function AddQuestionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  
  const [category, setCategory] = useState<Category | ''>(searchParams.get('category') as Category || '');
  const [section, setSection] = useState<Section | ''>(searchParams.get('section') as Section || '');
  const [bunch, setBunch] = useState(searchParams.get('bunch') || '');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [correctAnswers, setCorrectAnswers] = useState<number[]>([]);
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCategoryChange = (val: Category) => {
    setCategory(val);
  };

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      toast.error('Minimum 2 options required');
      return;
    }
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    // Remove from correct answers if it was selected
    setCorrectAnswers(correctAnswers.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i)));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCorrectToggle = (index: number) => {
    if (correctAnswers.includes(index)) {
      setCorrectAnswers(correctAnswers.filter((i) => i !== index));
    } else {
      setCorrectAnswers([...correctAnswers, index]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!category || !section) {
      toast.error('Please select category and section');
      return;
    }

    if (!bunch.trim()) {
      toast.error('Please enter a bunch name');
      return;
    }

    if (!question.trim()) {
      toast.error('Please enter a question');
      return;
    }

    if (options.some((opt) => !opt.trim())) {
      toast.error('All options must be filled');
      return;
    }

    if (correctAnswers.length === 0) {
      toast.error('Please mark at least one correct answer');
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('questions').insert({
      category,
      section,
      bunch: bunch.trim(),
      question: question.trim(),
      options: options.map((opt) => opt.trim()),
      correct: correctAnswers.sort((a, b) => a - b),
      explanation: explanation.trim() || null,
      created_by: user?.id,
    });

    if (error) {
      toast.error('Failed to add question');
      setLoading(false);
      return;
    }

    toast.success('Question added successfully!');
    
    // Reset form
    setQuestion('');
    setOptions(['', '']);
    setCorrectAnswers([]);
    setExplanation('');
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <div className="flex-1 p-6 md:p-12">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-balance">Add Question</h1>
            <p className="text-muted-foreground text-pretty">Create a new quiz question manually</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Question Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Category Selection */}
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

                {/* Section Selection */}
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

                {/* Question Text */}
                <div className="space-y-2">
                  <Label>Question</Label>
                  <Textarea
                    placeholder="Enter your question (multi-line supported)"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    rows={4}
                    className="px-3"
                  />
                </div>

                {/* Options */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Options</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddOption} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Option
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {options.map((option, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <Checkbox
                          checked={correctAnswers.includes(index)}
                          onCheckedChange={() => handleCorrectToggle(index)}
                          className="mt-3"
                        />
                        <div className="flex-1">
                          <Input
                            placeholder={`Option ${index + 1}`}
                            value={option}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                            className="px-3"
                          />
                        </div>
                        {options.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveOption(index)}
                            className="mt-1"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">Check the box to mark correct answer(s)</p>
                </div>

                {/* Explanation */}
                <div className="space-y-2">
                  <Label>Explanation (Optional)</Label>
                  <Textarea
                    placeholder="Provide an explanation for the correct answer"
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    rows={3}
                    className="px-3"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Adding...' : 'Add Question'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
