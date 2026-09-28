import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
// @ts-ignore
import { supabase } from '@/db/supabase';
import type { User } from '@supabase/supabase-js';
// @ts-ignore
import type { Profile } from '@/types/types';
import { toast } from 'sonner';

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('获取用户信息失败:', error);
    return null;
  }
  return data;
}
interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signInWithUsername: (username: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithUsername: (username: string, password: string, email?: string, fullName?: string, mobileNumber?: string, dateOfBirth?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  // Tracks the currently authenticated user ID so refreshProfile is never stale
  const userIdRef = useRef<string | null>(null);

  // Refresh profile data from database
  const refreshProfile = async () => {
    const uid = userIdRef.current;
    if (!uid) { setProfile(null); return; }
    const profileData = await getProfile(uid);
    setProfile(profileData);
  };

  useEffect(() => {
    // `initialized` prevents the INITIAL_SESSION event from onAuthStateChange
    // from firing a second getProfile call that duplicates the getSession fetch.
    let initialized = false;

    supabase.auth
      .getSession()
      .then(({ data: { session } }: { data: { session: { user: { id: string } } | null } }) => {
        initialized = true;
        const u = session?.user ?? null;
        userIdRef.current = u?.id ?? null;
        setUser(u as User | null);
        if (u) {
          getProfile(u.id).then((p) => {
            setProfile(p);
            setLoading(false);
          });
        } else {
          setLoading(false);
        }
      })
      .catch((error: Error) => {
        initialized = true;
        setLoading(false);
        toast.error(`Session error: ${error.message}`);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: { user: { id: string } } | null) => {
      // Skip the synthetic INITIAL_SESSION — getSession already handled it
      if (!initialized) return;
      const u = session?.user ?? null;
      userIdRef.current = u?.id ?? null;
      setUser(u as User | null);
      if (u) {
        getProfile(u.id).then(setProfile);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithUsername = async (username: string, password: string) => {
    try {
      // Step 1: resolve the real auth email for this username via a
      // SECURITY DEFINER function (bypasses RLS for unauthenticated callers).
      let email: string;
      const { data: lookedUpEmail, error: rpcError } = await supabase.rpc(
        'get_email_by_username',
        { p_username: username.trim() }
      );

      if (rpcError || !lookedUpEmail) {
        // Fallback: constructed email used for accounts registered without
        // a custom email (the silent majority).
        email = `${username.trim()}@miaoda.com`;
      } else {
        email = lookedUpEmail as string;
      }

      // Step 2: sign in with the resolved email + password
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUpWithUsername = async (username: string, password: string, email?: string, fullName?: string, mobileNumber?: string, dateOfBirth?: string) => {
    try {
      const finalEmail = email || `${username}@miaoda.com`;

      // Check mobile uniqueness before creating auth user
      if (mobileNumber) {
        const { data: existingMobile } = await supabase
          .from('profiles')
          .select('id')
          .eq('mobile_number', mobileNumber)
          .maybeSingle();
        if (existingMobile) {
          return { error: new Error('This mobile number is already registered.') };
        }
      }
      
      const { data, error } = await supabase.auth.signUp({
        email: finalEmail,
        password,
      });

      if (error) {
        console.error('Signup error:', error);
        throw error;
      }

      if (data.user) {
        // Upsert instead of update — handles the case where the DB trigger
        // hasn't run yet by retrying once after a short wait.
        const tryUpdate = async (attempt: number): Promise<void> => {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              username,
              temporary_password: password,
              full_name: fullName || null,
              mobile_number: mobileNumber || null,
              date_of_birth: dateOfBirth || null,
            })
            .eq('id', data.user!.id);

          if (updateError) {
            if (attempt < 3) {
              // Profile trigger may not have run yet — retry with backoff
              await new Promise(r => setTimeout(r, 400 * attempt));
              return tryUpdate(attempt + 1);
            }
            throw new Error(`Database error saving new user: ${updateError.message}`);
          }
        };
        await tryUpdate(1);
      }
      
      return { error: null };
    } catch (error) {
      console.error('SignUp failed:', error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithUsername, signUpWithUsername, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
