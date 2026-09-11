import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import {
  Card,
  Loading,
  ProgressBar,
  Screen,
  ScreenHeader,
} from '../../src/components';
import { colors } from '../../src/theme/colors';
import { dailyHistory } from '../../src/db/foodLogs';
import { dayLabel } from '../../src/lib/dates';
import { formatNumber } from '../../src/lib/format';
import { useUser } from '../../src/context/UserContext';

/**
 * NUT-10 — riwayat nutrisi per tanggal.
 *
 * Datanya sudah lengkap sejak awal (setiap catatan makanan membawa
 * `logged_on`); yang belum ada hanya layarnya. Jadi layar ini murni pembaca:
 * satu baris per hari yang punya catatan, diringkas oleh SQLite.
 *
 * Target kalori sengaja dibandingkan dengan target HARI INI, bukan target
 * saat hari itu dicatat. Profil pengguna tidak menyimpan riwayat berat badan
 * atau program, jadi target masa lalu tidak bisa dihitung ulang — bar progres
 * di sini dibaca sebagai "dibandingkan kebutuhanmu sekarang".
 */
export default function NutritionHistoryScreen() {
  const db = useSQLiteContext();
  const { user, targetCalories } = useUser();

  const [days, setDays] = useState(null);

  useFocusEffect(
    useCallback(() => {
      dailyHistory(db, user.id).then(setDays);
    }, [db, user.id]),
  );

  if (!days) {
    return (
      <Screen>
        <ScreenHeader title="Riwayat Nutrisi" />
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="Riwayat Nutrisi" />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-3 px-5 pb-8 pt-2">
          {days.length === 0 ? (
            <Card className="items-center gap-2 p-8">
              <Ionicons
                name="calendar-outline"
                size={28}
                color={colors.ink.subtle}
              />
              <Text className="text-center text-sm text-ink-muted">
                Belum ada catatan makanan. Riwayat muncul di sini begitu kamu
                mencatat makanan pertamamu.
              </Text>
            </Card>
          ) : (
            days.map((day) => (
              <Pressable
                key={day.loggedOn}
                onPress={() =>
                  router.push(`/nutrition/day?date=${day.loggedOn}`)
                }
                accessibilityRole="button"
                accessibilityLabel={`Lihat catatan ${dayLabel(day.loggedOn)}`}
                className="active:opacity-80"
              >
                <Card className="p-4">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-base font-bold text-ink">
                      {dayLabel(day.loggedOn)}
                    </Text>
                    <View className="flex-row items-center gap-1">
                      <Text className="text-base font-bold text-brand-dark">
                        {formatNumber(day.calories)}
                      </Text>
                      <Text className="text-xs text-ink-muted">
                        / {formatNumber(targetCalories)} kkal
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={colors.ink.subtle}
                      />
                    </View>
                  </View>

                  <ProgressBar
                    value={day.calories / targetCalories}
                    className="mt-3"
                  />

                  <View className="mt-3 flex-row items-center justify-between">
                    <Text className="text-xs text-ink-muted">
                      P: {day.protein}g · C: {day.carbs}g · F: {day.fat}g
                    </Text>
                    <Text className="text-2xs text-ink-subtle">
                      {day.items} catatan
                    </Text>
                  </View>
                </Card>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
