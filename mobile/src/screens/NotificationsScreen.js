import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../lib/api';
import { theme } from '../theme';

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await api('/api/notifications');
      setNotifications(res.notifications || []);
    } catch (e) {
      console.warn('Failed to load notifications:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  async function handleMarkAllRead() {
    try {
      await api('/api/notifications/read-all', { method: 'POST', body: JSON.stringify({}) });
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
    } catch (e) {
      console.warn('Failed to mark all read:', e.message);
    }
  }

  async function handleMarkSingleRead(id) {
    try {
      await api(`/api/notifications/${id}/read`, { method: 'PATCH', body: JSON.stringify({}) });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
    } catch {}
  }

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 16,
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border
        }}>
        <View>
          <Text style={{ fontSize: 22, fontWeight: '900', color: theme.colors.text }}>Notifications</Text>
          <Text style={{ fontSize: 12, color: theme.colors.muted, marginTop: 2 }}>
            {unreadCount > 0 ? `${unreadCount} unread update(s)` : 'All caught up!'}
          </Text>
        </View>

        {unreadCount > 0 && (
          <Pressable onPress={handleMarkAllRead} style={{ padding: 6 }}>
            <Text style={{ color: theme.colors.primary, fontWeight: '700', fontSize: 13 }}>Mark all read</Text>
          </Pressable>
        )}
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await loadNotifications();
                setRefreshing(false);
              }}
            />
          }
          renderItem={({ item }) => {
            const isUnread = !item.read_at;
            const timeStr = new Date(item.created_at).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <Pressable
                onPress={() => handleMarkSingleRead(item.id)}
                style={{
                  backgroundColor: isUnread ? '#F7F4FF' : '#FFFFFF',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: isUnread ? '#D8CCFF' : theme.colors.border
                }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    {isUnread && (
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: theme.colors.primary,
                          marginRight: 8
                        }}
                      />
                    )}
                    <Text style={{ fontSize: 15, fontWeight: '800', color: theme.colors.text, flex: 1 }}>
                      {item.title}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: theme.colors.muted }}>{timeStr}</Text>
                </View>
                <Text style={{ fontSize: 13, color: '#4A4458', marginTop: 6, lineHeight: 18 }}>
                  {item.body}
                </Text>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 18, padding: 32, alignItems: 'center', marginTop: 40, borderWidth: 1, borderColor: theme.colors.border }}>
              <Text style={{ fontSize: 36, marginBottom: 10 }}>🔔</Text>
              <Text style={{ fontSize: 17, fontWeight: '800', color: theme.colors.text }}>No notifications yet</Text>
              <Text style={{ color: theme.colors.muted, textAlign: 'center', marginTop: 4, fontSize: 13 }}>
                Updates on applications, orders, and messages will appear here.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

