'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Language, translations, TranslationKey } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

type UserRole = 'admin' | 'moderator' | 'user';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  default_currency?: string;
  email_notifications?: boolean;
}

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  darkMode: boolean;
  toggleDarkMode: () => void;
  user: User | null;
  userProfile: UserProfile | null;
  authLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  hasAccess: (page: string) => boolean;
  refreshProfile: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const ACCESS_MAP: Record<UserRole, string[]> = {
  admin: ['dashboard', 'orders', 'orderTracking', 'inventory', 'expenses', 'analytics', 'employees', 'users', 'settings'],
  moderator: ['dashboard', 'orders', 'orderTracking', 'inventory', 'expenses', 'employees', 'settings'],
  user: ['orders', 'orderTracking', 'inventory', 'expenses'],
};

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  const saved = localStorage.getItem('vuga-lang') as Language | null;
  if (saved === 'az' || saved === 'en') return saved;
  // Detect browser language on first visit
  const browserLang = navigator.language?.toLowerCase() || '';
  return browserLang.startsWith('az') ? 'az' : 'en';
}

function getInitialDarkMode(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('vuga-theme') === 'dark';
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);
  const [darkMode, setDarkMode] = useState(getInitialDarkMode);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      if (data && !error) {
        const profile = data as UserProfile;
        setUserProfile(profile);
      }
    } catch {
      // Profile fetch failed - will show auth page
    }
    setAuthLoading(false);
  }, []);

  useEffect(() => {
    // Safety timeout: stop loading after 3s no matter what
    const timeout = setTimeout(() => setAuthLoading(false), 3000);
    let initialDone = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeout);
      initialDone = true;
      if (session?.user) {
        setUser(session.user);
        fetchUserProfile(session.user.id);
      } else {
        setAuthLoading(false);
      }
    }).catch(() => {
      clearTimeout(timeout);
      initialDone = true;
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Skip INITIAL_SESSION - getSession() handles it
        if (event === 'INITIAL_SESSION') return;

        if (event === 'TOKEN_REFRESHED') return;

        if (session?.user) {
          setUser(session.user);
          // Only show loading spinner if this is not the initial load
          // (initial load is handled by getSession above)
          if (initialDone) {
            await fetchUserProfile(session.user.id);
          }
        } else {
          setUser(null);
          setUserProfile(null);
          setAuthLoading(false);
        }
      }
    );

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  useEffect(() => {
    localStorage.setItem('vuga-lang', language);
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    localStorage.setItem('vuga-theme', darkMode ? 'dark' : 'light');
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const t = (key: TranslationKey): string => {
    return translations[language][key] || key;
  };

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      // Immediately set user and fetch profile — don't wait for onAuthStateChange
      if (data.user) {
        setUser(data.user);
        setAuthLoading(true);
        await fetchUserProfile(data.user.id);
      }
      return { error: null };
    } catch {
      setAuthLoading(false);
      return { error: 'Network error. Please try again.' };
    }
  };

  const handleSignOut = async () => {
    // Clear state immediately for instant UI response
    setUser(null);
    setUserProfile(null);
    // Fire sign-out in background — don't block the UI
    supabase.auth.signOut({ scope: 'local' }).catch(() => {});
  };

  const hasAccess = (page: string): boolean => {
    if (!userProfile) return false;
    return ACCESS_MAP[userProfile.role]?.includes(page) ?? false;
  };

  const refreshProfile = async () => {
    if (user) await fetchUserProfile(user.id);
  };

  return (
    <AppContext.Provider
      value={{
        language, setLanguage, t, darkMode, toggleDarkMode,
        user, userProfile, authLoading,
        signIn, signOut: handleSignOut, hasAccess, refreshProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
