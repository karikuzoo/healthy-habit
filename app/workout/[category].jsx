import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Card, ExerciseMedia, Screen, ScreenHeader } from '../../src/components';
import { colors } from '../../src/theme/colors';
import {
  equipmentLabel,
  exerciseCategories,
  exercisesInCategory,
  formatSets,
} from '../../src/data/workout';

export default function CategoryScreen() {
  const { category } = useLocalSearchParams();

  const title =
    exerciseCategories.find((item) => item.id === category)?.name ?? 'Kategori';
  const exercises = exercisesInCategory(category);

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
                  <ExerciseMedia exerciseId={exercise.id} size={64} />
                  <View className="flex-1">
                    <Text className="text-base font-bold text-ink">{exercise.name}</Text>
                    <Text className="mt-0.5 text-sm text-ink-muted">
                      {formatSets(exercise)}
                    </Text>

                    {equipmentLabel(exercise) ? (
                      <View className="mt-1 flex-row items-center gap-1">
                        <Ionicons name="alert-circle-outline" size={11} color={colors.steps.DEFAULT} />
                        <Text className="text-2xs text-steps">{equipmentLabel(exercise)}</Text>
                      </View>
                    ) : null}
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
