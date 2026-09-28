import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithUsername } = useAuth();
  const navigate = useNavigate();

  // Password reset request dialog state
  const [resetOpen, setResetOpen] = useState(false);
  const [resetFullName, setResetFullName] = useState('');
  const [resetMobile, setResetMobile] = useState('');
  const [resetDob, setResetDob] = useState('');
  const [resetUsername, setResetUsername] = useState('');
  const [resetErrors, setResetErrors] = useState<Record<string, string>>({});
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    const { error } = await signInWithUsername(username, password);
    if (error) {
      toast.error('Invalid username or password');
      setLoading(false);
      return;
    }
    toast.success('Login successful!');
    navigate('/dashboard');
    setLoading(false);
  };

  const validateReset = () => {
    const errs: Record<string, string> = {};
    if (!resetFullName.trim()) errs.fullName = 'Full Name is required.';
    if (!resetMobile.trim()) errs.mobile = 'Mobile Number is required.';
    else if (!/^\d{10}$/.test(resetMobile)) errs.mobile = 'Enter a valid 10-digit mobile number.';
    if (!resetDob) errs.dob = 'Date of Birth is required.';
    return errs;
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateReset();
    setResetErrors(errs);
    if (Object.keys(errs).length > 0) return;

    // Prevent duplicate pending request from same mobile
    const { data: existing } = await supabase
      .from('password_reset_requests')
      .select('id')
      .eq('mobile_number', resetMobile)
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) {
      setResetErrors({ mobile: 'A pending request already exists for this mobile number.' });
      return;
    }

    setResetSubmitting(true);
    const { error } = await supabase.from('password_reset_requests').insert({
      full_name: resetFullName.trim(),
      mobile_number: resetMobile.trim(),
      date_of_birth: resetDob,
      username: resetUsername.trim() || null,
      status: 'pending',
    });

    if (error) {
      toast.error('Failed to submit request. Please try again.');
      setResetSubmitting(false);
      return;
    }

    setResetSuccess(true);
    setResetSubmitting(false);
  };

  const closeResetDialog = () => {
    setResetOpen(false);
    setResetFullName('');
    setResetMobile('');
    setResetDob('');
    setResetUsername('');
    setResetErrors({});
    setResetSuccess(false);
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-semibold text-balance">Welcome Back</CardTitle>
          <CardDescription className="text-pretty">Login to continue your quiz journey</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className="px-3"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="px-3"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in…' : 'Login'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setResetOpen(true)}
                className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                Submit a Password Reset Request
              </button>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <a href="/signup" className="text-primary hover:underline font-medium">
                Sign Up
              </a>
            </p>
          </form>
        </CardContent>
      </Card>

      {/* ── Password Reset Request Dialog ──────────────────────────────── */}
      <Dialog open={resetOpen} onOpenChange={(o) => { if (!o) closeResetDialog(); else setResetOpen(true); }}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader>
            <DialogTitle>Password Reset Request</DialogTitle>
          </DialogHeader>

          {resetSuccess ? (
            <div className="space-y-4 py-2">
              <div className="rounded-xl border border-border bg-muted/40 p-5 text-sm text-foreground leading-relaxed text-pretty">
              Your password reset request has been submitted successfully. The Administrator will verify your details and reset your password if the information is correct. Your password and username will be sent to you on your WhatsApp.
              </div>
              <Button className="w-full" onClick={closeResetDialog}>Close</Button>
            </div>
          ) : (
            <form onSubmit={handleResetSubmit} className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground text-pretty">
                Provide your details below. The admin will verify and reset your password.
              </p>

              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="r-fullName">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="r-fullName"
                  placeholder="Your full name"
                  value={resetFullName}
                  onChange={(e) => setResetFullName(e.target.value)}
                  className="px-3"
                />
                {resetErrors.fullName && <p className="text-xs text-destructive">{resetErrors.fullName}</p>}
              </div>

              {/* Mobile */}
              <div className="space-y-1.5">
                <Label htmlFor="r-mobile">
                  Mobile Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="r-mobile"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={resetMobile}
                  onChange={(e) => setResetMobile(e.target.value.replace(/\D/g, ''))}
                  className="px-3"
                />
                {resetErrors.mobile && <p className="text-xs text-destructive">{resetErrors.mobile}</p>}
              </div>

              {/* DOB */}
              <div className="space-y-1.5">
                <Label htmlFor="r-dob">
                  Date of Birth <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="r-dob"
                  type="date"
                  value={resetDob}
                  onChange={(e) => setResetDob(e.target.value)}
                  className="px-3"
                  max={new Date().toISOString().split('T')[0]}
                />
                {resetErrors.dob && <p className="text-xs text-destructive">{resetErrors.dob}</p>}
              </div>

              {/* Username (optional) */}
              <div className="space-y-1.5">
                <Label htmlFor="r-username">Username (Optional)</Label>
                <Input
                  id="r-username"
                  placeholder="Your username (if remembered)"
                  value={resetUsername}
                  onChange={(e) => setResetUsername(e.target.value)}
                  className="px-3"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={closeResetDialog}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={resetSubmitting}>
                  {resetSubmitting ? 'Submitting…' : 'Submit Request'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
