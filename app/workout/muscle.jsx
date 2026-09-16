import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Card, Screen, ScreenHeader } from "../../src/components";
import { colors } from "../../src/theme/colors";

/**
 * Enam kelompok otot ditulis eksplisit di sini (bukan mengambil semua isi
 * `exerciseCategories`), karena kategori itu sekarang juga memuat 'cardio' —
 * yang sengaja TIDAK muncul di layar ini (kardio langsung ke daftar gerakan
 * dari layar Jenis Workout, tanpa lewat pemilihan otot).
 */
const MUSCLE_GROUPS = [
  { id: "dada", label: "CHEST", icon: "body-outline" },
  { id: "bahu", label: "SHOULDER", icon: "body-outline" },
  { id: "punggung", label: "BACK", icon: "body-outline" },
  { id: "lengan", label: "ARMS", icon: "body-outline" },
  { id: "inti", label: "ABS", icon: "body-outline" },
  { id: "kaki", label: "LEGS", icon: "body-outline" },
];

export default function MuscleGroupScreen() {
  const { type } = useLocalSearchParams();

  return (
    <Screen>
      <ScreenHeader title="Jenis Otot" />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-5 pb-8 pt-1">
          <Text className="mb-4 text-sm text-ink-muted">Pilih Jenis Otot</Text>

          <View className="flex-row flex-wrap justify-between gap-y-4">
            {MUSCLE_GROUPS.map((muscle) => (
              <Pressable
                key={muscle.id}
                onPress={() =>
                  router.push(`/workout/${muscle.id}?type=${type ?? ""}`)
                }
                accessibilityRole="button"
                className="w-[48%] active:opacity-80"
              >
                <Card className="items-center gap-2 p-5">
                  {/*
                    Belum ada ilustrasi siluet tubuh per otot (seperti di
                    referensi desain) — dipakai ikon placeholder dulu, warna
                    lingkaran beda-beda sekadar biar tiap kartu mudah dibedakan
                    sekilas. Tinggal ganti View ini dengan <Image> begitu
                    asetnya tersedia.
                  */}
                  <View className="h-16 w-16 items-center justify-center rounded-full bg-brand-soft">
                    <Ionicons
                      name={muscle.icon}
                      size={30}
                      color={colors.brand.DEFAULT}
                    />
                  </View>
                  <Text className="text-sm font-bold tracking-wide text-ink">
                    {muscle.label}
                  </Text>
                </Card>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
