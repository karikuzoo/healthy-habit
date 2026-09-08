import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Card, Screen, ScreenHeader } from '../../src/components';
import { colors } from '../../src/theme/colors';
import { exerciseCategories, exercisesByCategory, formatSets } from '../../src/data/workout';

export default function CategoryScreen() {
  const { category } = useLocalSearchParams();

  const title =
    exerciseCategories.find((item) => item.id === category)?.name ?? 'Kategori';
  const exercises = exercisesByCategory[category] ?? [];

  return (
    <Screen>
      <ScreenHeader title={title} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-3 px-5 pb-8 pt-2">
          {exercises.length === 0 ? (
            <Card className="items-center gap-2 p-8">
              <Ionicons name="barbell-outline" size={28} color={colors.ink.subtle} />
              <Text className="text-sm text-ink-muted">
                Belum ada gerakan untuk kategori ini.
              </Text>
            </Card>
          ) : (
            exercises.map((exercise) => (
              <Pressable
                key={exercise.id}
                onPress={() => router.push(`/workout/session?exercise=${exercise.id}`)}
                accessibilityRole="button"
                className="active:opacity-80"
              >
                <Card className="flex-row items-center gap-4 p-3">
                  <View className="h-16 w-16 items-center justify-center rounded-xl bg-surface-sunken">
                    <Ionicons name="barbell-outline" size={24} color={colors.ink.subtle} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-ink">{exercise.name}</Text>
                    <Text className="mt-0.5 text-sm text-ink-muted">
                      {formatSets(exercise)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.ink.subtle} />
                </Card>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
