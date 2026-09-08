import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '../theme/colors';

/**
 * Header layar stack: tombol kembali + judul.
 * Judul sengaja rata kiri (mengikuti mockup), bukan di tengah.
 */
export function ScreenHeader({ title, onBack, className = '' }) {
  return (
    <View className={`flex-row items-center gap-3 px-5 py-3 ${className}`}>
      <Pressable
        onPress={onBack ?? (() => router.back())}
        accessibilityRole="button"
        accessibilityLabel="Kembali"
        hitSlop={8}
        className="h-10 w-10 items-center justify-center rounded-full active:bg-surface-sunken"
      >
        <Ionicons name="arrow-back" size={24} color={colors.ink.DEFAULT} />
      </Pressable>
      <Text className="text-2xl font-bold text-ink">{title}</Text>
    </View>
  );
}

export default ScreenHeader;
