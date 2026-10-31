import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

export default function ChatScreen({ route, navigation }) {
  const { conversationId, recipientName, gigTitle } = route.params;
  const { session } = useAuth();
  const currentUserId = session?.user?.id;

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  const loadMessages = useCallback(async () => {
    try {
      const res = await api(`/api/chat/conversations/${conversationId}/messages`);
      setMessages(res.messages || []);
    } catch (e) {
      console.warn('Failed to load messages:', e.message);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadMessages();

    // Set custom header title
    navigation.setOptions({
      title: recipientName || 'Campus Chat',
      headerSubtitle: gigTitle || undefined
    });

    // Realtime subscription via Supabase
    const channel = supabase
      .channel(`chat_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          if (payload.new && payload.new.sender_id !== currentUserId) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
          }
        }
      )
      .subscribe();

    // Fallback polling for updates every 8 seconds
    const interval = setInterval(loadMessages, 8000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [conversationId, currentUserId, gigTitle, loadMessages, navigation, recipientName]);

  async function handleSend() {
    const text = inputText.trim();
    if (!text || sending) return;

    setInputText('');
    setSending(true);

    // Optimistic UI insertion
    const tempId = 'temp_' + Date.now();
    const optimisticMsg = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      body: text,
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await api(`/api/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body: text })
      });
      // Replace optimistic message with actual message from server
      setMessages((prev) => prev.map((m) => (m.id === tempId ? res.message : m)));
    } catch (e) {
      console.warn('Send message error:', e.message);
      // Remove temp message if failed
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {gigTitle ? (
        <View style={{ backgroundColor: theme.colors.lavender, paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.primaryDark, flex: 1 }}>
            📌 Regarding: {gigTitle}
          </Text>
        </View>
      ) : null}

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const isMe = item.sender_id === currentUserId;
            const timeStr = new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <View
                style={{
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  marginBottom: 10
                }}>
                <View
                  style={{
                    backgroundColor: isMe ? theme.colors.primary : '#FFFFFF',
                    borderRadius: 18,
                    borderBottomRightRadius: isMe ? 4 : 18,
                    borderBottomLeftRadius: isMe ? 18 : 4,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderWidth: isMe ? 0 : 1,
                    borderColor: theme.colors.border,
                    elevation: 1,
                    shadowColor: '#000',
                    shadowOpacity: 0.04,
                    shadowRadius: 3
                  }}>
                  <Text style={{ color: isMe ? '#FFFFFF' : theme.colors.text, fontSize: 15, lineHeight: 21 }}>
                    {item.body}
                  </Text>
                  <Text
                    style={{
                      fontSize: 10,
                      color: isMe ? '#E3D7FF' : theme.colors.muted,
                      alignSelf: 'flex-end',
                      marginTop: 4
                    }}>
                    {timeStr}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 40, padding: 20 }}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>💬</Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: theme.colors.text }}>No messages yet</Text>
              <Text style={{ color: theme.colors.muted, textAlign: 'center', marginTop: 4, fontSize: 13 }}>
                Send a message to discuss project details, scope, or delivery.
              </Text>
            </View>
          }
        />
      )}

      {/* Input bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border
        }}>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          placeholderTextColor={theme.colors.muted}
          multiline
          style={{
            flex: 1,
            backgroundColor: '#FAF9FE',
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 10,
            maxHeight: 100,
            fontSize: 15,
            color: theme.colors.text,
            borderWidth: 1,
            borderColor: theme.colors.border
          }}
        />
        <Pressable
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
          style={{
            backgroundColor: inputText.trim() ? theme.colors.primary : '#E5E0F2',
            width: 44,
            height: 44,
            borderRadius: 22,
            justifyContent: 'center',
            alignItems: 'center',
            marginLeft: 10
          }}>
          <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '900' }}>↑</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

