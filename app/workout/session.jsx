import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Button, Card, Screen, ScreenHeader } from '../../src/components';
import { colors } from '../../src/theme/colors';
import { estimateCalories, formatSets, todayWorkout } from '../../src/data/workout';
import { getExerciseProgress, logExerciseSession } from '../../src/db/workoutLogs';
import { useUser } from '../../src/context/UserContext';

/** 95 -> "01:35" */
function formatClock(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function SessionScreen() {
  const db = useSQLiteContext();
  const { user } = useUser();
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
  const [saving, setSaving] = useState(false);

  /**
   * Set yang SUDAH tercatat saat layar dibuka.
   *
   * Kalori diakumulasi di database, jadi yang boleh dikirim hanyalah
   * pertambahannya. Tanpa garis dasar ini, membuka kembali gerakan yang
   * sudah selesai lalu menekan "Selesai Latihan" akan menambah kalori lagi
   * tanpa ada kerja baru.
   */
  const [baselineSets, setBaselineSets] = useState(0);

  const running = startedAt !== null;

  const exercise =
    todayWorkout.exercises.find((item) => item.id === exerciseId) ?? todayWorkout.exercises[0];
  const position = todayWorkout.exercises.findIndex((item) => item.id === exercise.id);

  // Lanjutkan dari set yang sudah tercatat hari ini, bukan mulai dari nol
  useEffect(() => {
    let active = true;
    getExerciseProgress(db, user.id, exercise.id).then((sets) => {
      if (!active) return;
      setCompletedSets(sets);
      setBaselineSets(sets);
    });
    return () => {
      active = false;
    };
  }, [db, user.id, exercise.id]);

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

  const allSetsDone = completedSets >= exercise.sets;

  // Hanya set BARU pada kunjungan ini yang dihitung, karena kalori
  // diakumulasi di sisi database.
  const newSets = Math.max(completedSets - baselineSets, 0);

  // Dihitung dari set baru maupun waktu berjalan — mana yang lebih besar.
  // Timer di layar ini opsional, jadi kalori tidak boleh bergantung hanya
  // padanya.
  const burned = estimateCalories({
    exercise,
    completedSets: newSets,
    elapsedSeconds: elapsed,
  });

  const handleFinish = async () => {
    if (saving) return;

    // Tidak ada yang perlu disimpan kalau tidak ada waktu maupun set baru
    if (elapsed === 0 && newSets === 0) {
      router.back();
      return;
    }

    setSaving(true);

    await logExerciseSession(db, user.id, {
      exerciseId: exercise.id,
      name: exercise.name,
      setsPlanned: exercise.sets,
      setsCompleted: completedSets,
      reps: exercise.reps,
      position,
      durationSeconds: elapsed,
      calories: burned,
    });

    router.back();
  };

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
            {allSetsDone
              ? `${exercise.sets} dari ${exercise.sets} set selesai`
              : `Set ${completedSets + 1} dari ${exercise.sets}`}
          </Text>
        </Card>

        <View className="gap-3">
          <Button
            label={allSetsDone ? 'Semua set selesai' : 'Set Selesai'}
            variant="outline"
            onPress={() => setCompletedSets((prev) => Math.min(prev + 1, exercise.sets))}
            className={allSetsDone ? 'opacity-50' : ''}
          />
          <Button
            label={saving ? 'Menyimpan...' : 'Selesai Latihan'}
            onPress={handleFinish}
            className={saving ? 'opacity-50' : ''}
          />
        </View>
      </View>
    </Screen>
  );
}
