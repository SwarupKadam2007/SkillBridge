import React, { useState, useEffect } from 'react';
import { Alert, Text, View, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import PrimaryButton from '../components/PrimaryButton';
import { theme } from '../theme';

export default function CollegeScreen({ navigation }) {
  const { session, refreshProfile, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const [activeColleges, setActiveColleges] = useState([]);
  const [loadingCampuses, setLoadingCampuses] = useState(true);

  const userEmail = session?.user?.email || '';

  useEffect(() => {
    async function fetchCampuses() {
      try {
        const res = await api('/api/college/active');
        setActiveColleges(res.colleges || []);
      } catch {
        // Non-blocking if active endpoint has issue
      } finally {
        setLoadingCampuses(false);
      }
    }
    fetchCampuses();
  }, []);

  async function verify() {
    setBusy(true);
    try {
      const res = await api('/api/college/verify', { method: 'POST', body: JSON.stringify({}) });
      await refreshProfile();
      Alert.alert('Verified! 🎓', res.message || 'Welcome to your campus marketplace!');
      navigation.replace('Main');
    } catch (e) {
      Alert.alert('Campus Verification Failed', e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 24, justifyContent: 'center', minHeight: '100%' }}>
      <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: theme.colors.border }}>
        <Text style={{ fontSize: 26, fontWeight: '900', color: theme.colors.text }}>Your Campus. Your Peers.</Text>
        <Text style={{ color: theme.colors.muted, lineHeight: 22, marginTop: 10, marginBottom: 16 }}>
          SkillBridge is an exclusive campus marketplace. Only students with a verified college email can view, post, and apply for gigs.
        </Text>

        <View style={{ backgroundColor: theme.colors.lavender, padding: 14, borderRadius: 14, marginBottom: 20 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.primaryDark }}>SIGNED IN AS</Text>
          <Text style={{ fontSize: 16, fontWeight: '800', color: theme.colors.text, marginTop: 4 }}>{userEmail}</Text>
        </View>

        <PrimaryButton title="Verify Campus Access" onPress={verify} loading={busy} />

        <Pressable onPress={signOut} style={{ marginTop: 16, alignItems: 'center', padding: 8 }}>
          <Text style={{ color: theme.colors.danger, fontWeight: '700', fontSize: 14 }}>Sign in with a different email</Text>
        </Pressable>

        <View style={{ marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: theme.colors.text, marginBottom: 8 }}>
            Eligible Campuses:
          </Text>
          {loadingCampuses ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : activeColleges.length > 0 ? (
            activeColleges.map((c) => (
              <View key={c.id} style={{ marginBottom: 6 }}>
                <Text style={{ fontSize: 13, color: theme.colors.text, fontWeight: '600' }}>• {c.name}</Text>
                <Text style={{ fontSize: 11, color: theme.colors.muted, marginLeft: 12 }}>
                  Domains: {(c.college_domains || []).map(d => `@${d.domain}`).join(', ')}
                </Text>
              </View>
            ))
          ) : (
            <Text style={{ fontSize: 12, color: theme.colors.muted }}>
              Includes Demo University (@student.edu, @college.edu, @gmail.com for local testing), Stanford, IIT Bombay.
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
