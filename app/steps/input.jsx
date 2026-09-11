import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Button, Card, Field, Screen, ScreenHeader } from '../../src/components';
import { colors } from '../../src/theme/colors';
import {
  DEFAULT_STEP_TARGET,
  getStepsForDay,
  setStepsForDay,
} from '../../src/db/stepLogs';
import { formatNumber } from '../../src/lib/format';
import { useUser } from '../../src/context/UserContext';

/**
 * Mencatat langkah secara manual (HOME-3, cadangan).
 *
 * Ada karena pedometer tidak selalu bisa dipakai:
 *
 * - **Expo Go di Android** tidak mendeklarasikan izin `ACTIVITY_RECOGNITION`
 *   di manifest-nya, jadi izinnya tidak akan pernah bisa diberikan di sana —
 *   terkonfirmasi di daftar izin Expo Go, bukan dugaan.
 * - Sebagian perangkat memang tidak punya sensor penghitung langkah.
 *
 * Layar ini MENIMPA angka hari itu, bukan menambah. Pengguna membaca jumlah
 * langkah dari sumber lain (jam tangan, aplikasi bawaan HP) lalu menyalinnya —
 * yang mereka ketik adalah total, bukan tambahan.
 *
 * Begitu pedometer bisa dipakai, kartu di dashboard berhenti menawarkan layar
 * ini. Keduanya menulis ke baris yang sama di `step_logs`, jadi berpindah dari
 * manual ke sensor tidak memerlukan migrasi apa pun.
 */

/** Pilihan cepat, supaya angka kasar tidak perlu diketik penuh. */
const QUICK_STEPS = [2000, 5000, 8000, 10000];

export default function StepsInputScreen() {
  const db = useSQLiteContext();
  const { user } = useUser();

  const [steps, setSteps] = useState('');
  const [target, setTarget] = useState(DEFAULT_STEP_TARGET);
  const [saving, setSaving] = useState(false);

  // Angka hari ini dimuat lebih dulu, supaya ini jadi mengoreksi — bukan
  // menimpa dari nol tanpa pengguna tahu berapa yang sudah tercatat.
  useFocusEffect(
    useCallback(() => {
      getStepsForDay(db, user.id).then((row) => {
        setSteps(row.steps > 0 ? String(row.steps) : '');
        setTarget(row.target);
      });
    }, [db, user.id]),
  );

  const value = Number(steps);
  const valid = Number.isFinite(value) && value >= 0 && value <= 200000;
  const progress = target ? Math.min(value / target, 1) : 0;

  const handleSave = async () => {
    if (saving || !valid) return;
    setSaving(true);

    await setStepsForDay(db, user.id, value);
    router.back();
  };

  return (
    <Screen>
      <ScreenHeader title="Catat langkah" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-5 px-5 pb-8 pt-1">
          <Card className="flex-row items-start gap-3 p-4">
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={colors.ink.muted}
            />
            <Text className="flex-1 text-xs leading-5 text-ink-muted">
              Sensor langkah tidak bisa dipakai di perangkat ini, jadi
              langkahnya dicatat sendiri. Salin angkanya dari jam tangan atau
              aplikasi kesehatan bawaan HP-mu.
            </Text>
          </Card>

          <Field
            label="Jumlah langkah hari ini"
            icon="footsteps-outline"
            placeholder="0"
            value={steps}
            onChangeText={(text) => setSteps(text.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            maxLength={6}
          />

          <View className="gap-2">
            <Text className="text-sm font-semibold text-ink">Pilihan cepat</Text>
            <View className="flex-row flex-wrap gap-2">
              {QUICK_STEPS.map((amount) => (
                <Pressable
                  key={amount}
                  onPress={() => setSteps(String(amount))}
                  accessibilityRole="button"
                  className={`rounded-full border px-4 py-2.5 active:opacity-80 ${
                    String(amount) === steps
                      ? 'border-brand bg-brand-soft'
                      : 'border-line bg-surface'
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      String(amount) === steps ? 'text-brand-dark' : 'text-ink-muted'
                    }`}
                  >
                    {formatNumber(amount)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View className="items-center rounded-2xl bg-brand-soft px-4 py-4">
            <Text className="text-2xs font-bold tracking-widest text-brand">
              TERHADAP TARGET
            </Text>
            <Text className="mt-1 text-lg font-bold text-brand-dark">
              {formatNumber(valid ? value : 0)} / {formatNumber(target)} langkah
            </Text>
            <Text className="mt-0.5 text-xs text-ink-muted">
              {Math.round(progress * 100)}% dari target harian
            </Text>
          </View>

          <Button
            label={saving ? 'Menyimpan...' : 'Simpan'}
            onPress={handleSave}
            className={saving || !valid ? 'opacity-50' : ''}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
