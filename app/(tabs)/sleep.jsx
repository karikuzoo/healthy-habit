import React, { useState } from 'react';
import { ScrollView, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, ProgressRing, Screen } from '../../src/components';
import { colors } from '../../src/theme/colors';
import {
  bedtimeReminder,
  formatDurationEn,
  lastNightDuration,
  qualityLabelEn,
  sleepTargetMinutes,
  weeklyTrend,
} from '../../src/data/sleep';

const CHART_HEIGHT = 96;

export default function SleepScreen() {
  const [reminderEnabled, setReminderEnabled] = useState(true);

  const durationMinutes = lastNightDuration();
  const longestNight = Math.max(...weeklyTrend.map((night) => night.minutes));

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-5 px-5 pb-8 pt-2">
          <Text className="text-3xl font-bold text-ink">Sleep Tracker</Text>

          {/* Ring SVG — menggantikan trik border+rotate yang render-nya tidak akurat */}
          <Card className="items-center gap-4 p-6">
            <ProgressRing
              size={180}
              strokeWidth={12}
              value={durationMinutes / sleepTargetMinutes}
              color={colors.sleep.DEFAULT}
              trackColor={colors.line.DEFAULT}
            >
              <Text className="text-stat font-bold text-ink">
                {formatDurationEn(durationMinutes)}
              </Text>
              <Text className="mt-1 text-2xs font-bold tracking-widest text-ink-muted">
                ASLEEP TIME
              </Text>
            </ProgressRing>

            <View className="rounded-full bg-brand-soft px-4 py-2">
              <Text className="text-sm font-bold text-brand-dark">
                Sleep Quality: {qualityLabelEn()}
              </Text>
            </View>
          </Card>

          <View className="gap-3">
            <Text className="text-lg font-bold text-ink">Weekly Trend</Text>
            <Card className="p-5">
              <View
                className="flex-row items-end justify-between"
                style={{ height: CHART_HEIGHT }}
              >
                {weeklyTrend.map((night, index) => (
                  <View key={`${night.day}-${index}`} className="flex-1 items-center gap-2">
                    <View
                      className={`w-3 rounded-full ${night.active ? 'bg-sleep' : 'bg-line'}`}
                      style={{ height: (night.minutes / longestNight) * (CHART_HEIGHT - 24) }}
                    />
                    <Text className="text-xs text-ink-muted">{night.day}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </View>

          <Card className="flex-row items-center justify-between p-5">
            <View className="flex-1 pr-3">
              <Text className="text-base font-bold text-ink">Bedtime Reminder</Text>
              <Text className="mt-0.5 text-sm text-ink-muted">
                Ingatkan aku bersiap tidur pukul {bedtimeReminder}
              </Text>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={setReminderEnabled}
              trackColor={{ false: colors.line.DEFAULT, true: colors.brand.DEFAULT }}
              thumbColor={colors.surface.DEFAULT}
            />
          </Card>

          <Button label="Catat tidur" onPress={() => router.push('/sleep/input')} />
        </View>
      </ScrollView>
    </Screen>
  );
}
