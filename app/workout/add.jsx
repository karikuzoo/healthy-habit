import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Card, Screen, ScreenHeader } from '../../src/components';
import { colors } from '../../src/theme/colors';
import { exerciseCategories, exercisesByCategory } from '../../src/data/workout';

/**
 * Pemilih kategori untuk tombol "Tambahkan gerakan".
 * Sebelumnya tombol itu menuju rute '/workout/kategori' yang tidak pernah ada.
 */
export default function AddExerciseScreen() {
  return (
    <Screen>
      <ScreenHeader title="Tambahkan gerakan" />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-3 px-5 pb-8 pt-2">
          <Text className="mb-1 text-sm text-ink-muted">
            Pilih kategori untuk melihat daftar gerakannya.
          </Text>

          {exerciseCategories.map((category) => (
            <Pressable
              key={category.id}
              onPress={() => router.push(`/workout/${category.id}`)}
              accessibilityRole="button"
              className="active:opacity-80"
            >
              <Card className="flex-row items-center gap-4 p-4">
                <View className="h-11 w-11 items-center justify-center rounded-xl bg-brand-soft">
                  <Ionicons name="barbell" size={20} color={colors.brand.DEFAULT} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-ink">{category.name}</Text>
                  <Text className="mt-0.5 text-sm text-ink-muted">
                    {exercisesByCategory[category.id]?.length ?? 0} gerakan
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.ink.subtle} />
              </Card>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
