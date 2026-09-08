import React from 'react';
import { Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

/**
 * Pill yang bisa dipilih.
 * `tone="solid"` untuk filter (isian hijau penuh, mis. chip waktu makan),
 * `tone="soft"` untuk pilihan tujuan (isian hijau muda + centang).
 */
export function Chip({ label, active = false, onPress, tone = 'soft', className = '' }) {
  const solid = tone === 'solid';

  const box = active
    ? solid
      ? 'bg-brand border-brand'
      : 'bg-brand-soft border-brand'
    : 'bg-surface border-line';

  const text = active
    ? solid
      ? 'text-white'
      : 'text-brand-dark'
    : 'text-ink-muted';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className={`flex-row items-center gap-1.5 rounded-full border px-4 py-2.5 active:opacity-80 ${box} ${className}`}
    >
      {active && !solid ? (
        <Ionicons name="checkmark-circle" size={16} color={colors.brand.DEFAULT} />
      ) : null}
      <Text className={`text-sm font-semibold ${text}`}>{label}</Text>
    </Pressable>
  );
}

export default Chip;
