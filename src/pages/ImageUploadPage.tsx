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
import { Progress } from '@/components/ui/progress';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Category, Section } from '@/types/types';

const categories: Category[] = ['Appendix 2A', 'Appendix 3A', 'LDCE', 'Chapter Wise Questions'];
const sections: Section[] = ['Expenditure', 'Establishment', 'Stores', 'Books & Budget', 'Traffic', 'General'];

const MAX_FILE_SIZE = 1024 * 1024; // 1MB

export default function ImageUploadPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  
  const [category, setCategory] = useState<Category | ''>(searchParams.get('category') as Category || '');
  const [section, setSection] = useState<Section | ''>(searchParams.get('section') as Section || '');
  const [bunch, setBunch] = useState(searchParams.get('bunch') || '');
  const [question, setQuestion] = useState('');
  const [questionImage, setQuestionImage] = useState<File | null>(null);
  const [questionImagePreview, setQuestionImagePreview] = useState<string>('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [correctAnswers, setCorrectAnswers] = useState<number[]>([]);
  const [explanation, setExplanation] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Resize to max 1080p
          const maxDimension = 1080;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Convert to WEBP with quality 0.8
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
                  type: 'image/webp',
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Compression failed'));
              }
            },
            'image/webp',
            0.8
          );
        };
      };
      reader.onerror = reject;
    });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate filename (only English letters and numbers)
    const filename = file.name.replace(/\.[^/.]+$/, '');
    if (!/^[a-zA-Z0-9_-]+$/.test(filename)) {
      toast.error('Filename must contain only English letters and numbers');
      return;
    }

    let processedFile = file;

    // Compress if larger than 1MB
    if (file.size > MAX_FILE_SIZE) {
      toast.info('Compressing image...');
      try {
        processedFile = await compressImage(file);
        toast.success(`Image compressed to ${(processedFile.size / 1024).toFixed(0)}KB`);
      } catch (error) {
        toast.error('Failed to compress image');
        return;
      }
    }

    setQuestionImage(processedFile);
    setQuestionImagePreview(URL.createObjectURL(processedFile));
  };

  const handleRemoveImage = () => {
    setQuestionImage(null);
    setQuestionImagePreview('');
    const fileInput = document.getElementById('question-image-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
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

  const uploadImageToStorage = async (file: File): Promise<string> => {
    const filename = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage.from('question-images').upload(filename, file);

    if (error) throw error;

    const { data: urlData } = supabase.storage.from('question-images').getPublicUrl(data.path);
    return urlData.publicUrl;
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
    setUploadProgress(0);

    try {
      let questionImageUrl: string | undefined;

      // Upload question image if provided
      if (questionImage) {
        setUploadProgress(30);
        questionImageUrl = await uploadImageToStorage(questionImage);
        setUploadProgress(60);
      }

      // Insert question
      const { error } = await supabase.from('questions').insert({
        category,
        section,
        bunch: bunch.trim(),
        question: question.trim(),
        options: options.map((opt) => opt.trim()),
        correct: correctAnswers.sort((a, b) => a - b),
        explanation: explanation.trim() || null,
        question_image_url: questionImageUrl,
        created_by: user?.id,
      });

      if (error) throw error;

      setUploadProgress(100);
      toast.success('Question with image added successfully!');

      // Reset form
      setQuestion('');
      setQuestionImage(null);
      setQuestionImagePreview('');
      setOptions(['', '']);
      setCorrectAnswers([]);
      setExplanation('');
      setUploadProgress(0);
    } catch (error) {
      toast.error('Failed to add question');
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <div className="flex-1 p-6 md:p-12">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-balance">Add Image Question</h1>
            <p className="text-muted-foreground text-pretty">Create a question with image support</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Question Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
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

                {/* Question Text */}
                <div className="space-y-2">
                  <Label>Question</Label>
                  <Textarea
                    placeholder="Enter your question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    rows={3}
                    className="px-3"
                  />
                </div>

                {/* Question Image */}
                <div className="space-y-2">
                  <Label>Question Image (Optional)</Label>
                  {questionImagePreview ? (
                    <div className="relative">
                      <img src={questionImagePreview} alt="Question" className="w-full rounded-lg border" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute right-2 top-2"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label
                      htmlFor="question-image-input"
                      className="flex h-32 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border hover:border-primary"
                    >
                      <div className="text-center">
                        <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">Click to upload image</p>
                        <p className="text-xs text-muted-foreground">Max 1MB, auto-compressed</p>
                      </div>
                    </label>
                  )}
                  <input
                    id="question-image-input"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>

                {/* Options */}
                <div className="space-y-4">
                  <Label>Options</Label>
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
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">Check the box to mark correct answer(s)</p>
                </div>

                {/* Explanation */}
                <div className="space-y-2">
                  <Label>Explanation (Optional)</Label>
                  <Textarea
                    placeholder="Provide an explanation"
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    rows={3}
                    className="px-3"
                  />
                </div>

                {/* Upload Progress */}
                {loading && uploadProgress > 0 && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} />
                    <p className="text-center text-sm text-muted-foreground">Uploading... {uploadProgress}%</p>
                  </div>
                )}

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
