import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '../theme/colors';

/** Penanda tunggu saat migrasi database dan pembacaan profil awal. */
export function Loading() {
  return (
    <View className="flex-1 items-center justify-center bg-surface-muted">
      <ActivityIndicator color={colors.brand.DEFAULT} />
    </View>
  );
}

export default Loading;
