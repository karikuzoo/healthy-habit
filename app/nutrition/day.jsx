import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import {
  Card,
  Loading,
  ProgressBar,
  Screen,
  ScreenHeader,
} from '../../src/components';
import { colors } from '../../src/theme/colors';
import { dailyTotals, listMealsForDay } from '../../src/db/foodLogs';
import { fullDayLabel } from '../../src/lib/dates';
import { formatNumber } from '../../src/lib/format';
import { useUser } from '../../src/context/UserContext';

const MACRO_COLUMNS = [
  { key: 'protein', label: 'PROTEIN', color: colors.macro.protein },
  { key: 'carbs', label: 'CARBS', color: colors.macro.carbs },
  { key: 'fat', label: 'FAT', color: colors.macro.fat },
];

const EMPTY_TOTALS = { calories: 0, protein: 0, carbs: 0, fat: 0 };

/**
 * Catatan makanan satu tanggal.
 *
 * Sengaja hanya membaca, tanpa tombol tambah atau hapus. Mengubah catatan
 * lama punya konsekuensi sendiri (NUT-8) dan layar ini bukan tempatnya —
 * di sini pengguna sedang melihat ke belakang, bukan mencatat.
 *
 * `listMealsForDay` dan `dailyTotals` sudah menerima tanggal sejak awal, jadi
 * tidak ada query baru yang perlu ditulis untuk layar ini.
 */
export default function NutritionDayScreen() {
  const db = useSQLiteContext();
  const { user, targetCalories, macroTargets } = useUser();
  const { date } = useLocalSearchParams();

  const [meals, setMeals] = useState(null);
  const [consumed, setConsumed] = useState(EMPTY_TOTALS);

  useFocusEffect(
    useCallback(() => {
      if (!date) return;

      Promise.all([
        listMealsForDay(db, user.id, date),
        dailyTotals(db, user.id, date),
      ]).then(([mealRows, totals]) => {
        setMeals(mealRows);
        setConsumed(totals);
      });
    }, [db, user.id, date]),
  );

  if (!date) {
    return (
      <Screen>
        <ScreenHeader title="Catatan harian" />
        <View className="items-center gap-2 px-5 pt-10">
          <Ionicons name="calendar-outline" size={28} color={colors.ink.subtle} />
          <Text className="text-sm text-ink-muted">Tanggal tidak ditemukan.</Text>
        </View>
      </Screen>
    );
  }

  if (!meals) {
    return (
      <Screen>
        <ScreenHeader title="Catatan harian" />
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="Catatan harian" />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-5 px-5 pb-8 pt-1">
          <Text className="text-sm text-ink-muted">{fullDayLabel(date)}</Text>

          <Card className="p-5">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-ink-muted">
                Total hari itu
              </Text>
              <Text className="text-base font-bold text-ink">
                {formatNumber(consumed.calories)} / {formatNumber(targetCalories)}{' '}
                kkal
              </Text>
            </View>

            <ProgressBar
              value={consumed.calories / targetCalories}
              className="mb-5"
            />

            <View className="flex-row justify-between">
              {MACRO_COLUMNS.map((macro) => (
                <View
                  key={macro.key}
                  className="border-l-4 pl-2"
                  style={{ borderLeftColor: macro.color }}
                >
                  <Text className="text-2xs font-bold tracking-wider text-ink-muted">
                    {macro.label}
                  </Text>
                  <Text className="mt-1 text-sm font-bold text-ink">
                    {consumed[macro.key]}g / {macroTargets[macro.key]}g
                  </Text>
                </View>
              ))}
            </View>
          </Card>

          {meals.length === 0 ? (
            <Card className="items-center gap-2 p-8">
              <Ionicons
                name="restaurant-outline"
                size={28}
                color={colors.ink.subtle}
              />
              <Text className="text-sm text-ink-muted">
                Tidak ada catatan makanan pada tanggal ini.
              </Text>
            </Card>
          ) : (
            meals.map((meal) => (
              <View key={meal.slot} className="gap-3">
                <Text className="text-lg font-bold text-ink">
                  {meal.label}{' '}
                  <Text className="text-sm font-normal text-ink-muted">
                    {formatNumber(meal.totals.calories)} kkal
                  </Text>
                </Text>

                <Card className="overflow-hidden">
                  {meal.items.map((item, index) => (
                    <Pressable
                      key={item.id}
                      onPress={() =>
                        router.push(`/nutrition/detail?log=${item.id}`)
                      }
                      accessibilityRole="button"
                      className={`flex-row items-center gap-3 p-4 active:bg-surface-sunken ${
                        index > 0 ? 'border-t border-line-soft' : ''
                      }`}
                    >
                      <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-sunken">
                        <Ionicons
                          name="fast-food-outline"
                          size={18}
                          color={colors.ink.muted}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-ink">
                          {item.name}
                        </Text>
                        <Text className="mt-0.5 text-xs text-ink-muted">
                          P: {item.protein}g · C: {item.carbs}g · F: {item.fat}g
                        </Text>
                      </View>
                      <Text className="text-sm font-bold text-brand-dark">
                        {item.calories} kkal
                      </Text>
                    </Pressable>
                  ))}
                </Card>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
