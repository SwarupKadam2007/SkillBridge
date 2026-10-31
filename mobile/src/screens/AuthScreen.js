import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  View,
  ScrollView,
  Pressable
} from 'react-native';
import { supabase } from '../lib/supabase';
import PrimaryButton from '../components/PrimaryButton';
import { theme } from '../theme';

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleAuth() {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      return Alert.alert('Missing details', 'Please enter your email and password.');
    }
    if (isSignUp && !fullName.trim()) {
      return Alert.alert('Missing Name', 'Please enter your full name for your campus profile.');
    }

    setBusy(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { full_name: fullName.trim() }
          }
        });
        if (error) throw error;
        if (data.session) {
          Alert.alert('Account Created! 🎓', 'Welcome to SkillBridge! Now verify your campus access.');
        } else {
          Alert.alert(
            'Check your email',
            'We sent a verification link to your email. Confirm it to activate your account.'
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        });
        if (error) throw error;
      }
    } catch (error) {
      Alert.alert(isSignUp ? 'Sign up failed' : 'Sign in failed', error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <View style={{ backgroundColor: '#fff', padding: 26, borderRadius: 26, borderWidth: 1, borderColor: theme.colors.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Text style={{ color: theme.colors.primary, fontSize: 30, fontWeight: '900' }}>SkillBridge</Text>
            <View style={{ backgroundColor: theme.colors.lavender, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginLeft: 8 }}>
              <Text style={{ color: theme.colors.primaryDark, fontSize: 11, fontWeight: '800' }}>CAMPUS</Text>
            </View>
          </View>

          <Text style={{ color: theme.colors.muted, marginTop: 4, marginBottom: 24, fontSize: 14 }}>
            Student-to-student marketplace. Earn with your skills, hire verified peers.
          </Text>

          {isSignUp && (
            <View>
              <Text style={{ fontWeight: '700', marginBottom: 6, color: theme.colors.text }}>Full Name</Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="e.g. Alex Johnson"
                placeholderTextColor={theme.colors.muted}
                style={inputStyle}
              />
            </View>
          )}

          <Text style={{ fontWeight: '700', marginBottom: 6, color: theme.colors.text }}>College Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@college.edu or name@gmail.com"
            placeholderTextColor={theme.colors.muted}
            style={inputStyle}
          />

          <Text style={{ fontWeight: '700', marginBottom: 6, color: theme.colors.text }}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="At least 6 characters"
            placeholderTextColor={theme.colors.muted}
            style={inputStyle}
          />

          <PrimaryButton
            title={isSignUp ? 'Create Campus Account' : 'Sign In'}
            onPress={handleAuth}
            loading={busy}
          />

          <Pressable
            onPress={() => setIsSignUp(!isSignUp)}
            style={{ marginTop: 18, alignItems: 'center' }}>
            <Text style={{ color: theme.colors.primaryDark, fontWeight: '700', fontSize: 14 }}>
              {isSignUp
                ? 'Already have an account? Sign In'
                : "Don't have an account yet? Create Account"}
            </Text>
          </Pressable>

          <View style={{ marginTop: 20, paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
            <Text style={{ color: theme.colors.muted, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
              💡 Campus verification happens automatically via your verified email domain after sign in.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const inputStyle = {
  borderWidth: 1,
  borderColor: theme.colors.border,
  borderRadius: 14,
  padding: 14,
  marginBottom: 16,
  backgroundColor: '#FAF9FE',
  fontSize: 15,
  color: theme.colors.text
};
