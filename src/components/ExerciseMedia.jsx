import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { framesFor } from '../data/exerciseMedia';

/** Jeda tukar frame. Cukup lambat untuk dicerna, cukup cepat untuk terasa bergerak. */
const FRAME_MS = 900;

/**
 * Peraga satu gerakan latihan.
 *
 * Sumbernya dua foto statis — posisi awal dan akhir — bukan animasi. Kesan
 * gerak dihasilkan dengan menukar kedua frame itu bergantian, dan untuk
 * peraga bentuk gerakan itu justru cukup: yang perlu ditangkap mata memang
 * perbedaan antara kedua posisi tersebut.
 *
 * Tiga keadaan, dan pembedaannya disengaja:
 *
 * - `animated` true  — kedua frame ditukar bergantian. Dipakai di layar sesi
 *   latihan, tempat peraganya berguna sebagai acuan.
 * - `animated` false — frame pertama saja, diam. Dipakai untuk thumbnail di
 *   daftar: pada 64px perbedaan posisinya tidak terbaca, dan menukar delapan
 *   thumbnail sekaligus memboroskan baterai tanpa memberi informasi.
 * - belum ada berkas  — ikon placeholder, tidak kosong dan tidak error.
 */
export function ExerciseMedia({
  exerciseId,
  size = 64,
  animated = false,
  rounded = 'rounded-xl',
  className = '',
}) {
  const frames = framesFor(exerciseId);
  const [index, setIndex] = useState(0);

  const shouldCycle = animated && (frames?.length ?? 0) > 1;

  useEffect(() => {
    if (!shouldCycle) return;

    const timer = setInterval(
      () => setIndex((current) => (current + 1) % frames.length),
      FRAME_MS,
    );
    return () => clearInterval(timer);
  }, [shouldCycle, frames?.length]);

  // Gerakan berganti saat berpindah layar; jangan mulai dari frame kedua
  useEffect(() => {
    setIndex(0);
  }, [exerciseId]);

  if (!frames || frames.length === 0) {
    return (
      <View
        className={`items-center justify-center bg-surface-sunken ${rounded} ${className}`}
        style={{ width: size, height: size }}
      >
        <Ionicons
          name="barbell-outline"
          size={Math.round(size * 0.38)}
          color={colors.ink.subtle}
        />
      </View>
    );
  }

  return (
    <Image
      source={frames[Math.min(index, frames.length - 1)]}
      // URL remote diunduh sekali lalu disimpan ke disk, sehingga tetap
      // tampil tanpa sinyal — penting karena app ini dipakai di gym.
      cachePolicy="disk"
      contentFit="cover"
      // Transisi silang membuat pertukaran frame terasa menyatu, bukan
      // berkedip patah-patah.
      transition={shouldCycle ? { duration: 300, effect: 'cross-dissolve' } : 150}
      accessible
      accessibilityRole="image"
      className={`bg-surface-sunken ${rounded} ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export default ExerciseMedia;
