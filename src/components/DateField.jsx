import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { dateLabel, fromIsoDate, toIsoDate } from '../lib/dates';
import { DatePickerSheet } from './DatePickerSheet';

/**
 * Kolom tanggal (AUTH-10).
 *
 * Tampilannya menyerupai `SelectField`, dan isinya dibuka oleh kalender
 * bergaya aplikasi — bukan pemilih bawaan sistem. Pemilih bawaan digambar
 * Android/iOS sendiri, jadi warna dan bentuknya tidak bisa disamakan dengan
 * layar di sekitarnya, dan keduanya pun tampil berbeda satu sama lain.
 *
 * `value` dan `onChange` memakai 'YYYY-MM-DD', bentuk yang sama dengan kolom
 * `birth_date` di database — jadi tidak ada konversi yang tercecer di layar.
 */
export function DateField({
  label,
  value,
  onChange,
  placeholder = 'Pilih tanggal',
  icon = 'calendar-outline',
  minimumDate,
  maximumDate,
  className = '',
}) {
  const [open, setOpen] = useState(false);

  const display = dateLabel(value);

  return (
    <View className={`gap-2 ${className}`}>
      {label ? (
        <Text className="text-sm font-semibold text-ink">{label}</Text>
      ) : null}

      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label ? `${label}: ${display || placeholder}` : undefined}
        className="h-14 flex-row items-center gap-3 rounded-2xl border border-line bg-surface px-4 active:opacity-70"
      >
        {icon ? <Ionicons name={icon} size={20} color={colors.ink.muted} /> : null}

        <Text className={`flex-1 text-base ${display ? 'text-ink' : 'text-ink-subtle'}`}>
          {display || placeholder}
        </Text>

        <Ionicons name="chevron-down" size={20} color={colors.ink.muted} />
      </Pressable>

      <DatePickerSheet
        visible={open}
        onClose={() => setOpen(false)}
        onSelect={(date) => {
          onChange?.(toIsoDate(date));
          setOpen(false);
        }}
        value={value ? fromIsoDate(value) : null}
        title={label ?? placeholder}
        minimumDate={minimumDate}
        maximumDate={maximumDate}
      />
    </View>
  );
}

export default DateField;
