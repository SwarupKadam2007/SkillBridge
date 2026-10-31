import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import PrimaryButton from '../components/PrimaryButton';
import { theme } from '../theme';

export default function AuthScreen() {
  const { signInDemoUser } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  async function handleQuickDemo() {
    setDemoLoading(true);
    try {
      await signInDemoUser('alex.rivera@stanford.edu', 'Alex Rivera', 'Stanford University');
    } catch (e) {
      Alert.alert('Demo Error', e.message);
    } finally {
      setDemoLoading(false);
    }
  }

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
      // If network failed or server unreachable, offer immediate offline/demo mode entry
      Alert.alert(
        'Connection Notice',
        `Remote server connection error: ${error.message}\n\nWould you like to enter in Campus Demo Mode using this email?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enter as Demo Student',
            style: 'default',
            onPress: () => {
              const name = fullName.trim() || cleanEmail.split('@')[0] || 'Campus Student';
              signInDemoUser(cleanEmail, name, 'SkillBridge Campus');
            }
          }
        ]
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 22 }}>
        {/* Quick Demo Access Header Banner */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            padding: 20,
            borderRadius: 22,
            marginBottom: 16,
            borderWidth: 1.5,
            borderColor: theme.colors.primary,
            shadowColor: theme.colors.primary,
            shadowOpacity: 0.08,
            shadowRadius: 10,
            elevation: 3
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Text style={{ fontSize: 24, marginRight: 8 }}>⚡</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: '900', color: theme.colors.text }}>
                Instant Campus Demo
              </Text>
              <Text style={{ fontSize: 12, color: theme.colors.muted, marginTop: 2 }}>
                Explore active campus gigs, chat, orders & student profile with 1 tap.
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handleQuickDemo}
            disabled={demoLoading}
            style={({ pressed }) => ({
              backgroundColor: theme.colors.primary,
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: 'center',
              marginTop: 10,
              opacity: pressed || demoLoading ? 0.85 : 1
            })}>
            {demoLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 15 }}>
                🚀 Explore as Student (1-Tap Entry)
              </Text>
            )}
          </Pressable>
        </View>

        {/* Traditional Auth Box */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            padding: 24,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: theme.colors.border
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Text style={{ color: theme.colors.primary, fontSize: 28, fontWeight: '900' }}>
              SkillBridge
            </Text>
            <View
              style={{
                backgroundColor: theme.colors.lavender,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 8,
                marginLeft: 8
              }}>
              <Text style={{ color: theme.colors.primaryDark, fontSize: 11, fontWeight: '800' }}>
                SIGN IN
              </Text>
            </View>
          </View>

          <Text style={{ color: theme.colors.muted, marginTop: 2, marginBottom: 20, fontSize: 13 }}>
            Or sign in with your campus account credentials:
          </Text>

          {isSignUp && (
            <View>
              <Text style={{ fontWeight: '700', marginBottom: 6, color: theme.colors.text }}>
                Full Name
              </Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="e.g. Alex Rivera"
                placeholderTextColor={theme.colors.muted}
                style={inputStyle}
              />
            </View>
          )}

          <Text style={{ fontWeight: '700', marginBottom: 6, color: theme.colors.text }}>
            Student Email
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@college.edu or name@gmail.com"
            placeholderTextColor={theme.colors.muted}
            style={inputStyle}
          />

          <Text style={{ fontWeight: '700', marginBottom: 6, color: theme.colors.text }}>
            Password
          </Text>
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
            style={{ marginTop: 16, alignItems: 'center' }}>
            <Text style={{ color: theme.colors.primaryDark, fontWeight: '700', fontSize: 14 }}>
              {isSignUp
                ? 'Already have an account? Sign In'
                : "Don't have an account yet? Create Account"}
            </Text>
          </Pressable>
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
  marginBottom: 14,
  backgroundColor: '#FAF9FE',
  fontSize: 15,
  color: theme.colors.text
};
