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
  planExercises,
  todayWorkout,
} from "../../src/data/workout";
import {
  deleteTodayExercise,
  listTodayExercises,
  todaySummary,
} from "../../src/db/workoutLogs";
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

  const [exercises, setExercises] = useState(() => planExercises());

  useFocusEffect(
    useCallback(() => {
      Promise.all([
        listTodayExercises(db, user.id),
        todaySummary(db, user.id),
      ]).then(([done, today]) => {
        setProgress(done);
        setSummary(today);
      });
    }, [db, user.id]),
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
            // 1. Hapus catatan dari DB
            await deleteTodayExercise(db, user.id, exercise.id);

            // 2. Hapus gerakan dari daftar tampilan (UI)
            setExercises((prev) =>
              prev.filter((item) => item.id !== exercise.id),
            );

            // 3. Refresh ringkasan
            const [done, today] = await Promise.all([
              listTodayExercises(db, user.id),
              todaySummary(db, user.id),
            ]);
            setProgress(done);
            setSummary(today);
          },
        },
      ],
    );
  };

  const started = summary.exercisesDone > 0;

  return (
    <Screen>
      <View className="px-5">
        <Text className="text-3xl font-bold text-ink">Workout</Text>
        <Text className="mt-1 text-sm text-ink-muted">
          {todayWorkout.level} • {todayWorkout.durationMinutes} menit •{" "}
          {todayWorkout.intensity}
        </Text>

        {/* Ringkasan Latihan */}
        <View className="mt-5 rounded-card bg-brand p-4">
          <View className="flex-row items-center">
            <SummaryItem
              value={
                started ? summary.calories : todayWorkout.estimatedCalories
              }
              label="kkal"
            />
            <View className="h-8 w-px bg-white/25" />
            <SummaryItem
              value={
                started
                  ? `${summary.exercisesDone}/${exercises.length}`
                  : exercises.length
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
          {exercises.map((exercise, index) => {
            const done = progress.get(exercise.id);
            const complete = done && done.setsCompleted >= exercise.sets;

            return (
              <Card
                key={exercise.id}
                className="flex-row items-center gap-3 p-3"
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

                {/* Tombol Sampah untuk Menghapus */}
                <Pressable
                  onPress={() => handleDeleteExercise(exercise)}
                  hitSlop={10}
                  className="p-2 active:opacity-60"
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
