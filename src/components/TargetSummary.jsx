import React from 'react';
import { Text, View } from 'react-native';
import { Card } from './Card';
import { formatNumber } from '../lib/format';

/**
 * Ringkasan target berat: laju, target kalori, dan perkiraan beberapa minggu
 * ke depan.
 *
 * Dipakai dua layar — pendaftaran tahap 2 dan Edit profil — karena keduanya
 * mengubah angka yang sama dan harus memperlihatkan akibat yang sama persis.
 *
 * Komponen ini sengaja tidak menghitung apa pun sendiri. Ia menerima hasil
 * `rencanaLengkap` apa adanya, supaya tidak ada versi kedua dari aturan yang
 * menentukan berapa kalori seseorang boleh makan.
 */

/** 0,5 bukan 0.5, dan bukan 0,4999999. Tidak lewat Intl supaya sama di mana pun. */
function labelKg(nilai) {
  return String(Math.round(nilai * 10) / 10).replace('.', ',');
}

export function TargetSummary({ rencana, proyeksi = [], tanggalRealistis, className = '' }) {
  if (!rencana || rencana.kaloriTarget == null) return null;

  if (rencana.arah === 'jaga') {
    return (
      <Card className={`gap-2 p-5 ${className}`}>
        <Text className="text-2xs font-bold tracking-widest text-brand">PERKIRAAN</Text>
        <Text className="text-sm text-ink-muted">
          Berat targetmu sama dengan berat sekarang, jadi kalorimu diatur untuk
          menjaga berat.
        </Text>
      </Card>
    );
  }

  const turun = rencana.arah === 'turun';

  return (
    <Card className={`gap-3 p-5 ${className}`}>
      <Text className="text-2xs font-bold tracking-widest text-brand">PERKIRAAN</Text>

      <Text className="text-lg font-bold text-ink">
        {`${turun ? 'Turun' : 'Naik'} ${labelKg(Math.abs(rencana.lajuKgPerMinggu))} kg per minggu`}
      </Text>

      <Text className="text-sm text-ink-muted">
        {`Target kalori ${formatNumber(rencana.kaloriTarget)} kkal per hari, ${
          rencana.deltaKaloriHarian < 0 ? 'defisit' : 'surplus'
        } ${formatNumber(Math.abs(rencana.deltaKaloriHarian))} kkal.`}
      </Text>

      {/* Batas yang mengikat disebut terus terang. Target yang diam-diam
          dipotong lalu ditampilkan sebagai rencana yang mulus adalah janji
          yang tidak akan ditepati aplikasi. */}
      {rencana.dibatasiOleh ? (
        <View className="gap-1 rounded-xl bg-steps-soft p-3">
          <Text className="text-xs font-semibold text-steps">
            {rencana.dibatasiOleh === 'bmr'
              ? 'Terlalu singkat untuk dikejar dengan aman'
              : 'Lebih cepat dari batas aman'}
          </Text>
          <Text className="text-2xs leading-4 text-ink-muted">
            {tanggalRealistis
              ? `Lajunya ditahan di batas aman, jadi perkiraan tercapainya sekitar ${tanggalRealistis}.`
              : 'Dengan data ini targetmu belum bisa dikejar. Coba longgarkan tanggalnya.'}
          </Text>
        </View>
      ) : null}

      <View className="gap-1 pt-1">
        {proyeksi.map((titik) => (
          <View key={titik.minggu} className="flex-row items-center justify-between">
            <Text className="text-xs text-ink-muted">{`${titik.minggu} minggu lagi`}</Text>
            <Text className="text-xs font-semibold text-ink">
              {`${labelKg(titik.beratKg)} kg${titik.tercapai ? ' — target tercapai' : ''}`}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

export default TargetSummary;
