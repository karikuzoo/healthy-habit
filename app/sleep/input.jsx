import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Button, Card, Field, Screen, ScreenHeader } from '../../src/components';
import { colors } from '../../src/theme/colors';
import {
  formatDuration,
  lastNightDuration,
  lastNightSleep,
  sleepQualityOptions,
  sleepTargetMinutes,
} from '../../src/data/sleep';

function TimeBox({ label, icon, value }) {
  return (
    <View className="flex-1 gap-2">
      <Text className="text-sm font-semibold text-ink">{label}</Text>
      <View className="h-14 flex-row items-center gap-2 rounded-2xl border border-line bg-surface px-4">
        <Ionicons name={icon} size={18} color={colors.ink.muted} />
        <Text className="text-base font-semibold text-ink">{value}</Text>
      </View>
    </View>
  );
}

export default function SleepInputScreen() {
  const [quality, setQuality] = useState(lastNightSleep.quality);
  const [notes, setNotes] = useState('');

  // Durasi dihitung dari jam tidur & bangun, bukan angka terpisah
  const durationMinutes = lastNightDuration();
  const shortfall = sleepTargetMinutes - durationMinutes;

  return (
    <Screen>
      <ScreenHeader title="Sleep Tracker" />

      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View className="gap-5 px-5 pb-8">
          <Text className="text-sm text-ink-muted">
            Tambahkan waktu tidur secara manual untuk tadi malam.
          </Text>

          <View className="rounded-card bg-sleep-soft p-5">
            <View className="flex-row items-start justify-between">
              <Text className="text-2xs font-bold tracking-widest text-sleep">
                DURASI TIDUR
              </Text>
              <Ionicons name="time-outline" size={18} color={colors.sleep.DEFAULT} />
            </View>
            <Text className="mt-2 text-stat font-bold text-ink">
              {formatDuration(durationMinutes)}
            </Text>
            <Text className="mt-1 text-sm text-ink-muted">
              {shortfall > 0
                ? `Bagus! Kurang ${formatDuration(shortfall)} lagi dari target 8 jam.`
                : 'Mantap! Target 8 jam sudah terpenuhi.'}
            </Text>
          </View>

          <View className="flex-row gap-4">
            <TimeBox label="Mulai tidur" icon="moon-outline" value={lastNightSleep.bedtime} />
            <TimeBox label="Bangun" icon="sunny-outline" value={lastNightSleep.wakeTime} />
          </View>

          <View className="gap-3">
            <Text className="text-sm font-semibold text-ink">Bagaimana kualitas tidurmu?</Text>
            <View className="flex-row gap-3">
              {sleepQualityOptions.map((option) => {
                const active = quality === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setQuality(option.value)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    className="flex-1 active:opacity-80"
                  >
                    <Card
                      className={`items-center gap-2 border py-4 ${
                        active ? 'border-brand bg-brand-softer' : 'border-line'
                      }`}
                      shadow={!active}
                    >
                      <Text className="text-2xl">{option.emoji}</Text>
                      <Text
                        className={`text-sm font-semibold ${
                          active ? 'text-brand-dark' : 'text-ink-muted'
                        }`}
                      >
                        {option.label}
                      </Text>
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Field
            label="Catatan (opsional)"
            placeholder="Tidur lebih cepat setelah membaca"
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <Button label="Simpan tidur" onPress={() => router.back()} className="mt-2" />
        </View>
      </ScrollView>
    </Screen>
  );
}
