import React from 'react';
import { View, Text, Pressable } from 'react-native';

export default function RatingStars({ rating = 5, maxStars = 5, size = 18, interactive = false, onRate }) {
  const stars = [];

  for (let i = 1; i <= maxStars; i++) {
    const isFilled = i <= Math.round(rating);
    stars.push(
      <Pressable
        key={i}
        disabled={!interactive}
        onPress={() => interactive && onRate && onRate(i)}
        style={{ padding: interactive ? 6 : 1 }}>
        <Text style={{ fontSize: size, color: isFilled ? '#F59E0B' : '#D1D5DB' }}>
          ★
        </Text>
      </Pressable>
    );
  }

  return <View style={{ flexDirection: 'row', alignItems: 'center' }}>{stars}</View>;
}

