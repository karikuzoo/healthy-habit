import React, { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import {
  Button,
  Card,
  ExerciseMedia,
  Loading,
  Screen,
  ScreenHeader,
  Segmented,
  Stepper,
} from '../../src/components';
import { colors } from '../../src/theme/colors';
import {
  equipmentLabel,
  formatReps,
  parseReps,
  repUnits,
  resolveExercise,
} from '../../src/data/workout';
import { getPlanExercise, savePlanExercise } from '../../src/db/workoutPlan';
import { useUser } from '../../src/context/UserContext';

/**
 * Menyetel satu gerakan sebelum masuk ke rencana hari ini.
 *
 * Layar ini yang memisahkan "menambahkan gerakan" dari "melatih gerakan".
 * Sebelumnya memilih gerakan dari katalog langsung membuka sesi latihan,
 * sehingga rencana hari ini tidak pernah benar-benar bisa disusun.
 *
 * Satu layar dipakai untuk menambah maupun mengubah: yang membedakan hanya
 * apakah gerakannya sudah ada di rencana. Dengan begitu menambahkan gerakan
 * yang sudah ada tidak berakhir sebagai gerakan kembar, melainkan membuka
 * resep yang sedang berlaku.
 */

/** Batas per satuan — 300 detik cukup untuk plank terlama yang masuk akal. */
const REPS_RANGE = {
  repetisi: { min: 1, max: 100, step: 1, label: 'Repetisi per set', hint: '1-100' },
  detik: { min: 5, max: 300, step: 5, label: 'Durasi per set (detik)', hint: '5-300' },
};

export default function ConfigureExerciseScreen() {
  const db = useSQLiteContext();
  const { user } = useUser();
  const { exercise: exerciseId } = useLocalSearchParams();

  const exercise = resolveExercise(exerciseId);

  const [ready, setReady] = useState(false);
  const [inPlan, setInPlan] = useState(false);
  const [sets, setSets] = useState('3');
  const [amount, setAmount] = useState('12');
  const [unit, setUnit] = useState('repetisi');
  const [saving, setSaving] = useState(false);

  // Resep yang sedang berlaku jadi nilai awal; gerakan baru memakai bawaan
  // katalog. Sengaja tidak useFocusEffect: kembali ke layar ini tidak boleh
  // menimpa angka yang sedang diketik pengguna.
  useEffect(() => {
    if (!exercise) {
      setReady(true);
      return;
    }

    let active = true;
    getPlanExercise(db, user.id, exercise.id).then((planned) => {
      if (!active) return;

      const recipe = planned ?? exercise;
      const parsed = parseReps(recipe.reps);

      setInPlan(Boolean(planned));
      setSets(String(recipe.sets));
      setAmount(String(parsed.amount));
      setUnit(parsed.unit);
      setReady(true);
    });

    return () => {
      active = false;
    };
  }, [db, user.id, exercise?.id]);

  const range = REPS_RANGE[unit];

  // Ganti satuan berarti ganti rentang: 12 repetisi tidak masuk akal sebagai
  // 12 detik, jadi angkanya dijepit ke rentang satuan yang baru.
  const changeUnit = useCallback((next) => {
    setUnit(next);
    setAmount((current) => {
      const { min, max } = REPS_RANGE[next];
      const value = Number(current);
      if (!Number.isFinite(value)) return String(min);
      return String(Math.min(Math.max(value, min), max));
    });
  }, []);

  if (!exercise) {
    return (
      <Screen>
        <ScreenHeader title="Atur gerakan" />
        <View className="items-center gap-2 px-5 pt-10">
          <Ionicons name="barbell-outline" size={28} color={colors.ink.subtle} />
          <Text className="text-sm text-ink-muted">Gerakan tidak ditemukan.</Text>
        </View>
      </Screen>
    );
  }

  if (!ready) {
    return (
      <Screen>
        <ScreenHeader title="Atur gerakan" />
        <Loading />
      </Screen>
    );
  }

  const safeSets = Math.min(Math.max(Number(sets) || 1, 1), 10);
  const safeAmount = Math.min(
    Math.max(Number(amount) || range.min, range.min),
    range.max,
  );
  const reps = formatReps(safeAmount, unit);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);

    await savePlanExercise(db, user.id, {
      exerciseId: exercise.id,
      sets: safeSets,
      reps,
    });

    /**
     * Kembali ke tab Workout, bukan ke daftar kategori: gerakan yang baru
     * ditambahkan harus langsung terlihat di rencananya.
     *
     * Sengaja menyebut tujuannya (`dismissTo`) alih-alih "pop to top"
     * (`dismissAll`). Keduanya kebetulan sama-sama mendarat di tab selama
     * tab itu ada di dasar stack — dan itu asumsi yang pernah tidak berlaku:
     * sebelum `enterApp()` ada, layar Welcome masih tertinggal di bawahnya
     * dan `dismissAll` justru memulangkan pengguna ke sana.
     */
    router.dismissTo('/(tabs)/workout');
  };

  return (
    <Screen>
      <ScreenHeader title={inPlan ? 'Ubah gerakan' : 'Atur gerakan'} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-5 px-5 pb-8 pt-2">
            <Card className="items-center gap-2 p-5">
              <ExerciseMedia exerciseId={exercise.id} size={120} rounded="rounded-2xl" />

              <Text className="mt-1 text-xl font-bold text-ink">{exercise.name}</Text>

              {equipmentLabel(exercise) ? (
                <View className="flex-row items-center gap-1.5 rounded-full bg-steps-soft px-3 py-1">
                  <Ionicons
                    name="alert-circle-outline"
                    size={13}
                    color={colors.steps.DEFAULT}
                  />
                  <Text className="text-xs font-semibold text-steps">
                    {equipmentLabel(exercise)}
                  </Text>
                </View>
              ) : null}
            </Card>

            <Stepper
              label="Jumlah set"
              hint="1-10"
              value={sets}
              onChange={setSets}
              min={1}
              max={10}
            />

            <View className="gap-2">
              <Text className="text-sm font-semibold text-ink">Satuan</Text>
              <Segmented
                options={repUnits}
                value={unit}
                onChange={changeUnit}
              />
              <Text className="text-2xs text-ink-subtle">
                Pilih Detik untuk gerakan tahan seperti plank.
              </Text>
            </View>

            <Stepper
              label={range.label}
              hint={range.hint}
              value={amount}
              onChange={setAmount}
              min={range.min}
              max={range.max}
              step={range.step}
            />

            <View className="items-center rounded-2xl bg-brand-soft px-4 py-4">
              <Text className="text-2xs font-bold tracking-widest text-brand">
                RENCANA GERAKAN INI
              </Text>
              <Text className="mt-1 text-lg font-bold text-brand-dark">
                {safeSets} set × {reps}
              </Text>
            </View>

            <Button
              label={
                saving
                  ? 'Menyimpan...'
                  : inPlan
                    ? 'Simpan perubahan'
                    : 'Tambahkan ke rencana'
              }
              onPress={handleSave}
              className={saving ? 'opacity-50' : ''}
            />

            {inPlan ? (
              <Text className="text-center text-2xs text-ink-subtle">
                Gerakan ini sudah ada di rencana hari ini.
              </Text>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
