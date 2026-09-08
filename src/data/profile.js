/** Pilihan yang dipakai di form pendaftaran dan profil. */

export const activityLevels = [
  { value: 'sedentary', label: 'Jarang Bergerak' },
  { value: 'light', label: 'Aktivitas Ringan' },
  { value: 'moderate', label: 'Cukup Aktif' },
  { value: 'active', label: 'Aktif' },
  { value: 'veryActive', label: 'Sangat Aktif' },
];

export const genders = [
  { value: 'Laki-Laki', label: 'Laki-Laki' },
  { value: 'Perempuan', label: 'Perempuan' },
];

export const programs = [
  { value: 'cutting', label: 'Cutting', icon: 'trending-down' },
  { value: 'maintenance', label: 'Maintenance', icon: 'swap-vertical' },
  { value: 'bulking', label: 'Bulking', icon: 'trending-up' },
];

export function activityLabel(value) {
  return activityLevels.find((level) => level.value === value)?.label ?? '';
}

export function programLabel(value) {
  return programs.find((program) => program.value === value)?.label ?? '';
}
