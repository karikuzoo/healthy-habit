/**
 * Sumber tunggal palet warna aplikasi.
 *
 * Dipakai dua arah:
 * - lewat `tailwind.config.js` supaya tersedia sebagai className (`bg-brand`, `text-ink-muted`)
 * - lewat import langsung untuk prop yang tidak menerima className
 *   (tintColor tab bar, trackColor Switch, stroke SVG, StatusBar)
 */
export const colors = {
  brand: {
    DEFAULT: '#2D6A4F',
    dark: '#1B4332',
    darker: '#123524',
    light: '#40916C',
    soft: '#E8F1EB',
    softer: '#F1F7F3',
  },
  ink: {
    DEFAULT: '#111827',
    muted: '#6B7280',
    subtle: '#9CA3AF',
  },
  surface: {
    DEFAULT: '#FFFFFF',
    muted: '#F6F8F7',
    sunken: '#F3F4F6',
  },
  line: {
    DEFAULT: '#E5E7EB',
    soft: '#F1F5F4',
  },
  // Warna makronutrien — dipakai konsisten di Nutrition, Detail, dan Profile
  macro: {
    calories: '#F97316',
    protein: '#10B981',
    carbs: '#F59E0B',
    fat: '#3B82F6',
  },
  sleep: {
    DEFAULT: '#3B82F6',
    soft: '#E7F0FD',
  },
  steps: {
    DEFAULT: '#F59E0B',
    soft: '#FDF0DC',
  },
  danger: {
    DEFAULT: '#EF4444',
    soft: '#FEF2F2',
  },
};

export default colors;
