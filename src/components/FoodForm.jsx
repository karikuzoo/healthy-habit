import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';
import { Field } from './Field';
import { SelectField } from './SelectField';
import { colors } from '../theme/colors';
import { foodCategories, servingsForCategory } from '../data/foodServings';

const CATEGORY_OPTIONS = foodCategories.map((c) => ({ value: c, label: c }));

/**
 * Form nilai gizi per 100 gram.
 *
 * Dipakai bersama layar makanan baru dan layar ubah makanan. Aturan
 * validasinya sendiri ada di `src/lib/validateFood.js` — form ini hanya
 * menampilkan hasilnya, supaya keduanya tidak mungkin berbeda aturan.
 *
 * Susunan medannya mengikuti tabel "Informasi Nilai Gizi" di kemasan
 * Indonesia, karena di situlah orang menyalin angkanya.
 */
export function FoodForm({ form, setField, errors, warning, touched }) {
  const showError = (key) => (touched ? errors[key] : undefined);

  return (
    <>
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
          <Text className="text-xs font-normal text-ink-muted">boleh dikosongkan</Text>
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
    </>
  );
}

export default FoodForm;
