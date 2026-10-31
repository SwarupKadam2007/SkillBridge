import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (currentSession) => {
    if (!currentSession?.access_token) {
      setProfile(null);
      return;
    }
    try {
      const data = await api('/api/me');
      setProfile(data.profile || null);
    } catch {
      // If server is not ready or user has no profile yet
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    await fetchProfile(currentSession);
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const { data: { session: initSession } } = await supabase.auth.getSession();
        if (!isMounted) return;
        setSession(initSession);
        if (initSession) {
          await fetchProfile(initSession);
        }
      } catch (err) {
        console.warn('Auth init warning:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!isMounted) return;
      setSession(nextSession);
      if (nextSession) {
        await fetchProfile(nextSession);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const isVerified = Boolean(profile?.college_verified_at && profile?.college_id);

  return (
    <AuthContext.Provider value={{ session, profile, isVerified, loading, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
