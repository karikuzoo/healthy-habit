import React, { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { Button, Card, ExerciseMedia, Screen } from "../../src/components";
import { colors } from "../../src/theme/colors";
import {
  equipmentLabel,
  formatSets,
  planEstimate,
  resolvePlan,
  todayWorkout,
} from "../../src/data/workout";
import {
  daySummary,
  deleteTodayExercise,
  listTodayExercises,
} from "../../src/db/workoutLogs";
import { getTodayPlan, removePlanExercise } from "../../src/db/workoutPlan";
import { useUser } from "../../src/context/UserContext";

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

  /**
   * Rencana dibaca dari database, bukan dari konstanta katalog. Itu yang
   * membuat gerakan tambahan bertahan setelah layar ditutup — dan gerakan
   * yang dihapus tidak muncul lagi.
   *
   * `null` berarti belum selesai dibaca; daftar kosong berarti rencana yang
   * memang dikosongkan pengguna. Keduanya tidak boleh tertukar, karena yang
   * satu menampilkan ajakan menambah gerakan dan yang lain tidak.
   */
  const [exercises, setExercises] = useState(null);

  const refresh = useCallback(async () => {
    const [plan, done, today] = await Promise.all([
      getTodayPlan(db, user.id),
      listTodayExercises(db, user.id),
      daySummary(db, user.id),
    ]);

    setExercises(resolvePlan(plan));
    setProgress(done);
    setSummary(today);
  }, [db, user.id]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  // Handler untuk konfirmasi dan menghapus gerakan
  const handleDeleteExercise = (exercise) => {
    Alert.alert(
      "Hapus Gerakan?",
      `Apakah kamu yakin ingin menghapus "${exercise.name}" dari latihan hari ini?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            // Dikeluarkan dari rencana sekaligus dari catatan hari ini. Kalau
            // hanya catatannya yang dihapus, gerakannya muncul lagi di rencana
            // begitu layar dibuka ulang.
            await removePlanExercise(db, user.id, exercise.id);
            await deleteTodayExercise(db, user.id, exercise.id);
            await refresh();
          },
        },
      ],
    );
  };

  const plan = exercises ?? [];
  const estimate = planEstimate(plan.length);
  const started = summary.exercisesDone > 0;

  return (
    <Screen>
      <View className="px-5">
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="text-3xl font-bold text-ink">Workout</Text>
            <Text className="mt-1 text-sm text-ink-muted">
              {todayWorkout.level} • {estimate.durationMinutes} menit •{" "}
              {todayWorkout.intensity}
            </Text>
          </View>

          <Pressable
            onPress={() => router.push("/workout/history")}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Riwayat latihan"
            className="flex-row items-center gap-1.5 rounded-full bg-brand-soft px-3 py-2 active:opacity-70"
          >
            <Ionicons
              name="time-outline"
              size={16}
              color={colors.brand.DEFAULT}
            />
            <Text className="text-xs font-bold text-brand-dark">Riwayat</Text>
          </Pressable>
        </View>

        {/* Ringkasan Latihan */}
        <View className="mt-5 rounded-card bg-brand p-4">
          <View className="flex-row items-center">
            <SummaryItem
              value={started ? summary.calories : estimate.calories}
              label="kkal"
            />
            <View className="h-8 w-px bg-white/25" />
            <SummaryItem
              value={
                started
                  ? `${summary.exercisesDone}/${plan.length}`
                  : plan.length
              }
              label="gerakan"
            />
            <View className="h-8 w-px bg-white/25" />
            <SummaryItem
              value={
                started
                  ? `${summary.durationMinutes}m`
                  : `${todayWorkout.restSeconds}s`
              }
              label={started ? "durasi" : "istirahat"}
            />
          </View>

          <Text className="mt-3 text-center text-2xs text-white/70">
            {started ? "Tercatat hari ini" : "Rencana hari ini"}
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="mt-5">
        <View className="gap-3 px-5 pb-4">
          {exercises && plan.length === 0 ? (
            <Card className="items-center gap-2 p-8">
              <Ionicons
                name="barbell-outline"
                size={28}
                color={colors.ink.subtle}
              />
              <Text className="text-center text-sm text-ink-muted">
                Rencana hari ini masih kosong. Tambahkan gerakan untuk mulai
                menyusunnya.
              </Text>
            </Card>
          ) : null}

          {plan.map((exercise, index) => {
            const done = progress.get(exercise.id);
            const complete = done && done.setsCompleted >= exercise.sets;

            return (
              <Card
                key={exercise.planId}
                className="flex-row items-center gap-1 p-3"
              >
                {/* Area utama (klik untuk ke halaman Sesi) */}
                <Pressable
                  onPress={() =>
                    router.push(`/workout/session?exercise=${exercise.id}`)
                  }
                  accessibilityRole="button"
                  className="flex-1 flex-row items-center gap-3 active:opacity-80"
                >
                  {complete ? (
                    <View className="h-16 w-16 items-center justify-center rounded-xl bg-brand-soft">
                      <Ionicons
                        name="checkmark-circle"
                        size={28}
                        color={colors.brand.DEFAULT}
                      />
                    </View>
                  ) : (
                    <View className="h-16 w-16 overflow-hidden rounded-xl bg-brand-soft">
                      <ExerciseMedia exerciseId={exercise.id} size={64} />
                    </View>
                  )}

                  <View className="flex-1">
                    <Text className="text-2xs font-bold tracking-wider text-brand">
                      GERAKAN {index + 1}
                    </Text>
                    <Text className="mt-0.5 text-base font-bold text-ink">
                      {exercise.name}
                    </Text>
                    <Text className="mt-0.5 text-sm text-ink-muted">
                      {done
                        ? `${done.setsCompleted} dari ${exercise.sets} set selesai`
                        : formatSets(exercise)}
                    </Text>

                    {equipmentLabel(exercise) ? (
                      <View className="mt-1 flex-row items-center gap-1">
                        <Ionicons
                          name="alert-circle-outline"
                          size={11}
                          color={colors.steps.DEFAULT}
                        />
                        <Text className="text-2xs text-steps">
                          {equipmentLabel(exercise)}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </Pressable>

                {/* Ubah set dan repetisi gerakan ini */}
                <Pressable
                  onPress={() =>
                    router.push(`/workout/configure?exercise=${exercise.id}`)
                  }
                  hitSlop={8}
                  className="p-2 active:opacity-60"
                  accessibilityRole="button"
                  accessibilityLabel={`Ubah set dan repetisi ${exercise.name}`}
                >
                  <Ionicons
                    name="create-outline"
                    size={20}
                    color={colors.ink.muted}
                  />
                </Pressable>

                {/* Tombol Sampah untuk Menghapus */}
                <Pressable
                  onPress={() => handleDeleteExercise(exercise)}
                  hitSlop={8}
                  className="p-2 active:opacity-60"
                  accessibilityRole="button"
                  accessibilityLabel={`Hapus gerakan ${exercise.name}`}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={colors.ink.subtle}
                  />
                </Pressable>
              </Card>
            );
          })}
        </View>
      </ScrollView>

      <View className="px-5 pb-3 pt-1">
        <Button
          label="Tambahkan gerakan"
          onPress={() => router.push("/workout/add")}
        />
      </View>
    </Screen>
  );
}
