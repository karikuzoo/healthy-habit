import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
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
import { addFoodLog, dailyTotals, getFoodLog } from '../../src/db/foodLogs';
import { getFoodWithServings, scaleNutrition } from '../../src/db/foods';
import { slotLabel } from '../../src/data/nutrition';
import { formatNumber } from '../../src/lib/format';
import { useUser } from '../../src/context/UserContext';

const EMPTY_TOTALS = { calories: 0, protein: 0, carbs: 0, fat: 0 };

/**
 * Mikronutrien yang mungkin ada di katalog.
 *
 * Katalog bawaan berasal dari dataset yang hanya memuat empat makro, jadi
 * kolom-kolom ini umumnya kosong kecuali untuk makanan buatan pengguna.
 * Barisnya hanya ditampilkan kalau nilainya benar-benar ada — lebih baik
 * jujur tidak punya data daripada memajang "0 g" yang terlihat seperti fakta.
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

  /**
   * Layar ini punya dua pintu masuk, dan bedanya penting:
   *
   * - `?log=<id>`  dari catatan harian. Yang ditampilkan adalah porsi dan
   *   angka yang BENAR-BENAR tercatat, bukan nilai katalog saat ini.
   * - `?food=<id>` dari pencarian. Pratinjau katalog dengan ukuran saji
   *   default, dan tombol simpan aktif.
   *
   * Sebelumnya kedua pintu itu diperlakukan sama, sehingga membuka catatan
   * "1 porsi 100 g" menampilkan "1 potong 50 g" — nilai default katalog.
   */
  const { log: logId, food: foodParam, slot = 'siang' } = useLocalSearchParams();
  const fromLog = Boolean(logId);

  const [entry, setEntry] = useState(null);
  const [food, setFood] = useState(null);
  const [consumed, setConsumed] = useState(EMPTY_TOTALS);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      (async () => {
        const totals = await dailyTotals(db, user.id);
        if (active) setConsumed(totals);

        if (fromLog) {
          const row = await getFoodLog(db, logId);
          if (!active) return;
          if (!row) {
            setNotFound(true);
            return;
          }
          setEntry(row);

          // Katalognya dipakai hanya sebagai acuan per 100 g; catatan tetap
          // tampil walau makanannya sudah dihapus dari katalog.
          if (row.foodId) {
            const catalogFood = await getFoodWithServings(db, row.foodId);
            if (active) setFood(catalogFood);
          }
          return;
        }

        if (!foodParam) {
          setNotFound(true);
          return;
        }

        const catalogFood = await getFoodWithServings(db, foodParam);
        if (!active) return;
        if (catalogFood) setFood(catalogFood);
        else setNotFound(true);
      })();

      return () => {
        active = false;
      };
    }, [db, user.id, fromLog, logId, foodParam]),
  );

  if (notFound) {
    return (
      <Screen>
        <ScreenHeader title="Detail Makanan" />
        <View className="flex-1 items-center justify-center gap-2 px-8">
          <Ionicons name="alert-circle-outline" size={30} color={colors.ink.subtle} />
          <Text className="text-center text-sm text-ink-muted">
            {fromLog
              ? 'Catatan ini sudah tidak ada.'
              : 'Makanan ini tidak ditemukan di katalog.'}
          </Text>
        </View>
      </Screen>
    );
  }

  if (fromLog ? !entry : !food) return <Loading />;

  // Nilai yang ditampilkan: dari catatan kalau datang dari log, dari katalog
  // kalau datang dari pencarian.
  const catalogServing = food?.servings?.find((s) => s.isDefault) ?? food?.servings?.[0];

  const shown = fromLog
    ? {
        name: entry.name,
        portion: entry.portion ?? entry.servingLabel ?? '1 porsi',
        grams: entry.weightG,
        calories: entry.calories,
        protein: entry.protein,
        carbs: entry.carbs,
        fat: entry.fat,
      }
    : {
        name: food.name,
        portion: catalogServing.label,
        ...scaleNutrition(food, catalogServing.grams, 1),
      };

  const dailyProgress = consumed.calories / targetCalories;
  const remaining = Math.max(targetCalories - consumed.calories, 0);
  const micros = food ? MICROS.filter((m) => food[m.key] != null) : [];

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);

    await addFoodLog(db, user.id, {
      foodId: food.id,
      slot,
      name: food.name,
      portion: catalogServing.label,
      servingLabel: catalogServing.label,
      servingGrams: catalogServing.grams,
      quantity: 1,
      weightG: shown.grams,
      calories: shown.calories,
      protein: shown.protein,
      carbs: shown.carbs,
      fat: shown.fat,
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
              <Text className="text-base font-bold text-ink">{shown.name}</Text>
              <Text className="mt-0.5 text-sm text-ink-muted">
                {shown.portion}
                {shown.grams != null ? ` • ${shown.grams} g` : ''}
                {food?.category ? ` • ${food.category}` : ''}
              </Text>
              <Text className="mt-1 text-sm font-bold text-macro-calories">
                {shown.calories} kkal
              </Text>
            </View>
          </Card>

          {fromLog ? (
            <Card className="flex-row items-center gap-3 p-4">
              <Ionicons name="checkmark-circle" size={18} color={colors.brand.DEFAULT} />
              <Text className="flex-1 text-sm text-ink-muted">
                Tercatat di {slotLabel(entry.mealSlot)}
                {entry.quantity > 1 ? ` • ${entry.quantity} porsi` : ''}
              </Text>
            </Card>
          ) : null}

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
                Porsi ini {fromLog ? 'menyumbang' : 'akan menyumbang'} {shown.calories} kkal.
                Sisa kebutuhanmu hari ini {formatNumber(remaining)} kkal dari target{' '}
                {formatNumber(targetCalories)} kkal.
              </Text>
            </View>
          </Card>

          <MacroTiles values={shown} targets={macroTargets} />

          {/* Acuan per 100 g — basisnya beda dari kartu di atas, jadi dilabeli tegas */}
          {food ? (
            <Card className="px-5 py-2">
              <Text className="py-3 text-base font-bold text-ink">
                Acuan gizi per 100 gram
              </Text>
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
          ) : null}

          {/* Kalau angkanya keliru, di sinilah pengguna menyadarinya — jadi di
              sini juga jalan keluarnya. Hanya muncul kalau makanannya masih
              terhubung ke katalog; tanpa itu tidak ada entri yang bisa diubah. */}
          {food ? (
            <Pressable
              onPress={() => router.push(`/nutrition/edit-food?food=${food.id}`)}
              accessibilityRole="button"
              className="flex-row items-center justify-center gap-2 py-2 active:opacity-70"
            >
              <Ionicons name="create-outline" size={16} color={colors.brand.DEFAULT} />
              <Text className="text-sm font-bold text-brand">Angkanya keliru? Perbaiki</Text>
            </Pressable>
          ) : (
            <Card className="flex-row items-start gap-3 p-4">
              <Ionicons name="information-circle-outline" size={18} color={colors.ink.muted} />
              <Text className="flex-1 text-xs leading-5 text-ink-muted">
                Makanan ini sudah tidak ada di katalog, tetapi angka yang kamu catat tetap
                tersimpan utuh.
              </Text>
            </Card>
          )}

          {/* Tombol simpan hanya masuk akal saat datang dari pencarian */}
          {fromLog ? null : (
            <Button
              label={saving ? 'Menyimpan...' : 'Simpan ke Log'}
              onPress={handleSave}
              className={saving ? 'mt-1 opacity-50' : 'mt-1'}
            />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
