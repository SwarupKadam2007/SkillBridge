import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../lib/api';
import { theme } from '../theme';

export default function ConversationsScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadConversations = useCallback(async () => {
    try {
      const res = await api('/api/chat/conversations');
      setConversations(res.conversations || []);
    } catch (e) {
      console.warn('Failed to load conversations:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [loadConversations])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
        <Text style={{ fontSize: 26, fontWeight: '900', color: theme.colors.text }}>Campus Chats</Text>
        <Text style={{ color: theme.colors.muted, fontSize: 13, marginTop: 4 }}>
          Direct real-time conversations with campus buyers and freelancers.
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => {
            const partner = item.otherUser || {};
            const partnerName = partner.full_name || 'Campus Peer';
            const latest = item.latestMessage;
            const timeStr = latest?.created_at
              ? new Date(latest.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })
              : '';

            return (
              <Pressable
                onPress={() =>
                  navigation.navigate('Chat', {
                    conversationId: item.id,
                    recipientName: partnerName,
                    gigTitle: item.gigs?.title
                  })
                }
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 18,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  opacity: pressed ? 0.9 : 1
                })}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: theme.colors.primary,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 14
                  }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '800' }}>
                    {partnerName.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: theme.colors.text }}>
                      {partnerName}
                    </Text>
                    {timeStr ? (
                      <Text style={{ fontSize: 11, color: theme.colors.muted }}>{timeStr}</Text>
                    ) : null}
                  </View>

                  {item.gigs?.title ? (
                    <Text numberOfLines={1} style={{ fontSize: 12, color: theme.colors.primaryDark, fontWeight: '700', marginTop: 2 }}>
                      🏷️ {item.gigs.title}
                    </Text>
                  ) : null}

                  <Text numberOfLines={1} style={{ fontSize: 13, color: theme.colors.muted, marginTop: 4 }}>
                    {latest?.body || 'No messages yet. Tap to start chatting.'}
                  </Text>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 18, padding: 32, alignItems: 'center', marginTop: 30, borderWidth: 1, borderColor: theme.colors.border }}>
              <Text style={{ fontSize: 36, marginBottom: 10 }}>💬</Text>
              <Text style={{ fontSize: 17, fontWeight: '800', color: theme.colors.text }}>No conversations yet</Text>
              <Text style={{ color: theme.colors.muted, textAlign: 'center', marginTop: 6, fontSize: 13, lineHeight: 18 }}>
                When you inquire about a gig or hire a peer, your active chats will appear here.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

