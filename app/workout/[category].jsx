import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Card, ExerciseMedia, Screen, ScreenHeader } from '../../src/components';
import { colors } from '../../src/theme/colors';
import {
  equipmentLabel,
  exerciseCategories,
  exercisesInCategory,
  formatSets,
} from '../../src/data/workout';
import { listPlan } from '../../src/db/workoutPlan';
import { useUser } from '../../src/context/UserContext';

export default function CategoryScreen() {
  const db = useSQLiteContext();
  const { user } = useUser();
  const { category } = useLocalSearchParams();

  const title =
    exerciseCategories.find((item) => item.id === category)?.name ?? 'Kategori';
  const exercises = exercisesInCategory(category);

  /**
   * Gerakan yang sudah ada di rencana ditandai, bukan disembunyikan: pengguna
   * tetap boleh membukanya untuk mengubah set atau repetisinya.
   */
  const [planned, setPlanned] = useState(() => new Set());

  useFocusEffect(
    useCallback(() => {
      listPlan(db, user.id).then((items) =>
        setPlanned(new Set(items.map((item) => item.exerciseId))),
      );
    }, [db, user.id]),
  );

  return (
    <Screen>
      <ScreenHeader title={title} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-3 px-5 pb-8 pt-2">
          <Text className="mb-1 text-sm text-ink-muted">
            Pilih gerakan untuk mengatur set dan repetisinya sebelum masuk ke
            rencana hari ini.
          </Text>

          {exercises.length === 0 ? (
            <Card className="items-center gap-2 p-8">
              <Ionicons name="barbell-outline" size={28} color={colors.ink.subtle} />
              <Text className="text-sm text-ink-muted">
                Belum ada gerakan untuk kategori ini.
              </Text>
            </Card>
          ) : (
            exercises.map((exercise) => {
              const added = planned.has(exercise.id);

              return (
                <Pressable
                  key={exercise.id}
                  onPress={() =>
                    router.push(`/workout/configure?exercise=${exercise.id}`)
                  }
                  accessibilityRole="button"
                  accessibilityLabel={
                    added
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
                            Sudah di rencana
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
                      name={added ? 'create-outline' : 'add-circle-outline'}
                      size={22}
                      color={added ? colors.ink.subtle : colors.brand.DEFAULT}
                    />
                  </Card>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
