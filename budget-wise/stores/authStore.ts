import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { Profile } from '../types/database';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { usePremiumStore } from './premiumStore';

interface User {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: string | null }>;
  completeOnboarding: () => Promise<{ error: string | null }>;
  clearError: () => void;
}

const mapSupabaseUser = (user: SupabaseUser | null): User | null => {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email || '',
    fullName: user.user_metadata?.full_name,
    avatarUrl: user.user_metadata?.avatar_url,
  };
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true, error: null });

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (session?.user) {
        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.warn('Error fetching profile:', profileError);
        }

        set({
          user: mapSupabaseUser(session.user),
          profile: profile || null,
          session,
          isAuthenticated: true,
          isLoading: false,
        });

        // Inizializza Premium/RevenueCat
        try {
          await usePremiumStore.getState().initialize(session.user.id);
        } catch (error) {
          console.warn('Error initializing premium:', error);
        }
      } else {
        set({
          user: null,
          profile: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }

      // Set up auth state listener
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          set({
            user: mapSupabaseUser(session.user),
            profile: profile || null,
            session,
            isAuthenticated: true,
          });
        } else if (event === 'SIGNED_OUT') {
          set({
            user: null,
            profile: null,
            session: null,
            isAuthenticated: false,
          });
        } else if (event === 'TOKEN_REFRESHED' && session) {
          set({ session });
        }
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({
        user: null,
        profile: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Failed to initialize authentication',
      });
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        set({ isLoading: false, error: error.message });
        return { error: error.message };
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        set({
          user: mapSupabaseUser(data.user),
          profile: profile || null,
          session: data.session,
          isAuthenticated: true,
          isLoading: false,
        });

        // Inizializza Premium/RevenueCat
        try {
          await usePremiumStore.getState().initialize(data.user.id);
        } catch (error) {
          console.warn('Error initializing premium:', error);
        }
      }

      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed';
      set({ isLoading: false, error: message });
      return { error: message };
    }
  },

  signUp: async (email: string, password: string, fullName?: string) => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: 'budgetwise://auth/callback',
        },
      });

      if (error) {
        set({ isLoading: false, error: error.message });
        return { error: error.message };
      }

      if (data.user) {
        // Create profile for new user with onboarding_completed: false
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            full_name: fullName || null,
            main_currency: 'EUR',
            onboarding_completed: false,
          });

        if (profileError) {
          console.warn('Error creating profile:', profileError);
        }

        // Fetch the created profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        set({
          user: mapSupabaseUser(data.user),
          profile: profile || null,
          session: data.session,
          isAuthenticated: !!data.session,
          isLoading: false,
        });
      }

      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign up failed';
      set({ isLoading: false, error: message });
      return { error: message };
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true });

      // Logout da RevenueCat
      try {
        await usePremiumStore.getState().logout();
      } catch (error) {
        console.warn('Error logging out from premium:', error);
      }

      await supabase.auth.signOut();
      set({
        user: null,
        profile: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Sign out error:', error);
      set({ isLoading: false });
    }
  },

  resetPassword: async (email: string) => {
    try {
      set({ isLoading: true, error: null });

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'budgetwise://auth/callback',
      });

      set({ isLoading: false });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password reset failed';
      set({ isLoading: false, error: message });
      return { error: message };
    }
  },

  updateProfile: async (updates: Partial<Profile>) => {
    try {
      const { user } = get();
      if (!user) {
        return { error: 'Not authenticated' };
      }

      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        set({ isLoading: false, error: error.message });
        return { error: error.message };
      }

      set({ profile: data, isLoading: false });
      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Profile update failed';
      set({ isLoading: false, error: message });
      return { error: message };
    }
  },

  completeOnboarding: async () => {
    try {
      const { user, profile } = get();
      if (!user) {
        return { error: 'Not authenticated' };
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      set({ profile: data });
      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to complete onboarding';
      return { error: message };
    }
  },

  clearError: () => set({ error: null }),
}));
