import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { targetsFor } from '../data/nutrition';

const UserContext = createContext(null);

const defaultUser = {
  firstName: 'Padlan',
  lastName: 'Prabowo',
  email: 'padlan@email.com',
  gender: 'Laki-Laki',
  birthDate: '12 Agustus 1998',
  age: 28,
  height: 182,
  weight: 78,
  activityLevel: 'sedentary',
  program: 'bulking',
  targetGoal: 'Lebih bugar dan tidur teratur',
  avatar: null,
  darkMode: false,
  units: 'metric',
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
    const targets = targetsFor(user.program);

    return {
      user,
      updateUser,
      isLoggedIn,
      login,
      logout,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      targetCalories: targets.calories,
      macroTargets: {
        protein: targets.protein,
        carbs: targets.carbs,
        fat: targets.fat,
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
