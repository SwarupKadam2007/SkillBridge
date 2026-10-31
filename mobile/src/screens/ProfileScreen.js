import React, { useState, useEffect } from 'react';
import { Alert, Text, View, ScrollView, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api, getActiveApiUrl, setCustomApiUrl, checkServerHealth } from '../lib/api';
import PrimaryButton from '../components/PrimaryButton';
import RatingStars from '../components/RatingStars';
import { theme } from '../theme';

export default function ProfileScreen() {
  const { session, profile, refreshProfile, signOut } = useAuth();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [course, setCourse] = useState(profile?.course || '');
  const [gradYear, setGradYear] = useState(profile?.graduation_year ? String(profile.graduation_year) : '');
  const [reputationData, setReputationData] = useState(null);

  // Server settings state
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState(getActiveApiUrl());
  const [serverStatus, setServerStatus] = useState(null); // 'online', 'offline', 'testing'

  const userEmail = profile?.email || session?.user?.email || '';
  const collegeName = profile?.colleges?.name || 'Verified Campus';

  useEffect(() => {
    if (profile?.id) {
      api(`/api/reviews/user/${profile.id}`)
        .then((res) => setReputationData(res))
        .catch(() => {});
    }
  }, [profile?.id]);

  async function handleTestServer() {
    setServerStatus('testing');
    const isUp = await checkServerHealth(serverUrlInput);
    setServerStatus(isUp ? 'online' : 'offline');
  }

  async function handleSaveServerUrl() {
    await setCustomApiUrl(serverUrlInput);
    Alert.alert('Saved', `API endpoint set to: ${serverUrlInput || 'Default'}`);
    setShowServerConfig(false);
    handleTestServer();
  }

  async function handleSave() {
    setBusy(true);
    try {
      await api('/api/me', {
        method: 'PUT',
        body: JSON.stringify({
          full_name: fullName.trim(),
          bio: bio.trim(),
          course: course.trim(),
          graduation_year: gradYear ? Number(gradYear) : null
        })
      });
      await refreshProfile();
      Alert.alert('Saved!', 'Your campus profile has been updated.');
      setEditing(false);
    } catch (e) {
      Alert.alert('Update failed', e.message);
    } finally {
      setBusy(false);
    }
  }

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut }
    ]);
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 20 }}>
      {/* Profile Card */}
      <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 22, borderWidth: 1, borderColor: theme.colors.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
            <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900' }}>
              {(fullName || userEmail || 'S').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: theme.colors.text }}>
              {fullName || 'Student'}
            </Text>
            <Text style={{ fontSize: 13, color: theme.colors.muted }}>{userEmail}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <View style={{ backgroundColor: '#E6F8EE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' }}>
                <Text style={{ color: theme.colors.success, fontSize: 11, fontWeight: '800' }}>
                  🎓 {collegeName}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {!editing ? (
          <View>
            <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: 14 }} />

            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: theme.colors.muted }}>DEGREE / COURSE</Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.text, marginTop: 2 }}>
                {course || 'Not specified'} {gradYear ? `• Class of '${gradYear}` : ''}
              </Text>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: theme.colors.muted }}>BIO & SKILLS</Text>
              <Text style={{ fontSize: 14, color: theme.colors.text, marginTop: 4, lineHeight: 20 }}>
                {bio || 'Add a bio describing your skills, tools, and background.'}
              </Text>
            </View>

            <Pressable
              onPress={() => setEditing(true)}
              style={{ backgroundColor: '#FAF9FE', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' }}>
              <Text style={{ color: theme.colors.primary, fontWeight: '800', fontSize: 13 }}>✏️ Edit Profile</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ marginTop: 10 }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: theme.colors.muted, marginBottom: 4 }}>Full Name</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your Name"
              style={inputStyle}
            />

            <Text style={{ fontSize: 12, fontWeight: '800', color: theme.colors.muted, marginBottom: 4 }}>Course / Major</Text>
            <TextInput
              value={course}
              onChangeText={setCourse}
              placeholder="e.g. B.Tech Computer Science, B.Des"
              style={inputStyle}
            />

            <Text style={{ fontSize: 12, fontWeight: '800', color: theme.colors.muted, marginBottom: 4 }}>Graduation Year</Text>
            <TextInput
              value={gradYear}
              onChangeText={setGradYear}
              placeholder="e.g. 2026"
              keyboardType="numeric"
              style={inputStyle}
            />

            <Text style={{ fontSize: 12, fontWeight: '800', color: theme.colors.muted, marginBottom: 4 }}>Bio & Portfolio Note</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Introduce your freelance strengths and tools..."
              multiline
              style={[inputStyle, { minHeight: 70, textAlignVertical: 'top' }]}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <View style={{ flex: 1 }}>
                <PrimaryButton title="Save Profile" onPress={handleSave} loading={busy} />
              </View>
              <Pressable
                onPress={() => setEditing(false)}
                style={{ paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border }}>
                <Text style={{ color: theme.colors.muted, fontWeight: '700' }}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      {/* Backend & Network Status Card */}
      <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 18, marginTop: 16, borderWidth: 1, borderColor: theme.colors.border }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, marginRight: 8 }}>🌐</Text>
            <View>
              <Text style={{ fontSize: 15, fontWeight: '800', color: theme.colors.text }}>Backend Connection</Text>
              <Text style={{ fontSize: 12, color: theme.colors.muted }}>
                {serverStatus === 'online'
                  ? '🟢 Live Server Connected'
                  : serverStatus === 'testing'
                  ? '⏳ Testing connection...'
                  : '🟡 Demo & Campus Offline Mode'}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => setShowServerConfig(!showServerConfig)}
            style={{ backgroundColor: theme.colors.lavender, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}>
            <Text style={{ color: theme.colors.primaryDark, fontWeight: '800', fontSize: 12 }}>
              {showServerConfig ? 'Close' : 'Configure'}
            </Text>
          </Pressable>
        </View>

        {showServerConfig && (
          <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.muted, marginBottom: 4 }}>
              API Base URL (e.g. https://your-server.onrender.com or http://192.168.x.x:4000)
            </Text>
            <TextInput
              value={serverUrlInput}
              onChangeText={setServerUrlInput}
              autoCapitalize="none"
              placeholder="http://10.0.2.2:4000"
              placeholderTextColor={theme.colors.muted}
              style={[inputStyle, { marginBottom: 10 }]}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={handleTestServer}
                style={{ flex: 1, backgroundColor: '#FAF9FE', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' }}>
                {serverStatus === 'testing' ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <Text style={{ color: theme.colors.primaryDark, fontWeight: '800', fontSize: 13 }}>Test Health</Text>
                )}
              </Pressable>
              <Pressable
                onPress={handleSaveServerUrl}
                style={{ flex: 1, backgroundColor: theme.colors.primary, padding: 12, borderRadius: 12, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>Save URL</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      {/* Campus Reputation & Reviews */}
      {reputationData && (
        <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 18, marginTop: 16, borderWidth: 1, borderColor: theme.colors.border }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: theme.colors.text }}>Campus Reputation</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <RatingStars rating={reputationData.averageRating} size={16} />
              <Text style={{ fontSize: 14, fontWeight: '900', color: theme.colors.text, marginLeft: 6 }}>
                {reputationData.averageRating}
              </Text>
              <Text style={{ fontSize: 12, color: theme.colors.muted, marginLeft: 4 }}>
                ({reputationData.totalReviews})
              </Text>
            </View>
          </View>

          {reputationData.reviews.length > 0 ? (
            reputationData.reviews.slice(0, 3).map((rev) => (
              <View key={rev.id} style={{ backgroundColor: '#FAF9FE', borderRadius: 12, padding: 12, marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.text }}>
                    {rev.reviewer?.full_name || 'Campus Student'}
                  </Text>
                  <RatingStars rating={rev.rating} size={12} />
                </View>
                {rev.comment ? (
                  <Text style={{ fontSize: 12, color: '#4B455B', marginTop: 4 }}>"{rev.comment}"</Text>
                ) : null}
              </View>
            ))
          ) : (
            <Text style={{ fontSize: 13, color: theme.colors.muted }}>
              Complete orders on campus to earn reviews and build trust.
            </Text>
          )}
        </View>
      )}

      {/* Safety & Honor Code */}
      <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 18, marginTop: 16, borderWidth: 1, borderColor: theme.colors.border }}>
        <Text style={{ fontSize: 15, fontWeight: '800', color: theme.colors.text, marginBottom: 6 }}>
          Campus Trust & Safety
        </Text>
        <Text style={{ fontSize: 13, color: theme.colors.muted, lineHeight: 18 }}>
          SkillBridge maintains an academic integrity policy. Commercial tutoring, design, coding, and campus services are welcome. Direct exam cheating or academic fraud is prohibited.
        </Text>
      </View>

      {/* Sign out */}
      <Pressable
        onPress={handleSignOut}
        style={{ marginTop: 20, backgroundColor: '#FFF2F4', padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#FDD5D9' }}>
        <Text style={{ color: theme.colors.danger, fontWeight: '800', fontSize: 15 }}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const inputStyle = {
  backgroundColor: '#FAF9FE',
  borderWidth: 1,
  borderColor: theme.colors.border,
  borderRadius: 12,
  padding: 12,
  marginBottom: 12,
  fontSize: 14,
  color: theme.colors.text
};
