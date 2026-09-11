import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';
import { startOfDay } from 'date-fns';
import { addSteps, getStepsForDay, setStepsForDay } from '../db/stepLogs';

/**
 * Langkah hari ini dari sensor perangkat (HOME-3).
 *
 * Dua platform, dua jalur — dan ini bukan pilihan gaya, melainkan batas API:
 *
 * - **iOS** punya `getStepCountAsync(start, end)`. Ditanya sekali dari tengah
 *   malam sampai sekarang, jawabannya total harian yang sebenarnya, termasuk
 *   langkah saat aplikasi tertutup. Hasilnya ditimpa ke database.
 *
 * - **Android** TIDAK punya itu. `getStepCountAsync` di sana melempar
 *   `NotSupportedException` (lihat `PedometerModule.kt` di expo-sensors),
 *   jadi satu-satunya jalan adalah `watchStepCount` yang menghitung sejak
 *   berlangganan dan berhenti saat aplikasi ke background.
 *
 * Di Android yang hilang lebih sedikit dari yang diduga dokumentasinya.
 * `TYPE_STEP_COUNTER` adalah pencacah PERANGKAT KERAS yang terus berjalan,
 * dan `SensorProxy.onHostResume()` mendaftarkan ulang pendengarnya tanpa
 * mereset baseline (`listenerDecorator` hanya dipanggil saat langganan JS
 * dibuat atau dibubarkan). Jadi event pertama sesudah aplikasi kembali ke
 * depan sudah memuat langkah selama di background.
 *
 * Yang benar-benar hilang di Android hanya dua:
 *
 * 1. langkah sebelum aplikasi PERTAMA dibuka hari itu — tidak ada baseline
 * 2. langkah selagi proses aplikasi mati, sampai dibuka lagi
 *
 * Karena itu langganan sengaja TIDAK dibuat ulang tanpa alasan: tiap
 * langganan baru mereset baseline dan membuka celah nomor 2. Efek di bawah
 * hanya bergantung pada nilai yang stabil.
 *
 * Pertambahannya juga DIAKUMULASI ke database, bukan ditimpa, supaya
 * potongan dari sesi-sesi sebelumnya tidak terhapus.
 *
 * Untuk menutup celah yang tersisa, jalannya Health Connect — library di luar
 * Expo, dan itu pekerjaan tersendiri.
 */

/** Jeda tulis ke database. Sensor bisa melapor tiap langkah; DB tidak perlu. */
const FLUSH_MS = 5000;

