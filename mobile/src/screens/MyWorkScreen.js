import React, { useState, useCallback } from 'react';
import { Alert, FlatList, RefreshControl, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../lib/api';
import { theme } from '../theme';

const TABS = ['Orders', 'My Gigs', 'Applications'];

export default function MyWorkScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Orders');
  const [orders, setOrders] = useState([]);
  const [myGigs, setMyGigs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      if (activeTab === 'Orders') {
        const res = await api('/api/orders/mine');
        setOrders(res.orders || []);
      } else if (activeTab === 'My Gigs') {
        const res = await api('/api/gigs/mine');
        setMyGigs(res.gigs || []);
      } else if (activeTab === 'Applications') {
        const res = await api('/api/applications/mine');
        setApplications(res.applications || []);
      }
    } catch (e) {
      if (!e.message?.includes('Verify your college')) {
        Alert.alert('Load error', e.message);
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header and Tab Switcher */}
      <View style={{ paddingHorizontal: 18, paddingTop: 18, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
        <Text style={{ fontSize: 26, fontWeight: '900', color: theme.colors.text }}>My Work</Text>
        <Text style={{ color: theme.colors.muted, fontSize: 13, marginTop: 4, marginBottom: 14 }}>
          Manage your campus orders, client deliverables, and applications.
        </Text>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => {
                  setActiveTab(tab);
                  setLoading(true);
                }}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  alignItems: 'center',
                  borderRadius: 12,
                  backgroundColor: isActive ? theme.colors.primary : '#FAF9FE',
                  borderWidth: 1,
                  borderColor: isActive ? theme.colors.primary : theme.colors.border
                }}>
                <Text style={{
                  color: isActive ? '#fff' : theme.colors.text,
                  fontWeight: '800',
                  fontSize: 13
                }}>
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Content List */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : activeTab === 'Orders' ? (
        <FlatList
          data={orders}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 18 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
              style={({ pressed }) => ({
                backgroundColor: '#fff',
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: theme.colors.border,
                opacity: pressed ? 0.9 : 1
              })}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: theme.colors.muted, fontWeight: '700' }}>
                  ORDER #{item.id.slice(0, 8).toUpperCase()}
                </Text>
                <View style={{
                  backgroundColor: item.status === 'accepted' ? '#E6F8EE' : item.status === 'delivered' ? '#EDF5FF' : theme.colors.lavender,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 8
                }}>
                  <Text style={{
                    fontSize: 11,
                    fontWeight: '800',
                    color: item.status === 'accepted' ? theme.colors.success : item.status === 'delivered' ? '#2563EB' : theme.colors.primaryDark
                  }}>
                    {item.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={{ fontSize: 16, fontWeight: '800', color: theme.colors.text, marginTop: 8 }}>
                {item.gigs?.title || 'Campus Gig Order'}
              </Text>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <Text style={{ color: theme.colors.muted, fontSize: 12 }}>
                  {item.seller?.full_name ? `Seller: ${item.seller.full_name}` : `Buyer: ${item.buyer?.full_name || 'Peer'}`}
                </Text>
                <Text style={{ color: theme.colors.primaryDark, fontSize: 16, fontWeight: '900' }}>
                  ₹{(item.agreed_price_paise / 100).toFixed(0)}
                </Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <EmptyState
              title="No active orders"
              message="Orders are created when an application is accepted or when you hire a student."
            />
          }
        />
      ) : activeTab === 'My Gigs' ? (
        <FlatList
          data={myGigs}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 18 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          renderItem={({ item }) => (
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ backgroundColor: theme.colors.lavender, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                  <Text style={{ color: theme.colors.primaryDark, fontWeight: '800', fontSize: 11 }}>{item.category}</Text>
                </View>
                <Text style={{ fontSize: 12, color: theme.colors.muted }}>⚡ {item.delivery_days} day(s)</Text>
              </View>

              <Text style={{ fontSize: 16, fontWeight: '800', color: theme.colors.text, marginTop: 8 }}>{item.title}</Text>
              <Text style={{ color: theme.colors.primaryDark, fontSize: 16, fontWeight: '900', marginTop: 4 }}>
                ₹{(item.price_paise / 100).toFixed(0)}
              </Text>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F2EFF8' }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.text }}>
                  {item.applicant_count || 0} applicant(s)
                </Text>
                <Pressable
                  onPress={() => navigation.navigate('GigApplicants', { gigId: item.id, gigTitle: item.title })}
                  style={{ backgroundColor: theme.colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 }}>
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>View Applicants</Text>
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              title="No gigs posted yet"
              message="Offer notes, tutoring, design, or coding to your campus peers."
              actionText="+ Post your first gig"
              onAction={() => navigation.navigate('Post')}
            />
          }
        />
      ) : (
        <FlatList
          data={applications}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 18 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          renderItem={({ item }) => (
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: theme.colors.muted, fontWeight: '700' }}>APPLICATION</Text>
                <View style={{
                  backgroundColor: item.status === 'accepted' ? '#E6F8EE' : item.status === 'rejected' ? '#FEECEE' : theme.colors.lavender,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 8
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

              <Text style={{ fontSize: 16, fontWeight: '800', color: theme.colors.text, marginTop: 8 }}>
                {item.gigs?.title || 'Campus Gig'}
              </Text>
              <Text style={{ color: theme.colors.muted, fontSize: 13, marginTop: 4 }}>
                Pitch: "{item.message}"
              </Text>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <Text style={{ color: theme.colors.muted, fontSize: 12 }}>
                  Budget: ₹{((item.gigs?.price_paise || 0) / 100).toFixed(0)}
                </Text>
                <Pressable
                  onPress={() => item.gigs && navigation.navigate('GigDetails', { gig: item.gigs })}>
                  <Text style={{ color: theme.colors.primary, fontWeight: '700', fontSize: 12 }}>View Gig →</Text>
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              title="No applications yet"
              message="Browse the campus marketplace and apply for gigs that match your skills."
              actionText="Explore Gigs"
              onAction={() => navigation.navigate('Home')}
            />
          }
        />
      )}
    </View>
  );
}

function EmptyState({ title, message, actionText, onAction }) {
  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 30, alignItems: 'center', marginTop: 24, borderWidth: 1, borderColor: theme.colors.border }}>
      <Text style={{ fontSize: 32, marginBottom: 10 }}>📂</Text>
      <Text style={{ fontSize: 17, fontWeight: '800', color: theme.colors.text }}>{title}</Text>
      <Text style={{ color: theme.colors.muted, textAlign: 'center', marginTop: 6, fontSize: 13, lineHeight: 18, marginBottom: onAction ? 16 : 0 }}>
        {message}
      </Text>
      {onAction && (
        <Pressable onPress={onAction} style={{ backgroundColor: theme.colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 }}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>{actionText}</Text>
        </Pressable>
      )}
    </View>
  );
}
