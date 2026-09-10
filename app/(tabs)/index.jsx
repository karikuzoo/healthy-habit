import React, { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Card, ProgressBar, ProgressRing, Screen, StatTile } from '../../src/components';
import { colors } from '../../src/theme/colors';
import { useUser } from '../../src/context/UserContext';
import { formatDuration } from '../../src/data/sleep';
import { getSleepForDay } from '../../src/db/sleepLogs';
import { dailyTotals } from '../../src/db/foodLogs';
import { todaySummary } from '../../src/db/workoutLogs';
import { todayWorkout } from '../../src/data/workout';
import { calculateDailyScore } from '../../src/lib/dailyScore';
import { formatNumber } from '../../src/lib/format';

const STEPS = { current: 6248, target: 8000 };
const EMPTY_TOTALS = { calories: 0, protein: 0, carbs: 0, fat: 0 };

export default function HomeDashboard() {
  const db = useSQLiteContext();
  const { user, targetCalories } = useUser();
  const [consumed, setConsumed] = useState(EMPTY_TOTALS);
  const [sleepMinutes, setSleepMinutes] = useState(null);
  const [workout, setWorkout] = useState({ durationMinutes: 0, exercisesDone: 0 });

  // Kalori dan tidur hari ini dibaca dari database, bukan data statis
  useFocusEffect(
    useCallback(() => {
      dailyTotals(db, user.id).then(setConsumed);
      getSleepForDay(db, user.id).then((row) =>
        setSleepMinutes(row?.durationMinutes ?? null),
      );
      todaySummary(db, user.id).then(setWorkout);
    }, [db, user.id]),
  );

  const score = calculateDailyScore({
    sleepMinutes,
    caloriesConsumed: consumed.calories,
    calorieTarget: targetCalories,
    exercisesDone: workout.exercisesDone,
    exercisesPlanned: todayWorkout.plan.length,
  });

  const stepsProgress = STEPS.current / STEPS.target;
  const stepsLeft = Math.max(STEPS.target - STEPS.current, 0);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-5 px-5 pb-8 pt-2">
          {/* Sapaan */}
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-base text-ink-muted">Selamat pagi,</Text>
              <Text className="text-2xl font-bold text-ink">{user.firstName} 👋</Text>
            </View>
            <View className="h-12 w-12 items-center justify-center rounded-full bg-surface-sunken">
              <Ionicons name="person" size={24} color={colors.ink.subtle} />
            </View>
          </View>

          {/* Skor harian */}
          <View className="flex-row items-center justify-between rounded-card bg-brand-dark p-5">
            <View className="flex-1">
              <Text className="text-2xs font-bold tracking-widest text-white/70">
                SKOR HARI INI
              </Text>
              <Text className="mt-2 text-score font-bold text-white">
                {score.total}
                <Text className="text-xl font-normal text-white/70">/100</Text>
              </Text>
              <Text className="mt-1 text-sm text-white/80">{score.message}</Text>
            </View>
            <ProgressRing
              size={76}
              strokeWidth={7}
              value={score.total / 100}
              color={colors.brand.light}
              trackColor="rgba(255,255,255,0.18)"
            />
          </View>

          {/* Langkah kaki */}
          <Card className="p-5">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-steps-soft">
                  <Ionicons name="footsteps" size={18} color={colors.steps.DEFAULT} />
                </View>
                <View>
                  <Text className="text-base font-semibold text-ink">Langkah kaki</Text>
                  <Text className="text-xs text-ink-muted">
                    Target harian {formatNumber(STEPS.target)}
                  </Text>
                </View>
              </View>
              <Text className="text-base font-bold text-brand">
                {Math.round(stepsProgress * 100)}%
              </Text>
            </View>

            <Text className="mb-3 mt-4 text-stat font-bold text-ink">
              {formatNumber(STEPS.current)}{' '}
              <Text className="text-base font-normal text-ink-muted">langkah</Text>
            </Text>

            <ProgressBar value={stepsProgress} barClassName="bg-steps" />

            <Text className="mt-3 text-xs text-ink-muted">
              {formatNumber(stepsLeft)} langkah lagi—jalan sore 18 menit cukup!
            </Text>
          </Card>

          {/* Ringkasan kesehatan */}
          <View className="gap-4">
            <Text className="text-lg font-bold text-ink">Ringkasan kesehatan</Text>
            <View className="flex-row gap-3">
              <StatTile
                icon="moon"
                iconColor={colors.sleep.DEFAULT}
                iconBgClassName="bg-sleep-soft"
                value={sleepMinutes === null ? '—' : formatDuration(sleepMinutes)}
                label="Tidur"
              />
              <StatTile
                icon="flame"
                iconColor={colors.macro.calories}
                iconBgClassName="bg-steps-soft"
                value={formatNumber(consumed.calories)}
                label="Kalori"
              />
              <StatTile
                icon="timer"
                iconColor={colors.brand.light}
                iconBgClassName="bg-brand-soft"
                value={`${workout.durationMinutes} min`}
                label="Latihan"
              />
            </View>
          </View>

          {/* Rekomendasi */}
          <View className="rounded-2xl bg-brand-soft p-5">
            <Text className="mb-2 text-base font-bold text-brand-dark">
              ✨ Today's FitSync Plan
            </Text>
            <Text className="text-sm leading-6 text-brand-darker">
              Light Cardio recommended (6.5h sleep detected). Focus on an active recovery jog
              and steady breathing to optimize longevity.
            </Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
