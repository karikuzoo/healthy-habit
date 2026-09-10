import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Button, FoodForm, Screen, ScreenHeader } from '../../src/components';
import { servingsForCategory } from '../../src/data/foodServings';
import { insertFood } from '../../src/db/foods';
import { parseFoodForm, validateFood } from '../../src/lib/validateFood';
import { useUser } from '../../src/context/UserContext';

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

  const parsed = parseFoodForm(form);
  const { errors, warning, valid } = validateFood(parsed);

  const handleSave = async () => {
    setTouched(true);
    if (!valid || saving) return;
    setSaving(true);

    // Berat porsi kustom jadi ukuran default; ukuran per kategori tetap
    // ditambahkan sebagai pilihan lain. Disaring berdasarkan label DAN berat,
    // supaya tidak muncul dua ukuran berlabel sama dengan berat berbeda.
    const base = servingsForCategory(form.category).map((s) => ({
      ...s,
      isDefault: parsed.servingGrams == null ? s.isDefault : false,
    }));

    const custom = { label: '1 porsi', grams: parsed.servingGrams, isDefault: true };

    const servings =
      parsed.servingGrams == null
        ? base
        : [
            custom,
            ...base.filter((s) => s.grams !== custom.grams && s.label !== custom.label),
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
        fiber: parsed.fiber,
        sugar: parsed.sugar,
        sodium: parsed.sodium,
        cholesterol: parsed.cholesterol,
        source: 'pengguna',
      },
      servings,
      user.id,
    );

    router.back();
  };

  return (
    <Screen>
      <ScreenHeader title="Makanan Baru" />

      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View className="gap-5 px-5 pb-8">
          <Text className="text-sm leading-5 text-ink-muted">
            Isi nilai gizi per 100 gram. Kalau kamu punya kemasannya, angka ini ada di
            tabel "Informasi Nilai Gizi".
          </Text>

          <FoodForm
            form={form}
            setField={setField}
            errors={errors}
            warning={warning}
            touched={touched}
          />

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
