import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

/**
 * Foto profil, dengan dua tingkat cadangan (PROF-9).
 *
 * 1. foto yang dipilih pengguna
 * 2. inisial namanya — lebih personal daripada ikon, dan langsung
 *    membedakan satu akun dari akun lain
 * 3. ikon orang, kalau namanya pun belum ada
 *
 * Berkas fotonya bisa lenyap di luar kendali aplikasi: pengguna menghapusnya
 * lewat pengelola berkas, atau memulihkan perangkat dari cadangan yang tidak
 * memuat direktori dokumen. `onError` menangkap itu dan jatuh ke inisial,
 * bukan menyisakan kotak kosong.
 */
export function Avatar({ uri, name = '', size = 48, className = '' }) {
  const [failed, setFailed] = useState(false);

  // Foto baru berhak dicoba lagi meski yang sebelumnya gagal dimuat
  useEffect(() => {
    setFailed(false);
  }, [uri]);

  const initials = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');

  const showPhoto = Boolean(uri) && !failed;

  return (
    <View
      className={`items-center justify-center overflow-hidden rounded-full bg-surface-sunken ${className}`}
      style={{ width: size, height: size }}
    >
      {showPhoto ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size }}
          contentFit="cover"
          onError={() => setFailed(true)}
          accessibilityLabel={name ? `Foto profil ${name}` : 'Foto profil'}
        />
      ) : initials ? (
        <Text
          className="font-bold text-ink-muted"
          style={{ fontSize: Math.round(size * 0.36) }}
        >
          {initials}
        </Text>
      ) : (
        <Ionicons
          name="person"
          size={Math.round(size * 0.5)}
          color={colors.ink.subtle}
        />
      )}
    </View>
  );
}

export default Avatar;
