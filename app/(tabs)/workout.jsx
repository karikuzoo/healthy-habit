import React, { useCallback, useEffect, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import * as Haptics from "expo-haptics";
import { addDays, format, isToday, startOfWeek } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Button, Card, ExerciseMedia, Screen } from "../../src/components";
import { colors } from "../../src/theme/colors";
import {
  exerciseCategories,
  formatSets,
  planEstimate,
  resolvePlan,
  todayWorkout,
} from "../../src/data/workout";
import {
  deleteTodayExercise,
  listTodayExercises,
} from "../../src/db/workoutLogs";
import { getTodayPlan, removePlanExercise } from "../../src/db/workoutPlan";
import { getSleepForDay } from "../../src/db/sleepLogs";
import { formatDuration } from "../../src/data/sleep";
import { useUser } from "../../src/context/UserContext";

/** Pilihan preset rest timer, dalam detik. 0 berarti "Off". */
const REST_PRESETS = [0, 15, 30, 45, 60, 90, 120];

/** 69 -> "01:09" */
function formatClock(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

function formatRestLabel(seconds) {
  return seconds === 0 ? "Off" : `${seconds}s`;
}

function SummaryItem({ value, label }) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-2xl font-bold text-white">{value}</Text>
      <Text className="mt-0.5 text-xs text-white/75">{label}</Text>
    </View>
  );
}

/**
 * Tujuh tanggal minggu berjalan, buat strip tanggal di kepala layar Workout.
 * Murni tampilan — belum ada fitur menyusun rencana per tanggal tertentu,
 * jadi selain hari ini tanggalnya tidak bisa ditekan untuk pindah rencana.
 */
