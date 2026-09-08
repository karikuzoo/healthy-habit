import React, { createContext, useContext, useState } from 'react';

const UserContext = createContext();

const defaultUser = {
  firstName: 'Padlan',
  lastName: 'Prabowo',
  email: 'padlan@email.com',
  gender: 'Laki-Laki',
  birthDate: '1998-08-12',
  age: 28,
  height: 182,
  weight: 78,
  activityLevel: 'moderate', // sedentary, light, moderate, active, veryActive
  program: 'bulking', // bulking, maintenance, cutting
  targetGoal: 'Lebih bugar dan tidur teratur',
  avatar: null,
  darkMode: false,
  units: 'metric', // metric, imperial
};

export function UserProvider({ children }) {
  const [user, setUser] = useState(defaultUser);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const updateUser = (updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  const login = () => setIsLoggedIn(true);
  const logout = () => setIsLoggedIn(false);

  // Calculate BMR using Mifflin-St Jeor
  const getBMR = () => {
    const base = 10 * user.weight + 6.25 * user.height - 5 * user.age;
    return user.gender === 'Laki-Laki' ? base + 5 : base - 161;
  };

  // Activity multipliers
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    veryActive: 1.9,
  };

  const getTDEE = () => {
    return Math.round(getBMR() * (activityMultipliers[user.activityLevel] || 1.55));
  };

  const getTargetCalories = () => {
    const tdee = getTDEE();
    switch (user.program) {
      case 'bulking':
        return tdee + 400;
      case 'cutting':
        return tdee - 400;
      default:
        return tdee;
    }
  };

  const getMacroTargets = () => {
    const calories = getTargetCalories();
    switch (user.program) {
      case 'bulking':
        return {
          protein: Math.round((calories * 0.25) / 4),
          carbs: Math.round((calories * 0.50) / 4),
          fat: Math.round((calories * 0.25) / 9),
        };
      case 'cutting':
        return {
          protein: Math.round((calories * 0.40) / 4),
          carbs: Math.round((calories * 0.35) / 4),
          fat: Math.round((calories * 0.25) / 9),
        };
      default:
        return {
          protein: Math.round((calories * 0.30) / 4),
          carbs: Math.round((calories * 0.40) / 4),
          fat: Math.round((calories * 0.30) / 9),
        };
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        updateUser,
        isLoggedIn,
        login,
        logout,
        getBMR,
        getTDEE,
        getTargetCalories,
        getMacroTargets,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

export default UserContext;
