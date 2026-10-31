import React, { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, TextInput, View, Pressable, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import GigCard from '../components/GigCard';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

const CATEGORIES = ['All', 'Design', 'Coding', 'Notes & Tutoring', 'Errands', 'Writing', 'Events'];

export default function HomeScreen({ navigation }) {
  const { profile } = useAuth();
  const [gigs, setGigs] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (selectedCategory && selectedCategory !== 'All') params.append('category', selectedCategory);

      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const result = await api(`/api/gigs${queryStr}`);
      setGigs(result.gigs || []);

      // Fetch unread notification count
      api('/api/notifications')
        .then((res) => setUnreadNotifications(res.unreadCount || 0))
        .catch(() => {});
    } catch (e) {
      // If user is not verified, they will be routed by navigator
      if (!e.message?.includes('Verify your college')) {
        Alert.alert('Marketplace', e.message);
      }
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const collegeName = profile?.colleges?.name || 'Your Campus';

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlatList
        data={gigs}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 18, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
        ListHeaderComponent={
          <View style={{ marginBottom: 16 }}>
            {/* Campus Header Pill and Notifications Bell */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.lavender, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                <Text style={{ fontSize: 13, marginRight: 4 }}>🎓</Text>
                <Text style={{ color: theme.colors.primaryDark, fontWeight: '800', fontSize: 12 }}>
                  {collegeName.toUpperCase()}
                </Text>
              </View>

              <Pressable
                onPress={() => navigation.navigate('Notifications')}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#FFFFFF',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: theme.colors.border
                }}>
                <Text style={{ fontSize: 18 }}>🔔</Text>
                {unreadNotifications > 0 && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: theme.colors.danger
                    }}
                  />
                )}
              </Pressable>
            </View>

            <Text style={{ fontSize: 26, fontWeight: '900', color: theme.colors.text }}>Campus Marketplace</Text>
            <Text style={{ color: theme.colors.muted, marginTop: 4, marginBottom: 14 }}>
              Exchange skills, find freelance help, and earn with campus peers.
            </Text>

            {/* Search Input */}
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 14, marginBottom: 14 }}>
              <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
              <TextInput
                value={search}
                onChangeText={setSearch}
                onSubmitEditing={load}
                placeholder="Search gigs by title or keywords..."
                placeholderTextColor={theme.colors.muted}
                style={{ flex: 1, height: 48, color: theme.colors.text, fontSize: 15 }}
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')}>
                  <Text style={{ color: theme.colors.muted, fontWeight: '700', padding: 4 }}>✕</Text>
                </Pressable>
              )}
            </View>

            {/* Category Filter Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 2 }}>
              {CATEGORIES.map(cat => {
                const isActive = selectedCategory === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setSelectedCategory(cat)}
                    style={{
                      backgroundColor: isActive ? theme.colors.primary : '#fff',
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 18,
                      marginRight: 8,
                      borderWidth: 1,
                      borderColor: isActive ? theme.colors.primary : theme.colors.border
                    }}>
                    <Text style={{ color: isActive ? '#fff' : theme.colors.text, fontWeight: '700', fontSize: 13 }}>
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        }
        renderItem={({ item }) => (
          <GigCard gig={item} onPress={() => navigation.navigate('GigDetails', { gig: item })} />
        )}
        ListEmptyComponent={
          !loading && (
            <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 32, alignItems: 'center', marginTop: 20, borderWidth: 1, borderColor: theme.colors.border }}>
              <Text style={{ fontSize: 36, marginBottom: 12 }}>🚀</Text>
              <Text style={{ fontSize: 18, fontWeight: '800', color: theme.colors.text, textAlign: 'center' }}>
                No active gigs found
              </Text>
              <Text style={{ color: theme.colors.muted, textAlign: 'center', marginTop: 6, marginBottom: 20, lineHeight: 20 }}>
                {selectedCategory !== 'All' || search
                  ? 'Try selecting another category or clearing search filters.'
                  : 'Be the first student to offer a skill on campus!'}
              </Text>
              <Pressable
                onPress={() => navigation.navigate('Post')}
                style={{ backgroundColor: theme.colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14 }}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>+ Post a Campus Gig</Text>
              </Pressable>
            </View>
          )
        }
      />
    </View>
  );
}
