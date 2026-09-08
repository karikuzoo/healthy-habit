import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Screen, ScreenHeader } from '../../src/components';
import { formatSets, todayWorkout } from '../../src/data/workout';

/** 95 -> "01:35" */
function formatClock(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function SessionScreen() {
  const { exercise: exerciseId } = useLocalSearchParams();
  const [elapsed, setElapsed] = useState(0);
  const [completedSets, setCompletedSets] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const exercise =
    todayWorkout.exercises.find((item) => item.id === exerciseId) ?? todayWorkout.exercises[0];

  const allSetsDone = completedSets >= exercise.sets;

  // Estimasi kalori dibagi rata per gerakan, lalu diskala oleh waktu berjalan
  const caloriesPerSecond =
    todayWorkout.estimatedCalories / (todayWorkout.durationMinutes * 60);
  const burned = Math.round(elapsed * caloriesPerSecond);

  return (
    <Screen>
      <ScreenHeader title="Sesi Latihan" />

      <View className="flex-1 justify-between px-5 pb-6">
        <View className="items-center pt-8">
          <Text className="text-timer font-bold text-brand-dark">{formatClock(elapsed)}</Text>
          <Text className="mt-2 text-base text-ink-muted">🔥 {burned} kkal terbakar</Text>
        </View>

        <Card className="items-center gap-2 p-6">
          <Text className="text-2xl font-bold text-ink">{exercise.name}</Text>
          <Text className="text-base text-ink-muted">{formatSets(exercise)}</Text>
          <Text className="mt-2 text-sm font-semibold text-brand">
            Set {Math.min(completedSets + 1, exercise.sets)} dari {exercise.sets}
          </Text>
        </Card>

        <View className="gap-3">
          <Button
            label={allSetsDone ? 'Semua set selesai' : 'Set Selesai'}
            variant="outline"
            onPress={() => setCompletedSets((prev) => Math.min(prev + 1, exercise.sets))}
            className={allSetsDone ? 'opacity-50' : ''}
          />
          <Button label="Selesai Latihan" onPress={() => router.back()} />
        </View>
      </View>
    </Screen>
  );
}
