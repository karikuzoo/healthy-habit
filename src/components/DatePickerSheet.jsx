import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  setMonth,
  setYear,
  startOfDay,
  startOfMonth,
} from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { colors } from '../theme/colors';

/**
 * Kalender pemilih tanggal bergaya aplikasi.
 *
 * Menggantikan pemilih bawaan sistem, yang digambar Android/iOS sendiri dan
 * karenanya tidak bisa disamakan dengan palet aplikasi.
 *
 * Tiga tampilan, dan urutannya penting untuk TANGGAL LAHIR: menelusuri mundur
 * 25 tahun satu bulan demi satu bulan adalah siksaan, jadi judulnya bisa
 * diketuk untuk melompat ke daftar tahun, lalu bulan, baru harinya.
 *
 * Tanpa dependensi kalender tambahan — date-fns sudah ada di proyek, dan
 * seluruh yang dibutuhkan hanyalah aritmetika tanggal.
 */

/** Nama hari sesingkat mungkin; kolomnya hanya selebar seperempat layar. */
const WEEKDAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

/** Lebar satu kolom dari tujuh, disimpan sebagai string persen. */
const COLUMN = `${100 / 7}%`;

function Header({ children }) {
  return (
    <Text className="text-base font-bold text-ink">{children}</Text>
  );
}

