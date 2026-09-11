import React, { useCallback, useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import {
  Button,
  Card,
  ProgressBar,
  ProgressRing,
  Screen,
  StatTile,
} from "../../src/components";
import { colors } from "../../src/theme/colors";
import { useUser } from "../../src/context/UserContext";
import { formatDuration } from "../../src/data/sleep";
import { getSleepForDay } from "../../src/db/sleepLogs";
import { dailyTotals } from "../../src/db/foodLogs";
import { daySummary } from "../../src/db/workoutLogs";
import { getTodayPlan } from "../../src/db/workoutPlan";
import { calculateDailyScore } from "../../src/lib/dailyScore";
import { useStepCounter } from "../../src/hooks/useStepCounter";
import { formatNumber } from "../../src/lib/format";

const EMPTY_TOTALS = { calories: 0, protein: 0, carbs: 0, fat: 0 };

/** Laju jalan santai, dipakai menerjemahkan sisa langkah menjadi menit. */
const STEPS_PER_MINUTE = 100;

/**
 * Alasan sensor langkah tidak dipakai, dalam kalimat yang bisa dibaca.
 *
 * Setiap keadaan di sini berakhir di tempat yang sama — tombol catat manual —
 * tapi alasannya berbeda, dan pengguna berhak tahu yang mana.
 */
function sensorNotice(status, reason) {
  if (status === "tidak-tersedia") {
    return "Perangkat ini tidak punya sensor penghitung langkah.";
  }
  if (status === "galat") {
    return `Sensor langkah tidak bisa dibaca: ${reason}`;
  }
  return "Izin sensor langkah belum diberikan, jadi langkah belum bisa dihitung otomatis.";
}

export default function HomeDashboard() {
  const db = useSQLiteContext();
  const { user, targetCalories } = useUser();
  const [consumed, setConsumed] = useState(EMPTY_TOTALS);
  const [sleepMinutes, setSleepMinutes] = useState(null);
  const [workout, setWorkout] = useState({
    durationMinutes: 0,
    exercisesDone: 0,
  });
  // Jumlah gerakan yang direncanakan dibaca dari rencana hari ini, bukan dari
  // konstanta katalog: rencananya bisa disunting pengguna, sementara skor
  // latihan membandingkan yang selesai dengan yang direncanakan.
  const [exercisesPlanned, setExercisesPlanned] = useState(0);

  // Langkah datang dari sensor perangkat, bukan dari useFocusEffect di bawah:
  // di Android hitungannya berjalan selama layar ini terpasang.
  const pedometer = useStepCounter(db, user.id);
  const { reload: reloadSteps } = pedometer;

  // Kalori dan tidur hari ini dibaca dari database, bukan data statis
  useFocusEffect(
    useCallback(() => {
      dailyTotals(db, user.id).then(setConsumed);
      getSleepForDay(db, user.id).then((row) =>
        setSleepMinutes(row?.durationMinutes ?? null),
      );
      daySummary(db, user.id).then(setWorkout);
      getTodayPlan(db, user.id).then((plan) =>
        setExercisesPlanned(plan.length),
      );
      // Angka langkah bisa berubah dari layar catat manual
      reloadSteps();
    }, [db, user.id, reloadSteps]),
  );

  const score = calculateDailyScore({
    sleepMinutes,
    caloriesConsumed: consumed.calories,
    calorieTarget: targetCalories,
    exercisesDone: workout.exercisesDone,
    exercisesPlanned,
    steps: pedometer.steps,
    stepTarget: pedometer.target,
  });

  const stepsProgress = pedometer.target
    ? pedometer.steps / pedometer.target
    : 0;
  const stepsLeft = Math.max(pedometer.target - pedometer.steps, 0);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-5 px-5 pb-8">
          {/* Sapaan */}
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-base text-ink-muted">Selamat pagi,</Text>
              <Text className="text-2xl font-bold text-ink">
                {user.firstName}
              </Text>
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
              <Text className="mt-1 text-sm text-white/80">
                {score.message}
              </Text>
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
                  <Ionicons
                    name="footsteps"
                    size={18}
                    color={colors.steps.DEFAULT}
                  />
                </View>
                <View>
                  <Text className="text-base font-semibold text-ink">
                    Langkah kaki
                  </Text>
                  <Text className="text-xs text-ink-muted">
                    Target harian {formatNumber(pedometer.target)}
                  </Text>
                </View>
              </View>
              <Text className="text-base font-bold text-brand">
                {Math.round(stepsProgress * 100)}%
              </Text>
            </View>

            <Text className="mb-3 mt-4 text-stat font-bold text-ink">
              {formatNumber(pedometer.steps)}{" "}
              <Text className="text-base font-normal text-ink-muted">
                langkah
              </Text>
            </Text>

            <ProgressBar value={stepsProgress} barClassName="bg-steps" />

            {pedometer.usingSensor ? (
              <>
                <Text className="mt-3 text-xs text-ink-muted">
                  {stepsLeft === 0
                    ? "Target langkah hari ini tercapai."
                    : `${formatNumber(stepsLeft)} langkah lagi—sekitar ${Math.max(
                        Math.round(stepsLeft / STEPS_PER_MINUTE),
                        1,
                      )} menit jalan kaki.`}
                </Text>

                {/* Batas yang harus dikatakan, bukan disembunyikan. Sensornya
                    tidak punya baseline sebelum aplikasi dibuka hari itu, jadi
                    langkah sebelum itu memang tidak bisa dihitung. */}
                {Platform.OS === "android" ? (
                  <Text className="mt-1 text-2xs leading-4 text-ink-subtle">
                    Dihitung sejak aplikasi pertama dibuka hari ini.
                  </Text>
                ) : null}
              </>
            ) : (
              /* Sensor tidak bisa dipakai. Aksi utamanya yang BERFUNGSI —
                 catat manual — bukan tombol izin yang mungkin tidak menghasilkan
                 apa-apa. Mencoba izin tetap ditawarkan, tapi sebagai jalur
                 kedua. */
              <View className="mt-3 gap-2">
                <Text className="text-xs leading-5 text-ink-muted">
                  {sensorNotice(pedometer.status, pedometer.reason)}
                </Text>

                <Button
                  label="Catat langkah manual"
                  variant="soft"
                  onPress={() => router.push("/steps/input")}
                  className="h-11"
                />

                {pedometer.status === "ditolak" ||
                pedometer.status === "terkunci" ? (
                  <Pressable
                    onPress={pedometer.requestPermission}
                    accessibilityRole="button"
                    className="flex-row items-center justify-center gap-1.5 py-1 active:opacity-70"
                  >
                    <Ionicons
                      name="refresh"
                      size={14}
                      color={colors.ink.muted}
                    />
                    <Text className="text-xs font-semibold text-ink-muted">
                      Coba izinkan sensor
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            )}
          </Card>

          {/* Ringkasan kesehatan */}
          <View className="gap-4">
            <Text className="text-lg font-bold text-ink">
              Ringkasan kesehatan
            </Text>
            <View className="flex-row gap-3">
              <StatTile
                icon="moon"
                iconColor={colors.sleep.DEFAULT}
                iconBgClassName="bg-sleep-soft"
                value={
                  sleepMinutes === null ? "—" : formatDuration(sleepMinutes)
                }
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
              <Ionicons name="sparkles" size={16} color={colors.brand.dark}>
                {" "}
              </Ionicons>
              Today's FitSync Plan
            </Text>
            <Text className="text-sm leading-6 text-brand-darker">
              Light Cardio recommended{" "}
              {sleepMinutes != null &&
                ` (${formatDuration(sleepMinutes)} sleep detected)`}
              . Focus on an active recovery jog and steady breathing to optimize
              longevity.
            </Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
