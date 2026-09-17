import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { addDays, differenceInCalendarDays, differenceInYears, parseISO } from 'date-fns';
import {
  ActionSheet,
  Avatar,
  Button,
  DateField,
  Field,
  Screen,
  ScreenHeader,
  TargetSummary,
} from '../../src/components';
import { colors } from '../../src/theme/colors';
import { deleteAvatar, saveAvatar } from '../../src/lib/avatar';
import { dateLabel, toIsoDate } from '../../src/lib/dates';
import {
  isChangingLoginEmail,
  MAX_WEIGHT_KG,
  validateProfileEdit,
} from '../../src/lib/validateProfile';
import { rencanaLengkap } from '../../src/lib/weightGoal';
import { useUser } from '../../src/context/UserContext';

/** Dihitung sekali; membuat Date baru tiap render membingungkan pemilihnya. */
const TODAY = new Date();
const OLDEST_BIRTH_DATE = new Date(
  TODAY.getFullYear() - 120,
  TODAY.getMonth(),
  TODAY.getDate(),
);

/** Sama seperti di pendaftaran tahap 2: paling cepat besok, paling lama 3 tahun. */
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

export default function EditProfileScreen() {
  const { user, updateUser, fullName } = useUser();

  const [form, setForm] = useState({
    name: fullName,
    email: user.email,
    height: String(user.height),
    weight: String(user.weight),
    targetGoal: user.targetGoal,
    targetWeight: user.targetWeight == null ? '' : String(user.targetWeight),
  });

  const [birthDate, setBirthDate] = useState(user.birthDate ?? null);
  const [targetDate, setTargetDate] = useState(user.targetDate ?? null);

  /** Galat baru muncul setelah percobaan simpan pertama — sama seperti layar masuk. */
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const setField = (key) => (value) => {
    const next = { ...form, [key]: value };
    setForm(next);
    if (submitted) setErrors(validateProfileEdit(next).errors);
  };

  const [busy, setBusy] = useState(false);

  /**
   * Menjalankan pemilih foto, lalu menyimpan hasilnya.
   *
   * Izin diminta TEPAT saat dibutuhkan, bukan saat layar dibuka: dialog izin
   * yang muncul tanpa dipancing tindakan hampir selalu ditolak.
   */
  const pickFrom = async (source) => {
    if (busy) return;

    const permission =
      source === 'kamera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        source === 'kamera' ? 'Izin kamera ditolak' : 'Izin galeri ditolak',
        permission.canAskAgain
          ? 'Izinkan aksesnya untuk mengganti foto profil.'
          : 'Nyalakan izinnya lewat Pengaturan sistem untuk mengganti foto profil.',
      );
      return;
    }

    const options = {
      mediaTypes: 'images',
      allowsEditing: true,
      // Persegi, karena foto profil selalu ditampilkan dalam lingkaran
      aspect: [1, 1],
      // Foto kamera berukuran beberapa megabyte, padahal ditampilkan di
      // bawah 100 piksel. Menurunkan mutunya menghemat ruang tanpa
      // perbedaan yang terlihat.
      quality: 0.6,
    };

    const result =
      source === 'kamera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

    if (result.canceled) return;

    const picked = result.assets?.[0];
    if (!picked?.uri) return;

    setBusy(true);
    try {
      // Disalin keluar dari cache dulu — lihat `src/lib/avatar.js`
      const stored = await saveAvatar(picked.uri, user.id, user.avatar);
      await updateUser({ avatar: stored });
    } catch (error) {
      Alert.alert('Foto gagal disimpan', String(error?.message ?? error));
    } finally {
      setBusy(false);
    }
  };

  const removePhoto = async () => {
    setBusy(true);
    try {
      const previous = user.avatar;
      await updateUser({ avatar: null });
      await deleteAvatar(previous);
    } finally {
      setBusy(false);
    }
  };

  const [sheetOpen, setSheetOpen] = useState(false);

  /**
   * "Hapus foto" hanya muncul kalau memang ada fotonya — menawarkan
   * penghapusan untuk sesuatu yang belum ada hanya membingungkan.
   */
  const photoOptions = [
    {
      label: 'Ambil foto',
      icon: 'camera-outline',
      onPress: () => pickFrom('kamera'),
    },
    {
      label: 'Pilih dari galeri',
      icon: 'images-outline',
      onPress: () => pickFrom('galeri'),
    },
    ...(user.avatar
      ? [
          {
            label: 'Hapus foto',
            icon: 'trash-outline',
            tone: 'danger',
            onPress: removePhoto,
          },
        ]
      : []),
  ];

  const openPhotoOptions = () => setSheetOpen(true);

  /**
   * Dihitung dari isi form, bukan dari `weightPlan` di konteks: yang perlu
   * dilihat pengguna adalah akibat angka yang SEDANG ia ubah, sebelum
   * disimpan. Konteks masih memegang nilai lama sampai Simpan ditekan.
   */
  const umur = birthDate ? differenceInYears(TODAY, parseISO(birthDate)) : null;
  const beratKg = Number(form.weight);
  const targetKg = Number(form.targetWeight);

  const sisaHari = targetDate
    ? differenceInCalendarDays(parseISO(targetDate), TODAY)
    : null;

  const { rencana, proyeksi } = rencanaLengkap({
    beratKg,
    tinggiCm: Number(form.height),
    umur,
    gender: user.gender,
    activityLevel: user.activityLevel,
    targetKg,
    hari: sisaHari,
  });

  const targetSah = Number.isFinite(targetKg) && targetKg > 0 && targetKg <= MAX_WEIGHT_KG;
  const targetLengkap = targetSah && Boolean(targetDate);
  const estimasiSiap = targetLengkap && rencana.kaloriTarget != null;

  /** Lihat catatan yang sama di pendaftaran tahap 2. */
  const galatTarget =
    form.targetWeight.trim() && !targetSah
      ? `Berat target harus lebih dari nol dan paling banyak ${MAX_WEIGHT_KG} kg.`
      : null;

  const perluTanggal = targetSah && !targetDate;

  const tanggalRealistis =
    rencana.hariRealistis == null
      ? null
      : dateLabel(toIsoDate(addDays(TODAY, rencana.hariRealistis)));

  const handleSave = async () => {
    const result = validateProfileEdit(form);

    setSubmitted(true);
    setErrors(result.errors);
    if (!result.valid) return;

    const [firstName, ...rest] = form.name.trim().split(' ');

    await updateUser({
      firstName,
      lastName: rest.join(' '),
      email: form.email,
      height: Number(form.height),
      weight: Number(form.weight),
      targetGoal: form.targetGoal,
      birthDate,
      // Mengosongkan berat target berarti MENCABUT targetnya, dan tanggalnya
      // ikut dicabut. Menyisakan tanggal tanpa berat hanya akan jadi kolom
      // yang tidak bisa dipakai menghitung apa-apa.
      targetWeight: targetLengkap ? targetKg : null,
      targetDate: targetLengkap ? targetDate : null,
    });

    router.back();
  };

  return (
    <Screen>
      <ScreenHeader title="Edit profil" />

      <ActionSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Foto profil"
        description={
          user.avatar
            ? 'Ganti atau hapus foto yang sedang dipakai.'
            : 'Pilih foto untuk ditampilkan di profilmu.'
        }
        options={photoOptions}
      />

      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View className="gap-5 px-5 pb-8">
          <Text className="text-sm text-ink-muted">
            Perbarui informasi personal dan target kesehatanmu.
          </Text>

          <View className="items-center gap-3">
            <Pressable
              onPress={openPhotoOptions}
              accessibilityRole="button"
              accessibilityLabel="Ubah foto profil"
              className="active:opacity-80"
            >
              <Avatar uri={user.avatar} name={fullName} size={96} />

              {busy ? (
                <View className="absolute h-24 w-24 items-center justify-center rounded-full bg-ink/40">
                  <ActivityIndicator color={colors.surface.DEFAULT} />
                </View>
              ) : (
                <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-brand">
                  <Ionicons name="camera" size={15} color={colors.surface.DEFAULT} />
                </View>
              )}
            </Pressable>

            <Pressable
              onPress={openPhotoOptions}
              accessibilityRole="button"
              hitSlop={8}
            >
              <Text className="text-sm font-bold text-brand">
                {user.avatar ? 'Ubah foto' : 'Tambah foto'}
              </Text>
            </Pressable>
          </View>

          <Field
            label="Nama lengkap"
            value={form.name}
            onChangeText={setField('name')}
            error={errors.name}
            placeholder="Nama lengkap"
          />

          <View className="gap-2">
            <Field
              label="Email"
              value={form.email}
              onChangeText={setField('email')}
              error={errors.email}
              placeholder="nama@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Kolom ini bukan sekadar keterangan kontak — ia dipakai untuk
                masuk. Hampir tidak ada yang menduganya, jadi dikatakan
                tepat saat alamatnya diubah. */}
            {isChangingLoginEmail(form.email, user.email) ? (
              <View className="flex-row items-start gap-2 rounded-xl bg-steps-soft px-3 py-2">
                <Ionicons
                  name="alert-circle-outline"
                  size={14}
                  color={colors.steps.DEFAULT}
                />
                <Text className="flex-1 text-2xs leading-4 text-steps">
                  Email ini dipakai untuk masuk. Setelah disimpan, gunakan
                  alamat baru ini saat masuk berikutnya.
                </Text>
              </View>
            ) : null}
          </View>

          {/* Umur di tab Profil dan BMR di target kalori sama-sama
              diturunkan dari sini, jadi salah pilih saat mendaftar harus bisa
              diperbaiki. */}
          <DateField
            label="Tanggal lahir"
            value={birthDate}
            onChange={setBirthDate}
            placeholder="Pilih tanggal lahir"
            minimumDate={OLDEST_BIRTH_DATE}
            maximumDate={TODAY}
          />

          <View className="flex-row gap-4">
            <Field
              label="Tinggi"
              value={form.height}
              onChangeText={setField('height')}
              error={errors.height}
              placeholder="165"
              suffix="cm"
              keyboardType="numeric"
              className="flex-1"
            />
            <Field
              label="Berat"
              value={form.weight}
              onChangeText={setField('weight')}
              error={errors.weight}
              placeholder="58"
              suffix="kg"
              keyboardType="numeric"
              className="flex-1"
            />
          </View>

          <Field
            label="Target utama"
            value={form.targetGoal}
            onChangeText={setField('targetGoal')}
            placeholder="Lebih bugar dan tidur teratur"
          />

          <View className="gap-3">
            <Text className="text-sm font-semibold text-ink">
              Target berat badan (opsional)
            </Text>

            <Field
              label="Berat target"
              value={form.targetWeight}
              onChangeText={setField('targetWeight')}
              error={galatTarget}
              placeholder="70"
              suffix="kg"
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
                : 'Kalau diisi, target kalori harianmu dihitung dari sini — bukan dari program. Kosongkan berat target untuk mencabutnya.'}
            </Text>
          </View>

          {estimasiSiap ? (
            <TargetSummary
              rencana={rencana}
              proyeksi={proyeksi}
              tanggalRealistis={tanggalRealistis}
            />
          ) : null}

          <Button label="Simpan perubahan" onPress={handleSave} className="mt-2" />
        </View>
      </ScrollView>
    </Screen>
  );
}
