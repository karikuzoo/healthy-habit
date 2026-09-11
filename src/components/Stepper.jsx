import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

/**
 * Pengatur angka: tombol minus, angka yang bisa diketik, tombol plus.
 *
 * Angkanya sengaja tetap berupa TextInput, bukan hanya label. Menaikkan
 * durasi plank dari 30 ke 90 detik lewat tombol saja butuh belasan ketukan;
 * mengetik langsung jauh lebih cepat, sementara tombolnya tetap ada untuk
 * penyesuaian kecil.
 *
 * Nilai dipegang sebagai teks oleh pemanggil supaya kolomnya boleh kosong
 * selagi diketik. Pembulatan ke rentang yang sah dilakukan saat kolom
 * ditinggalkan (`onBlur`), bukan di setiap ketukan tombol.
 */
export function Stepper({
  label,
  hint,
  value,
  onChange,
  min = 1,
  max = 999,
  step = 1,
}) {
  const current = Number(value);
  const safe = Number.isFinite(current) ? current : min;

  const nudge = (delta) => {
    const next = Math.min(Math.max(safe + delta, min), max);
    onChange(String(next));
  };

  const commit = () => {
    if (!Number.isFinite(current) || String(value).trim() === '') {
      onChange(String(min));
      return;
    }
    onChange(String(Math.min(Math.max(Math.round(current), min), max)));
  };

  return (
    <View className="gap-2">
      <View className="flex-row items-baseline justify-between">
        <Text className="text-sm font-semibold text-ink">{label}</Text>
        {hint ? <Text className="text-2xs text-ink-subtle">{hint}</Text> : null}
      </View>

      <View className="h-14 flex-row items-center rounded-2xl border border-line bg-surface px-2">
        <Pressable
          onPress={() => nudge(-step)}
          disabled={safe <= min}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`Kurangi ${label}`}
          className={`h-10 w-10 items-center justify-center rounded-full bg-surface-sunken active:opacity-60 ${
            safe <= min ? 'opacity-40' : ''
          }`}
        >
          <Ionicons name="remove" size={20} color={colors.ink.DEFAULT} />
        </Pressable>

        <TextInput
          value={String(value)}
          onChangeText={(text) => onChange(text.replace(/[^0-9]/g, ''))}
          onBlur={commit}
          keyboardType="number-pad"
          selectTextOnFocus
          accessibilityLabel={label}
          className="flex-1 text-center text-xl font-bold text-ink"
        />

        <Pressable
          onPress={() => nudge(step)}
          disabled={safe >= max}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`Tambah ${label}`}
          className={`h-10 w-10 items-center justify-center rounded-full bg-brand-soft active:opacity-60 ${
            safe >= max ? 'opacity-40' : ''
          }`}
        >
          <Ionicons name="add" size={20} color={colors.brand.DEFAULT} />
        </Pressable>
      </View>
    </View>
  );
}

export default Stepper;
