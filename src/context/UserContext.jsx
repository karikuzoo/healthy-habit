import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { addDays, differenceInCalendarDays, differenceInYears, format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useSQLiteContext } from 'expo-sqlite';
import { Loading } from '../components/Loading';
import { toIsoDate } from '../lib/dates';
import { hitungBmr, hitungTdee } from '../lib/energy';
import { proyeksiBerat, rencanaTarget } from '../lib/weightGoal';
import { seedCatalogIfEmpty } from '../db/foods';
import { seedDemoDayIfEmpty } from '../db/foodLogs';
import { seedDemoWeekIfEmpty } from '../db/sleepLogs';
import {
  ensureUser,
  registerAccount,
  registeredEmailHints,
  resetPassword,
  updateUserRow,
  verifyCredentials,
} from '../db/users';

const UserContext = createContext(null);

/**
 * Selisih kalori dari TDEE untuk tiap program.
 *
 * Dipakai hanya ketika pengguna BELUM menyebut berat target. Begitu
 * targetnya terisi, besar defisitnya dihitung mundur dari target itu dan
 * angka di bawah tidak lagi ikut campur — lihat `rencanaTarget`.
 */
const CALORIE_OFFSET = {
  bulking: 400,
  maintenance: 0,
  cutting: -400,
};

/** Porsi kalori per makro tiap program: [protein, karbo, lemak]. */
const MACRO_SPLIT = {
  bulking: [0.25, 0.5, 0.25],
  maintenance: [0.3, 0.4, 0.3],
  cutting: [0.4, 0.35, 0.25],
};

