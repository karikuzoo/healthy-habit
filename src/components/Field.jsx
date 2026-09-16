import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

/**
 * Input berlabel. `secure` menampilkan tombol mata untuk toggle visibilitas.
 * `icon` adalah nama ikon Ionicons yang muncul di sisi kiri.
 *
 * `error` menandai kolom bermasalah: bingkainya berubah merah dan pesannya
 * muncul di bawah. Pesan itu ditaruh DI SEBELAH kolomnya, bukan dikumpulkan
 * di satu tempat — kalau tiga kolom salah sekaligus, pengguna harus tahu yang
 * mana tanpa mencocokkan sendiri.
 *
 * `suffix` adalah satuan yang menempel di sisi kanan, mis. "cm" atau "kg".
 * Satuan yang hanya ditaruh di placeholder ikut hilang begitu pengguna
 * mengetik — persis saat angkanya butuh diberi konteks.
 */
export function Field({
  label,
  icon,
  secure = false,
  multiline = false,
  error = null,
  suffix = null,
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
        className={`flex-row items-center gap-3 rounded-2xl border bg-surface px-4 ${
          error ? 'border-danger' : 'border-line'
        } ${multiline ? 'h-24 py-3' : 'h-14'}`}
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

        {suffix ? (
          <Text className="text-sm font-semibold text-ink-muted">{suffix}</Text>
        ) : null}

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

      {error ? (
        <View className="flex-row items-center gap-1.5">
          <Ionicons
            name="alert-circle"
            size={13}
            color={colors.danger.DEFAULT}
          />
          <Text className="flex-1 text-xs text-danger">{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default Field;
