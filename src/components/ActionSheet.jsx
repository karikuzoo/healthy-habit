import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

/**
 * Lembar pilihan yang muncul dari bawah layar.
 *
 * Menggantikan `Alert.alert` berisi daftar tindakan. `Alert` digambar oleh
 * SISTEM: bentuk, warna, dan urutan tombolnya milik Android/iOS, bukan milik
 * aplikasi — dan di Android tiga tombol pilihan berdesak-desakan dalam satu
 * baris tanpa ikon. Lembar ini memakai token yang sama dengan seluruh layar
 * lain, jadi pilihannya terbaca sebagai bagian dari aplikasi.
 *
 * `Alert` TETAP dipakai untuk pesan dan konfirmasi sederhana — di sana
 * tampilan bawaan sistem justru keunggulan, karena pengguna sudah mengenalinya
 * sebagai peringatan.
 *
 * Bentuk `options`: `{ label, icon, tone, onPress }` dengan `tone` bernilai
 * `'danger'` untuk tindakan merusak.
 */
export function ActionSheet({
  visible,
  onClose,
  title,
  description,
  options = [],
  cancelLabel = 'Batal',
}) {
  const insets = useSafeAreaInsets();

  /**
   * Lembar ditutup LEBIH DULU, tindakannya menyusul frame berikutnya.
   *
   * Beberapa tindakan membuka layar sistemnya sendiri (pemilih foto, kamera).
   * Membukanya selagi lembar ini masih terpasang membuat iOS menolak dengan
   * "attempt to present while another is presenting".
   */
  const runAfterClose = (action) => {
    onClose();
    if (action) requestAnimationFrame(action);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Latar gelap; mengetuknya menutup lembar, sama seperti tombol Batal */}
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Tutup pilihan"
        className="flex-1 justify-end bg-ink/50"
      >
        {/* Ketukan di dalam lembar tidak boleh menembus ke latar */}
        <Pressable
          onPress={() => {}}
          accessibilityRole="none"
          className="rounded-t-3xl bg-surface pt-2"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          {/* Penanda geser — isyarat visual bahwa ini lembar, bukan layar */}
          <View className="mb-3 self-center h-1 w-10 rounded-full bg-line" />

          {title ? (
            <View className="px-5 pb-2">
              <Text className="text-base font-bold text-ink">{title}</Text>
              {description ? (
                <Text className="mt-0.5 text-xs leading-5 text-ink-muted">
                  {description}
                </Text>
              ) : null}
            </View>
          ) : null}

          <View className="px-2 pt-1">
            {options.map((option) => {
              const danger = option.tone === 'danger';

              return (
                <Pressable
                  key={option.label}
                  onPress={() => runAfterClose(option.onPress)}
                  accessibilityRole="button"
                  className="flex-row items-center gap-4 rounded-2xl px-3 py-3.5 active:bg-surface-sunken"
                >
                  <View
                    className={`h-10 w-10 items-center justify-center rounded-full ${
                      danger ? 'bg-danger-soft' : 'bg-brand-soft'
                    }`}
                  >
                    <Ionicons
                      name={option.icon}
                      size={19}
                      color={danger ? colors.danger.DEFAULT : colors.brand.DEFAULT}
                    />
                  </View>

                  <Text
                    className={`flex-1 text-base font-semibold ${
                      danger ? 'text-danger' : 'text-ink'
                    }`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View className="mx-5 mt-2 border-t border-line-soft pt-2">
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              className="items-center rounded-2xl py-3.5 active:bg-surface-sunken"
            >
              <Text className="text-base font-bold text-ink-muted">
                {cancelLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default ActionSheet;