function weekDates() {
  const start = startOfWeek(new Date(), { locale: idLocale });
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

function DayStrip() {
  const days = weekDates();

  return (
    <View className="mt-5 flex-row justify-between">
      {days.map((date) => {
        const today = isToday(date);
        return (
          <View key={date.toISOString()} className="items-center gap-1.5">
            <Text
              className={`text-2xs font-bold uppercase ${
                today ? "text-brand" : "text-ink-subtle"
              }`}
            >
              {today ? "Today" : format(date, "EEEEE", { locale: idLocale })}
            </Text>
            <View
              className={`h-8 w-8 items-center justify-center rounded-full ${
                today ? "bg-brand" : ""
              }`}
            >
              <Text
                className={`text-sm font-bold ${
                  today ? "text-white" : "text-ink"
                }`}
              >
                {format(date, "d")}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** Satu baris opsi (Mulai Latihan / Temukan Program). */
function StartOption({ icon, title, subtitle, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="active:opacity-80"
    >
      <Card className="flex-row items-center gap-4 p-4">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-brand-soft">
          <Ionicons name={icon} size={18} color={colors.brand.DEFAULT} />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-ink">{title}</Text>
          <Text className="mt-0.5 text-sm text-ink-muted">{subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.ink.subtle} />
      </Card>
    </Pressable>
  );
}

/**
 * Nama program otomatis dari kategori gerakan terbanyak di rencana.
 * Bukan nama yang disimpan pengguna — sekadar label ringkas untuk kartu
 * pembungkus, dihitung ulang dari isi rencana setiap kali dirender.
 */
function planProgramName(plan) {
  if (plan.length === 0) return "Latihan hari ini";

  const counts = {};
  plan.forEach((exercise) => {
    counts[exercise.category] = (counts[exercise.category] ?? 0) + 1;
  });

  const [topCategory, topCount] = Object.entries(counts).sort(
    (a, b) => b[1] - a[1],
  )[0];

  const dominant = topCount / plan.length >= 0.6;
  if (!dominant) return "Latihan Campuran";

  const categoryName =
    exerciseCategories.find((category) => category.id === topCategory)?.name ??
    "Latihan";
  return `Program ${categoryName}`;
}

/** Kartu ringkas: seluruh rencana dibungkus jadi satu program, tap untuk buka daftarnya. */
function ProgramSummaryCard({ plan, onPress }) {
  const estimate = planEstimate(plan.length);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="active:opacity-80"
    >
      <Card className="flex-row items-center gap-4 p-4">
        <View className="h-14 w-14 overflow-hidden rounded-xl bg-brand-soft">
          <ExerciseMedia exerciseId={plan[0]?.id} size={56} />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-ink">
            {planProgramName(plan)}
          </Text>
          <Text className="mt-0.5 text-sm text-ink-muted">
            {estimate.durationMinutes} min | {estimate.calories} Kkal
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.ink.subtle} />
      </Card>
    </Pressable>
  );
}

export default function WorkoutScreen() {
  const db = useSQLiteContext();
  const { user } = useUser();

  const [progress, setProgress] = useState(() => new Map());
  const [sleepMinutes, setSleepMinutes] = useState(null);

  /**
   * Rencana dibaca dari database, bukan dari konstanta katalog. Itu yang
   * membuat gerakan tambahan bertahan setelah layar ditutup — dan gerakan
   * yang dihapus tidak muncul lagi.
   *
   * `null` berarti belum selesai dibaca; daftar kosong berarti rencana yang
   * memang dikosongkan pengguna. Keduanya tidak boleh tertukar, karena yang
   * satu menampilkan ajakan menambah gerakan dan yang lain tidak.
   */
  const [exercises, setExercises] = useState(null);

  /**
   * Rencana yang sudah ada isinya ditampilkan ringkas dulu (satu kartu
   * program) — daftar per gerakan hanya muncul begitu kartu itu di-tap.
   * Direset ke ringkas lagi setiap layar difokuskan ulang, supaya kembali
   * dari sesi latihan tidak menyisakan daftar penuh terbuka begitu saja.
   */
  const [expanded, setExpanded] = useState(false);

  /**
   * Timer sesi latihan (layar "Rincian latihan"), lokal ke layar ini —
   * bukan dicatat ke database. `sessionState`:
   *
   * - 'idle'    belum ditekan Mulai Latihan sama sekali, atau habis RESET.
   * - 'running' berjalan, `elapsedSeconds` naik tiap detik.
   * - 'paused'  berhenti manual (rest timer di-set "Off" lalu Pause ditekan).
   * - 'resting' menghitung MUNDUR sebesar rest timer yang di-set pengguna;
   *             `elapsedSeconds` tetap naik (total durasi termasuk istirahat),
   *             begitu `restSecondsLeft` habis, alarm bunyi dan otomatis
   *             kembali ke 'running' tanpa perlu ditekan lagi.
   */
  const [sessionState, setSessionState] = useState("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [restTimerSeconds, setRestTimerSeconds] = useState(0);
  const [restSecondsLeft, setRestSecondsLeft] = useState(0);
  const [showRestPicker, setShowRestPicker] = useState(false);
  const [restAlarmVisible, setRestAlarmVisible] = useState(false);

  const refresh = useCallback(async () => {
    const [plan, done, sleep] = await Promise.all([
      getTodayPlan(db, user.id),
      listTodayExercises(db, user.id),
      getSleepForDay(db, user.id),
    ]);

    setExercises(resolvePlan(plan));
    setProgress(done);
    setSleepMinutes(sleep?.durationMinutes ?? null);
  }, [db, user.id]);

  useFocusEffect(
    useCallback(() => {
      setExpanded(false);
      // Sesi timer ikut direset setiap layar dibuka ulang, supaya tidak ada
      // hitungan "hantu" yang jalan terus di belakang layar lain.
      setSessionState("idle");
      setElapsedSeconds(0);
      setRestSecondsLeft(0);
      refresh();
    }, [refresh]),
  );

  /**
   * "Alarm" waktu istirahat habis. Project ini belum punya library audio
   * (expo-av/expo-audio), jadi dipakai getaran berulang + banner singkat —
   * tetap terasa meski HP disilent. Kalau nanti mau bunyi asli, tinggal
   * ganti/tambah di sini.
   */
  const triggerRestAlarm = () => {
    setRestAlarmVisible(true);
    setTimeout(() => setRestAlarmVisible(false), 2500);

    [0, 300, 600].forEach((delay) => {
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, delay);
    });
  };

  // Detak jam sesi: jalan tiap detik selagi 'running' atau 'resting'.
  useEffect(() => {
    if (sessionState !== "running" && sessionState !== "resting") {
      return undefined;
    }

    const interval = setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1);

      if (sessionState === "resting") {
        setRestSecondsLeft((secondsLeft) => {
          if (secondsLeft <= 1) {
            triggerRestAlarm();
            setSessionState("running");
            return 0;
          }
          return secondsLeft - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionState]);

  const handlePrimaryPress = () => {
    if (sessionState === "idle" || sessionState === "paused") {
      setSessionState("running");
      return;
    }

    if (sessionState === "running") {
      if (restTimerSeconds > 0) {
        setRestSecondsLeft(restTimerSeconds);
        setSessionState("resting");
      } else {
        setSessionState("paused");
      }
      return;
    }

    if (sessionState === "resting") {
      // Ditekan manual sebelum hitungan mundur habis: langsung lanjut.
      setSessionState("running");
    }
  };

  const handleResetSession = () => {
    setSessionState("idle");
    setElapsedSeconds(0);
    setRestSecondsLeft(0);
  };

  // Handler untuk konfirmasi dan menghapus gerakan
  const handleDeleteExercise = (exercise) => {
    Alert.alert(
      "Hapus Gerakan?",
      `Apakah kamu yakin ingin menghapus "${exercise.name}" dari latihan hari ini?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            // Dikeluarkan dari rencana sekaligus dari catatan hari ini. Kalau
            // hanya catatannya yang dihapus, gerakannya muncul lagi di rencana
            // begitu layar dibuka ulang.
            await removePlanExercise(db, user.id, exercise.id);
            await deleteTodayExercise(db, user.id, exercise.id);
            await refresh();
          },
        },
      ],
    );
  };

  const plan = exercises ?? [];
  const estimate = planEstimate(plan.length);
  const isEmpty = exercises !== null && plan.length === 0;
  const showList = !isEmpty && expanded;

  const findProgramAlert = () =>
    Alert.alert(
      "Segera hadir",
      'Program latihan siap pakai belum tersedia. Untuk sekarang, susun latihanmu sendiri lewat "Mulai Latihan".',
    );

  return (
    <Screen>
      <View className="px-5">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 flex-row items-start gap-3">
            {showList ? (
              <Pressable
                onPress={() => setExpanded(false)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Kembali ke ringkasan latihan"
                className="mt-0.5 h-9 w-9 items-center justify-center rounded-full bg-surface-sunken active:opacity-70"
              >
                <Ionicons name="arrow-back" size={18} color={colors.ink} />
              </Pressable>
            ) : null}

            <View className="flex-1">
              <Text className="text-3xl font-bold text-ink">Workout</Text>
              <Text className="mt-1 text-sm text-ink-muted">
                {showList
                  ? `${todayWorkout.level} • ${estimate.durationMinutes} menit • ${todayWorkout.intensity}`
                  : `${todayWorkout.level} • ${todayWorkout.intensity}`}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => router.push("/workout/history")}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Riwayat latihan"
            className="flex-row items-center gap-1.5 rounded-full bg-brand-soft px-3 py-2 active:opacity-70"
          >
            <Ionicons
              name="time-outline"
              size={16}
              color={colors.brand.DEFAULT}
            />
            <Text className="text-xs font-bold text-brand-dark">Riwayat</Text>
          </Pressable>
        </View>

        {showList ? (
          <>
            {/* Ringkasan Latihan */}
            <View className="mt-5 rounded-card bg-brand p-4">
              <View className="flex-row items-center">
                <SummaryItem value={estimate.calories} label="kkal" />
                <View className="h-8 w-px bg-white/25" />
                <SummaryItem value={plan.length} label="gerakan" />
                <View className="h-8 w-px bg-white/25" />
                <SummaryItem value={formatClock(elapsedSeconds)} label="Time" />
              </View>
            </View>

            <Pressable
              onPress={() => setShowRestPicker(true)}
              accessibilityRole="button"
              className="mt-4 flex-row items-center gap-1.5 self-start active:opacity-70"
            >
              <Ionicons
                name="timer-outline"
                size={16}
                color={colors.brand.DEFAULT}
              />
              <Text className="text-sm font-semibold text-brand-dark">
                Rest Timer : {formatRestLabel(restTimerSeconds)}
              </Text>
            </Pressable>

            {restAlarmVisible ? (
              <View className="mt-2 flex-row items-center gap-1.5 self-start rounded-full bg-brand-soft px-3 py-1.5">
                <Ionicons name="alarm" size={14} color={colors.brand.dark} />
                <Text className="text-xs font-bold text-brand-dark">
                  Istirahat selesai — lanjutkan!
                </Text>
              </View>
            ) : null}
          </>
        ) : (
          <DayStrip />
        )}
      </View>

      {showList ? (
        <>
          <ScrollView showsVerticalScrollIndicator={false} className="mt-5">
            <View className="gap-3 px-5 pb-4">
              {plan.map((exercise, index) => {
                const done = progress.get(exercise.id);
                const complete = done && done.setsCompleted >= exercise.sets;

                return (
                  <Card
                    key={exercise.planId}
                    className="flex-row items-center gap-1 p-3"
                  >
                    {/* Area utama (klik untuk ke halaman Sesi) */}
                    <Pressable
                      onPress={() =>
                        router.push(`/workout/session?exercise=${exercise.id}`)
                      }
                      accessibilityRole="button"
                      className="flex-1 flex-row items-center gap-3 active:opacity-80"
                    >
                      {complete ? (
                        <View className="h-16 w-16 items-center justify-center rounded-xl bg-brand-soft">
                          <Ionicons
                            name="checkmark-circle"
                            size={28}
                            color={colors.brand.DEFAULT}
                          />
                        </View>
                      ) : (
                        <View className="h-16 w-16 overflow-hidden rounded-xl bg-brand-soft">
                          <ExerciseMedia exerciseId={exercise.id} size={64} />
                        </View>
                      )}

                      <View className="flex-1">
                        <Text className="text-base font-bold text-ink">
                          {exercise.name}
                        </Text>
                        <Text className="mt-0.5 text-sm text-ink-muted">
                          {done
                            ? `${done.setsCompleted} dari ${exercise.sets} set selesai`
                            : formatSets(exercise)}
                        </Text>
                      </View>
                    </Pressable>

                    {/* Ubah set dan repetisi gerakan ini */}
                    <Pressable
                      onPress={() =>
                        router.push(
                          `/workout/configure?exercise=${exercise.id}`,
                        )
                      }
                      hitSlop={8}
                      className="p-2 active:opacity-60"
                      accessibilityRole="button"
                      accessibilityLabel={`Ubah set dan repetisi ${exercise.name}`}
                    >
                      <Ionicons
                        name="create-outline"
                        size={20}
                        color={colors.ink.muted}
                      />
                    </Pressable>

                    {/* Tombol Sampah untuk Menghapus */}
                    <Pressable
                      onPress={() => handleDeleteExercise(exercise)}
                      hitSlop={8}
                      className="p-2 active:opacity-60"
                      accessibilityRole="button"
                      accessibilityLabel={`Hapus gerakan ${exercise.name}`}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color={colors.ink.subtle}
                      />
                    </Pressable>
                  </Card>
                );
              })}
            </View>
          </ScrollView>

          <View className="gap-2 px-5 pb-3 pt-1">
            <Pressable
              onPress={() => router.push("/workout/add")}
              accessibilityRole="button"
              className="flex-row items-center justify-center gap-1.5 py-1 active:opacity-70"
            >
              <Ionicons
                name="add-circle-outline"
                size={16}
                color={colors.brand.DEFAULT}
              />
              <Text className="text-sm font-semibold text-brand-dark">
                Tambahkan gerakan
              </Text>
            </Pressable>

            <View className="flex-row gap-3">
              <Button
                variant="soft"
                onPress={handleResetSession}
                className="flex-1 flex-row items-center justify-center gap-1.5"
              >
                <Ionicons name="refresh" size={16} color={colors.brand.dark} />
                <Text className="text-base font-bold text-brand-dark">
                  RESET
                </Text>
              </Button>

              <Button
                onPress={handlePrimaryPress}
                className="flex-[2] flex-row items-center justify-center gap-1.5"
              >
                <Ionicons
                  name={
                    sessionState === "running"
                      ? "pause"
                      : sessionState === "resting"
                        ? "time"
                        : "play"
                  }
                  size={16}
                  color="#FFFFFF"
                />
                <Text className="text-base font-bold text-white">
                  {sessionState === "running"
                    ? "Pause"
                    : sessionState === "resting"
                      ? `Istirahat ${restSecondsLeft}s`
                      : "Mulai Latihan"}
                </Text>
              </Button>
            </View>
          </View>
        </>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} className="mt-6">
          <View className="gap-3 px-5 pb-8">
            <Text className="mb-1 text-lg font-bold text-ink">
              {isEmpty ? "Tidak ada latihan hari ini" : "Latihanmu hari ini"}
            </Text>

            {!isEmpty ? (
              <ProgramSummaryCard
                plan={plan}
                onPress={() => setExpanded(true)}
              />
            ) : null}

            <StartOption
              icon="play"
              title="Mulai Latihan"
              subtitle="Buat menu latihanmu sendiri"
              onPress={() => router.push("/workout/add")}
            />

            <StartOption
              icon="search"
              title="Temukan Program Latihan"
              subtitle="Latihan dengan program yang tersedia"
              onPress={findProgramAlert}
            />

            {/* Rekomendasi, sama seperti kartu di Home */}
            <View className="mt-2 rounded-2xl bg-brand-soft p-5">
              <Text className="mb-2 text-base font-bold text-brand-dark">
                <Ionicons name="sparkles" size={16} color={colors.brand.dark}>
                  {" "}
                </Ionicons>
                Today's FitSync Plan
              </Text>
              <Text className="text-sm leading-6 text-brand-darker">
                Light Cardio recommended{" "}
                {sleepMinutes != null &&
                  ` (${formatDuration(sleepMinutes)} sleep detected)`}
                . Focus on an active recovery jog and steady breathing to
                optimize longevity.
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Picker Rest Timer */}
      <Modal
        visible={showRestPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRestPicker(false)}
      >
        <Pressable
          className="flex-1 items-center justify-end bg-black/40"
          onPress={() => setShowRestPicker(false)}
        >
          <Pressable
            onPress={() => {}}
            className="w-full rounded-t-3xl bg-surface-muted p-5 pb-8"
          >
            <Text className="mb-3 text-center text-base font-bold text-ink">
              Atur Rest Timer
            </Text>

            {REST_PRESETS.map((seconds) => (
              <Pressable
                key={seconds}
                onPress={() => {
                  setRestTimerSeconds(seconds);
                  setShowRestPicker(false);
                }}
                accessibilityRole="button"
                className="flex-row items-center justify-between border-b border-surface-sunken py-3 active:opacity-70"
              >
                <Text className="text-base text-ink">
                  {formatRestLabel(seconds)}
                </Text>
                {restTimerSeconds === seconds ? (
                  <Ionicons
                    name="checkmark"
                    size={18}
                    color={colors.brand.DEFAULT}
                  />
                ) : null}
              </Pressable>
            ))}

            <Button
              label="Tutup"
              variant="soft"
              onPress={() => setShowRestPicker(false)}
              className="mt-4"
            />
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