export function UserProvider({ children }) {
  const db = useSQLiteContext();
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let active = true;

    (async () => {
      const row = await ensureUser(db);
      // Katalog makanan bawaan; hanya berjalan pada peluncuran pertama
      await seedCatalogIfEmpty(db);
      // Sementara, sampai pencarian makanan (NUT-6) tersedia — hapus bersama
      // `seedDemoDayIfEmpty` begitu makanan bisa dicari sendiri.
      await seedDemoDayIfEmpty(db, row.id);
      await seedDemoWeekIfEmpty(db, row.id);
      if (active) setUser(row);
    })();

    return () => {
      active = false;
    };
  }, [db]);

  /**
   * Tulis ke SQLite lebih dulu, lalu pakai baris hasil tulis itu sebagai
   * state. Dengan begitu UI tidak pernah menampilkan nilai yang gagal
   * tersimpan, dan tidak ada dua sumber kebenaran.
   */
  const updateUser = useCallback(
    async (updates) => {
      if (!user) return;
      const row = await updateUserRow(db, user.id, updates);
      setUser(row);
    },
    [db, user],
  );

  /**
   * Mendaftarkan akun di perangkat ini, lalu memakainya sebagai profil aktif.
   *
   * Kata sandi tidak pernah masuk ke state React — ia langsung diserahkan ke
   * lapisan database untuk di-hash, dan yang kembali hanya baris profilnya.
   */
  /**
   * Mendaftarkan akun baru, lalu memakainya sebagai profil aktif.
   *
   * Tidak lagi mengirim `user.id`: satu perangkat bisa punya beberapa akun,
   * dan lapisan database yang menentukan baris mana yang dipakai — akun lama
   * kalau emailnya sudah terdaftar, baris baru kalau belum.
   */
  const register = useCallback(
    async (credentials) => {
      const row = await registerAccount(db, credentials);
      setUser(row);
      return row;
    },
    [db],
  );

  /**
   * Memeriksa kredensial, lalu menandai sesi masuk kalau cocok.
   *
   * Hasil gagalnya dikembalikan apa adanya supaya layar masuk bisa
   * membedakan "belum ada akun terdaftar" dari "kredensial salah".
   */
  const signIn = useCallback(
    async (credentials) => {
      const result = await verifyCredentials(db, credentials);
      if (!result.ok) return result;

      setUser(result.user);
      setIsLoggedIn(true);
      return result;
    },
    [db],
  );

  /**
   * Mengganti kata sandi tanpa tahu yang lama (AUTH-7).
   *
   * TIDAK ikut menandai sesi masuk: sesudah berhasil, pengguna kembali ke
   * layar masuk dan memakai kata sandi barunya. Itu membuktikan ia benar
   * ingat apa yang baru saja disetel, dan sesuai dengan alur yang dikenal
   * orang dari aplikasi lain.
   */
  const changePassword = useCallback(
    async (credentials) => resetPassword(db, credentials),
    [db],
  );

  /** Email akun terdaftar dalam bentuk tersamar, untuk layar lupa kata sandi. */
  const emailHints = useCallback(async () => registeredEmailHints(db), [db]);

  const login = useCallback(() => setIsLoggedIn(true), []);
  const logout = useCallback(() => setIsLoggedIn(false), []);

  const value = useMemo(() => {
    if (!user) return null;

    const birth = user.birthDate ? parseISO(user.birthDate) : null;
    const age = birth ? differenceInYears(new Date(), birth) : null;

    const bmr = hitungBmr({
      beratKg: user.weight,
      tinggiCm: user.height,
      umur: age,
      gender: user.gender,
    });

    const tdee = hitungTdee(bmr, user.activityLevel);

    /**
     * Berat target menyetir target kalori; program hanya jadi cadangan.
     *
     * Dulu seluruh defisit ditentukan program: cutting selalu -400, apa pun
     * berat yang dituju dan kapan. Sekarang pengguna menyebut mau berada di
     * berat berapa dan kapan, lalu defisit hariannya dihitung mundur dari
     * situ — dengan batas aman yang dijaga `rencanaTarget`.
     *
     * Tanggal target yang sudah lewat membuat `hariKeTarget` nol atau minus,
     * dan `rencanaTarget` mengembalikan rencana kosong. Itu disengaja: lebih
     * baik kembali ke kalori pemeliharaan daripada memaksakan defisit dari
     * tenggat yang sudah basi. Layar bisa membaca `targetKedaluwarsa` untuk
     * memintanya diperbarui.
     */
    const targetTerisi =
      Number.isFinite(user.targetWeight) && user.targetWeight > 0 && Boolean(user.targetDate);

    const hariKeTarget = user.targetDate
      ? differenceInCalendarDays(parseISO(user.targetDate), new Date())
      : null;

    const rencanaBerat = rencanaTarget({
      beratKg: user.weight,
      targetKg: user.targetWeight,
      hari: hariKeTarget,
      tdee,
      bmr,
    });

    const targetCalories = targetTerisi
      ? rencanaBerat.kaloriTarget
      : tdee + (CALORIE_OFFSET[user.program] ?? 0);

    const [proteinPct, carbsPct, fatPct] =
      MACRO_SPLIT[user.program] ?? MACRO_SPLIT.maintenance;

    return {
      user,
      updateUser,
      isLoggedIn,
      login,
      logout,
      register,
      signIn,
      changePassword,
      emailHints,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      age,
      birthDateLabel: birth ? format(birth, 'd MMMM yyyy', { locale: idLocale }) : '',
      bmr,
      tdee,
      targetCalories,
      weightPlan: {
        ...rencanaBerat,
        targetTerisi,
        targetKedaluwarsa: Boolean(user.targetDate) && hariKeTarget !== null && hariKeTarget < 1,
        hariKeTarget,
        tanggalRealistis:
          rencanaBerat.hariRealistis == null
            ? null
            : toIsoDate(addDays(new Date(), rencanaBerat.hariRealistis)),
        proyeksi: proyeksiBerat({
          beratKg: user.weight,
          targetKg: user.targetWeight,
          lajuKgPerMinggu: rencanaBerat.lajuKgPerMinggu,
        }),
      },
      macroTargets: {
        protein: Math.round((targetCalories * proteinPct) / 4),
        carbs: Math.round((targetCalories * carbsPct) / 4),
        fat: Math.round((targetCalories * fatPct) / 9),
      },
    };
  }, [user, updateUser, isLoggedIn, login, logout, register, signIn, changePassword, emailHints]);

  // Profil dibaca dari SQLite; tahan render sampai baris pertama tersedia
  if (!value) return <Loading />;

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser harus dipakai di dalam <UserProvider>');
  }
  return context;
}

export default UserContext;
