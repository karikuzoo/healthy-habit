import React, { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import {
  Card,
  ExerciseMedia,
  Field,
  Screen,
  ScreenHeader,
} from "../../src/components";
import { colors } from "../../src/theme/colors";
import {
  equipmentLabel,
  exerciseCategories,
  exercisesForWorkout,
  exercisesInCategory,
  formatSets,
} from "../../src/data/workout";
import { listPlan } from "../../src/db/workoutPlan";
import { useUser } from "../../src/context/UserContext";
import { useWorkoutBuilder } from "../../src/context/WorkoutBuilderContext";

export default function CategoryScreen() {
  const db = useSQLiteContext();
  const { user } = useUser();
  const { category, type } = useLocalSearchParams();
  const [query, setQuery] = useState("");
  const {
    items: builderItems,
    isSelected,
    toggleExercise,
  } = useWorkoutBuilder();

  /**
   * Datang dari alur baru "Mulai Latihan" berarti `type` selalu terisi
   * ('weight-lifting' / 'no-equipment' / 'cardio') — ini yang membedakan
   * dari alur lama "Tambahkan gerakan" (tanpa `type` sama sekali), yang
   * masih menulis langsung ke rencana lewat `/workout/configure` seperti
   * sebelumnya. Alur baru tidak lagi lewat sana: ketuk gerakan cukup
   * menandainya di `WorkoutBuilderContext`, resepnya diatur belakangan di
   * layar "Rincian Pemilihan gerakan".
   */
  const isBuilderFlow = Boolean(type);

  const title =
    exerciseCategories.find((item) => item.id === category)?.name ?? "Kategori";

  /**
   * Datang dari alur baru "Mulai Latihan" (Jenis Workout -> Jenis Otot)
   * membawa `type` di query string, jadi katalog ikut disaring per alat.
   * Datang dari "Tambahkan gerakan" yang lama tidak membawa `type` sama
   * sekali — semua alat ditampilkan seperti sebelumnya.
   */
  const allExercises = type
    ? exercisesForWorkout(category, type)
    : exercisesInCategory(category);

  const exercises = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allExercises;
    return allExercises.filter((exercise) =>
      exercise.name.toLowerCase().includes(q),
    );
  }, [allExercises, query]);

  /**
   * Gerakan yang sudah ada di rencana ditandai, bukan disembunyikan: pengguna
   * tetap boleh membukanya untuk mengubah set atau repetisinya.
   */
  const [planned, setPlanned] = useState(() => new Set());

  useFocusEffect(
    useCallback(() => {
      if (isBuilderFlow) return; // Alur baru pakai builder, bukan rencana yang sudah tersimpan.
      listPlan(db, user.id).then((items) =>
        setPlanned(new Set(items.map((item) => item.exerciseId))),
      );
    }, [db, user.id, isBuilderFlow]),
  );

  return (
    <Screen>
      <ScreenHeader title={title} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-3 px-5 pb-8 pt-2">
          <Text className="mb-1 text-sm text-ink-muted">
            Pilih gerakan untuk mengatur set dan repetisinya.
          </Text>

          <Field
            label="Cari gerakan"
            icon="search"
            placeholder={allExercises[0]?.name ?? "Cari gerakan..."}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            className="mb-1"
          />

          {allExercises.length === 0 ? (
            <Card className="items-center gap-2 p-8">
              <Ionicons
                name="barbell-outline"
                size={28}
                color={colors.ink.subtle}
              />
              <Text className="text-center text-sm text-ink-muted">
                {type === "no-equipment"
                  ? "Belum ada gerakan tanpa alat untuk otot ini."
                  : type === "weight-lifting"
                    ? "Belum ada gerakan berbeban untuk otot ini."
                    : "Belum ada gerakan untuk kategori ini."}
              </Text>
            </Card>
          ) : exercises.length === 0 ? (
            <Card className="items-center gap-2 p-8">
              <Ionicons name="search" size={28} color={colors.ink.subtle} />
              <Text className="text-sm text-ink-muted">
                Tidak ada gerakan yang cocok dengan "{query}".
              </Text>
            </Card>
          ) : (
            exercises.map((exercise) => {
              const added = isBuilderFlow
                ? isSelected(exercise.id)
                : planned.has(exercise.id);

              return (
                <Pressable
                  key={exercise.id}
                  onPress={() =>
                    isBuilderFlow
                      ? toggleExercise(exercise)
                      : router.push(
                          `/workout/configure?exercise=${exercise.id}`,
                        )
                  }
                  accessibilityRole="button"
                  accessibilityLabel={
                    isBuilderFlow
                      ? added
                        ? `Batalkan pilihan ${exercise.name}`
                        : `Pilih ${exercise.name}`
                      : added
                        ? `Ubah ${exercise.name} di rencana`
                        : `Tambahkan ${exercise.name} ke rencana`
                  }
                  className="active:opacity-80"
                >
                  <Card className="flex-row items-center gap-4 p-3">
                    <ExerciseMedia exerciseId={exercise.id} size={64} />
                    <View className="flex-1">
                      <Text className="text-base font-bold text-ink">
                        {exercise.name}
                      </Text>

                      {added ? (
                        <View className="mt-0.5 flex-row items-center gap-1">
                          <Ionicons
                            name="checkmark-circle"
                            size={13}
                            color={colors.brand.DEFAULT}
                          />
                          <Text className="text-sm font-semibold text-brand">
                            {isBuilderFlow
                              ? "Sudah dipilih"
                              : "Sudah di rencana"}
                          </Text>
                        </View>
                      ) : (
                        <Text className="mt-0.5 text-sm text-ink-muted">
                          {formatSets(exercise)}
                        </Text>
                      )}

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
                    <Ionicons
                      name={
                        added
                          ? isBuilderFlow
                            ? "checkmark-circle"
                            : "create-outline"
                          : "add-circle-outline"
                      }
                      size={22}
                      color={
                        added && !isBuilderFlow
                          ? colors.ink.subtle
                          : colors.brand.DEFAULT
                      }
                    />
                  </Card>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>

      {isBuilderFlow && builderItems.length > 0 ? (
        <View className="px-5 pb-3 pt-1">
          <Pressable
            onPress={() => router.push("/workout/review")}
            accessibilityRole="button"
            className="flex-row items-center justify-center gap-2 rounded-2xl bg-brand py-4 active:opacity-90"
          >
            <Ionicons name="list" size={18} color="#FFFFFF" />
            <Text className="text-base font-bold text-white">
              Lihat Gerakan ({builderItems.length})
            </Text>
          </Pressable>
        </View>
      ) : null}
    </Screen>
  );
}
