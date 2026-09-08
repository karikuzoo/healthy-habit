import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { differenceInYears, format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

const UserContext = createContext(null);

const defaultUser = {
  firstName: 'Padlan',
  lastName: 'Prabowo',
  email: 'padlan@email.com',
  gender: 'Laki-Laki',
  // Disimpan sebagai ISO; umur dan label tampilan diturunkan darinya
  birthDate: '1998-08-12',
  height: 182,
  weight: 78,
  activityLevel: 'sedentary',
  program: 'bulking',
  targetGoal: 'Lebih bugar dan tidur teratur',
  avatar: null,
  darkMode: false,
  units: 'metric',
};

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
  const [user, setUser] = useState(defaultUser);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const updateUser = useCallback((updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  }, []);

  const login = useCallback(() => setIsLoggedIn(true), []);
  const logout = useCallback(() => setIsLoggedIn(false), []);

  const value = useMemo(() => {
    const birth = parseISO(user.birthDate);
    const age = differenceInYears(new Date(), birth);

    // Mifflin-St Jeor
    const base = 10 * user.weight + 6.25 * user.height - 5 * age;
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
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      age,
      birthDateLabel: format(birth, 'd MMMM yyyy', { locale: id }),
      bmr,
      tdee,
      targetCalories,
      macroTargets: {
        protein: Math.round((targetCalories * proteinPct) / 4),
        carbs: Math.round((targetCalories * carbsPct) / 4),
        fat: Math.round((targetCalories * fatPct) / 9),
      },
    };
  }, [user, updateUser, isLoggedIn, login, logout]);

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
