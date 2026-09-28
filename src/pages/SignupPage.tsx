import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

// Field helper — defined at module level to prevent re-mount on every render
function Field({ id, label, required, children, error }: {
  id: string; label: string; required?: boolean; children: React.ReactNode; error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [mobile, setMobile] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  // Field-level errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signUpWithUsername, signInWithUsername } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'Full Name is required.';
    if (!username.trim()) errs.username = 'Username is required.';
    else if (!/^[a-zA-Z0-9_]+$/.test(username)) errs.username = 'Only letters, numbers, and underscores allowed.';
    if (!mobile.trim()) errs.mobile = 'Mobile Number is required.';
    else if (!/^\d{10}$/.test(mobile)) errs.mobile = 'Enter a valid 10-digit Indian mobile number.';
    if (!dob) errs.dob = 'Please select your Date of Birth.';
    if (!password) errs.password = 'Password is required.';
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters.';
    if (!confirmPassword) errs.confirmPassword = 'Please confirm your password.';
    else if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    if (!agreedToTerms) errs.terms = 'Please agree to the User Agreement and Privacy Policy.';
    return errs;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);

    const { error } = await signUpWithUsername(
      username,
      password,
      email || undefined,
      fullName,
      mobile,
      dob,
    );

    if (error) {
      const msg = error.message;
      if (msg.includes('mobile number')) {
        setErrors((prev) => ({ ...prev, mobile: msg }));
      } else {
        toast.error(msg);
      }
      setLoading(false);
      return;
    }

    toast.success('Account created! Waiting for admin approval.');

    const { error: loginError } = await signInWithUsername(username, password);
    if (loginError) {
      navigate('/login');
    } else {
      navigate('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-semibold text-balance">Create Account</CardTitle>
          <CardDescription className="text-pretty">Sign up to start taking quizzes</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-5">

            {/* Full Name */}
            <Field id="fullName" label="Full Name" required error={errors.fullName}>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                className="px-3"
              />
            </Field>

            {/* Username */}
            <Field id="username" label="Username" required error={errors.username}>
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className="px-3"
              />
              {!errors.username && (
                <p className="text-xs text-muted-foreground">Letters, numbers, and underscores only</p>
              )}
            </Field>

            {/* Mobile Number */}
            <Field id="mobile" label="Mobile Number" required error={errors.mobile}>
              <Input
                id="mobile"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                disabled={loading}
                className="px-3"
              />
              {!errors.mobile && (
                <p className="text-xs text-muted-foreground">10-digit Indian mobile number, must be unique</p>
              )}
            </Field>

            {/* Date of Birth */}
            <Field id="dob" label="Date of Birth" required error={errors.dob}>
              <Input
                id="dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                disabled={loading}
                className="px-3"
                max={new Date().toISOString().split('T')[0]}
              />
            </Field>

            {/* Email (optional) */}
            <Field id="email" label="Email (Optional)">
              <Input
                id="email"
                type="email"
                placeholder="Enter email (optional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="px-3"
              />
            </Field>

            {/* Password */}
            <Field id="password" label="Password" required error={errors.password}>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="px-3"
              />
            </Field>

            {/* Confirm Password */}
            <Field id="confirmPassword" label="Confirm Password" required error={errors.confirmPassword}>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className="px-3"
              />
            </Field>

            {/* Terms */}
            <div className="space-y-1">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                  disabled={loading}
                />
                <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                  I agree to the User Agreement and Privacy Policy
                </Label>
              </div>
              {errors.terms && <p className="text-xs text-destructive pl-6">{errors.terms}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating Account…' : 'Sign Up'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
