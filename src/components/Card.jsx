import React from 'react';
import { View } from 'react-native';
import { cardShadow } from '../theme/shadows';

/**
 * Kartu putih dengan shadow standar.
 * Shadow lewat `style` karena box-shadow Tailwind tidak memetakan bersih ke RN.
 */
export function Card({ children, className = '', shadow = true }) {
  return (
    <View
      className={`rounded-2xl bg-surface ${className}`}
      style={shadow ? cardShadow : undefined}
    >
      {children}
    </View>
  );
}

export default Card;
