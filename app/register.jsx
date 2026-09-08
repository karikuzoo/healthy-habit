import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Field, Screen, ScreenHeader, StepProgress } from '../src/components';
import { useUser } from '../src/context/UserContext';

export default function RegisterScreen() {
  const { updateUser } = useUser();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [agreed, setAgreed] = useState(false);

  const setField = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleContinue = async () => {
    await updateUser({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
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
            placeholder="Padlan"
            value={form.firstName}
            onChangeText={setField('firstName')}
          />
          <Field
            label="Nama Belakang"
            placeholder="Prabowo"
            value={form.lastName}
            onChangeText={setField('lastName')}
          />
          <Field
            label="Email"
            placeholder="prabowoteddy@mail.com"
            value={form.email}
            onChangeText={setField('email')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Field
            label="Kata Sandi"
            placeholder="Minimal 8 karakter"
            value={form.password}
            onChangeText={setField('password')}
            secure
          />
          <Field
            label="Konfirmasi Kata Sandi"
            placeholder="Ulangi kata sandi"
            value={form.confirmPassword}
            onChangeText={setField('confirmPassword')}
            secure
          />

          <Pressable
            onPress={() => setAgreed((prev) => !prev)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreed }}
            className="flex-row items-start gap-3"
          >
            <View
              className={`mt-0.5 h-5 w-5 items-center justify-center rounded border-2 ${
                agreed ? 'border-brand bg-brand' : 'border-line'
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
