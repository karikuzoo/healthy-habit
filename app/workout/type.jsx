import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Screen, ScreenHeader } from "../../src/components";
import { cardShadow } from "../../src/theme/shadows";

/**
 * Kartu besar per jenis workout. Belum ada foto asli untuk masing-masing
 * jenis, jadi dipakai gradasi warna + ikon sebagai placeholder — mengikuti
 * pola yang sama seperti `ExerciseMedia` (ikon dulu, foto menyusul).
 */
const TYPE_CARDS = [
  {
    id: "weight-lifting",
    label: "WEIGHT LIFTING",
    icon: "barbell",
    gradient: ["#3A3A3A", "#121212"],
  },
  {
    id: "no-equipment",
    label: "NO EQUIPMENT",
    icon: "body",
    gradient: ["#4A4A4A", "#1A1A1A"],
  },
  {
    id: "cardio",
    label: "CARDIO",
    icon: "heart",
    gradient: ["#2E6B4F", "#123524"],
  },
];

export default function WorkoutTypeScreen() {
  const handleSelect = (type) => {
    // Kardio tidak dikelompokkan per otot — langsung ke daftar gerakan.
    if (type.id === "cardio") {
      router.push(`/workout/cardio?type=cardio`);
      return;
    }
    router.push(`/workout/muscle?type=${type.id}`);
  };

  return (
    <Screen>
      <ScreenHeader title="Jenis Workout" />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-4 px-5 pb-8 pt-1">
          <Text className="mb-1 text-sm text-ink-muted">
            Pilih Jenis Workout
          </Text>

          {TYPE_CARDS.map((type) => (
            <Pressable
              key={type.id}
              onPress={() => handleSelect(type)}
              accessibilityRole="button"
              className="active:opacity-90"
            >
              <View
                className="h-40 overflow-hidden rounded-2xl"
                style={cardShadow}
              >
                <LinearGradient
                  colors={type.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="flex-1 items-center justify-center"
                >
                  <Ionicons
                    name={type.icon}
                    size={36}
                    color="rgba(255,255,255,0.35)"
                    style={{ position: "absolute", top: 16, right: 16 }}
                  />
                  <Text className="text-xl font-bold tracking-wide text-white">
                    {type.label}
                  </Text>
                </LinearGradient>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
