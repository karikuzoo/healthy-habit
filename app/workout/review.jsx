import React from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { Button, Card, ExerciseMedia, Screen } from "../../src/components";
import { colors } from "../../src/theme/colors";
import { planEstimate, todayWorkout } from "../../src/data/workout";
import { saveTemplate, updateTemplate } from "../../src/db/workoutTemplates";
import { replaceTodayPlanWithTemplate } from "../../src/db/workoutPlan";
import { useUser } from "../../src/context/UserContext";
import { useWorkoutBuilder } from "../../src/context/WorkoutBuilderContext";

/** Jarak naik/turun tiap satuan — repetisi 1 per ketuk, detik/menit 5 per ketuk. */
const STEP_BY_UNIT = { repetisi: 1, detik: 5, menit: 5 };

/** Akhiran pendek di sebelah angka; repetisi tidak diberi akhiran sama sekali. */
function unitSuffix(unit) {
  if (unit === "detik") return "dtk";
  if (unit === "menit") return "min";
  return "";
}

/** Stepper ringkas untuk satu baris kartu — versi kecil dari komponen Stepper biasa. */
function InlineStepper({ amount, unit, onChange }) {
  const step = STEP_BY_UNIT[unit] ?? 1;
  const suffix = unitSuffix(unit);

  return (
    <View className="flex-row items-center gap-1 rounded-full bg-brand-soft p-1">
      <Pressable
        onPress={() => onChange(Math.max(1, amount - step))}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="Kurangi"
        className="h-7 w-7 items-center justify-center rounded-full bg-surface active:opacity-70"
      >
        <Ionicons name="remove" size={14} color={colors.brand.dark} />
      </Pressable>

      <Text className="min-w-[34px] text-center text-sm font-bold text-brand-dark">
        {amount}
        {suffix ? ` ${suffix}` : ""}
      </Text>

      <Pressable
        onPress={() => onChange(amount + step)}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="Tambah"
        className="h-7 w-7 items-center justify-center rounded-full bg-surface active:opacity-70"
      >
        <Ionicons name="add" size={14} color={colors.brand.dark} />
      </Pressable>
    </View>
  );
}

