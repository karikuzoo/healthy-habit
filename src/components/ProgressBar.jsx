import React from 'react';
import { View } from 'react-native';

/**
 * Bar progres. `value` diterima 0..1 dan dijepit agar tidak meluber
 * saat data melebihi target.
 */
export function ProgressBar({ value = 0, className = '', barClassName = 'bg-brand' }) {
  const pct = Math.round(Math.min(Math.max(value, 0), 1) * 100);

  return (
    <View className={`h-2 overflow-hidden rounded-full bg-line ${className}`}>
      <View className={`h-full rounded-full ${barClassName}`} style={{ width: `${pct}%` }} />
    </View>
  );
}

export default ProgressBar;
