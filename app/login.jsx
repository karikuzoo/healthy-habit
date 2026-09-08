import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Field, Screen, Segmented } from '../src/components';
import { useUser } from '../src/context/UserContext';

const TABS = [
  { value: 'masuk', label: 'Masuk' },
  { value: 'daftar', label: 'Daftar' },
];

export default function LoginScreen() {
  const { login } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    login();
    router.replace('/(tabs)');
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
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Field
              label="Kata sandi"
              icon="lock-closed-outline"
              placeholder="Masukkan kata sandi"
              value={password}
              onChangeText={setPassword}
              secure
            />

            <Pressable className="self-end" hitSlop={8} accessibilityRole="button">
              <Text className="text-sm font-semibold text-brand-dark">Lupa kata sandi?</Text>
            </Pressable>

            <Button label="Masuk" onPress={handleLogin} className="mt-2" />

            <Text className="mt-2 text-center text-sm text-ink-muted">
              atau lanjutkan dengan Google
            </Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
