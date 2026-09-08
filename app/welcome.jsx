import React from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Screen } from '../src/components';
import { colors } from '../src/theme/colors';

export default function WelcomeScreen() {
  return (
    <Screen className="bg-surface" edges={[]}>
      {/* Placeholder foto sampul — ganti dengan <Image> saat asetnya tersedia */}
      <View className="h-[45%] items-center justify-center rounded-b-3xl bg-brand-soft">
        <Ionicons name="body-outline" size={72} color={colors.brand.light} />
      </View>

      <View className="flex-1 justify-center px-6">
        <Text className="mb-4 text-xs font-bold tracking-widest text-brand-dark">
          HEALTHY HABIT
        </Text>
        <Text className="mb-3 text-stat font-bold text-ink">
          Sehat terasa lebih sederhana.
        </Text>
        <Text className="mb-10 text-base leading-6 text-ink-muted">
          Olahraga, tidur, nutrisi, dan langkah harian—semua dalam satu ritme.
        </Text>

        <View className="gap-3">
          <Button label="Daftar sekarang" onPress={() => router.push('/register')} />
          <Button
            label="Saya sudah punya akun"
            variant="soft"
            onPress={() => router.push('/login')}
          />
        </View>
      </View>
    </Screen>
  );
}
