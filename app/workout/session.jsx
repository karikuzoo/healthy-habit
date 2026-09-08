import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Screen, ScreenHeader } from '../../src/components';
import { colors } from '../../src/theme/colors';
import { formatSets, todayWorkout } from '../../src/data/workout';

/** 95 -> "01:35" */
function formatClock(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function SessionScreen() {
  const { exercise: exerciseId } = useLocalSearchParams();

  /**
   * Waktu dihitung dari jam dinding, bukan dengan menambah 1 detik per tick.
   * Penambahan per tick melenceng kalau thread JS sibuk atau aplikasi masuk
   * background — durasi latihan jadi lebih pendek dari kenyataan.
   *
   * `accumulated` menyimpan detik dari sesi jalan sebelumnya, `startedAt`
   * menandai kapan periode jalan saat ini dimulai (null berarti sedang jeda).
   */
  const [accumulated, setAccumulated] = useState(0);
  const [startedAt, setStartedAt] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const [completedSets, setCompletedSets] = useState(0);

  const running = startedAt !== null;

  // Tick 500ms supaya angka detik tidak tertinggal sampai satu detik
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(interval);
  }, [running]);

  const elapsed = accumulated + (running ? Math.floor((now - startedAt) / 1000) : 0);

  const toggle = useCallback(() => {
    if (running) {
      setAccumulated((prev) => prev + Math.floor((Date.now() - startedAt) / 1000));
      setStartedAt(null);
    } else {
      const timestamp = Date.now();
      setNow(timestamp);
      setStartedAt(timestamp);
    }
  }, [running, startedAt]);

  const reset = useCallback(() => {
    setAccumulated(0);
    setStartedAt(null);
  }, []);

  const confirmReset = useCallback(() => {
    if (elapsed === 0) return;

    Alert.alert('Reset waktu?', `Waktu ${formatClock(elapsed)} akan dikosongkan.`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: reset },
    ]);
  }, [elapsed, reset]);

  const exercise =
    todayWorkout.exercises.find((item) => item.id === exerciseId) ?? todayWorkout.exercises[0];

  const allSetsDone = completedSets >= exercise.sets;

  // Estimasi kalori mengikuti waktu yang benar-benar berjalan
  const caloriesPerSecond =
    todayWorkout.estimatedCalories / (todayWorkout.durationMinutes * 60);
  const burned = Math.round(elapsed * caloriesPerSecond);

  return (
    <Screen>
      <ScreenHeader title="Sesi Latihan" />

      <View className="flex-1 justify-between px-5 pb-6">
        <View className="items-center pt-6">
          <Text className="text-timer font-bold text-brand-dark">{formatClock(elapsed)}</Text>

          <View className="mt-1 flex-row items-center gap-2">
            <View
              className={`h-2 w-2 rounded-full ${running ? 'bg-brand' : 'bg-ink-subtle'}`}
            />
            <Text className="text-sm text-ink-muted">
              {running ? 'Berjalan' : elapsed > 0 ? 'Jeda' : 'Belum dimulai'}
            </Text>
          </View>

          <Text className="mt-2 text-base text-ink-muted">🔥 {burned} kkal terbakar</Text>

          {/* Kontrol waktu */}
          <View className="mt-6 flex-row items-center gap-4">
            <Pressable
              onPress={confirmReset}
              disabled={elapsed === 0}
              accessibilityRole="button"
              accessibilityLabel="Reset waktu"
              className={`h-14 w-14 items-center justify-center rounded-full border border-line bg-surface active:opacity-70 ${
                elapsed === 0 ? 'opacity-40' : ''
              }`}
            >
              <Ionicons name="refresh" size={24} color={colors.ink.muted} />
            </Pressable>

            <Pressable
              onPress={toggle}
              accessibilityRole="button"
              accessibilityLabel={running ? 'Jeda waktu' : 'Mulai waktu'}
              className="h-20 w-20 items-center justify-center rounded-full bg-brand active:opacity-80"
            >
              <Ionicons
                name={running ? 'pause' : 'play'}
                size={32}
                color={colors.surface.DEFAULT}
                // Ikon play secara visual tidak seimbang di tengah lingkaran
                style={running ? undefined : { marginLeft: 4 }}
              />
            </Pressable>
          </View>
        </View>

        <Card className="items-center gap-2 p-6">
          <Text className="text-2xl font-bold text-ink">{exercise.name}</Text>
          <Text className="text-base text-ink-muted">{formatSets(exercise)}</Text>
          <Text className="mt-2 text-sm font-semibold text-brand">
            Set {Math.min(completedSets + 1, exercise.sets)} dari {exercise.sets}
          </Text>
        </Card>

        <View className="gap-3">
          <Button
            label={allSetsDone ? 'Semua set selesai' : 'Set Selesai'}
            variant="outline"
            onPress={() => setCompletedSets((prev) => Math.min(prev + 1, exercise.sets))}
            className={allSetsDone ? 'opacity-50' : ''}
          />
          <Button label="Selesai Latihan" onPress={() => router.back()} />
        </View>
      </View>
    </Screen>
  );
}
