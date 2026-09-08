import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import {
  Button,
  Card,
  Chip,
  Field,
  MacroTiles,
  Screen,
  ScreenHeader,
} from '../../src/components';
import { colors } from '../../src/theme/colors';
import { foodDetail, mealSlots } from '../../src/data/nutrition';
import { addFoodLog } from '../../src/db/foodLogs';
import { useUser } from '../../src/context/UserContext';

export default function AddFoodScreen() {
  const db = useSQLiteContext();
  const { user, macroTargets } = useUser();

  const [slot, setSlot] = useState('siang');
  const [query, setQuery] = useState('');
  const [portion, setPortion] = useState(foodDetail.portion);
  const [selected, setSelected] = useState(true);
  const [saving, setSaving] = useState(false);

  const proteinShare = Math.round((foodDetail.protein / macroTargets.protein) * 100);

  const handleAdd = async () => {
    if (!selected || saving) return;
    setSaving(true);

    await addFoodLog(db, user.id, {
      slot,
      name: foodDetail.name,
      portion,
      weightG: foodDetail.weightG,
      calories: foodDetail.calories,
      protein: foodDetail.protein,
      carbs: foodDetail.carbs,
      fat: foodDetail.fat,
    });

    router.back();
  };

  return (
    <Screen>
      <ScreenHeader title="Nutrition" />

      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View className="gap-5 px-5 pb-8">
          <Text className="text-sm text-ink-muted">
            Catat asupan agar target nutrisimu tetap seimbang.
          </Text>

          <Field
            label="Cari makanan"
            icon="search"
            placeholder="Nasi merah, ayam, buah..."
            value={query}
            onChangeText={setQuery}
          />

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

          {selected ? (
            <Card className="gap-4 p-4">
              <View className="flex-row items-start gap-3">
                <View className="h-14 w-14 items-center justify-center rounded-xl bg-surface-sunken">
                  <Ionicons name="restaurant-outline" size={24} color={colors.ink.subtle} />
                </View>

                <Pressable
                  onPress={() => router.push('/nutrition/detail')}
                  accessibilityRole="button"
                  className="flex-1 active:opacity-70"
                >
                  <Text className="text-base font-bold text-ink">{foodDetail.name}</Text>
                  <Text className="mt-0.5 text-sm text-ink-muted">
                    {foodDetail.portion} • {foodDetail.weight}
                  </Text>
                  <Text className="mt-1 text-sm font-bold text-macro-calories">
                    {foodDetail.calories} kkal
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setSelected(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Batalkan pilihan makanan"
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={22} color={colors.ink.subtle} />
                </Pressable>
              </View>

              <MacroTiles values={foodDetail} />

              <Field
                label="Porsi"
                value={portion}
                onChangeText={setPortion}
                placeholder="1 mangkuk"
              />

              <View className="rounded-2xl bg-brand-soft p-4">
                <Text className="text-sm leading-5 text-brand-darker">
                  ✨ Makanan ini memenuhi {proteinShare}% kebutuhan protein harianmu.
                </Text>
              </View>
            </Card>
          ) : (
            <Card className="items-center gap-2 p-8">
              <Ionicons name="search-outline" size={28} color={colors.ink.subtle} />
              <Text className="text-center text-sm text-ink-muted">
                Pencarian makanan belum tersedia. Pilih kembali makanan contoh
                untuk mencatatnya.
              </Text>
              <Pressable
                onPress={() => setSelected(true)}
                accessibilityRole="button"
                className="mt-1 active:opacity-70"
              >
                <Text className="text-sm font-bold text-brand">Tampilkan lagi</Text>
              </Pressable>
            </Card>
          )}

          <Button
            label={saving ? 'Menyimpan...' : 'Tambahkan makanan'}
            onPress={handleAdd}
            className={selected && !saving ? '' : 'opacity-50'}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
