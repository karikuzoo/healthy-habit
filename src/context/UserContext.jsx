import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { differenceInYears, format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useSQLiteContext } from 'expo-sqlite';
import { Loading } from '../components/Loading';
import { deleteAvatar } from '../lib/avatar';
import { seedCatalogIfEmpty } from '../db/foods';
import { seedDemoDayIfEmpty } from '../db/foodLogs';
import { seedDemoWeekIfEmpty } from '../db/sleepLogs';
import {
  ensureUser,
  registerAccount,
  resetPassword,
  updateUserRow,
  verifyCredentials,
} from '../db/users';

const UserContext = createContext(null);

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
};

/** Selisih kalori dari TDEE untuk tiap program. */
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
  const register = useCallback(
    async (credentials) => {
      if (!user) return;

      const { user: row, discardedAvatar } = await registerAccount(
        db,
        user.id,
        credentials,
      );

      // Berkas foto pemilik lama dihapus SESUDAH barisnya berhasil ditulis;
      // kalau gagal di tengah, yang tertinggal hanya berkas yatim — bukan
      // profil yang menunjuk ke foto yang sudah lenyap.
      await deleteAvatar(discardedAvatar);

      setUser(row);
    },
    [db, user],
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

  const login = useCallback(() => setIsLoggedIn(true), []);
  const logout = useCallback(() => setIsLoggedIn(false), []);

  const value = useMemo(() => {
    if (!user) return null;

    const birth = user.birthDate ? parseISO(user.birthDate) : null;
    const age = birth ? differenceInYears(new Date(), birth) : null;

    // Mifflin-St Jeor
    const base = 10 * user.weight + 6.25 * user.height - 5 * (age ?? 0);
    const bmr = Math.round(user.gender === 'Laki-Laki' ? base + 5 : base - 161);

    const tdee = Math.round(bmr * (ACTIVITY_MULTIPLIERS[user.activityLevel] ?? 1.55));
    const targetCalories = tdee + (CALORIE_OFFSET[user.program] ?? 0);

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
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      age,
      birthDateLabel: birth ? format(birth, 'd MMMM yyyy', { locale: idLocale }) : '',
      bmr,
      tdee,
      targetCalories,
      macroTargets: {
        protein: Math.round((targetCalories * proteinPct) / 4),
        carbs: Math.round((targetCalories * carbsPct) / 4),
        fat: Math.round((targetCalories * fatPct) / 9),
      },
    };
  }, [user, updateUser, isLoggedIn, login, logout, register, signIn, changePassword]);

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
