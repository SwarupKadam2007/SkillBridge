import React, { useState, useEffect, useCallback } from 'react';
import { Alert, FlatList, RefreshControl, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { api } from '../lib/api';
import { theme } from '../theme';

export default function GigApplicantsScreen({ route, navigation }) {
  const { gigId, gigTitle } = route.params;
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const loadApplications = useCallback(async () => {
    try {
      const res = await api(`/api/gigs/${gigId}/applications`);
      setApplications(res.applications || []);
    } catch (e) {
      Alert.alert('Could not load applicants', e.message);
    } finally {
      setLoading(false);
    }
  }, [gigId]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  async function handleDecision(appId, status) {
    setProcessingId(appId);
    try {
      const res = await api(`/api/applications/${appId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      Alert.alert(
        status === 'accepted' ? 'Hired! 🎉' : 'Application Declined',
        status === 'accepted'
          ? 'You accepted this applicant. An order has been created. Check your active orders in My Work.'
          : 'The applicant has been notified.'
      );
      await loadApplications();
    } catch (e) {
      Alert.alert('Action failed', e.message);
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlatList
        data={applications}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 18 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await loadApplications();
              setRefreshing(false);
            }}
          />
        }
        ListHeaderComponent={
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 13, color: theme.colors.muted, fontWeight: '700' }}>APPLICANTS FOR</Text>
            <Text style={{ fontSize: 20, fontWeight: '900', color: theme.colors.text, marginTop: 4 }}>
              {gigTitle || 'Gig'}
            </Text>
            <Text style={{ color: theme.colors.muted, marginTop: 4, fontSize: 13 }}>
              {applications.length} student proposal(s) received
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const applicant = item.profiles || {};
          const name = applicant.full_name || 'Campus Student';
          const isBusy = processingId === item.id;

          return (
            <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: theme.colors.border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>
                      {name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: theme.colors.text }}>{name}</Text>
                    {applicant.course ? (
                      <Text style={{ fontSize: 12, color: theme.colors.muted }}>
                        {applicant.course} {applicant.graduation_year ? `• Class of '${applicant.graduation_year}` : ''}
                      </Text>
                    ) : null}
                  </View>
                </View>

                {/* Status Badge */}
                <View style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 10,
                  backgroundColor: item.status === 'accepted' ? '#E6F8EE' : item.status === 'rejected' ? '#FEECEE' : theme.colors.lavender
                }}>
                  <Text style={{
                    fontSize: 11,
                    fontWeight: '800',
                    color: item.status === 'accepted' ? theme.colors.success : item.status === 'rejected' ? theme.colors.danger : theme.colors.primaryDark
                  }}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Proposal message */}
              <View style={{ backgroundColor: '#FAF9FE', borderRadius: 12, padding: 12, marginTop: 14, borderWidth: 1, borderColor: theme.colors.border }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.muted, marginBottom: 4 }}>PITCH</Text>
                <Text style={{ fontSize: 14, color: theme.colors.text, lineHeight: 20 }}>
                  {item.message || 'No message provided.'}
                </Text>
              </View>

              {/* Action buttons if still pending */}
              {item.status === 'pending' && (
                <View style={{ flexDirection: 'row', marginTop: 16, gap: 10 }}>
                  <Pressable
                    disabled={isBusy}
                    onPress={() => handleDecision(item.id, 'accepted')}
                    style={{ flex: 1, backgroundColor: theme.colors.primary, paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}>
                    {isBusy ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Accept & Hire</Text>
                    )}
                  </Pressable>
                  <Pressable
                    disabled={isBusy}
                    onPress={() => handleDecision(item.id, 'rejected')}
                    style={{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' }}>
                    <Text style={{ color: theme.colors.danger, fontWeight: '700', fontSize: 14 }}>Decline</Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          !loading && (
            <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 32, alignItems: 'center', marginTop: 30, borderWidth: 1, borderColor: theme.colors.border }}>
              <Text style={{ fontSize: 32, marginBottom: 10 }}>📬</Text>
              <Text style={{ fontSize: 17, fontWeight: '800', color: theme.colors.text }}>No proposals yet</Text>
              <Text style={{ color: theme.colors.muted, textAlign: 'center', marginTop: 6, fontSize: 13 }}>
                When peers on campus submit proposals to this gig, they will appear here.
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

