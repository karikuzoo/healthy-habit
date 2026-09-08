import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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
import { foodDetail, meals, mealSlots, sumMeals } from '../../src/data/nutrition';
import { useUser } from '../../src/context/UserContext';

export default function AddFoodScreen() {
  const { macroTargets } = useUser();
  const [slot, setSlot] = useState('Siang');
  const [query, setQuery] = useState('');
  const [portion, setPortion] = useState(foodDetail.portion);
  const [added, setAdded] = useState(true);

  // Persentase protein harian setelah makanan ini ditambahkan ke log
  const proteinAfter = Math.round(
    ((sumMeals(meals).protein + foodDetail.protein) / macroTargets.protein) * 100,
  );

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
                  key={item}
                  label={item}
                  tone="solid"
                  active={slot === item}
                  onPress={() => setSlot(item)}
                />
              ))}
            </View>
          </ScrollView>

          {added ? (
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
                  onPress={() => setAdded(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Hapus makanan ini"
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
                  ✨ Setelah makanan ini, kebutuhan protein harianmu tercapai {proteinAfter}%.
                </Text>
              </View>
            </Card>
          ) : (
            <Card className="items-center gap-2 p-8">
              <Ionicons name="search-outline" size={28} color={colors.ink.subtle} />
              <Text className="text-sm text-ink-muted">
                Cari makanan untuk mulai mencatat.
              </Text>
            </Card>
          )}

          <Button
            label="Tambahkan makanan"
            onPress={() => router.back()}
            className={added ? '' : 'opacity-50'}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
