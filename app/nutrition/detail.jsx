import React, { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import {
  Button,
  Card,
  Loading,
  MacroTiles,
  ProgressRing,
  Screen,
  ScreenHeader,
} from '../../src/components';
import { colors } from '../../src/theme/colors';
import { addFoodLog, dailyTotals } from '../../src/db/foodLogs';
import { getFoodWithServings, scaleNutrition } from '../../src/db/foods';
import { formatNumber } from '../../src/lib/format';
import { useUser } from '../../src/context/UserContext';

const EMPTY_TOTALS = { calories: 0, protein: 0, carbs: 0, fat: 0 };

/**
 * Mikronutrien yang mungkin ada di katalog.
 *
 * Katalog saat ini berasal dari dataset yang hanya memuat empat makro, jadi
 * kolom-kolom ini umumnya kosong. Barisnya sengaja hanya ditampilkan kalau
 * nilainya benar-benar ada — lebih baik jujur tidak punya data daripada
 * memajang deretan "0 g" yang terlihat seperti fakta.
 */
const MICROS = [
  { key: 'fiber', label: 'Serat', unit: 'g' },
  { key: 'sugar', label: 'Gula', unit: 'g' },
  { key: 'sodium', label: 'Sodium', unit: 'mg' },
  { key: 'cholesterol', label: 'Kolesterol', unit: 'mg' },
];

export default function FoodDetailScreen() {
  const db = useSQLiteContext();
  const { user, targetCalories, macroTargets } = useUser();
  const { food: foodId, slot = 'siang' } = useLocalSearchParams();

  const [food, setFood] = useState(null);
  const [consumed, setConsumed] = useState(EMPTY_TOTALS);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      dailyTotals(db, user.id).then((totals) => {
        if (active) setConsumed(totals);
      });

      if (!foodId) {
        setNotFound(true);
        return () => { active = false; };
      }

      getFoodWithServings(db, foodId).then((row) => {
        if (!active) return;
        if (row) setFood(row);
        else setNotFound(true);
      });

      return () => { active = false; };
    }, [db, user.id, foodId]),
  );

  if (notFound) {
    return (
      <Screen>
        <ScreenHeader title="Detail Makanan" />
        <View className="flex-1 items-center justify-center gap-2 px-8">
          <Ionicons name="alert-circle-outline" size={30} color={colors.ink.subtle} />
          <Text className="text-center text-sm text-ink-muted">
            Makanan ini tidak ditemukan di katalog.
          </Text>
        </View>
      </Screen>
    );
  }

  if (!food) return <Loading />;

  const serving = food.servings.find((s) => s.isDefault) ?? food.servings[0];
  const scaled = scaleNutrition(food, serving.grams, 1);

  const dailyProgress = consumed.calories / targetCalories;
  const remaining = Math.max(targetCalories - consumed.calories, 0);

  const micros = MICROS.filter((m) => food[m.key] != null);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);

    await addFoodLog(db, user.id, {
      foodId: food.id,
      slot,
      name: food.name,
      portion: serving.label,
      servingLabel: serving.label,
      servingGrams: serving.grams,
      quantity: 1,
      weightG: scaled.grams,
      calories: scaled.calories,
      protein: scaled.protein,
      carbs: scaled.carbs,
      fat: scaled.fat,
    });

    router.back();
  };

  return (
    <Screen>
      <ScreenHeader title="Detail Makanan" />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-4 px-5 pb-8">
          <Card className="flex-row items-center gap-4 p-4">
            <View className="h-16 w-16 items-center justify-center rounded-xl bg-surface-sunken">
              <Ionicons name="restaurant-outline" size={26} color={colors.ink.subtle} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-ink">{food.name}</Text>
              <Text className="mt-0.5 text-sm text-ink-muted">
                {serving.label} • {scaled.grams} g • {food.category}
              </Text>
              <Text className="mt-1 text-sm font-bold text-macro-calories">
                {scaled.calories} kkal
              </Text>
            </View>
          </Card>

          {/* Progres harian dibaca dari log di database */}
          <Card className="flex-row items-center gap-4 p-5">
            <ProgressRing
              size={64}
              strokeWidth={6}
              value={dailyProgress}
              color={colors.brand.DEFAULT}
            >
              <Text className="text-sm font-bold text-brand-dark">
                {Math.round(dailyProgress * 100)}%
              </Text>
            </ProgressRing>

            <View className="flex-1">
              <Text className="text-base font-bold text-ink">Dampak Kalori Harian</Text>
              <Text className="mt-1 text-sm leading-5 text-ink-muted">
                Porsi ini menyumbang {scaled.calories} kkal. Sisa kebutuhanmu hari ini{' '}
                {formatNumber(remaining)} kkal dari target {formatNumber(targetCalories)} kkal.
              </Text>
            </View>
          </Card>

          <MacroTiles values={scaled} targets={macroTargets} />

          {/* Gizi per 100 g — acuan yang tidak bergantung ukuran saji */}
          <Card className="px-5 py-2">
            <Text className="py-3 text-base font-bold text-ink">Per 100 gram</Text>
            {[
              { label: 'Energi', value: `${food.calories} kkal` },
              { label: 'Protein', value: `${food.protein} g` },
              { label: 'Karbohidrat', value: `${food.carbs} g` },
              { label: 'Lemak', value: `${food.fat} g` },
              ...micros.map((m) => ({ label: m.label, value: `${food[m.key]} ${m.unit}` })),
            ].map((row) => (
              <View
                key={row.label}
                className="flex-row items-center justify-between border-t border-line-soft py-3"
              >
                <Text className="text-sm text-ink-muted">{row.label}</Text>
                <Text className="text-sm font-semibold text-ink">{row.value}</Text>
              </View>
            ))}

            {micros.length === 0 ? (
              <Text className="border-t border-line-soft py-3 text-xs leading-5 text-ink-subtle">
                Data serat, gula, sodium, dan kolesterol belum tersedia untuk makanan ini.
              </Text>
            ) : null}
          </Card>

          <Card className="gap-2 p-4">
            <View className="flex-row items-center gap-3">
              <Ionicons name="pricetag-outline" size={16} color={colors.ink.muted} />
              <Text className="flex-1 text-sm text-ink-muted">Sumber data</Text>
              <Text className="text-sm font-semibold text-ink">{food.source}</Text>
            </View>
            {food.source === 'dataset-eksternal' ? (
              <Text className="text-xs leading-5 text-ink-subtle">
                Angka gizi berasal dari dataset eksternal yang belum diverifikasi terhadap
                TKPI. Berat per ukuran saji adalah perkiraan.
              </Text>
            ) : null}
          </Card>

          <Button
            label={saving ? 'Menyimpan...' : 'Simpan ke Log'}
            onPress={handleSave}
            className={saving ? 'mt-1 opacity-50' : 'mt-1'}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
