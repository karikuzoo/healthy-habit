import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import {
  Button,
  Card,
  Chip,
  Loading,
  MacroTiles,
  Screen,
  ScreenHeader,
  Stepper,
} from '../../src/components';
import { colors } from '../../src/theme/colors';
import { mealSlots, portionLabel } from '../../src/data/nutrition';
import {
  getFoodLog,
  rescaleFoodLog,
  softDeleteFoodLog,
  updateFoodLog,
} from '../../src/db/foodLogs';
import { getFoodWithServings } from '../../src/db/foods';

/**
 * NUT-8 — mengubah catatan makanan yang sudah tersimpan.
 *
 * Sebelumnya satu-satunya koreksi yang mungkin adalah menghapus lalu mencatat
 * ulang, dan jalan menghapusnya pun hanya lewat tekan-lama yang tidak
 * terlihat. Layar ini menggantikan keduanya: ubah porsi, pindah waktu makan,
 * atau hapus — semuanya bertombol.
 *
 * Angka gizi diskalakan dari catatan, bukan dihitung ulang dari katalog —
 * lihat `rescaleFoodLog` untuk alasannya.
 *
 * Tiga hal yang sengaja TIDAK ada di sini:
 *
 * - mengubah tanggal, karena itu memindahkan catatan antar ringkasan harian
 * - mengubah nama makanan, karena yang salah namanya berarti salah makanan
 * - mengoreksi angka gizi katalog, karena itu NUT-12 dan tempatnya di
 *   `edit-food.jsx` — mengubah katalog dari sini akan menyentuh catatan
 *   pengguna lain di hari lain
 */

/** Ukuran saji untuk catatan yang makanannya sudah tidak ada di katalog. */
function fallbackServings(entry) {
  if (!entry.servingGrams) return [];
  return [{ label: entry.servingLabel ?? 'porsi', grams: entry.servingGrams }];
}

