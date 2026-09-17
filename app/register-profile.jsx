import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  Button,
  Chip,
  Field,
  Screen,
  DateField,
  Dialog,
  ScreenHeader,
  SelectField,
  StepProgress,
} from '../src/components';
import { activityLevels, genders, programs } from '../src/data/profile';
import { enterApp } from '../src/lib/navigation';
import { useUser } from '../src/context/UserContext';

/** Dihitung sekali; membuat Date baru tiap render membingungkan pemilihnya. */
const TODAY = new Date();
const OLDEST_BIRTH_DATE = new Date(
  TODAY.getFullYear() - 120,
  TODAY.getMonth(),
  TODAY.getDate(),
);

export default function RegisterProfileScreen() {
  const { user, updateUser, login } = useUser();
  const [activityLevel, setActivityLevel] = useState(user.activityLevel);
  const [gender, setGender] = useState(user.gender);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [program, setProgram] = useState('cutting');
  const [birthDate, setBirthDate] = useState(user.birthDate ?? null);

  /**
   * Dialog berhasil menahan langkah terakhir, bukan sekadar hiasan.
   *
   * Mendaftar adalah satu-satunya titik di aplikasi ini yang membuat akun,
   * dan sebelumnya ia selesai tanpa satu pun tanda — layar langsung berganti
   * jadi dashboard, dan pengguna tidak pernah diberi tahu bahwa akunnya
   * benar-benar jadi. Sesi baru ditandai masuk setelah dialognya diakui.
   */
  const [berhasil, setBerhasil] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    if (saving) return;
    setSaving(true);

    await updateUser({
      activityLevel,
      gender,
      program,
      ...(birthDate ? { birthDate } : null),
      ...(height ? { height: Number(height) } : null),
      ...(weight ? { weight: Number(weight) } : null),
    });

    setSaving(false);
    setBerhasil(true);
  };

  const masukKeAplikasi = () => {
    setBerhasil(false);
    login();
    enterApp();
  };

  return (
    <Screen className="bg-surface">
      <StepProgress step={2} className="pb-1 pt-2" />
      <ScreenHeader title="Buat Akun" />

      <ScrollView keyboardShouldPersistTaps="handled">
        <View className="gap-5 px-6 pb-8 pt-2">
          <SelectField
            label="Jenis Aktivitas"
            value={activityLevel}
            options={activityLevels}
            onChange={setActivityLevel}
          />

          {/* Batas atas hari ini: tidak ada yang lahir di masa depan. Batas
              bawah 120 tahun supaya roda tahunnya tidak tak berujung. Usia
              MINIMUM sengaja belum dipaksakan — itu keputusan produk yang
              masih terbuka di PRD. */}
          <DateField
            label="Tanggal lahir"
            value={birthDate}
            onChange={setBirthDate}
            placeholder="Pilih tanggal lahir"
            minimumDate={OLDEST_BIRTH_DATE}
            maximumDate={TODAY}
          />

          <SelectField
            label="Jenis kelamin"
            icon="person-outline"
            value={gender}
            options={genders}
            onChange={setGender}
          />

          <View className="flex-row gap-4">
            <Field
              label="Tinggi"
              placeholder="165"
              suffix="cm"
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
              className="flex-1"
            />
            <Field
              label="Berat"
              placeholder="58"
              suffix="kg"
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              className="flex-1"
            />
          </View>

          <View className="gap-3">
            <Text className="text-sm font-semibold text-ink">Apa tujuan utamamu?</Text>
            <View className="flex-row flex-wrap gap-3">
              {programs.map((item) => (
                <Chip
                  key={item.value}
                  label={item.label}
                  active={program === item.value}
                  onPress={() => setProgram(item.value)}
                />
              ))}
            </View>
          </View>

          <Button
            label={saving ? 'Menyimpan...' : 'Lanjutkan'}
            onPress={handleContinue}
            className={saving ? 'mt-2 opacity-50' : 'mt-2'}
          />

          <Dialog
            visible={berhasil}
            icon="checkmark-circle"
            tone="success"
            title="Pendaftaran berhasil"
            description={`Selamat datang${user.firstName ? `, ${user.firstName}` : ''}! Akunmu sudah siap dan targetmu sudah dihitung dari data tubuhmu.`}
            actionLabel="Mulai sekarang"
            onAction={masukKeAplikasi}
          />

          <Pressable
            onPress={() => router.push('/login')}
            accessibilityRole="button"
            className="items-center py-4"
          >
            <Text className="text-sm text-ink-muted">
              Sudah punya akun? <Text className="font-semibold text-brand-dark">Masuk</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}
