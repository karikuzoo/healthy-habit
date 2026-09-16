import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Button, Field, Screen, Segmented } from '../src/components';
import { enterApp } from '../src/lib/navigation';
import { colors } from '../src/theme/colors';
import { validateLogin } from '../src/lib/validateAuth';
import { useUser } from '../src/context/UserContext';

const TABS = [
  { value: 'masuk', label: 'Masuk' },
  { value: 'daftar', label: 'Daftar' },
];

export default function LoginScreen() {
  const { signIn } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  /**
   * Galat hanya muncul SETELAH tombol Masuk ditekan sekali, bukan selagi
   * mengetik. Menandai kolom merah pada huruf pertama email adalah menegur
   * orang yang belum selesai bicara.
   */
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  /** Pesan gagal dari pemeriksaan kredensial, terpisah dari galat per kolom. */
  const [authError, setAuthError] = useState('');
  const [checking, setChecking] = useState(false);

  const handleLogin = async () => {
    if (checking) return;

    const result = validateLogin({ email, password });

    setSubmitted(true);
    setErrors(result.errors);
    setAuthError('');
    if (!result.valid) return;

    setChecking(true);
    const attempt = await signIn({ email, password });
    setChecking(false);

    if (attempt.ok) {
      enterApp();
      return;
    }

    // "Belum ada akun" dan "kredensial salah" butuh JALAN KELUAR yang
    // berbeda: yang satu harus mendaftar dulu, yang satu mencoba lagi.
    setAuthError(
      attempt.reason === 'belum-terdaftar'
        ? 'Belum ada akun terdaftar di perangkat ini. Daftar dulu untuk membuatnya.'
        : 'Email atau kata sandi salah.',
    );
  };

  // Sesudah percobaan pertama, galat diperbarui tiap ketikan — supaya pesan
  // merahnya hilang begitu diperbaiki, bukan bertahan sampai ditekan lagi.
  const revalidate = (next) => {
    setAuthError('');
    if (submitted) setErrors(validateLogin(next).errors);
  };

  const changeEmail = (value) => {
    setEmail(value);
    revalidate({ email: value, password });
  };

  const changePassword = (value) => {
    setPassword(value);
    revalidate({ email, password: value });
  };

  return (
    <Screen className="bg-surface">
      <ScrollView keyboardShouldPersistTaps="handled">
        <View className="px-6 pb-10 pt-10">
          <Text className="mb-2 text-xs font-bold tracking-widest text-brand-dark">
            HEALTHY HABIT
          </Text>
          <Text className="mb-2 text-3xl font-bold text-ink">Selamat datang</Text>
          <Text className="mb-8 text-base leading-6 text-ink-muted">
            Masuk atau buat akun untuk memulai perjalanan sehatmu.
          </Text>

          <Segmented
            options={TABS}
            value="masuk"
            onChange={(value) => value === 'daftar' && router.push('/register')}
            className="mb-8"
          />

          <View className="gap-4">
            <Field
              label="Email"
              icon="mail-outline"
              placeholder="nama@email.com"
              value={email}
              onChangeText={changeEmail}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Field
              label="Kata sandi"
              icon="lock-closed-outline"
              placeholder="Masukkan kata sandi"
              value={password}
              onChangeText={changePassword}
              error={errors.password}
              secure
            />

            <Pressable
              onPress={() => router.push('/reset-password')}
              className="self-end"
              hitSlop={8}
              accessibilityRole="button"
            >
              <Text className="text-sm font-semibold text-brand-dark">Lupa kata sandi?</Text>
            </Pressable>

            {authError ? (
              <View className="flex-row items-start gap-2 rounded-2xl bg-danger-soft px-4 py-3">
                <Ionicons
                  name="alert-circle"
                  size={16}
                  color={colors.danger.DEFAULT}
                />
                <Text className="flex-1 text-xs leading-5 text-danger">
                  {authError}
                </Text>
              </View>
            ) : null}

            <Button
              label={checking ? 'Memeriksa...' : 'Masuk'}
              onPress={handleLogin}
              className={checking ? 'mt-2 opacity-50' : 'mt-2'}
            />

            <Text className="mt-2 text-center text-sm text-ink-muted">
              atau lanjutkan dengan Google
            </Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