export default function WorkoutReviewScreen() {
  const db = useSQLiteContext();
  const { user, updateUser } = useUser();
  const {
    items,
    templateId,
    templateName,
    setTemplateName,
    totalSets,
    duplicateExercise,
    removeExercise,
    updateAmount,
    clear,
    toPlanRows,
  } = useWorkoutBuilder();

  const [saving, setSaving] = React.useState(false);
  const estimate = planEstimate(items.length);

  const handleRemove = (item) => {
    Alert.alert(
      "Hapus gerakan?",
      `"${item.name}" akan dihapus dari pilihan ini.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => removeExercise(item.key),
        },
      ],
    );
  };

  const handleSave = async () => {
    if (saving || items.length === 0) return;
    setSaving(true);

    const nameToSave =
      templateName.trim() === "" ? "Custom Template" : templateName.trim();

    // Save to templates — baik bikin baru maupun edit, ID hasilnya SELALU
    // dijadikan template aktif (lihat updateUser di bawah). Sebelumnya
    // langkah ini tidak ada sama sekali, jadi tab Workout tetap menunjuk ke
    // activeTemplateId yang lama/basi walau pengguna baru saja menyimpan
    // template lain dengan nama baru — makanya nama yang tampil di header
    // tidak pernah sesuai dengan yang baru disimpan.
    const savedTemplateId = templateId
      ? await updateTemplate(db, templateId, nameToSave, toPlanRows()).then(
          () => templateId,
        )
      : await saveTemplate(db, user.id, nameToSave, toPlanRows());

    // Also set it as today's plan
    await replaceTodayPlanWithTemplate(db, user.id, toPlanRows());
    await updateUser({ activeTemplateId: savedTemplateId });

    clear();
    // Kembali ke tab Workout, dan request agar daftar diexpand
    router.navigate("/(tabs)/workout?expand=true");
  };

  return (
    <Screen>
      <View className="px-5">
        <View className="flex-row items-start gap-3">
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Kembali"
            className="mt-0.5 h-9 w-9 items-center justify-center rounded-full bg-surface-sunken active:opacity-70"
          >
            <Ionicons name="arrow-back" size={18} color={colors.ink.DEFAULT} />
          </Pressable>

          <View className="flex-1">
            <Text className="text-3xl font-bold text-ink">Workout</Text>
            <Text className="mt-1 text-sm text-ink-muted">
              {todayWorkout.level} • {todayWorkout.intensity}
            </Text>
          </View>
        </View>

        <View className="mt-5 rounded-card bg-brand p-4">
          <View className="flex-row items-center">
            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-white">
                {estimate.calories}
              </Text>
              <Text className="mt-0.5 text-xs text-white/75">kkal</Text>
            </View>
            <View className="h-8 w-px bg-white/25" />
            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-white">
                {items.length}
              </Text>
              <Text className="mt-0.5 text-xs text-white/75">gerakan</Text>
            </View>
            <View className="h-8 w-px bg-white/25" />
            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-white">{totalSets}</Text>
              <Text className="mt-0.5 text-xs text-white/75">Set</Text>
            </View>
          </View>
        </View>

        <View className="mt-5 px-1">
          <Text className="mb-2 text-sm font-bold text-ink">Nama Template</Text>
          <View className="rounded-xl border border-surface-sunken bg-surface px-4 py-3">
            <TextInput
              placeholder="Contoh: Latihan Otot Lengan"
              value={templateName}
              onChangeText={setTemplateName}
              style={{ fontSize: 16, color: colors.ink.DEFAULT }}
              placeholderTextColor={colors.ink.subtle}
            />
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="mt-5">
        <View className="gap-3 px-5 pb-4">
          {items.length === 0 ? (
            <Card className="items-center gap-2 p-8">
              <Ionicons
                name="barbell-outline"
                size={28}
                color={colors.ink.subtle}
              />
              <Text className="text-center text-sm text-ink-muted">
                Belum ada gerakan dipilih. Tap "Tambah Gerakan" di bawah untuk
                mulai.
              </Text>
            </Card>
          ) : (
            items.map((item) => (
              <Card key={item.key} className="flex-row items-center gap-3 p-3">
                <ExerciseMedia exerciseId={item.exerciseId} size={56} />

                <Text
                  className="flex-1 text-base font-bold text-ink"
                  numberOfLines={2}
                >
                  {item.name}
                </Text>

                <InlineStepper
                  amount={item.amount}
                  unit={item.unit}
                  onChange={(next) => updateAmount(item.key, next)}
                />

                <View className="gap-2 ml-2">
                  <Pressable
                    onPress={() => duplicateExercise(item.key)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Salin ${item.name}`}
                    className="p-1 active:opacity-60 items-center justify-center"
                  >
                    <Ionicons
                      name="copy-outline"
                      size={19}
                      color={colors.ink.muted}
                    />
                  </Pressable>

                  <Pressable
                    onPress={() => handleRemove(item)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Hapus ${item.name}`}
                    className="p-1 active:opacity-60 items-center justify-center"
                  >
                    <Ionicons name="trash-outline" size={19} color="#EF4444" />
                  </Pressable>
                </View>
              </Card>
            ))
          )}

          <Pressable
            onPress={() => router.push("/workout/type")}
            accessibilityRole="button"
            className="items-center justify-center rounded-2xl border border-dashed border-brand py-4 pb-8 pt-8 active:opacity-70"
          >
            <Text className="text-base font-bold text-brand-dark">
              + Tambah Gerakan
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <View className="px-5 pb-16 pt-1">
        <Button
          label={saving ? "Menyimpan..." : "Simpan Latihan"}
          onPress={handleSave}
          className={items.length === 0 || saving ? "opacity-50" : ""}
        />
      </View>
    </Screen>
  );
}
