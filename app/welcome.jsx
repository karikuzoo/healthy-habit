import React, { useEffect, useRef, useState } from "react";
import { Animated, Text, View } from "react-native";
import { router } from "expo-router";
import { Button, Screen } from "../src/components";

// Daftar foto sampul welcome screen.
// Taruh file gambarnya di src/assets/welcome/, lalu sesuaikan nama filenya di sini.
// Bisa tambah/kurang jumlah gambar sesuka hati — akan otomatis ikut berputar.
const WELCOME_IMAGES = [
  require("../assets/welcome/welcome-1.webp"),
  require("../assets/welcome/welcome-2.webp"),
  require("../assets/welcome/welcome-3.webp"),
  require("../assets/welcome/welcome-4.webp"),
];

// Jeda pergantian gambar, dalam milidetik. 3000 = 3 detik.
const SLIDE_INTERVAL_MS = 6000;

export default function WelcomeScreen() {
  const [imageIndex, setImageIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Kalau cuma ada satu gambar (atau kosong), tidak perlu jalankan timer sama sekali
    if (WELCOME_IMAGES.length <= 1) return undefined;

    const timer = setInterval(() => {
      // Fade out gambar lama, ganti sumbernya, lalu fade in gambar baru
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setImageIndex((prev) => (prev + 1) % WELCOME_IMAGES.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, SLIDE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [fadeAnim]);

  return (
    <Screen className="pt-12 bg-surface" edges={[]}>
      {/* Foto sampul, berganti otomatis tiap beberapa detik dengan efek fade */}
      <View className="h-[45%] overflow-hidden rounded-3xl bg-brand-soft">
        <Animated.Image
          source={WELCOME_IMAGES[imageIndex]}
          resizeMode="cover"
          style={{ width: "100%", height: "100%", opacity: fadeAnim }}
        />
      </View>

      <View className="flex-1 justify-center px-6">
        <Text className="mb-4 text-xs font-bold tracking-widest text-brand-dark">
          HEALTHY HABIT
        </Text>
        <Text className="mb-3 text-stat font-bold text-ink">
          Sehat terasa lebih sederhana.
        </Text>
        <Text className="mb-10 text-base leading-6 text-ink-muted">
          Olahraga, tidur, nutrisi, dan langkah harian—semua dalam satu ritme.
        </Text>

        <View className="gap-3">
          <Button
            label="Daftar sekarang"
            onPress={() => router.push("/register")}
          />
          <Button
            label="Saya sudah punya akun"
            variant="soft"
            onPress={() => router.push("/login")}
          />
        </View>
      </View>
    </Screen>
  );
}