export function useStepCounter(db, userId) {
  const [steps, setSteps] = useState(null);
  const [target, setTarget] = useState(null);

  /** 'memeriksa' | 'aktif' | 'ditolak' | 'terkunci' | 'tidak-tersedia' | 'galat' */
  const [status, setStatus] = useState('memeriksa');

  /**
   * Kalimat penjelas untuk keadaan yang bukan 'aktif'.
   *
   * Versi pertama hook ini menelan setiap kegagalan dengan `.catch(() => null)`,
   * jadi sensor yang menolak, izin yang tidak bisa diminta, dan modul yang
   * tidak ada semuanya terlihat sama: tombol yang ditekan tanpa reaksi.
   * Sekarang alasannya dibawa keluar dan ditampilkan.
   */
  const [reason, setReason] = useState('');

  /**
   * Dinaikkan setelah izin diberikan, semata-mata untuk menjalankan ulang
   * efek di bawah. Tanpa itu status berubah jadi 'aktif' tapi tidak ada yang
   * berlangganan ke sensor sampai layarnya dibuka ulang.
   */
  const [attempt, setAttempt] = useState(0);

  /**
   * Nilai terakhir yang dilaporkan sensor pada LANGGANAN INI.
   *
   * Android melaporkan hitungan kumulatif sejak berlangganan (1, 2, 5, ...),
   * bukan pertambahannya. Yang boleh ditambahkan ke database adalah
   * selisihnya — tanpa ini, satu langkah ke-100 akan menambah 100.
   */
  const reported = useRef(0);

  /** Pertambahan yang belum sempat ditulis ke database. */
  const pending = useRef(0);

  const flush = useCallback(async () => {
    const delta = pending.current;
    if (delta <= 0) return;

    pending.current = 0;
    await addSteps(db, userId, delta);
  }, [db, userId]);

  // Angka tersimpan ditampilkan lebih dulu, sebelum sensor menjawab. Tanpa
  // ini kartu langkah berkedip dari 0 ke nilai sebenarnya tiap kali dibuka.
  const loadStored = useCallback(async () => {
    const stored = await getStepsForDay(db, userId);
    setSteps(stored.steps);
    setTarget(stored.target);
    return stored;
  }, [db, userId]);

  useEffect(() => {
    let active = true;
    let subscription = null;
    let timer = null;

    (async () => {
      await loadStored();

      let available;
      try {
        available = await Pedometer.isAvailableAsync();
      } catch (error) {
        console.warn('[langkah] isAvailableAsync gagal:', error);
        if (active) {
          setStatus('galat');
          setReason(String(error?.message ?? error));
        }
        return;
      }

      if (!active) return;
      if (!available) {
        setStatus('tidak-tersedia');
        return;
      }

      let permission;
      try {
        permission = await Pedometer.getPermissionsAsync();
      } catch (error) {
        console.warn('[langkah] getPermissionsAsync gagal:', error);
        if (active) {
          setStatus('galat');
          setReason(String(error?.message ?? error));
        }
        return;
      }

      console.log('[langkah] izin saat ini:', JSON.stringify(permission));
      if (!active) return;

      if (!permission?.granted) {
        // Tidak langsung meminta: dialog izin yang muncul tanpa dipancing
        // hampir selalu ditolak. Kartunya menampilkan tombol, dan
        // `requestPermission` di bawah yang memintanya.
        //
        // `canAskAgain: false` berarti dialognya TIDAK AKAN muncul lagi —
        // menekan tombol pun tidak akan terjadi apa-apa, jadi keadaan itu
        // dibedakan supaya pengguna diarahkan ke pengaturan sistem.
        setStatus(permission?.canAskAgain === false ? 'terkunci' : 'ditolak');
        return;
      }

      setStatus('aktif');
      setReason('');

      if (Platform.OS === 'ios') {
        const result = await Pedometer.getStepCountAsync(
          startOfDay(new Date()),
          new Date(),
        ).catch(() => null);
        if (!active || !result) return;

        await setStepsForDay(db, userId, result.steps);
        if (active) setSteps(result.steps);
        return;
      }

      reported.current = 0;

      try {
        subscription = Pedometer.watchStepCount((result) => {
          console.log('[langkah] sensor melapor:', result.steps);
          const delta = result.steps - reported.current;
          if (delta <= 0) return;

          reported.current = result.steps;
          pending.current += delta;
          setSteps((current) => (current ?? 0) + delta);
        });
        console.log('[langkah] berlangganan watchStepCount');
      } catch (error) {
        console.warn('[langkah] watchStepCount gagal:', error);
        if (active) {
          setStatus('galat');
          setReason(String(error?.message ?? error));
        }
        return;
      }

      timer = setInterval(flush, FLUSH_MS);
    })();

    return () => {
      active = false;
      subscription?.remove();
      if (timer) clearInterval(timer);
      // Sisa pertambahan ditulis saat layar ditinggalkan, supaya langkah
      // beberapa detik terakhir tidak ikut hilang.
      flush();
    };
  }, [db, userId, loadStored, flush, attempt]);

  /** Dipanggil tombol di kartu langkah saat izinnya belum diberikan. */
  const requestPermission = useCallback(async () => {
    let permission;
    try {
      permission = await Pedometer.requestPermissionsAsync();
    } catch (error) {
      console.warn('[langkah] requestPermissionsAsync gagal:', error);
      setStatus('galat');
      setReason(String(error?.message ?? error));
      return false;
    }

    console.log('[langkah] hasil permintaan izin:', JSON.stringify(permission));

    if (!permission?.granted) {
      setStatus(permission?.canAskAgain === false ? 'terkunci' : 'ditolak');
      return false;
    }

    setAttempt((n) => n + 1);
    return true;
  }, []);

  /**
   * Membaca ulang angka tersimpan — dipakai setelah langkah dicatat manual.
   *
   * Pertambahan yang masih menggantung ditulis LEBIH DULU. Tanpa itu,
   * membaca ulang akan menampilkan angka database yang belum memuat
   * pertambahan tersebut, lalu melompat naik saat flush berikutnya.
   */
  const reload = useCallback(async () => {
    await flush();
    await loadStored();
  }, [flush, loadStored]);

  return {
    steps: steps ?? 0,
    target: target ?? 0,
    status,
    reason,
    /** Sensor sedang bekerja (atau masih diperiksa) — input manual tak perlu. */
    usingSensor: status === 'aktif' || status === 'memeriksa',
    ready: steps != null && target != null,
    requestPermission,
    reload,
  };
}

export default useStepCounter;
