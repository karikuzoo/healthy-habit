import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  ActionSheet,
  Avatar,
  Button,
  DateField,
  Field,
  Screen,
  ScreenHeader,
} from '../../src/components';
import { colors } from '../../src/theme/colors';
import { deleteAvatar, saveAvatar } from '../../src/lib/avatar';
import { useUser } from '../../src/context/UserContext';

/** Dihitung sekali; membuat Date baru tiap render membingungkan pemilihnya. */
const TODAY = new Date();
const OLDEST_BIRTH_DATE = new Date(
  TODAY.getFullYear() - 120,
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
  });

  const [birthDate, setBirthDate] = useState(user.birthDate ?? null);

  const setField = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

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

  const handleSave = async () => {
    const [firstName, ...rest] = form.name.trim().split(' ');

    await updateUser({
      firstName: firstName ?? user.firstName,
      lastName: rest.join(' '),
      email: form.email,
      height: Number(form.height) || user.height,
      weight: Number(form.weight) || user.weight,
      targetGoal: form.targetGoal,
      birthDate,
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
            placeholder="Nama lengkap"
          />

          <Field
            label="Email"
            value={form.email}
            onChangeText={setField('email')}
            placeholder="nama@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

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
              placeholder="165"
              suffix="cm"
              keyboardType="numeric"
              className="flex-1"
            />
            <Field
              label="Berat"
              value={form.weight}
              onChangeText={setField('weight')}
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

          <Button label="Simpan perubahan" onPress={handleSave} className="mt-2" />
        </View>
      </ScrollView>
    </Screen>
  );
}
