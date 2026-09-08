import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  Button,
  Card,
  MacroTiles,
  ProgressRing,
  Screen,
  ScreenHeader,
} from '../../src/components';
import { colors } from '../../src/theme/colors';
import { foodDetail, meals, sumMeals } from '../../src/data/nutrition';
import { formatNumber } from '../../src/lib/format';
import { useUser } from '../../src/context/UserContext';

export default function FoodDetailScreen() {
  const { targetCalories, macroTargets } = useUser();

  const consumed = sumMeals(meals);
  const dailyProgress = consumed.calories / targetCalories;
  const remaining = Math.max(targetCalories - consumed.calories, 0);

  return (
    <Screen>
      <ScreenHeader title="Detail Makanan" />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-4 px-5 pb-8">
          {/* Ringkasan makanan */}
          <Card className="flex-row items-center gap-4 p-4">
            <View className="h-16 w-16 items-center justify-center rounded-xl bg-surface-sunken">
              <Ionicons name="restaurant-outline" size={26} color={colors.ink.subtle} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-ink">{foodDetail.name}</Text>
              <Text className="mt-0.5 text-sm text-ink-muted">
                {foodDetail.portion} • {foodDetail.weight}
              </Text>
              <Text className="mt-1 text-sm font-bold text-macro-calories">
                {foodDetail.calories} kkal
              </Text>
            </View>
          </Card>

          {/* Dampak terhadap kebutuhan harian */}
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
                Makanan ini menyumbang {foodDetail.calories} kkal. Sisa kebutuhanmu hari ini{' '}
                {formatNumber(remaining)} kkal dari target {formatNumber(targetCalories)} kkal.
              </Text>
            </View>
          </Card>

          {/* Makronutrien: persentase dihitung terhadap target harian */}
          <MacroTiles values={foodDetail} targets={macroTargets} />

          <Card className="px-5 py-2">
            <Text className="py-3 text-base font-bold text-ink">Informasi Gizi Detail</Text>
            {foodDetail.micros.map((micro) => (
              <View
                key={micro.label}
                className="flex-row items-center justify-between border-t border-line-soft py-3"
              >
                <Text className="text-sm text-ink-muted">{micro.label}</Text>
                <Text className="text-sm font-semibold text-ink">{micro.value}</Text>
              </View>
            ))}
          </Card>

          <Card className="flex-row items-center gap-3 p-4">
            <Ionicons name="time-outline" size={18} color={colors.ink.muted} />
            <Text className="flex-1 text-sm text-ink-muted">Waktu Makan</Text>
            <Text className="text-sm font-semibold text-ink">
              {foodDetail.mealSlot} • {foodDetail.time}
            </Text>
          </Card>

          <Button label="Simpan ke Log" onPress={() => router.back()} className="mt-1" />
        </View>
      </ScrollView>
    </Screen>
  );
}