export default function EditFoodLogScreen() {
  const db = useSQLiteContext();
  const { log: logId } = useLocalSearchParams();

  const [entry, setEntry] = useState(null);
  const [food, setFood] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const [slot, setSlot] = useState('siang');
  const [servingLabel, setServingLabel] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const [saving, setSaving] = useState(false);

  // Dibaca sekali, bukan tiap layar difokuskan: kembali ke sini tidak boleh
  // menimpa pilihan yang sedang disetel pengguna.
  useEffect(() => {
    if (!logId) {
      setNotFound(true);
      return;
    }

    let active = true;

    (async () => {
      const row = await getFoodLog(db, logId);
      if (!active) return;
      if (!row) {
        setNotFound(true);
        return;
      }

      setEntry(row);
      setSlot(row.mealSlot);
      setServingLabel(row.servingLabel ?? 'porsi');
      setQuantity(String(row.quantity ?? 1));

      if (row.foodId) {
        const catalogFood = await getFoodWithServings(db, row.foodId);
        if (active) setFood(catalogFood);
      }
    })();

    return () => {
      active = false;
    };
  }, [db, logId]);

  const confirmDelete = useCallback(() => {
    Alert.alert('Hapus catatan ini?', entry?.name ?? '', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          await softDeleteFoodLog(db, logId);
          router.back();
        },
      },
    ]);
  }, [db, logId, entry?.name]);

  if (notFound) {
    return (
      <Screen>
        <ScreenHeader title="Ubah catatan" />
        <View className="flex-1 items-center justify-center gap-2 px-8">
          <Ionicons
            name="alert-circle-outline"
            size={30}
            color={colors.ink.subtle}
          />
          <Text className="text-center text-sm text-ink-muted">
            Catatan ini sudah tidak ada.
          </Text>
        </View>
      </Screen>
    );
  }

  if (!entry) {
    return (
      <Screen>
        <ScreenHeader title="Ubah catatan" />
        <Loading />
      </Screen>
    );
  }

  const servings = food?.servings?.length ? food.servings : fallbackServings(entry);
  const serving =
    servings.find((item) => item.label === servingLabel) ?? servings[0] ?? null;

  const safeQuantity = Math.min(Math.max(Number(quantity) || 1, 1), 20);

  // null berarti catatan lama tanpa berat dan tanpa katalog: porsinya tidak
  // punya basis untuk diskalakan, jadi hanya waktu makan yang bisa dipindah.
  const scaled = serving
    ? rescaleFoodLog(
        entry,
        { servingGrams: serving.grams, quantity: safeQuantity },
        food,
      )
    : null;

  const shown = scaled ?? {
    weightG: entry.weightG,
    calories: entry.calories,
    protein: entry.protein,
    carbs: entry.carbs,
    fat: entry.fat,
  };

  const changed =
    slot !== entry.mealSlot ||
    (scaled != null &&
      (safeQuantity !== (entry.quantity ?? 1) ||
        serving.label !== (entry.servingLabel ?? 'porsi')));

  const handleSave = async () => {
    if (saving || !changed) return;
    setSaving(true);

    await updateFoodLog(db, logId, {
      slot,
      portion: scaled
        ? portionLabel(serving.label, safeQuantity)
        : entry.portion,
      servingLabel: scaled ? serving.label : entry.servingLabel,
      servingGrams: scaled ? serving.grams : entry.servingGrams,
      quantity: scaled ? safeQuantity : entry.quantity,
      weightG: shown.weightG,
      calories: shown.calories,
      protein: shown.protein,
      carbs: shown.carbs,
      fat: shown.fat,
    });

    router.back();
  };

  return (
    <Screen>
      <ScreenHeader title="Ubah catatan" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-5 px-5 pb-8 pt-1">
          <Card className="flex-row items-center gap-4 p-4">
            <View className="h-14 w-14 items-center justify-center rounded-xl bg-surface-sunken">
              <Ionicons
                name="restaurant-outline"
                size={24}
                color={colors.ink.subtle}
              />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-ink">{entry.name}</Text>
              <Text className="mt-0.5 text-xs text-ink-muted">
                Tercatat sebagai {entry.portion ?? entry.servingLabel ?? '1 porsi'}
                {entry.weightG != null ? ` • ${entry.weightG} g` : ''}
              </Text>
            </View>
          </Card>

          <View className="gap-2">
            <Text className="text-sm font-semibold text-ink">Waktu makan</Text>
            <View className="flex-row flex-wrap gap-2">
              {mealSlots.map((item) => (
                <Chip
                  key={item.value}
                  label={item.chip}
                  tone="solid"
                  active={slot === item.value}
                  onPress={() => setSlot(item.value)}
                />
              ))}
            </View>
          </View>

          {scaled ? (
            <>
              {servings.length > 1 ? (
                <View className="gap-2">
                  <Text className="text-sm font-semibold text-ink">
                    Ukuran saji
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {servings.map((item) => (
                      <Chip
                        key={item.label}
                        label={`${item.label} · ${item.grams} g`}
                        active={serving.label === item.label}
                        onPress={() => setServingLabel(item.label)}
                      />
                    ))}
                  </View>
                </View>
              ) : null}

              <Stepper
                label="Jumlah porsi"
                hint="1-20"
                value={quantity}
                onChange={setQuantity}
                min={1}
                max={20}
              />
            </>
          ) : (
            <Card className="flex-row items-start gap-3 p-4">
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={colors.ink.muted}
              />
              <Text className="flex-1 text-xs leading-5 text-ink-muted">
                Catatan ini tidak menyimpan berat porsinya dan makanannya sudah
                tidak ada di katalog, jadi porsinya tidak bisa dihitung ulang.
                Waktu makannya masih bisa dipindah.
              </Text>
            </Card>
          )}

          <View className="gap-3 rounded-2xl bg-brand-soft p-4">
            <View className="flex-row items-baseline justify-between">
              <Text className="text-2xs font-bold tracking-widest text-brand">
                SETELAH DIUBAH
              </Text>
              <Text className="text-xs text-brand-dark">
                {scaled ? portionLabel(serving.label, safeQuantity) : entry.portion}
                {shown.weightG != null ? ` • ${shown.weightG} g` : ''}
              </Text>
            </View>

            <Text className="text-2xl font-bold text-brand-dark">
              {shown.calories} kkal
            </Text>

            <MacroTiles values={shown} />

            {scaled?.basis === 'katalog' ? (
              <Text className="text-2xs leading-4 text-ink-muted">
                Catatan lama ini tidak menyimpan beratnya, jadi angkanya
                dihitung ulang dari katalog — bukan diskalakan dari catatan.
              </Text>
            ) : null}
          </View>

          <Button
            label={saving ? 'Menyimpan...' : 'Simpan perubahan'}
            onPress={handleSave}
            className={saving || !changed ? 'opacity-50' : ''}
          />

          <Pressable
            onPress={confirmDelete}
            accessibilityRole="button"
            className="flex-row items-center justify-center gap-2 py-2 active:opacity-70"
          >
            <Ionicons
              name="trash-outline"
              size={16}
              color={colors.danger.DEFAULT}
            />
            <Text className="text-sm font-bold text-danger">
              Hapus catatan ini
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}
