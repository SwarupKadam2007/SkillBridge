import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { theme } from '../theme';

export default function GigCard({ gig, onPress }) {
  const sellerName = gig.profiles?.full_name || 'Verified Student';
  const sellerCourse = gig.profiles?.course;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: theme.colors.border,
        opacity: pressed ? 0.92 : 1,
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6
      })}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ backgroundColor: theme.colors.lavender, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
          <Text style={{ color: theme.colors.primaryDark, fontWeight: '800', fontSize: 11 }}>{gig.category}</Text>
        </View>
        <Text style={{ color: theme.colors.muted, fontSize: 12, fontWeight: '600' }}>⚡ {gig.delivery_days} day(s) delivery</Text>
      </View>

      <Text style={{ color: theme.colors.text, fontSize: 17, fontWeight: '800', marginTop: 10 }}>{gig.title}</Text>
      <Text numberOfLines={2} style={{ color: theme.colors.muted, marginTop: 6, lineHeight: 19, fontSize: 14 }}>
        {gig.description}
      </Text>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F2EFF8' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>
              {sellerName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={{ color: theme.colors.text, fontSize: 12, fontWeight: '700' }}>{sellerName}</Text>
            {sellerCourse ? (
              <Text style={{ color: theme.colors.muted, fontSize: 10 }}>{sellerCourse}</Text>
            ) : null}
          </View>
        </View>
        <Text style={{ color: theme.colors.primaryDark, fontSize: 17, fontWeight: '900' }}>
          ₹{(gig.price_paise / 100).toFixed(0)}
        </Text>
      </View>
    </Pressable>
  );
}
