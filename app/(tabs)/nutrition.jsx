import React, { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { Button, Card, ProgressBar, Screen } from "../../src/components";
import { colors } from "../../src/theme/colors";
import {
  dailyTotals,
  listMealsForDay,
  softDeleteFoodLog,
} from "../../src/db/foodLogs";
import { formatNumber } from "../../src/lib/format";
import { useUser } from "../../src/context/UserContext";

const MACRO_COLUMNS = [
  { key: "protein", label: "PROTEIN", color: colors.macro.protein },
  { key: "carbs", label: "CARBS", color: colors.macro.carbs },
  { key: "fat", label: "FAT", color: colors.macro.fat },
];

const EMPTY_TOTALS = { calories: 0, protein: 0, carbs: 0, fat: 0 };

export default function NutritionScreen() {
  const db = useSQLiteContext();
  const { user, targetCalories, macroTargets } = useUser();

  const [meals, setMeals] = useState([]);
  const [consumed, setConsumed] = useState(EMPTY_TOTALS);

  const load = useCallback(async () => {
    const [mealRows, totals] = await Promise.all([
      listMealsForDay(db, user.id),
      dailyTotals(db, user.id),
    ]);
    setMeals(mealRows);
    setConsumed(totals);
  }, [db, user.id]);

  // Muat ulang setiap layar difokuskan, supaya makanan yang baru ditambahkan
  // dari layar lain langsung terlihat.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const confirmDelete = (item) => {
    Alert.alert("Hapus makanan ini?", item.name, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          await softDeleteFoodLog(db, item.id);
          load();
        },
      },
    ]);
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-5 px-5 pb-8">
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <Text className="text-3xl font-bold text-ink">Nutrition</Text>
              <Text className="mt-1 text-sm text-ink-muted">
                Catat asupan agar target nutrisimu tetap seimbang.
              </Text>
            </View>

            <Pressable
              onPress={() => router.push("/nutrition/history")}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Riwayat nutrisi"
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

          {/* Total dijumlahkan oleh SQLite, bukan dihitung ulang di JS */}
          <Card className="p-5">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-ink-muted">
                Daily Consumed
              </Text>
              <Text className="text-base font-bold text-ink">
                {formatNumber(consumed.calories)} /{" "}
                {formatNumber(targetCalories)} kkal
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
                Belum ada catatan makanan hari ini.
              </Text>
            </Card>
          ) : (
            meals.map((meal) => (
              <View key={meal.slot} className="gap-3">
                <Text className="text-lg font-bold text-ink">
                  {meal.label}{" "}
                  <Text className="text-sm font-normal text-ink-muted">
                    {formatNumber(meal.totals.calories)} kkal
                  </Text>
                </Text>

                <Card className="overflow-hidden">
                  {meal.items.map((item, index) => (
                    <View
                      key={item.id}
                      className={`flex-row items-center pr-2 ${
                        index > 0 ? "border-t border-line-soft" : ""
                      }`}
                    >
                      <Pressable
                        onPress={() =>
                          router.push(`/nutrition/detail?log=${item.id}`)
                        }
                        onLongPress={() => confirmDelete(item)}
                        accessibilityRole="button"
                        accessibilityHint="Ketuk untuk detail, tekan lama untuk menghapus"
                        className="flex-1 flex-row items-center gap-3 p-4 active:bg-surface-sunken"
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

                      {/* Ubah porsi atau waktu makan (NUT-8). Tekan-lama untuk
                          menghapus tetap ada, tapi tidak lagi jadi satu-satunya
                          jalan keluar dari catatan yang keliru. */}
                      <Pressable
                        onPress={() =>
                          router.push(`/nutrition/edit-log?log=${item.id}`)
                        }
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel={`Ubah catatan ${item.name}`}
                        className="p-2 active:opacity-60"
                      >
                        <Ionicons
                          name="create-outline"
                          size={18}
                          color={colors.ink.muted}
                        />
                      </Pressable>
                    </View>
                  ))}
                </Card>
              </View>
            ))
          )}

          <Button
            label="Tambahkan makanan"
            onPress={() => router.push("/nutrition/add-food")}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
