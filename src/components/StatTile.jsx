import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';

/**
 * Kotak ringkasan kecil: ikon berlatar lembut, angka, lalu label.
 */
export function StatTile({ icon, iconColor, iconBgClassName, value, label, className = '' }) {
  return (
    <Card className={`flex-1 p-4 ${className}`}>
      <View className={`h-9 w-9 items-center justify-center rounded-xl ${iconBgClassName}`}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text className="mt-3 text-lg font-bold text-ink">{value}</Text>
      <Text className="mt-0.5 text-xs text-ink-muted">{label}</Text>
    </Card>
  );
}

export default StatTile;
