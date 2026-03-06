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
}

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  darkMode: boolean;
  toggleDarkMode: () => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  user: User | null;
  userProfile: UserProfile | null;
  authLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  hasAccess: (page: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const ACCESS_MAP: Record<UserRole, string[]> = {
  admin: ['dashboard', 'orders', 'inventory', 'expenses', 'analytics', 'users'],
  moderator: ['orders', 'inventory'],
  user: ['orders'],
};

const DEFAULT_PAGE: Record<UserRole, string> = {
  admin: 'dashboard',
  moderator: 'orders',
  user: 'orders',
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('az');
  const [darkMode, setDarkMode] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const fetchUserProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) {
      const profile = data as UserProfile;
      setUserProfile(profile);
      setCurrentPage(DEFAULT_PAGE[profile.role] || 'orders');
    }
    setAuthLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchUserProfile(session.user.id);
      } else {
        setAuthLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          await fetchUserProfile(session.user.id);
        } else {
          setUser(null);
          setUserProfile(null);
          setAuthLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchUserProfile]);

  useEffect(() => {
    const savedLang = localStorage.getItem('vuga-lang') as Language;
    const savedTheme = localStorage.getItem('vuga-theme');
    if (savedLang) setLanguage(savedLang);
    if (savedTheme === 'dark') setDarkMode(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('vuga-lang', language);
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message || null };
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    return { error: error?.message || null };
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
    setCurrentPage('dashboard');
  };

  const hasAccess = (page: string): boolean => {
    if (!userProfile) return false;
    return ACCESS_MAP[userProfile.role]?.includes(page) ?? false;
  };

  return (
    <AppContext.Provider
      value={{
        language, setLanguage, t, darkMode, toggleDarkMode,
        currentPage, setCurrentPage,
        user, userProfile, authLoading,
        signIn, signUp, signOut: handleSignOut, hasAccess,
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
