import React from 'react';
import { Pressable, Text } from 'react-native';

const VARIANTS = {
  primary: { box: 'bg-brand', label: 'text-white' },
  soft: { box: 'bg-brand-soft', label: 'text-brand-dark' },
  outline: { box: 'bg-transparent border border-brand', label: 'text-brand-dark' },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  className = '',
  children,
}) {
  const styles = VARIANTS[variant] ?? VARIANTS.primary;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className={`h-14 items-center justify-center rounded-2xl active:opacity-80 ${styles.box} ${className}`}
    >
      {children ?? (
        <Text className={`text-base font-bold ${styles.label}`}>{label}</Text>
      )}
    </Pressable>
  );
}

export default Button;
