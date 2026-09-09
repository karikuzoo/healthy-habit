import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import {
  Button,
  Card,
  Field,
  Screen,
  ScreenHeader,
  SelectField,
} from '../../src/components';
import { colors } from '../../src/theme/colors';
import { foodCategories, servingsForCategory } from '../../src/data/foodServings';
import { insertFood } from '../../src/db/foods';
import { parseDecimal } from '../../src/lib/parseNumber';
import { useUser } from '../../src/context/UserContext';

const CATEGORY_OPTIONS = foodCategories.map((c) => ({ value: c, label: c }));

/** Kalori per 100 g tidak mungkin melebihi lemak murni (100 g x 9 kkal). */
const MAX_CALORIES = 900;

/**
 * Memeriksa isian form.
 *
 * Dibedakan tegas antara dua hal:
 * - `errors` menghalangi penyimpanan — hal yang mustahil secara fisik
 * - `warning` hanya memberi tahu — kalori yang tampak tidak konsisten dengan
 *   makronya bisa saja memang begitu di label kemasan, karena faktor Atwater
 *   beragam per bahan. Memblokirnya akan menolak data yang benar.
 */
function validate({ name, calories, protein, carbs, fat, servingGrams }) {
  const errors = {};

  if (!name.trim()) errors.name = 'Nama makanan wajib diisi.';

  const numbers = { calories, protein, carbs, fat };
  for (const [key, value] of Object.entries(numbers)) {
    if (value == null) errors[key] = 'Wajib diisi.';
    else if (value < 0) errors[key] = 'Tidak boleh negatif.';
  }

  if (calories != null && calories > MAX_CALORIES) {
    errors.calories = `Maksimal ${MAX_CALORIES} kkal per 100 g.`;
  }

  const macroSum = (protein ?? 0) + (carbs ?? 0) + (fat ?? 0);
  if (macroSum > 100) {
    errors.macroSum = `Protein + karbo + lemak = ${macroSum.toFixed(1)} g, tidak mungkin lebih dari 100 g per 100 g.`;
  }

  if (servingGrams != null && servingGrams <= 0) {
    errors.servingGrams = 'Berat porsi harus lebih dari nol.';
  }

  let warning = null;
  if (Object.keys(errors).length === 0 && calories > 0) {
    const computed = protein * 4 + carbs * 4 + fat * 9;
    const drift = Math.abs(computed - calories) / calories;
    if (drift > 0.25) {
      warning = `Dari makronya, kalorinya sekitar ${Math.round(computed)} kkal — selisih ${Math.round(drift * 100)}% dari yang kamu isi. Periksa lagi kalau ini bukan dari label kemasan.`;
    }
  }

  return { errors, warning };
}

