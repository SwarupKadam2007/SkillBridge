import React from 'react';
import { Pressable, Text, ActivityIndicator } from 'react-native';
import { theme } from '../theme';

export default function PrimaryButton({ title, onPress, loading, disabled }) {
  return (
    <Pressable onPress={onPress} disabled={disabled || loading}
      style={{ backgroundColor: theme.colors.primary, padding: 16, borderRadius: 15, alignItems: 'center', opacity: disabled ? 0.55 : 1 }}>
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{title}</Text>}
    </Pressable>
  );
}
