import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface RouteGuardProps {
  children: React.ReactNode;
}

const PUBLIC_ROUTES = ['/', '/login', '/signup'];

export default function RouteGuard({ children }: RouteGuardProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Wait for auth to load
    if (loading) return;

    const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);

    // If not logged in and trying to access protected route, redirect to login
    if (!user && !isPublicRoute) {
      navigate('/login', { replace: true });
    }

    // If logged in and on root or login/signup page, redirect to dashboard
    if (user && (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/signup')) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, location.pathname, navigate]);

  // Show nothing while loading
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Show nothing if redirecting
  const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);
  if (!user && !isPublicRoute) {
    return null;
  }

  return <>{children}</>;
}
