import React, { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import {
  Card,
  ExerciseMedia,
  Loading,
  Screen,
  ScreenHeader,
} from '../../src/components';
import { colors } from '../../src/theme/colors';
import { daySummary, listExercisesForDay } from '../../src/db/workoutLogs';
import { fullDayLabel } from '../../src/lib/dates';
import { formatNumber } from '../../src/lib/format';
import { useUser } from '../../src/context/UserContext';

function SummaryItem({ value, label }) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-2xl font-bold text-white">{value}</Text>
      <Text className="mt-0.5 text-xs text-white/75">{label}</Text>
    </View>
  );
}

/**
 * Latihan yang tercatat pada satu tanggal.
 *
 * Yang ditampilkan adalah apa yang BENAR-BENAR tercatat: nama, set, dan
 * repetisi dibaca dari baris log, bukan dari rencana atau katalog hari ini.
 * Rencana bisa berubah setiap hari dan katalog bisa dirapikan — catatan
 * latihan yang sudah lewat tidak boleh ikut berubah karenanya.
 *
 * Hanya peraga gerakannya yang masih diambil dari katalog lewat
 * `exercise_id`; kalau gerakannya sudah tidak ada di sana, `ExerciseMedia`
 * jatuh ke ikon placeholder dan barisnya tetap terbaca.
 */
export default function WorkoutDayScreen() {
  const db = useSQLiteContext();
  const { user } = useUser();
  const { date } = useLocalSearchParams();

  const [exercises, setExercises] = useState(null);
  const [summary, setSummary] = useState(null);

  useFocusEffect(
    useCallback(() => {
      if (!date) return;

      Promise.all([
        listExercisesForDay(db, user.id, date),
        daySummary(db, user.id, date),
      ]).then(([rows, day]) => {
        setExercises(rows);
        setSummary(day);
      });
    }, [db, user.id, date]),
  );

  if (!date) {
    return (
      <Screen>
        <ScreenHeader title="Latihan harian" />
        <View className="items-center gap-2 px-5 pt-10">
          <Ionicons name="calendar-outline" size={28} color={colors.ink.subtle} />
          <Text className="text-sm text-ink-muted">Tanggal tidak ditemukan.</Text>
        </View>
      </Screen>
    );
  }

  if (!exercises || !summary) {
    return (
      <Screen>
        <ScreenHeader title="Latihan harian" />
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="Latihan harian" />

      <View className="px-5">
        <Text className="text-sm text-ink-muted">{fullDayLabel(date)}</Text>

        <View className="mt-3 rounded-card bg-brand p-4">
          <View className="flex-row items-center">
            <SummaryItem value={formatNumber(summary.calories)} label="kkal" />
            <View className="h-8 w-px bg-white/25" />
            <SummaryItem value={summary.exercisesDone} label="gerakan" />
            <View className="h-8 w-px bg-white/25" />
            <SummaryItem
              value={`${summary.durationMinutes}m`}
              label="durasi"
            />
          </View>

          <Text className="mt-3 text-center text-2xs text-white/70">
            Tercatat pada tanggal ini
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="mt-4">
        <View className="gap-3 px-5 pb-8">
          {exercises.length === 0 ? (
            <Card className="items-center gap-2 p-8">
              <Ionicons
                name="barbell-outline"
                size={28}
                color={colors.ink.subtle}
              />
              <Text className="text-sm text-ink-muted">
                Tidak ada gerakan tercatat pada tanggal ini.
              </Text>
            </Card>
          ) : (
            exercises.map((exercise, index) => {
              const complete = exercise.setsCompleted >= exercise.setsPlanned;

              return (
                <Card
                  key={exercise.exerciseId}
                  className="flex-row items-center gap-3 p-3"
                >
                  <View className="h-14 w-14 overflow-hidden rounded-xl bg-brand-soft">
                    <ExerciseMedia exerciseId={exercise.exerciseId} size={56} />
                  </View>

                  <View className="flex-1">
                    <Text className="text-2xs font-bold tracking-wider text-brand">
                      GERAKAN {index + 1}
                    </Text>
                    <Text className="mt-0.5 text-base font-bold text-ink">
                      {exercise.name}
                    </Text>
                    <Text className="mt-0.5 text-sm text-ink-muted">
                      {exercise.setsCompleted} dari {exercise.setsPlanned} set
                      {exercise.reps ? ` × ${exercise.reps}` : ''}
                    </Text>
                  </View>

                  {complete ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={colors.brand.DEFAULT}
                    />
                  ) : (
                    <Text className="text-2xs font-semibold text-steps">
                      Sebagian
                    </Text>
                  )}
                </Card>
              );
            })
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