export default function NewFoodScreen() {
  const db = useSQLiteContext();
  const { user } = useUser();
  const { name: initialName } = useLocalSearchParams();

  const [form, setForm] = useState({
    name: typeof initialName === 'string' ? initialName : '',
    category: 'Lainnya',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    fiber: '',
    sugar: '',
    sodium: '',
    cholesterol: '',
    servingGrams: '',
  });
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  const setField = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  const parsed = {
    name: form.name,
    calories: parseDecimal(form.calories),
    protein: parseDecimal(form.protein),
    carbs: parseDecimal(form.carbs),
    fat: parseDecimal(form.fat),
    servingGrams: parseDecimal(form.servingGrams),
  };

  const { errors, warning } = validate(parsed);
  const valid = Object.keys(errors).length === 0;

  const handleSave = async () => {
    setTouched(true);
    if (!valid || saving) return;
    setSaving(true);

    // Berat porsi kustom jadi ukuran default; ukuran per kategori tetap
    // ditambahkan sebagai pilihan lain.
    const categoryServings = servingsForCategory(form.category).map((s) => ({
      ...s,
      isDefault: parsed.servingGrams == null ? s.isDefault : false,
    }));

    // Disaring berdasarkan label DAN berat: tanpa menyaring label, kategori
    // yang sudah punya "1 porsi" akan menghasilkan dua ukuran berlabel sama
    // dengan berat berbeda — mustahil dibedakan pengguna di pemilih porsi.
    const custom = { label: '1 porsi', grams: parsed.servingGrams, isDefault: true };

    const servings =
      parsed.servingGrams == null
        ? categoryServings
        : [
            custom,
            ...categoryServings.filter(
              (s) => s.grams !== custom.grams && s.label !== custom.label,
            ),
          ];

    await insertFood(
      db,
      {
        name: form.name.trim(),
        category: form.category,
        calories: parsed.calories,
        protein: parsed.protein,
        carbs: parsed.carbs,
        fat: parsed.fat,
        fiber: parseDecimal(form.fiber),
        sugar: parseDecimal(form.sugar),
        sodium: parseDecimal(form.sodium),
        cholesterol: parseDecimal(form.cholesterol),
        source: 'pengguna',
      },
      servings,
      user.id,
    );

    router.back();
  };

  const showError = (key) => (touched ? errors[key] : undefined);

  return (
    <Screen>
      <ScreenHeader title="Makanan Baru" />

      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View className="gap-5 px-5 pb-8">
          <Text className="text-sm leading-5 text-ink-muted">
            Isi nilai gizi per 100 gram. Kalau kamu punya kemasannya, angka ini ada di
            tabel "Informasi Nilai Gizi".
          </Text>

          <Field
            label="Nama makanan"
            placeholder="Ayam geprek sambal matah"
            value={form.name}
            onChangeText={setField('name')}
          />
          {showError('name') ? (
            <Text className="-mt-3 text-xs text-danger">{errors.name}</Text>
          ) : null}

          <SelectField
            label="Kategori"
            value={form.category}
            options={CATEGORY_OPTIONS}
            onChange={setField('category')}
          />

          <View className="gap-3">
            <Text className="text-base font-bold text-ink">Per 100 gram</Text>

            <Field
              label="Energi (kkal)"
              placeholder="180"
              value={form.calories}
              onChangeText={setField('calories')}
              keyboardType="decimal-pad"
            />
            {showError('calories') ? (
              <Text className="-mt-3 text-xs text-danger">{errors.calories}</Text>
            ) : null}

            <View className="flex-row gap-3">
              <Field
                label="Protein (g)"
                placeholder="14"
                value={form.protein}
                onChangeText={setField('protein')}
                keyboardType="decimal-pad"
                className="flex-1"
              />
              <Field
                label="Karbo (g)"
                placeholder="12"
                value={form.carbs}
                onChangeText={setField('carbs')}
                keyboardType="decimal-pad"
                className="flex-1"
              />
              <Field
                label="Lemak (g)"
                placeholder="8"
                value={form.fat}
                onChangeText={setField('fat')}
                keyboardType="decimal-pad"
                className="flex-1"
              />
            </View>

            {touched && (errors.protein || errors.carbs || errors.fat) ? (
              <Text className="-mt-3 text-xs text-danger">
                Protein, karbo, dan lemak wajib diisi dengan angka tidak negatif.
              </Text>
            ) : null}

            {touched && errors.macroSum ? (
              <Text className="-mt-3 text-xs text-danger">{errors.macroSum}</Text>
            ) : null}
          </View>

          {warning ? (
            <Card className="flex-row items-start gap-3 p-4">
              <Ionicons name="alert-circle-outline" size={18} color={colors.steps.DEFAULT} />
              <Text className="flex-1 text-xs leading-5 text-ink-muted">{warning}</Text>
            </Card>
          ) : null}

          <View className="gap-3">
            <Text className="text-base font-bold text-ink">
              Opsional{' '}
              <Text className="text-xs font-normal text-ink-muted">
                boleh dikosongkan
              </Text>
            </Text>

            <Field
              label="Berat 1 porsi (gram)"
              placeholder="185"
              value={form.servingGrams}
              onChangeText={setField('servingGrams')}
              keyboardType="decimal-pad"
            />
            {showError('servingGrams') ? (
              <Text className="-mt-3 text-xs text-danger">{errors.servingGrams}</Text>
            ) : null}
            <Text className="-mt-2 text-xs text-ink-subtle">
              Kalau dikosongkan, ukuran saji mengikuti kategori "{form.category}":{' '}
              {servingsForCategory(form.category)
                .map((s) => `${s.label} ${s.grams} g`)
                .join(', ')}
              .
            </Text>

            <View className="flex-row gap-3">
              <Field
                label="Serat (g)"
                placeholder="4,2"
                value={form.fiber}
                onChangeText={setField('fiber')}
                keyboardType="decimal-pad"
                className="flex-1"
              />
              <Field
                label="Gula (g)"
                placeholder="8"
                value={form.sugar}
                onChangeText={setField('sugar')}
                keyboardType="decimal-pad"
                className="flex-1"
              />
            </View>

            <View className="flex-row gap-3">
              <Field
                label="Sodium (mg)"
                placeholder="580"
                value={form.sodium}
                onChangeText={setField('sodium')}
                keyboardType="decimal-pad"
                className="flex-1"
              />
              <Field
                label="Kolesterol (mg)"
                placeholder="85"
                value={form.cholesterol}
                onChangeText={setField('cholesterol')}
                keyboardType="decimal-pad"
                className="flex-1"
              />
            </View>
          </View>

          <Button
            label={saving ? 'Menyimpan...' : 'Simpan makanan'}
            onPress={handleSave}
            className={saving ? 'opacity-50' : ''}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
