import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Card, Loading, Screen, ScreenHeader } from '../../src/components';
import { colors } from '../../src/theme/colors';
import { sessionHistory } from '../../src/db/workoutLogs';
import { dayLabel } from '../../src/lib/dates';
import { formatNumber } from '../../src/lib/format';
import { useUser } from '../../src/context/UserContext';

/**
 * WO-9 — riwayat latihan.
 *
 * Satu baris per tanggal yang punya sesi. Hari tanpa latihan tidak muncul:
 * daftar ini riwayat apa yang dikerjakan, bukan kalender yang menagih hari
 * yang terlewat.
 */
function Metric({ icon, color, value, label }) {
  return (
    <View className="flex-1 flex-row items-center gap-2">
      <Ionicons name={icon} size={16} color={color} />
      <View>
        <Text className="text-sm font-bold text-ink">{value}</Text>
        <Text className="text-2xs text-ink-muted">{label}</Text>
      </View>
    </View>
  );
}

export default function WorkoutHistoryScreen() {
  const db = useSQLiteContext();
  const { user } = useUser();

  const [days, setDays] = useState(null);

  useFocusEffect(
    useCallback(() => {
      sessionHistory(db, user.id).then(setDays);
    }, [db, user.id]),
  );

  if (!days) {
    return (
      <Screen>
        <ScreenHeader title="Riwayat Latihan" />
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="Riwayat Latihan" />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-3 px-5 pb-8 pt-2">
          {days.length === 0 ? (
            <Card className="items-center gap-2 p-8">
              <Ionicons
                name="barbell-outline"
                size={28}
                color={colors.ink.subtle}
              />
              <Text className="text-center text-sm text-ink-muted">
                Belum ada latihan tercatat. Selesaikan satu set, dan harinya
                akan muncul di sini.
              </Text>
            </Card>
          ) : (
            days.map((day) => (
              <Pressable
                key={day.loggedOn}
                onPress={() => router.push(`/workout/day?date=${day.loggedOn}`)}
                accessibilityRole="button"
                accessibilityLabel={`Lihat latihan ${dayLabel(day.loggedOn)}`}
                className="active:opacity-80"
              >
                <Card className="p-4">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-base font-bold text-ink">
                      {dayLabel(day.loggedOn)}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.ink.subtle}
                    />
                  </View>

                  <View className="mt-3 flex-row items-center">
                    <Metric
                      icon="flame-outline"
                      color={colors.macro.calories}
                      value={formatNumber(day.calories)}
                      label="kkal"
                    />
                    <Metric
                      icon="barbell-outline"
                      color={colors.brand.DEFAULT}
                      value={day.exercisesDone}
                      label="gerakan"
                    />
                    <Metric
                      icon="time-outline"
                      color={colors.sleep.DEFAULT}
                      value={`${day.durationMinutes}m`}
                      label="durasi"
                    />
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
