import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
import { INITIAL_USER } from '../lib/mockData';

const DEMO_SESSION_KEY = '@skillbridge_demo_session';
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
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    // If running in demo session, fetch local profile
    const demoStored = await AsyncStorage.getItem(DEMO_SESSION_KEY).catch(() => null);
    if (demoStored) {
      try {
        const data = await api('/api/me');
        setProfile(data.profile || JSON.parse(demoStored));
        return;
      } catch {}
    }

    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      await fetchProfile(currentSession);
    } catch {
      // Non-blocking
    }
  }, [fetchProfile]);

  const signInDemoUser = useCallback(async (customEmail, customName, collegeName = 'Stanford University') => {
    const email = customEmail || 'alex.rivera@stanford.edu';
    const fullName = customName || 'Alex Rivera';
    const domain = email.includes('@') ? email.split('@')[1] : 'stanford.edu';

    const demoProfile = {
      ...INITIAL_USER,
      email,
      full_name: fullName,
      college_verified_at: new Date().toISOString(),
      colleges: {
        id: 'col_demo_' + Date.now(),
        name: collegeName,
        domain
      }
    };

    const demoSession = {
      access_token: 'demo-token-' + Date.now(),
      user: {
        id: demoProfile.id,
        email: demoProfile.email,
        user_metadata: { full_name: demoProfile.full_name }
      }
    };

    await AsyncStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(demoProfile));
    setSession(demoSession);
    setProfile(demoProfile);
    setLoading(false);
    return demoProfile;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(DEMO_SESSION_KEY);
      await supabase.auth.signOut().catch(() => {});
    } catch (e) {
      console.warn('Sign out warning:', e);
    } finally {
      setSession(null);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        // 1. Check for stored demo session first
        const storedDemo = await AsyncStorage.getItem(DEMO_SESSION_KEY).catch(() => null);
        if (storedDemo) {
          const parsed = JSON.parse(storedDemo);
          if (isMounted) {
            setSession({
              access_token: 'demo-token',
              user: {
                id: parsed.id,
                email: parsed.email,
                user_metadata: { full_name: parsed.full_name }
              }
            });
            setProfile(parsed);
            setLoading(false);
          }
          return;
        }

        // 2. Otherwise check Supabase session
        const { data: { session: initSession } } = await supabase.auth.getSession().catch(() => ({ data: {} }));
        if (!isMounted) return;
        setSession(initSession || null);
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

    let listener;
    try {
      const authSub = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
        if (!isMounted) return;
        setSession(nextSession);
        if (nextSession) {
          await fetchProfile(nextSession);
        } else {
          // If signed out from Supabase, only clear if not in demo session
          const storedDemo = await AsyncStorage.getItem(DEMO_SESSION_KEY).catch(() => null);
          if (!storedDemo) {
            setProfile(null);
          }
        }
        setLoading(false);
      });
      listener = authSub.data?.listener || authSub.data;
    } catch {}

    return () => {
      isMounted = false;
      if (listener && listener.subscription) {
        listener.subscription.unsubscribe();
      }
    };
  }, [fetchProfile]);

  const isVerified = Boolean(profile?.college_verified_at && profile?.college_id);

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        isVerified,
        loading,
        refreshProfile,
        signOut,
        signInDemoUser
      }}>
      {children}
    </AuthContext.Provider>
  );
}
