import React, { useCallback, useState } from "react";
import { ScrollView, Switch, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { Button, Card, ProgressRing, Screen } from "../../src/components";
import { colors } from "../../src/theme/colors";
import {
  bedtimeReminder,
  formatDurationEn,
  qualityLabelEn,
  sleepTargetMinutes,
} from "../../src/data/sleep";
import { getSleepForDay, weeklyTrend } from "../../src/db/sleepLogs";
import { useUser } from "../../src/context/UserContext";

const CHART_HEIGHT = 96;

export default function SleepScreen() {
  const db = useSQLiteContext();
  const { user } = useUser();

  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [lastNight, setLastNight] = useState(null);
  const [trend, setTrend] = useState([]);

  useFocusEffect(
    useCallback(() => {
      Promise.all([getSleepForDay(db, user.id), weeklyTrend(db, user.id)]).then(
        ([row, week]) => {
          setLastNight(row);
          setTrend(week);
        },
      );
    }, [db, user.id]),
  );

  const durationMinutes = lastNight?.durationMinutes ?? 0;

  // Skala batang mengikuti malam terpanjang; fallback ke target agar tidak bagi nol
  const longestNight = Math.max(...trend.map((night) => night.minutes), 1);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-5 px-5 pb-8 pt-8">
          <Text className="text-3xl font-bold text-ink">Sleep Tracker</Text>

          <Card className="items-center gap-4 p-6">
            <ProgressRing
              size={180}
              strokeWidth={12}
              value={durationMinutes / sleepTargetMinutes}
              color={colors.sleep.DEFAULT}
              trackColor={colors.line.DEFAULT}
            >
              <Text className="text-stat font-bold text-ink">
                {lastNight ? formatDurationEn(durationMinutes) : "—"}
              </Text>
              <Text className="mt-1 text-2xs font-bold tracking-widest text-ink-muted">
                ASLEEP TIME
              </Text>
            </ProgressRing>

            {lastNight ? (
              <View className="rounded-full bg-brand-soft px-4 py-2">
                <Text className="text-sm font-bold text-brand-dark">
                  Sleep Quality: {qualityLabelEn(lastNight.quality)}
                </Text>
              </View>
            ) : (
              <Text className="text-sm text-ink-muted">
                Belum ada catatan tidur untuk hari ini.
              </Text>
            )}
          </Card>

          <View className="gap-3">
            <Text className="text-lg font-bold text-ink">Weekly Trend</Text>
            <Card className="p-5">
              <View
                className="flex-row items-end justify-between"
                style={{ height: CHART_HEIGHT }}
              >
                {trend.map((night) => (
                  <View key={night.date} className="flex-1 items-center gap-2">
                    <View
                      className={`w-3 rounded-full ${
                        night.minutes === 0
                          ? "bg-line-soft"
                          : night.active
                            ? "bg-sleep"
                            : "bg-line"
                      }`}
                      style={{
                        height: Math.max(
                          (night.minutes / longestNight) * (CHART_HEIGHT - 24),
                          4,
                        ),
                      }}
                    />
                    <Text
                      className={`text-xs ${
                        night.active ? "font-bold text-sleep" : "text-ink-muted"
                      }`}
                    >
                      {night.day}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          </View>

          <Card className="flex-row items-center justify-between p-5">
            <View className="flex-1 pr-3">
              <Text className="text-base font-bold text-ink">
                Bedtime Reminder
              </Text>
              <Text className="mt-0.5 text-sm text-ink-muted">
                Ingatkan aku bersiap tidur pukul {bedtimeReminder}
              </Text>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={setReminderEnabled}
              trackColor={{
                false: colors.line.DEFAULT,
                true: colors.brand.DEFAULT,
              }}
              thumbColor={colors.surface.DEFAULT}
            />
          </Card>

          <Button
            label={lastNight ? "Ubah catatan tidur" : "Catat tidur"}
            onPress={() => router.push("/sleep/input")}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
