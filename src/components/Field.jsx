import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

/**
 * Input berlabel. `secure` menampilkan tombol mata untuk toggle visibilitas.
 * `icon` adalah nama ikon Ionicons yang muncul di sisi kiri.
 */
export function Field({
  label,
  icon,
  secure = false,
  multiline = false,
  className = '',
  ...inputProps
}) {
  const [visible, setVisible] = useState(false);

  return (
    <View className={`gap-2 ${className}`}>
      {label ? (
        <Text className="text-sm font-semibold text-ink">{label}</Text>
      ) : null}

      <View
        className={`flex-row items-center gap-3 rounded-2xl border border-line bg-surface px-4 ${
          multiline ? 'h-24 py-3' : 'h-14'
        }`}
      >
        {icon ? (
          <Ionicons name={icon} size={20} color={colors.ink.muted} />
        ) : null}

        <TextInput
          className="flex-1 text-base text-ink"
          placeholderTextColor={colors.ink.subtle}
          secureTextEntry={secure && !visible}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          {...inputProps}
        />

        {secure ? (
          <Pressable
            onPress={() => setVisible((v) => !v)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
          >
            <Ionicons
              name={visible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.ink.muted}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export default Field;
