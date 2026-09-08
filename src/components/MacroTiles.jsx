import React from 'react';
import { Text, View } from 'react-native';
import { colors } from '../theme/colors';

const MACROS = [
  { key: 'protein', label: 'Protein', color: colors.macro.protein },
  { key: 'carbs', label: 'Karbo', color: colors.macro.carbs },
  { key: 'fat', label: 'Lemak', color: colors.macro.fat },
];

/**
 * Baris tiga kotak makro, dipakai di layar tambah makanan dan detail makanan.
 * `targets` opsional — kalau diberikan, tiap kotak menampilkan persentasenya.
 */
export function MacroTiles({ values, targets, className = '' }) {
  return (
    <View className={`flex-row gap-3 ${className}`}>
      {MACROS.map((macro) => {
        const value = values[macro.key];
        const target = targets?.[macro.key];

        return (
          <View key={macro.key} className="flex-1 rounded-2xl bg-surface-sunken p-3">
            <Text className="text-base font-bold text-ink">{value} g</Text>
            <Text className="mt-0.5 text-xs text-ink-muted">{macro.label}</Text>
            {target ? (
              <Text className="mt-1 text-2xs font-semibold" style={{ color: macro.color }}>
                {Math.round((value / target) * 100)}% dari target
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

export default MacroTiles;
