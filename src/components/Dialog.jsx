import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { Button } from './Button';

/**
 * Dialog di tengah layar, bergaya aplikasi.
 *
 * Berbeda dari `ActionSheet` yang naik dari bawah untuk MEMILIH tindakan,
 * dialog ini untuk MENYAMPAIKAN sesuatu yang perlu diakui dulu sebelum
 * lanjut — keberhasilan mendaftar, misalnya.
 *
 * `Alert` bawaan sistem tetap tempatnya untuk galat dan konfirmasi merusak:
 * di sana tampilan sistem justru keunggulan, karena pengguna sudah
 * mengenalinya sebagai peringatan. Momen berhasil sebaliknya — itu milik
 * aplikasi, dan digambar sistem membuatnya terasa seperti milik orang lain.
 *
 * `dismissable` sengaja bawaannya false. Dialog yang menahan navigasi harus
 * ditutup lewat tombolnya, supaya langkah berikutnya selalu disengaja dan
 * tidak terjadi karena ketukan yang meleset ke latar.
 */

const TONES = {
  success: { bg: 'bg-brand-soft', color: colors.brand.DEFAULT },
  danger: { bg: 'bg-danger-soft', color: colors.danger.DEFAULT },
  neutral: { bg: 'bg-surface-sunken', color: colors.ink.muted },
};

export function Dialog({
  visible,
  onClose,
  icon = 'checkmark-circle',
  tone = 'success',
  title,
  description,
  actionLabel = 'Lanjut',
  onAction,
  secondaryLabel,
  onSecondary,
  dismissable = false,
}) {
  const palette = TONES[tone] ?? TONES.neutral;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismissable ? onClose : () => {}}
    >
      <Pressable
        onPress={dismissable ? onClose : undefined}
        accessibilityRole={dismissable ? 'button' : 'none'}
        className="flex-1 items-center justify-center bg-ink/50 px-8"
      >
        <Pressable
          onPress={() => {}}
          accessibilityViewIsModal
          className="w-full items-center gap-3 rounded-3xl bg-surface px-6 py-7"
        >
          <View
            className={`h-16 w-16 items-center justify-center rounded-full ${palette.bg}`}
          >
            <Ionicons name={icon} size={34} color={palette.color} />
          </View>

          {title ? (
            <Text className="mt-1 text-center text-xl font-bold text-ink">
              {title}
            </Text>
          ) : null}

          {description ? (
            <Text className="text-center text-sm leading-6 text-ink-muted">
              {description}
            </Text>
          ) : null}

          <Button
            label={actionLabel}
            onPress={onAction ?? onClose}
            className="mt-3 w-full"
          />

          {secondaryLabel ? (
            <Pressable
              onPress={onSecondary ?? onClose}
              accessibilityRole="button"
              className="py-2 active:opacity-70"
            >
              <Text className="text-sm font-bold text-ink-muted">
                {secondaryLabel}
              </Text>
            </Pressable>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default Dialog;
