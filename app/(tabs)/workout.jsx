import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Button, Card, Screen } from '../../src/components';
import { colors } from '../../src/theme/colors';
import { formatSets, todayWorkout } from '../../src/data/workout';

function SummaryItem({ value, label }) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-2xl font-bold text-white">{value}</Text>
      <Text className="mt-0.5 text-xs text-white/75">{label}</Text>
    </View>
  );
}

export default function WorkoutScreen() {
  const { exercises } = todayWorkout;

  return (
    <Screen>
      <View className="px-5 pt-2">
        <Text className="text-3xl font-bold text-ink">Workout</Text>
        <Text className="mt-1 text-sm text-ink-muted">
          {todayWorkout.level} • {todayWorkout.durationMinutes} menit • {todayWorkout.intensity}
        </Text>

        {/* Ringkasan diturunkan dari daftar gerakan, bukan angka terpisah */}
        <View className="mt-5 flex-row items-center rounded-card bg-brand p-4">
          <SummaryItem value={todayWorkout.estimatedCalories} label="kkal" />
          <View className="h-8 w-px bg-white/25" />
          <SummaryItem value={exercises.length} label="gerakan" />
          <View className="h-8 w-px bg-white/25" />
          <SummaryItem value={`${todayWorkout.restSeconds}s`} label="istirahat" />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="mt-5">
        <View className="gap-3 px-5 pb-4">
          {exercises.map((exercise, index) => (
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
                  <Text className="text-2xs font-bold tracking-wider text-brand">
                    GERAKAN {index + 1}
                  </Text>
                  <Text className="mt-0.5 text-base font-bold text-ink">{exercise.name}</Text>
                  <Text className="mt-0.5 text-sm text-ink-muted">{formatSets(exercise)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.ink.subtle} />
              </Card>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View className="px-5 pb-3 pt-1">
        <Button label="Tambahkan gerakan" onPress={() => router.push('/workout/add')} />
      </View>
    </Screen>
  );
}
