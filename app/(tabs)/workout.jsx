import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Button, Card, Screen } from '../../src/components';
import { colors } from '../../src/theme/colors';
import { formatSets, todayWorkout } from '../../src/data/workout';
import { listTodayExercises, todaySummary } from '../../src/db/workoutLogs';
import { useUser } from '../../src/context/UserContext';

const EMPTY_SUMMARY = { durationMinutes: 0, calories: 0, exercisesDone: 0 };

function SummaryItem({ value, label }) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-2xl font-bold text-white">{value}</Text>
      <Text className="mt-0.5 text-xs text-white/75">{label}</Text>
    </View>
  );
}

export default function WorkoutScreen() {
  const db = useSQLiteContext();
  const { user } = useUser();

  const [progress, setProgress] = useState(() => new Map());
  const [summary, setSummary] = useState(EMPTY_SUMMARY);

  const { exercises } = todayWorkout;

  useFocusEffect(
    useCallback(() => {
      Promise.all([listTodayExercises(db, user.id), todaySummary(db, user.id)]).then(
        ([done, today]) => {
          setProgress(done);
          setSummary(today);
        },
      );
    }, [db, user.id]),
  );

  const started = summary.exercisesDone > 0;

  return (
    <Screen>
      <View className="px-5 pt-2">
        <Text className="text-3xl font-bold text-ink">Workout</Text>
        <Text className="mt-1 text-sm text-ink-muted">
          {todayWorkout.level} • {todayWorkout.durationMinutes} menit • {todayWorkout.intensity}
        </Text>

        {/* Sebelum ada sesi, kotak ini menampilkan rencana; setelah mulai,
            angka yang benar-benar tercatat hari ini. */}
        <View className="mt-5 rounded-card bg-brand p-4">
          <View className="flex-row items-center">
            <SummaryItem
              value={started ? summary.calories : todayWorkout.estimatedCalories}
              label="kkal"
            />
            <View className="h-8 w-px bg-white/25" />
            <SummaryItem
              value={started ? `${summary.exercisesDone}/${exercises.length}` : exercises.length}
              label="gerakan"
            />
            <View className="h-8 w-px bg-white/25" />
            <SummaryItem
              value={started ? `${summary.durationMinutes}m` : `${todayWorkout.restSeconds}s`}
              label={started ? 'durasi' : 'istirahat'}
            />
          </View>

          <Text className="mt-3 text-center text-2xs text-white/70">
            {started ? 'Tercatat hari ini' : 'Rencana hari ini'}
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="mt-5">
        <View className="gap-3 px-5 pb-4">
          {exercises.map((exercise, index) => {
            const done = progress.get(exercise.id);
            const complete = done && done.setsCompleted >= exercise.sets;

            return (
              <Pressable
                key={exercise.id}
                onPress={() => router.push(`/workout/session?exercise=${exercise.id}`)}
                accessibilityRole="button"
                className="active:opacity-80"
              >
                <Card className="flex-row items-center gap-4 p-3">
                  <View
                    className={`h-16 w-16 items-center justify-center rounded-xl ${
                      complete ? 'bg-brand-soft' : 'bg-surface-sunken'
                    }`}
                  >
                    <Ionicons
                      name={complete ? 'checkmark-circle' : 'barbell-outline'}
                      size={complete ? 28 : 24}
                      color={complete ? colors.brand.DEFAULT : colors.ink.subtle}
                    />
                  </View>

                  <View className="flex-1">
                    <Text className="text-2xs font-bold tracking-wider text-brand">
                      GERAKAN {index + 1}
                    </Text>
                    <Text className="mt-0.5 text-base font-bold text-ink">{exercise.name}</Text>
                    <Text className="mt-0.5 text-sm text-ink-muted">
                      {done
                        ? `${done.setsCompleted} dari ${exercise.sets} set selesai`
                        : formatSets(exercise)}
                    </Text>
                  </View>

                  <Ionicons name="chevron-forward" size={20} color={colors.ink.subtle} />
                </Card>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View className="px-5 pb-3 pt-1">
        <Button label="Tambahkan gerakan" onPress={() => router.push('/workout/add')} />
      </View>
    </Screen>
  );
}
