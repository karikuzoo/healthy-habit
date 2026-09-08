import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../theme/colors';

/**
 * Ring progres berbasis SVG.
 *
 * Menggantikan trik lama `borderColor` + `transform: rotate` yang render-nya
 * tidak akurat (sudutnya selalu kelipatan 90 derajat dan teks di dalamnya
 * harus diputar balik satu per satu).
 */
export function ProgressRing({
  size = 88,
  strokeWidth = 8,
  value = 0,
  color = colors.brand.light,
  trackColor = colors.line.DEFAULT,
  children,
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = circumference * Math.min(Math.max(value, 0), 1);
  const center = size / 2;

  return (
    <View className="items-center justify-center" style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference - filled}`}
          transform={`rotate(-90 ${center} ${center})`}
          fill="none"
        />
      </Svg>
      {children}
    </View>
  );
}

export default ProgressRing;
