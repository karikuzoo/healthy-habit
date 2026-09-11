import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  Button,
  Chip,
  Field,
  Screen,
  ScreenHeader,
  SelectField,
  StepProgress,
} from '../src/components';
import { activityLevels, genders, programs } from '../src/data/profile';
import { enterApp } from '../src/lib/navigation';
import { useUser } from '../src/context/UserContext';

export default function RegisterProfileScreen() {
  const { user, updateUser, login, birthDateLabel } = useUser();
  const [activityLevel, setActivityLevel] = useState(user.activityLevel);
  const [gender, setGender] = useState(user.gender);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [program, setProgram] = useState('cutting');

  const handleContinue = async () => {
    await updateUser({
      activityLevel,
      gender,
      program,
      ...(height ? { height: Number(height) } : null),
      ...(weight ? { weight: Number(weight) } : null),
    });
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

          <SelectField
            label="Tanggal lahir"
            icon="calendar-outline"
            value={birthDateLabel}
            placeholder="Pilih tanggal lahir"
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
              placeholder="165 cm"
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
              className="flex-1"
            />
            <Field
              label="Berat"
              placeholder="58 kg"
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

          <Button label="Lanjutkan" onPress={handleContinue} className="mt-2" />

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
