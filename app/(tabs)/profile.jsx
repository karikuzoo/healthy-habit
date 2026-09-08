import React from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Card, Screen } from '../../src/components';
import { colors } from '../../src/theme/colors';
import { programs, programLabel } from '../../src/data/profile';
import { formatNumber } from '../../src/lib/format';
import { useUser } from '../../src/context/UserContext';

function Stat({ label, value }) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-2xs font-bold tracking-widest text-ink-muted">{label}</Text>
      <Text className="mt-1 text-base font-bold text-ink">{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, updateUser, fullName, targetCalories, macroTargets } = useUser();

  const targetRows = [
    {
      label: 'Calories',
      value: `${formatNumber(targetCalories)} kkal`,
      color: colors.macro.calories,
    },
    { label: 'Protein', value: `${macroTargets.protein}g`, color: colors.macro.protein },
    { label: 'Carbs', value: `${macroTargets.carbs}g`, color: colors.macro.carbs },
    { label: 'Fat', value: `${macroTargets.fat}g`, color: colors.macro.fat },
  ];

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-6 px-5 pb-8 pt-2">
          <View className="flex-row justify-end">
            <Pressable
              onPress={() => router.push('/profile/edit')}
              accessibilityRole="button"
              accessibilityLabel="Edit profil"
              hitSlop={8}
              className="h-10 w-10 items-center justify-center rounded-full bg-surface active:opacity-70"
            >
              <Ionicons name="create-outline" size={22} color={colors.brand.DEFAULT} />
            </Pressable>
          </View>

          <View className="items-center gap-4">
            <View className="h-24 w-24 items-center justify-center rounded-full bg-surface-sunken">
              <Ionicons name="person" size={44} color={colors.ink.subtle} />
            </View>
            <Text className="text-2xl font-bold text-ink">{fullName}</Text>

            <View className="w-full flex-row">
              <Stat label="AGE" value={user.age} />
              <Stat label="WEIGHT" value={`${user.weight} kg`} />
              <Stat label="HEIGHT" value={`${user.height} cm`} />
            </View>
          </View>

          {/* Mengganti program juga mengubah target kalori & makro di bawah */}
          <View className="gap-4">
            <Text className="text-lg font-bold text-ink">Active Program</Text>
            <View className="flex-row gap-3">
              {programs.map((program) => {
                const active = user.program === program.value;
                return (
                  <Pressable
                    key={program.value}
                    onPress={() => updateUser({ program: program.value })}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    className={`flex-1 items-center gap-2 rounded-2xl border py-4 active:opacity-80 ${
                      active ? 'border-brand bg-brand' : 'border-line bg-surface'
                    }`}
                  >
                    <Ionicons
                      name={program.icon}
                      size={20}
                      color={active ? colors.surface.DEFAULT : colors.brand.DEFAULT}
                    />
                    <Text
                      className={`text-xs font-semibold ${
                        active ? 'text-white' : 'text-brand-dark'
                      }`}
                    >
                      {program.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="gap-4">
            <Text className="text-lg font-bold text-ink">
              Daily {programLabel(user.program)} Targets
            </Text>
            <Card className="overflow-hidden px-4">
              {targetRows.map((row, index) => (
                <View
                  key={row.label}
                  className={`flex-row items-center gap-3 py-4 ${
                    index > 0 ? 'border-t border-line-soft' : ''
                  }`}
                >
                  <View
                    className="h-3 w-1 rounded-full"
                    style={{ backgroundColor: row.color }}
                  />
                  <Text className="flex-1 text-base text-ink">{row.label}</Text>
                  <Text className="text-base font-bold text-ink">{row.value}</Text>
                </View>
              ))}
            </Card>
          </View>

          <View className="gap-4">
            <Text className="text-lg font-bold text-ink">Settings</Text>
            <Card className="overflow-hidden px-4">
              <Pressable
                accessibilityRole="button"
                className="flex-row items-center justify-between py-4 active:opacity-70"
              >
                <Text className="text-base text-ink">Notification Preferences</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.ink.subtle} />
              </Pressable>

              <Pressable
                onPress={() =>
                  updateUser({ units: user.units === 'metric' ? 'imperial' : 'metric' })
                }
                accessibilityRole="button"
                className="flex-row items-center justify-between border-t border-line-soft py-4 active:opacity-70"
              >
                <Text className="text-base text-ink">Units (kg/lbs)</Text>
                <Text className="text-base text-ink-muted">
                  {user.units === 'metric' ? 'Metric (kg)' : 'Imperial (lbs)'}
                </Text>
              </Pressable>

              <View className="flex-row items-center justify-between border-t border-line-soft py-4">
                <Text className="text-base text-ink">Dark Mode</Text>
                <Switch
                  value={user.darkMode}
                  onValueChange={(value) => updateUser({ darkMode: value })}
                  trackColor={{ false: colors.line.DEFAULT, true: colors.brand.DEFAULT }}
                  thumbColor={colors.surface.DEFAULT}
                />
              </View>
            </Card>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
