import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Button, Field, Screen, ScreenHeader } from '../../src/components';
import { colors } from '../../src/theme/colors';
import { useUser } from '../../src/context/UserContext';

export default function EditProfileScreen() {
  const { user, updateUser, fullName } = useUser();

  const [form, setForm] = useState({
    name: fullName,
    email: user.email,
    height: String(user.height),
    weight: String(user.weight),
    targetGoal: user.targetGoal,
  });

  const setField = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    const [firstName, ...rest] = form.name.trim().split(' ');

    await updateUser({
      firstName: firstName ?? user.firstName,
      lastName: rest.join(' '),
      email: form.email,
      height: Number(form.height) || user.height,
      weight: Number(form.weight) || user.weight,
      targetGoal: form.targetGoal,
    });

    router.back();
  };

  return (
    <Screen>
      <ScreenHeader title="Edit profil" />

      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View className="gap-5 px-5 pb-8">
          <Text className="text-sm text-ink-muted">
            Perbarui informasi personal dan target kesehatanmu.
          </Text>

          <View className="items-center gap-3">
            <View className="h-24 w-24 items-center justify-center rounded-full bg-surface-sunken">
              <Ionicons name="person" size={44} color={colors.ink.subtle} />
            </View>
            <Pressable accessibilityRole="button" hitSlop={8}>
              <Text className="text-sm font-bold text-brand">Ubah foto</Text>
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

          <View className="flex-row gap-4">
            <Field
              label="Tinggi"
              value={form.height}
              onChangeText={setField('height')}
              placeholder="165 cm"
              keyboardType="numeric"
              className="flex-1"
            />
            <Field
              label="Berat"
              value={form.weight}
              onChangeText={setField('weight')}
              placeholder="58 kg"
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