export function DatePickerSheet({
  visible,
  onClose,
  onSelect,
  value,
  title = 'Pilih tanggal',
  minimumDate,
  maximumDate,
}) {
  const insets = useSafeAreaInsets();

  const initial = value ?? maximumDate ?? new Date();

  const [cursor, setCursor] = useState(() => startOfMonth(initial));
  const [picked, setPicked] = useState(() => (value ? startOfDay(value) : null));

  /** 'hari' | 'bulan' | 'tahun' */
  const [view, setView] = useState('hari');

  // Lembar yang dibuka ulang harus kembali ke tanggal yang sedang berlaku,
  // bukan melanjutkan dari tempat terakhir pengguna menelusuri lalu batal.
  React.useEffect(() => {
    if (!visible) return;
    setCursor(startOfMonth(initial));
    setPicked(value ? startOfDay(value) : null);
    setView('hari');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const days = useMemo(() => {
    const start = startOfMonth(cursor);
    const all = eachDayOfInterval({ start, end: endOfMonth(cursor) });

    // Kotak kosong sebelum tanggal 1, supaya kolomnya sejajar nama harinya
    return [...Array(start.getDay()).fill(null), ...all];
  }, [cursor]);

  const years = useMemo(() => {
    const max = (maximumDate ?? new Date()).getFullYear();
    const min = (minimumDate ?? new Date(max - 120, 0, 1)).getFullYear();

    // Terbaru lebih dulu: tanggal lahir hampir selalu lebih dekat ke masa
    // kini daripada ke batas 120 tahun.
    return Array.from({ length: max - min + 1 }, (_, i) => max - i);
  }, [minimumDate, maximumDate]);

  const outOfRange = (date) =>
    (minimumDate && isBefore(date, startOfDay(minimumDate))) ||
    (maximumDate && isAfter(date, startOfDay(maximumDate)));

  const monthTitle = format(cursor, 'MMMM yyyy', { locale: idLocale });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Tutup kalender"
        className="flex-1 justify-end bg-ink/50"
      >
        <Pressable
          onPress={() => {}}
          className="rounded-t-3xl bg-surface pt-2"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <View className="mb-1 self-center h-1 w-10 rounded-full bg-line" />

          <View className="px-5 py-2">
            <Text className="text-xs font-bold tracking-widest text-brand">
              {title.toUpperCase()}
            </Text>
          </View>

          {/* Navigasi bulan. Judulnya sekaligus jalan pintas ke daftar tahun. */}
          <View className="flex-row items-center justify-between px-3 py-1">
            <Pressable
              onPress={() => setCursor((c) => addMonths(c, -1))}
              disabled={view !== 'hari'}
              accessibilityRole="button"
              accessibilityLabel="Bulan sebelumnya"
              className={`h-10 w-10 items-center justify-center rounded-full active:bg-surface-sunken ${
                view === 'hari' ? '' : 'opacity-0'
              }`}
            >
              <Ionicons name="chevron-back" size={20} color={colors.ink.DEFAULT} />
            </Pressable>

            <Pressable
              onPress={() => setView(view === 'hari' ? 'tahun' : 'hari')}
              accessibilityRole="button"
              accessibilityLabel={`${monthTitle}. Ketuk untuk memilih tahun`}
              className="flex-row items-center gap-1.5 rounded-full px-3 py-2 active:bg-surface-sunken"
            >
              <Header>
                {view === 'tahun'
                  ? 'Pilih tahun'
                  : view === 'bulan'
                    ? format(cursor, 'yyyy')
                    : monthTitle}
              </Header>
              <Ionicons
                name={view === 'hari' ? 'chevron-down' : 'chevron-up'}
                size={16}
                color={colors.ink.muted}
              />
            </Pressable>

            <Pressable
              onPress={() => setCursor((c) => addMonths(c, 1))}
              disabled={view !== 'hari'}
              accessibilityRole="button"
              accessibilityLabel="Bulan berikutnya"
              className={`h-10 w-10 items-center justify-center rounded-full active:bg-surface-sunken ${
                view === 'hari' ? '' : 'opacity-0'
              }`}
            >
              <Ionicons name="chevron-forward" size={20} color={colors.ink.DEFAULT} />
            </Pressable>
          </View>

          {view === 'hari' ? (
            <View className="px-3 pb-2">
              <View className="flex-row py-2">
                {WEEKDAYS.map((day) => (
                  <View key={day} style={{ width: COLUMN }} className="items-center">
                    <Text className="text-2xs font-bold text-ink-subtle">{day}</Text>
                  </View>
                ))}
              </View>

              <View className="flex-row flex-wrap">
                {days.map((day, index) => {
                  if (!day) {
                    // eslint-disable-next-line react/no-array-index-key
                    return <View key={`kosong-${index}`} style={{ width: COLUMN }} />;
                  }

                  const disabled = outOfRange(day);
                  const active = picked && isSameDay(day, picked);

                  return (
                    <View
                      key={day.toISOString()}
                      style={{ width: COLUMN }}
                      className="items-center py-0.5"
                    >
                      <Pressable
                        onPress={() => setPicked(startOfDay(day))}
                        disabled={disabled}
                        accessibilityRole="button"
                        accessibilityState={{ selected: Boolean(active), disabled }}
                        accessibilityLabel={format(day, 'd MMMM yyyy', { locale: idLocale })}
                        className={`h-10 w-10 items-center justify-center rounded-full ${
                          active ? 'bg-brand' : 'active:bg-surface-sunken'
                        } ${disabled ? 'opacity-25' : ''}`}
                      >
                        <Text
                          className={`text-sm ${
                            active
                              ? 'font-bold text-white'
                              : isSameMonth(day, cursor)
                                ? 'text-ink'
                                : 'text-ink-subtle'
                          }`}
                        >
                          {day.getDate()}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}

          {view === 'tahun' ? (
            <ScrollView className="max-h-72 px-3" showsVerticalScrollIndicator={false}>
              <View className="flex-row flex-wrap pb-2">
                {years.map((year) => {
                  const active = cursor.getFullYear() === year;
                  return (
                    <View key={year} style={{ width: '25%' }} className="p-1">
                      <Pressable
                        onPress={() => {
                          setCursor((c) => setYear(c, year));
                          setView('bulan');
                        }}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        className={`items-center rounded-2xl py-3 ${
                          active ? 'bg-brand' : 'active:bg-surface-sunken'
                        }`}
                      >
                        <Text
                          className={`text-sm ${
                            active ? 'font-bold text-white' : 'text-ink'
                          }`}
                        >
                          {year}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          ) : null}

          {view === 'bulan' ? (
            <View className="flex-row flex-wrap px-3 pb-2">
              {Array.from({ length: 12 }, (_, month) => {
                const active = cursor.getMonth() === month;
                return (
                  <View key={month} style={{ width: '33.333%' }} className="p-1">
                    <Pressable
                      onPress={() => {
                        setCursor((c) => setMonth(c, month));
                        setView('hari');
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      className={`items-center rounded-2xl py-3 ${
                        active ? 'bg-brand' : 'active:bg-surface-sunken'
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          active ? 'font-bold text-white' : 'text-ink'
                        }`}
                      >
                        {format(setMonth(cursor, month), 'MMM', { locale: idLocale })}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ) : null}

          <View className="mx-5 mt-1 flex-row gap-3 border-t border-line-soft pt-3">
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              className="flex-1 items-center rounded-2xl border border-line py-3.5 active:bg-surface-sunken"
            >
              <Text className="text-base font-bold text-ink-muted">Batal</Text>
            </Pressable>

            <Pressable
              onPress={() => picked && onSelect(picked)}
              disabled={!picked}
              accessibilityRole="button"
              className={`flex-1 items-center rounded-2xl bg-brand py-3.5 active:opacity-80 ${
                picked ? '' : 'opacity-40'
              }`}
            >
              <Text className="text-base font-bold text-white">Pilih</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default DatePickerSheet;
