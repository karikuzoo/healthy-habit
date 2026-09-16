import "../global.css";
import React, { Suspense } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SQLiteProvider } from "expo-sqlite";
import { Loading } from "../src/components";
import { UserProvider } from "../src/context/UserContext";
import { WorkoutBuilderProvider } from "../src/context/WorkoutBuilderContext";
import { DATABASE_NAME, migrate } from "../src/db/schema";

/**
 * Urutan provider penting di sini:
 *
 * - SQLiteProvider harus di luar UserProvider, karena UserProvider membaca
 *   profil lewat `useSQLiteContext()`. Migrasi schema jalan di `onInit`,
 *   sebelum children render.
 * - SafeAreaProvider di luar UserProvider supaya penanda tunggu selagi profil
 *   dibaca tetap ter-render di dalam struktur yang benar.
 * - WorkoutBuilderProvider di dalam UserProvider (tidak butuh profil, tapi
 *   biar tetap satu blok dengan provider state lain) dan di luar Stack,
 *   supaya draft "Mulai Latihan" tetap hidup selagi pengguna berpindah
 *   antar layar Jenis Workout / Jenis Otot / daftar gerakan.
 *
 * Rute tidak perlu didaftarkan satu per satu — expo-router menemukannya dari
 * struktur folder, dan `screenOptions` sudah mematikan header untuk semuanya.
 */
export default function RootLayout() {
  return (
    <Suspense fallback={<Loading />}>
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrate} useSuspense>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <UserProvider>
            <WorkoutBuilderProvider>
              <Stack screenOptions={{ headerShown: false }} />
            </WorkoutBuilderProvider>
          </UserProvider>
        </SafeAreaProvider>
      </SQLiteProvider>
    </Suspense>
  );
}
