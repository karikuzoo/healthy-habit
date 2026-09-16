import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Field, Screen, ScreenHeader, StepProgress } from '../src/components';
import { colors } from '../src/theme/colors';
import { validateRegister } from '../src/lib/validateAuth';
import { useUser } from '../src/context/UserContext';

export default function RegisterScreen() {
  const { register } = useUser();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [agreed, setAgreed] = useState(false);

  /** Galat baru muncul setelah percobaan pertama — lihat catatan di login.jsx. */
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const validateNow = (nextForm, nextAgreed) =>
    validateRegister({ ...nextForm, agreed: nextAgreed });

  const setField = (key) => (value) => {
    const next = { ...form, [key]: value };
    setForm(next);
    if (submitted) setErrors(validateNow(next, agreed).errors);
  };

  const toggleAgreed = () => {
    const next = !agreed;
    setAgreed(next);
    if (submitted) setErrors(validateNow(form, next).errors);
  };

  const handleContinue = async () => {
    const result = validateNow(form, agreed);

    setSubmitted(true);
    setErrors(result.errors);
    if (!result.valid) return;

    /**
     * Kata sandinya disimpan sebagai salt + hash, bukan teks polos — dan itu
     * pun hanya gerbang lokal, bukan keamanan. Lihat `src/lib/password.js`
     * untuk batas yang harus disadari.
     *
     * Ini yang membuat layar masuk punya sesuatu untuk dicocokkan; sebelum
     * ada ini, email yang belum pernah didaftarkan pun bisa masuk.
     */
    await register({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      password: form.password,
    });
    router.push('/register-profile');
  };

  return (
    <Screen className="bg-surface">
      <StepProgress step={1} className="pb-1 pt-2" />
      <ScreenHeader title="Buat Akun" />

      <ScrollView keyboardShouldPersistTaps="handled">
        <View className="gap-5 px-6 pb-8 pt-2">
          <Field
            label="Nama Depan"
            placeholder="Masukkan nama depan"
            value={form.firstName}
            onChangeText={setField('firstName')}
            error={errors.firstName}
          />
          <Field
            label="Nama Belakang"
            placeholder="Masukkan nama belakang"
            value={form.lastName}
            onChangeText={setField('lastName')}
          />
          <Field
            label="Email"
            placeholder="email@mail.com"
            value={form.email}
            onChangeText={setField('email')}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Field
            label="Kata Sandi"
            placeholder="Minimal 8 karakter"
            value={form.password}
            onChangeText={setField('password')}
            error={errors.password}
            secure
          />
          <Field
            label="Konfirmasi Kata Sandi"
            placeholder="Ulangi kata sandi"
            value={form.confirmPassword}
            onChangeText={setField('confirmPassword')}
            error={errors.confirmPassword}
            secure
          />

          <View className="gap-2">
            <Pressable
              onPress={toggleAgreed}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreed }}
              className="flex-row items-start gap-3"
            >
              <View
                className={`mt-0.5 h-5 w-5 items-center justify-center rounded border-2 ${
                  agreed
                    ? 'border-brand bg-brand'
                    : errors.agreed
                      ? 'border-danger'
                      : 'border-line'
                }`}
              >
                {agreed ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
              </View>
              <Text className="flex-1 text-sm leading-5 text-ink-muted">
                Saya setuju dengan{' '}
                <Text className="font-semibold text-brand-dark">Syarat Layanan</Text> dan{' '}
                <Text className="font-semibold text-brand-dark">Kebijakan Privasi</Text>.
              </Text>
            </Pressable>

            {errors.agreed ? (
              <View className="flex-row items-center gap-1.5">
                <Ionicons name="alert-circle" size={13} color={colors.danger.DEFAULT} />
                <Text className="flex-1 text-xs text-danger">{errors.agreed}</Text>
              </View>
            ) : null}
          </View>

          <Button label="Lanjutkan" onPress={handleContinue} className="mt-2" />

          <Pressable
            onPress={() => router.push('/login')}
            accessibilityRole="button"
            className="items-center py-4"
          >
            <Text className="text-sm text-ink-muted">
              Sudah punya akun? <Text className="font-semibold text-brand-dark">Masuk</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}
