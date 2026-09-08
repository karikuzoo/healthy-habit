import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Button, Card, Field, Screen, ScreenHeader } from '../../src/components';
import { colors } from '../../src/theme/colors';
import {
  formatDuration,
  isValidTime,
  minutesBetween,
  normalizeTimeInput,
  sleepQualityOptions,
  sleepTargetMinutes,
} from '../../src/data/sleep';
import { getSleepForDay, upsertSleepLog } from '../../src/db/sleepLogs';
import { useUser } from '../../src/context/UserContext';

function TimeField({ label, icon, value, onChangeText, invalid }) {
  return (
    <View className="flex-1 gap-2">
      <Text className="text-sm font-semibold text-ink">{label}</Text>
      <View
        className={`h-14 flex-row items-center gap-2 rounded-2xl border bg-surface px-4 ${
          invalid ? 'border-danger' : 'border-line'
        }`}
      >
        <Ionicons name={icon} size={18} color={colors.ink.muted} />
        <TextInput
          className="flex-1 text-base font-semibold text-ink"
          value={value}
          onChangeText={(text) => onChangeText(normalizeTimeInput(text))}
          placeholder="00:00"
          placeholderTextColor={colors.ink.subtle}
          keyboardType="number-pad"
          maxLength={5}
        />
      </View>
    </View>
  );
}

export default function SleepInputScreen() {
  const db = useSQLiteContext();
  const { user } = useUser();

  const [bedtime, setBedtime] = useState('22:45');
  const [wakeTime, setWakeTime] = useState('06:20');
  const [quality, setQuality] = useState('nyenyak');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Muat catatan malam ini kalau sudah ada, supaya ini jadi ubah, bukan tambah
  useFocusEffect(
    useCallback(() => {
      getSleepForDay(db, user.id).then((row) => {
        if (!row) return;
        setBedtime(row.bedtime);
        setWakeTime(row.wakeTime);
        setQuality(row.quality ?? 'nyenyak');
        setNotes(row.notes);
      });
    }, [db, user.id]),
  );

  const bedtimeValid = isValidTime(bedtime);
  const wakeValid = isValidTime(wakeTime);
  const timesValid = bedtimeValid && wakeValid;

  const durationMinutes = timesValid ? minutesBetween(bedtime, wakeTime) : null;
  const shortfall = durationMinutes === null ? null : sleepTargetMinutes - durationMinutes;

  const handleSave = async () => {
    if (!timesValid || saving) return;
    setSaving(true);

    await upsertSleepLog(db, user.id, { bedtime, wakeTime, quality, notes });
    router.back();
  };

  return (
    <Screen>
      <ScreenHeader title="Sleep Tracker" />

      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View className="gap-5 px-5 pb-8">
          <Text className="text-sm text-ink-muted">
            Tambahkan waktu tidur secara manual untuk tadi malam.
          </Text>

          {/* Durasi dihitung ulang sambil jam diketik */}
          <View className="rounded-card bg-sleep-soft p-5">
            <View className="flex-row items-start justify-between">
              <Text className="text-2xs font-bold tracking-widest text-sleep">
                DURASI TIDUR
              </Text>
              <Ionicons name="time-outline" size={18} color={colors.sleep.DEFAULT} />
            </View>

            <Text className="mt-2 text-stat font-bold text-ink">
              {durationMinutes === null ? '—' : formatDuration(durationMinutes)}
            </Text>

            <Text className="mt-1 text-sm text-ink-muted">
              {durationMinutes === null
                ? 'Isi jam tidur dan bangun dengan format 24 jam.'
                : shortfall > 0
                  ? `Bagus! Kurang ${formatDuration(shortfall)} lagi dari target 8 jam.`
                  : 'Mantap! Target 8 jam sudah terpenuhi.'}
            </Text>
          </View>

          <View className="flex-row gap-4">
            <TimeField
              label="Mulai tidur"
              icon="moon-outline"
              value={bedtime}
              onChangeText={setBedtime}
              invalid={bedtime.length === 5 && !bedtimeValid}
            />
            <TimeField
              label="Bangun"
              icon="sunny-outline"
              value={wakeTime}
              onChangeText={setWakeTime}
              invalid={wakeTime.length === 5 && !wakeValid}
            />
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

          <Button
            label={saving ? 'Menyimpan...' : 'Simpan tidur'}
            onPress={handleSave}
            className={timesValid && !saving ? 'mt-2' : 'mt-2 opacity-50'}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
