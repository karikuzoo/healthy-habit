import React, { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import {
  Button,
  Card,
  FoodForm,
  Loading,
  Screen,
  ScreenHeader,
} from '../../src/components';
import { colors } from '../../src/theme/colors';
import { servingsForCategory } from '../../src/data/foodServings';
import { getFoodWithServings, updateFood } from '../../src/db/foods';
import { parseFoodForm, validateFood } from '../../src/lib/validateFood';

/** Angka -> string untuk isian form; null jadi kosong, bukan "null". */
const toText = (value) => (value == null ? '' : String(value));

export default function EditFoodScreen() {
  const db = useSQLiteContext();
  const { food: foodId } = useLocalSearchParams();

  const [original, setOriginal] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      if (!foodId) {
        setNotFound(true);
        return () => { active = false; };
      }

      // Hanya dimuat sekali: memuat ulang setiap fokus akan membuang
      // perubahan yang sedang diketik pengguna.
      if (form) return () => { active = false; };

      getFoodWithServings(db, foodId).then((row) => {
        if (!active) return;
        if (!row) {
          setNotFound(true);
          return;
        }

        setOriginal(row);
        setForm({
          name: row.name,
          category: row.category ?? 'Lainnya',
          calories: toText(row.calories),
          protein: toText(row.protein),
          carbs: toText(row.carbs),
          fat: toText(row.fat),
          fiber: toText(row.fiber),
          sugar: toText(row.sugar),
          sodium: toText(row.sodium),
          cholesterol: toText(row.cholesterol),
          servingGrams: '',
        });
      });

      return () => { active = false; };
    }, [db, foodId, form]),
  );

  if (notFound) {
    return (
      <Screen>
        <ScreenHeader title="Ubah Makanan" />
        <View className="flex-1 items-center justify-center gap-2 px-8">
          <Ionicons name="alert-circle-outline" size={30} color={colors.ink.subtle} />
          <Text className="text-center text-sm text-ink-muted">
            Makanan ini tidak ditemukan di katalog.
          </Text>
        </View>
      </Screen>
    );
  }

  if (!form || !original) return <Loading />;

  const setField = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  const parsed = parseFoodForm(form);
  const { errors, warning, valid } = validateFood(parsed);

  const categoryChanged = form.category !== original.category;
  const servingChanged = parsed.servingGrams != null;

  const handleSave = async () => {
    setTouched(true);
    if (!valid || saving) return;
    setSaving(true);

    // Ukuran saji hanya dibuat ulang kalau memang perlu, supaya ukuran yang
    // sudah ada tidak diganti tanpa alasan.
    let servings;
    if (categoryChanged || servingChanged) {
      const base = servingsForCategory(form.category).map((s) => ({
        ...s,
        isDefault: servingChanged ? false : s.isDefault,
      }));

      const custom = { label: '1 porsi', grams: parsed.servingGrams, isDefault: true };

      servings = servingChanged
        ? [custom, ...base.filter((s) => s.grams !== custom.grams && s.label !== custom.label)]
        : base;
    }

    await updateFood(
      db,
      original.id,
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
      },
      servings ? { servings } : {},
    );

    router.back();
  };

  return (
    <Screen>
      <ScreenHeader title="Ubah Makanan" />

      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View className="gap-5 px-5 pb-8">
          <Text className="text-sm leading-5 text-ink-muted">
            Perbaiki nilai gizi per 100 gram kalau angkanya keliru. Perubahan ini hanya
            berlaku di perangkatmu.
          </Text>

          {original.userId == null ? (
            <Card className="flex-row items-start gap-3 p-4">
              <Ionicons name="information-circle-outline" size={18} color={colors.ink.muted} />
              <Text className="flex-1 text-xs leading-5 text-ink-muted">
                Ini entri katalog bawaan dengan sumber{' '}
                <Text className="font-semibold">{original.source}</Text>. Setelah kamu ubah,
                sumbernya menjadi "dikoreksi" supaya bisa dibedakan dari angka aslinya.
              </Text>
            </Card>
          ) : null}

          <FoodForm
            form={form}
            setField={setField}
            errors={errors}
            warning={warning}
            touched={touched}
          />

          {/* Catatan lama tidak berubah — angkanya disalin saat dicatat */}
          <Card className="flex-row items-start gap-3 p-4">
            <Ionicons name="time-outline" size={18} color={colors.ink.muted} />
            <Text className="flex-1 text-xs leading-5 text-ink-muted">
              Catatan yang sudah tersimpan tidak ikut berubah, karena angkanya disalin saat
              dicatat. Perubahan ini berlaku untuk pencatatan berikutnya.
            </Text>
          </Card>

          <Button
            label={saving ? 'Menyimpan...' : 'Simpan perubahan'}
            onPress={handleSave}
            className={saving ? 'opacity-50' : ''}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
