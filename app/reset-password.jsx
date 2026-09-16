import React, { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Button, Card, Field, Screen, ScreenHeader } from '../src/components';
import { colors } from '../src/theme/colors';
import { validateResetPassword } from '../src/lib/validateAuth';
import { useUser } from '../src/context/UserContext';

/**
 * Atur ulang kata sandi (AUTH-7).
 *
 * **Verifikasinya hanya "tahu email yang terdaftar"** — tanpa server, tidak
 * ada tautan atau kode yang bisa dikirim. Batas itu dikatakan di layar, bukan
 * disembunyikan, karena pengguna berhak tahu seberapa kuat pintu yang mereka
 * andalkan.
 *
 * Yang membuatnya tetap masuk akal: mendaftar ulang sudah bisa menimpa
 * kredensial tanpa menanyakan apa pun. Layar ini tidak membuka apa pun yang
 * belum terbuka — ia membuat jalannya jelas dan tidak merusak profil.
 *
 * Bentuk alurnya sengaja sama dengan yang nanti dipakai saat Supabase masuk
 * (masukkan email → setel kata sandi baru), jadi layarnya tidak terbuang.
 */
export default function ResetPasswordScreen() {
  const { changePassword } = useUser();

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  const setField = (key) => (value) => {
    const next = { ...form, [key]: value };
    setForm(next);
    setNotice('');
    if (submitted) setErrors(validateResetPassword(next).errors);
  };

  const handleSubmit = async () => {
    if (saving) return;

    const result = validateResetPassword(form);
    setSubmitted(true);
    setErrors(result.errors);
    setNotice('');
    if (!result.valid) return;

    setSaving(true);
    const attempt = await changePassword({
      email: form.email,
      password: form.password,
    });
    setSaving(false);

    if (attempt.ok) {
      Alert.alert(
        'Kata sandi diperbarui',
        'Masuk kembali memakai kata sandi barumu.',
        [{ text: 'Masuk', onPress: () => router.back() }],
      );
      return;
    }

    setNotice(
      attempt.reason === 'belum-terdaftar'
        ? 'Belum ada akun terdaftar di perangkat ini. Daftar dulu untuk membuatnya.'
        : 'Email itu tidak cocok dengan akun di perangkat ini.',
    );
  };

  return (
    <Screen className="bg-surface">
      <ScreenHeader title="Lupa kata sandi" />

      <ScrollView keyboardShouldPersistTaps="handled">
        <View className="gap-5 px-6 pb-10 pt-2">
          <Text className="text-sm leading-6 text-ink-muted">
            Masukkan email yang kamu pakai mendaftar, lalu setel kata sandi
            baru.
          </Text>

          {/* Batas yang harus dikatakan, bukan disembunyikan */}
          <Card className="flex-row items-start gap-3 p-4">
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={colors.ink.muted}
            />
            <Text className="flex-1 text-xs leading-5 text-ink-muted">
              Akunmu masih tersimpan di perangkat ini saja, jadi belum ada
              email pemulihan yang bisa dikirim. Untuk sekarang, mengetahui
              email terdaftar sudah cukup untuk menggantinya.
            </Text>
          </Card>

          <Field
            label="Email terdaftar"
            icon="mail-outline"
            placeholder="nama@email.com"
            value={form.email}
            onChangeText={setField('email')}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Field
            label="Kata sandi baru"
            icon="lock-closed-outline"
            placeholder="Minimal 8 karakter"
            value={form.password}
            onChangeText={setField('password')}
            error={errors.password}
            secure
          />

          <Field
            label="Konfirmasi kata sandi baru"
            icon="lock-closed-outline"
            placeholder="Ulangi kata sandi baru"
            value={form.confirmPassword}
            onChangeText={setField('confirmPassword')}
            error={errors.confirmPassword}
            secure
          />

          {notice ? (
            <View className="flex-row items-start gap-2 rounded-2xl bg-danger-soft px-4 py-3">
              <Ionicons
                name="alert-circle"
                size={16}
                color={colors.danger.DEFAULT}
              />
              <Text className="flex-1 text-xs leading-5 text-danger">
                {notice}
              </Text>
            </View>
          ) : null}

          <Button
            label={saving ? 'Menyimpan...' : 'Simpan kata sandi baru'}
            onPress={handleSubmit}
            className={saving ? 'mt-1 opacity-50' : 'mt-1'}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
