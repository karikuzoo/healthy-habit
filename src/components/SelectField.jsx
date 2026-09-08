import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

/**
 * Baris pilihan berlabel yang tampilannya menyerupai input.
 *
 * Kalau `options` diberikan, mengetuknya membuka daftar pilihan inline
 * (tanpa dependensi picker tambahan). Tanpa `options`, komponen ini hanya
 * memanggil `onPress` — dipakai untuk field yang butuh picker khusus.
 */
export function SelectField({
  label,
  value,
  placeholder,
  icon,
  options,
  onChange,
  onPress,
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const selected = options?.find((option) => option.value === value);
  const display = selected?.label ?? value;
  const hasValue = Boolean(display);

  const handlePress = () => {
    if (options) {
      setOpen((prev) => !prev);
    } else {
      onPress?.();
    }
  };

  return (
    <View className={`gap-2 ${className}`}>
      {label ? (
        <Text className="text-sm font-semibold text-ink">{label}</Text>
      ) : null}

      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityState={{ expanded: options ? open : undefined }}
        className="h-14 flex-row items-center gap-3 rounded-2xl border border-line bg-surface px-4 active:opacity-70"
      >
        {icon ? <Ionicons name={icon} size={20} color={colors.ink.muted} /> : null}

        <Text className={`flex-1 text-base ${hasValue ? 'text-ink' : 'text-ink-subtle'}`}>
          {hasValue ? display : placeholder}
        </Text>

        <Ionicons
          name={options && open ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.ink.muted}
        />
      </Pressable>

      {options && open ? (
        <View className="overflow-hidden rounded-2xl border border-line bg-surface">
          {options.map((option, index) => {
            const active = option.value === value;
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  onChange?.(option.value);
                  setOpen(false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                className={`flex-row items-center justify-between px-4 py-3 active:bg-surface-sunken ${
                  index > 0 ? 'border-t border-line-soft' : ''
                }`}
              >
                <Text className={`text-base ${active ? 'font-semibold text-brand-dark' : 'text-ink'}`}>
                  {option.label}
                </Text>
                {active ? (
                  <Ionicons name="checkmark" size={18} color={colors.brand.DEFAULT} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

export default SelectField;
