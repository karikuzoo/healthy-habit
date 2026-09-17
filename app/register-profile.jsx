import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { addDays, differenceInCalendarDays, differenceInYears, parseISO } from 'date-fns';
import {
  Button,
  Card,
  Chip,
  Field,
  Screen,
  DateField,
  Dialog,
  ScreenHeader,
  SelectField,
  StepProgress,
  TargetSummary,
} from '../src/components';
import { activityLevels, genders, programs } from '../src/data/profile';
import { dateLabel, toIsoDate } from '../src/lib/dates';
import { enterApp } from '../src/lib/navigation';
import { MAX_WEIGHT_KG } from '../src/lib/validateProfile';
import { rencanaLengkap } from '../src/lib/weightGoal';
import { useUser } from '../src/context/UserContext';

/** Dihitung sekali; membuat Date baru tiap render membingungkan pemilihnya. */
const TODAY = new Date();
const OLDEST_BIRTH_DATE = new Date(
  TODAY.getFullYear() - 120,
  TODAY.getMonth(),
  TODAY.getDate(),
);

/**
 * Rentang tenggat target: paling cepat besok, paling lama tiga tahun.
 *
 * Batas bawahnya bukan hari ini — target yang jatuh tempo hari ini tidak
 * menyisakan waktu untuk dikerjakan, dan pembagian "sisa hari" jadi nol.
 * Batas atasnya menahan tanggal yang tidak berarti apa-apa lagi sebagai
 * rencana.
 */
const TENGGAT_TERCEPAT = new Date(
  TODAY.getFullYear(),
  TODAY.getMonth(),
  TODAY.getDate() + 1,
);
const TENGGAT_TERJAUH = new Date(
  TODAY.getFullYear() + 3,
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
  const [targetWeight, setTargetWeight] = useState('');
  const [targetDate, setTargetDate] = useState(null);

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

  /**
   * Estimasi dihitung dari angka yang SEDANG diketik, bukan dari profil
   * tersimpan. Layar inilah tempat angka itu pertama kali diisi; `user`
   * masih memegang nilai bawaan sampai tombol Lanjutkan ditekan, jadi
   * membaca `targetCalories` dari konteks akan menampilkan angka orang lain.
   */
  const umur = birthDate ? differenceInYears(TODAY, parseISO(birthDate)) : null;
  const beratKg = Number(weight);
  const targetKg = Number(targetWeight);

  const sisaHari = targetDate
    ? differenceInCalendarDays(parseISO(targetDate), TODAY)
    : null;

  const { rencana, proyeksi } = rencanaLengkap({
    beratKg,
    tinggiCm: Number(height),
    umur,
    gender,
    activityLevel,
    targetKg,
    hari: sisaHari,
  });

  const targetSah = Number.isFinite(targetKg) && targetKg > 0 && targetKg <= MAX_WEIGHT_KG;
  const estimasiSiap = targetSah && Boolean(targetDate) && rencana.kaloriTarget != null;

  /**
   * Target yang diketik tapi tidak masuk akal DIBERI TAHU, bukan dibuang
   * diam-diam. Sebelumnya angka ngawur cukup tidak ikut tersimpan, dan
   * pengguna baru sadar targetnya tidak ada jauh belakangan.
   */
  const galatTarget =
    targetWeight.trim() && !targetSah
      ? `Berat target harus lebih dari nol dan paling banyak ${MAX_WEIGHT_KG} kg.`
      : null;

  const perluTanggal = targetSah && !targetDate;

  const tanggalRealistis =
    rencana.hariRealistis == null
      ? null
      : dateLabel(toIsoDate(addDays(TODAY, rencana.hariRealistis)));

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
      // Target hanya ikut tersimpan kalau lengkap DAN masuk akal. Separuh
      // target (berat tanpa tanggal) tidak bisa dipakai menghitung apa pun,
      // dan menyimpannya hanya menyisakan kolom yang membingungkan nanti.
      ...(targetSah && targetDate
        ? { targetWeight: targetKg, targetDate }
        : null),
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

          {/* Target boleh dilewati. Yang mengisinya mendapat target kalori yang
              dihitung mundur dari targetnya sendiri; yang melewatinya tetap
              memakai selisih bawaan dari program di atas. */}
          <View className="gap-3">
            <Text className="text-sm font-semibold text-ink">
              Target berat badan (opsional)
            </Text>

            <Field
              label="Berat target"
              placeholder="70"
              suffix="kg"
              value={targetWeight}
              onChangeText={setTargetWeight}
              error={galatTarget}
              keyboardType="numeric"
            />

            <DateField
              label="Ingin tercapai pada"
              value={targetDate}
              onChange={setTargetDate}
              placeholder="Pilih tanggal target"
              minimumDate={TENGGAT_TERCEPAT}
              maximumDate={TENGGAT_TERJAUH}
            />

            <Text className="text-2xs leading-4 text-ink-subtle">
              {perluTanggal
                ? 'Pilih tanggalnya juga supaya targetmu bisa dihitung.'
                : 'Kalau diisi, target kalori harianmu dihitung dari sini — bukan dari pilihan di atas. Boleh diubah kapan saja lewat Edit profil.'}
            </Text>
          </View>

          {estimasiSiap ? (
            <TargetSummary
              rencana={rencana}
              proyeksi={proyeksi}
              tanggalRealistis={tanggalRealistis}
            />
          ) : null}

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
