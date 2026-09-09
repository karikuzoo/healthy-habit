import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Button, Card, Chip, Field, Screen, ScreenHeader } from '../../src/components';
import { colors } from '../../src/theme/colors';
import { mealSlots } from '../../src/data/nutrition';
import { addFoodLogs } from '../../src/db/foodLogs';
import { getFoodWithServings, scaleNutrition, searchFoods } from '../../src/db/foods';
import { formatNumber } from '../../src/lib/format';
import { useUser } from '../../src/context/UserContext';

/** Jeda sebelum query dijalankan, supaya tidak menembak DB tiap ketukan. */
const DEBOUNCE_MS = 200;

/** Label porsi untuk log: "1 porsi" atau "2 × 1 porsi". */
function portionLabel(serving, quantity) {
  return quantity === 1 ? serving.label : `${quantity} × ${serving.label}`;
}

export default function AddFoodScreen() {
  const db = useSQLiteContext();
  const { user } = useUser();

  const [slot, setSlot] = useState('siang');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [saving, setSaving] = useState(false);

  /**
   * Makanan yang akan dicatat, terkumpul dulu sebelum disimpan.
   *
   * Sepiring makan hampir selalu beberapa item, jadi layar ini mengumpulkan
   * daftarnya lalu menyimpan sekali — bukan menutup diri setiap satu item
   * ditambahkan.
   */
  const [items, setItems] = useState([]);

  /** Indeks baris yang pemilih ukuran sajinya sedang terbuka; satu saja. */
  const [expanded, setExpanded] = useState(null);

  /**
   * Dinaikkan setiap layar difokuskan ulang, memaksa pencarian dijalankan
   * lagi — makanan yang baru dibuat di layar lain langsung muncul di hasil
   * tanpa pengguna perlu mengetik ulang.
   */
  const [refreshKey, setRefreshKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setRefreshKey((n) => n + 1);
    }, []),
  );

  // Pencarian tertunda; hasil lama dibuang kalau query sudah berubah
  useEffect(() => {
    const term = query.trim();
    if (!term) {
      setResults([]);
      return;
    }

    let active = true;
    const timer = setTimeout(() => {
      searchFoods(db, user.id, term).then((rows) => {
        if (active) setResults(rows);
      });
    }, DEBOUNCE_MS);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [db, user.id, query, refreshKey]);

  /** Menambahkan ke daftar; item yang sama menaikkan jumlah, bukan baris baru. */
  const addItem = useCallback(
    async (foodId) => {
      const food = await getFoodWithServings(db, foodId);
      if (!food) return;

      const serving = food.servings.find((s) => s.isDefault) ?? food.servings[0];

      setItems((prev) => {
        const index = prev.findIndex(
          (item) => item.food.id === food.id && item.serving.label === serving.label,
        );
        if (index === -1) return [...prev, { food, serving, quantity: 1 }];

        const next = [...prev];
        next[index] = { ...next[index], quantity: next[index].quantity + 1 };
        return next;
      });

      setQuery('');
      setResults([]);
    },
    [db],
  );

  const changeQuantity = (index, delta) => {
    // Turun ke nol berarti barisnya hilang dan indeks setelahnya bergeser —
    // pemilih yang sedang terbuka harus ditutup agar tidak salah sasaran.
    if (items[index]?.quantity + delta <= 0) setExpanded(null);

    setItems((prev) =>
      prev.flatMap((item, i) => {
        if (i !== index) return [item];
        const quantity = item.quantity + delta;
        return quantity <= 0 ? [] : [{ ...item, quantity }];
      }),
    );
  };

  const removeItem = (index) => {
    setExpanded(null);
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * Mengganti ukuran saji satu baris.
   *
   * Kalau ukuran barunya sama dengan baris lain untuk makanan yang sama,
   * keduanya digabung — tanpa ini daftar bisa memuat dua baris yang persis
   * identik dan mustahil dibedakan pengguna.
   */
  const changeServing = (index, serving) => {
    setItems((prev) => {
      const target = prev[index];

      const duplicate = prev.findIndex(
        (item, i) =>
          i !== index &&
          item.food.id === target.food.id &&
          item.serving.label === serving.label,
      );

      if (duplicate === -1) {
        const next = [...prev];
        next[index] = { ...target, serving };
        return next;
      }

      return prev
        .map((item, i) =>
          i === duplicate ? { ...item, quantity: item.quantity + target.quantity } : item,
        )
        .filter((_, i) => i !== index);
    });

    setExpanded(null);
  };

  const scaledItems = items.map((item) => ({
    ...item,
    scaled: scaleNutrition(item.food, item.serving.grams, item.quantity),
  }));

  const total = scaledItems.reduce(
    (sum, item) => ({
      calories: sum.calories + item.scaled.calories,
      protein: sum.protein + item.scaled.protein,
      carbs: sum.carbs + item.scaled.carbs,
      fat: sum.fat + item.scaled.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const handleSave = async () => {
    if (items.length === 0 || saving) return;
    setSaving(true);

    await addFoodLogs(
      db,
      user.id,
      scaledItems.map(({ food, serving, quantity, scaled }) => ({
        foodId: food.id,
        slot,
        name: food.name,
        portion: portionLabel(serving, quantity),
        servingLabel: serving.label,
        servingGrams: serving.grams,
        quantity,
        weightG: scaled.grams,
        calories: scaled.calories,
        protein: scaled.protein,
        carbs: scaled.carbs,
        fat: scaled.fat,
      })),
    );

    router.back();
  };

  return (
    <Screen>
      <ScreenHeader title="Tambah Makanan" />

      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View className="gap-5 px-5 pb-8">
          <Text className="text-sm text-ink-muted">
            Cari makanan lalu ketuk untuk menambahkannya ke daftar. Bisa beberapa sekaligus.
          </Text>

          <Field
            label="Cari makanan"
            icon="search"
            placeholder="Nasi, ayam, tahu, pisang..."
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
          />

          <View className="gap-2">
            <Text className="text-sm font-semibold text-ink">Waktu makan</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-3">
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
            </ScrollView>
          </View>

          {/* Hasil pencarian */}
          {results.length > 0 ? (
            <Card className="overflow-hidden">
              {results.map((food, index) => (
                <Pressable
                  key={food.id}
                  onPress={() => addItem(food.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Tambahkan ${food.name}`}
                  className={`flex-row items-center gap-3 p-4 active:bg-surface-sunken ${
                    index > 0 ? 'border-t border-line-soft' : ''
                  }`}
                >
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-ink">{food.name}</Text>
                    <Text className="mt-0.5 text-xs text-ink-muted">
                      {food.category}
                      {food.isCustom ? ' · milikku' : ''}
                    </Text>
                  </View>
                  <Text className="text-sm font-bold text-brand-dark">
                    {food.calories}
                    <Text className="font-normal text-ink-muted"> kkal/100g</Text>
                  </Text>
                  <Ionicons name="add-circle" size={22} color={colors.brand.DEFAULT} />
                </Pressable>
              ))}
            </Card>
          ) : null}

          {query.trim() && results.length === 0 ? (
            <Card className="items-center gap-3 p-8">
              <Ionicons name="search-outline" size={26} color={colors.ink.subtle} />
              <Text className="text-center text-sm text-ink-muted">
                Tidak ada makanan yang cocok dengan "{query.trim()}".
              </Text>
              <Pressable
                onPress={() =>
                  router.push(
                    `/nutrition/new-food?name=${encodeURIComponent(query.trim())}`,
                  )
                }
                accessibilityRole="button"
                className="flex-row items-center gap-2 rounded-full bg-brand-soft px-4 py-2.5 active:opacity-80"
              >
                <Ionicons name="add-circle-outline" size={18} color={colors.brand.DEFAULT} />
                <Text className="text-sm font-bold text-brand-dark">
                  Tambah "{query.trim()}" sebagai makanan baru
                </Text>
              </Pressable>
            </Card>
          ) : null}

          {/* Daftar yang akan dicatat */}
          {scaledItems.length > 0 ? (
            <View className="gap-3">
              <Text className="text-lg font-bold text-ink">
                Akan dicatat{' '}
                <Text className="text-sm font-normal text-ink-muted">
                  {scaledItems.length} makanan
                </Text>
              </Text>

              <Card className="overflow-hidden">
                {scaledItems.map((item, index) => (
                  <View
                    key={`${item.food.id}-${item.serving.label}`}
                    className={`gap-3 p-4 ${index > 0 ? 'border-t border-line-soft' : ''}`}
                  >
                    <View className="flex-row items-start gap-3">
                      <View className="flex-1">
                        <Pressable
                          onPress={() => router.push(`/nutrition/detail?food=${item.food.id}`)}
                          accessibilityRole="button"
                          className="active:opacity-70"
                        >
                          <Text className="text-base font-semibold text-ink">
                            {item.food.name}
                          </Text>
                        </Pressable>

                        <Pressable
                          onPress={() => setExpanded(expanded === index ? null : index)}
                          accessibilityRole="button"
                          accessibilityLabel={`Ganti ukuran saji ${item.food.name}`}
                          accessibilityState={{ expanded: expanded === index }}
                          className="mt-0.5 flex-row items-center gap-1 self-start active:opacity-70"
                        >
                          <Text className="text-xs text-brand">
                            {item.serving.label} • {item.scaled.grams} g
                          </Text>
                          <Ionicons
                            name={expanded === index ? 'chevron-up' : 'chevron-down'}
                            size={12}
                            color={colors.brand.DEFAULT}
                          />
                        </Pressable>
                      </View>

                      <Text className="text-sm font-bold text-brand-dark">
                        {item.scaled.calories} kkal
                      </Text>

                      <Pressable
                        onPress={() => removeItem(index)}
                        accessibilityRole="button"
                        accessibilityLabel={`Hapus ${item.food.name}`}
                        hitSlop={8}
                      >
                        <Ionicons name="close-circle" size={20} color={colors.ink.subtle} />
                      </Pressable>
                    </View>

                    {/* Pemilih ukuran saji, terbuka hanya untuk baris ini */}
                    {expanded === index ? (
                      <View className="flex-row flex-wrap gap-2">
                        {item.food.servings.map((serving) => (
                          <Chip
                            key={serving.label}
                            label={`${serving.label} · ${serving.grams} g`}
                            active={serving.label === item.serving.label}
                            onPress={() => changeServing(index, serving)}
                          />
                        ))}
                      </View>
                    ) : null}

                    <View className="flex-row items-center gap-3">
                      <Pressable
                        onPress={() => changeQuantity(index, -1)}
                        accessibilityRole="button"
                        accessibilityLabel="Kurangi jumlah"
                        className="h-9 w-9 items-center justify-center rounded-full border border-line active:opacity-70"
                      >
                        <Ionicons name="remove" size={18} color={colors.ink.DEFAULT} />
                      </Pressable>

                      <Text className="min-w-12 text-center text-sm font-semibold text-ink">
                        × {item.quantity}
                      </Text>

                      <Pressable
                        onPress={() => changeQuantity(index, 1)}
                        accessibilityRole="button"
                        accessibilityLabel="Tambah jumlah"
                        className="h-9 w-9 items-center justify-center rounded-full border border-line active:opacity-70"
                      >
                        <Ionicons name="add" size={18} color={colors.ink.DEFAULT} />
                      </Pressable>

                      <Text className="flex-1 text-right text-xs text-ink-muted">
                        P{item.scaled.protein} · K{item.scaled.carbs} · L{item.scaled.fat}
                      </Text>
                    </View>
                  </View>
                ))}

                <View className="flex-row items-center justify-between border-t border-line bg-surface-muted p-4">
                  <Text className="text-sm font-semibold text-ink">Total</Text>
                  <Text className="text-base font-bold text-ink">
                    {formatNumber(total.calories)} kkal
                    <Text className="text-xs font-normal text-ink-muted">
                      {'  '}P{total.protein} · K{total.carbs} · L{total.fat}
                    </Text>
                  </Text>
                </View>
              </Card>
            </View>
          ) : null}

          {scaledItems.length === 0 && !query.trim() ? (
            <Card className="items-center gap-3 p-8">
              <Ionicons name="restaurant-outline" size={26} color={colors.ink.subtle} />
              <Text className="text-center text-sm text-ink-muted">
                Ketik nama makanan di atas untuk mencarinya.
              </Text>
              <Pressable
                onPress={() => router.push('/nutrition/new-food')}
                accessibilityRole="button"
                className="active:opacity-70"
              >
                <Text className="text-sm font-bold text-brand">
                  Atau buat makanan sendiri
                </Text>
              </Pressable>
            </Card>
          ) : null}

          <Button
            label={
              saving
                ? 'Menyimpan...'
                : scaledItems.length === 0
                  ? 'Simpan ke log'
                  : `Simpan ${scaledItems.length} makanan ke log`
            }
            onPress={handleSave}
            className={scaledItems.length > 0 && !saving ? '' : 'opacity-50'}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
