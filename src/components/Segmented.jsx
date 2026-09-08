import React from 'react';
import { Pressable, Text, View } from 'react-native';

/**
 * Segmented control ala iOS: track abu-abu dengan pill putih di segmen aktif.
 */
export function Segmented({ options, value, onChange, className = '' }) {
  return (
    <View className={`flex-row rounded-full bg-surface-sunken p-1 ${className}`}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            className={`flex-1 items-center rounded-full py-3 ${active ? 'bg-surface' : ''}`}
          >
            <Text
              className={`text-sm font-bold ${active ? 'text-brand-dark' : 'text-ink-muted'}`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default Segmented;
