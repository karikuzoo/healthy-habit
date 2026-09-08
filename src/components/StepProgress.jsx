import React from 'react';
import { View } from 'react-native';

/**
 * Indikator langkah untuk alur pendaftaran dua tahap.
 * Segmen yang sedang aktif diberi warna, sisanya abu-abu.
 */
export function StepProgress({ step, total = 2, className = '' }) {
  return (
    <View
      className={`flex-row gap-2 px-5 ${className}`}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: total, now: step }}
    >
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          className={`h-1.5 flex-1 rounded-full ${i + 1 === step ? 'bg-brand' : 'bg-surface-sunken'}`}
        />
      ))}
    </View>
  );
}

export default StepProgress;
