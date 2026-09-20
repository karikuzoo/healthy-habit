import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { formatReps } from "../data/workout";

const WorkoutBuilderContext = createContext(null);

/**
 * Draft gerakan yang sedang disusun lewat alur "Mulai Latihan" (Jenis
 * Workout -> Jenis Otot -> daftar gerakan -> "Rincian Pemilihan gerakan"),
 * SEBELUM ditekan "Simpan Latihan".
 *
 * Sengaja murni di memori, bukan tabel database: kalau pengguna membatalkan
 * di tengah jalan (tombol back, pindah tab), draft ini cukup hilang begitu
 * saja — tidak boleh ada baris rencana setengah jadi tersimpan diam-diam.
 * Providernya dipasang di root layout supaya tetap hidup selama pengguna
 * berpindah antar layar Jenis Workout / Jenis Otot / daftar gerakan.
 *
 * Satu gerakan boleh muncul lebih dari sekali (lihat `duplicateExercise`) —
 * `key` yang membedakan tiap baris, bukan `exerciseId`.
 */
export function WorkoutBuilderProvider({ children }) {
  const [items, setItems] = useState([]);
  const [templateId, setTemplateId] = useState(null);
  const [templateName, setTemplateName] = useState("");

  const addExercise = useCallback((exercise) => {
    const isCardio = exercise.category === "cardio";

    setItems((current) => [
      ...current,
      {
        key: `${exercise.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        exerciseId: exercise.id,
        name: exercise.name,
        category: exercise.category,
        sets: 3,
        amount: isCardio ? 20 : 12,
        unit: isCardio ? "menit" : "repetisi",
      },
    ]);
  }, []);

  /** Dipakai daftar gerakan (bukan layar review) — cuma perlu tahu ADA/TIDAK per exerciseId. */
  const isSelected = useCallback(
    (exerciseId) => items.some((item) => item.exerciseId === exerciseId),
    [items],
  );

  /**
   * Ketuk di daftar gerakan: belum dipilih -> tambah satu; sudah dipilih ->
   * keluarkan SEMUA baris exerciseId itu (termasuk hasil salinannya) —
   * cocok untuk ketukan di daftar, yang tidak tahu `key` baris mana pun.
   * Untuk keluarkan satu baris tertentu di layar review, pakai
   * `removeExercise(key)` langsung.
   */
  const toggleExercise = useCallback(
    (exercise) => {
      if (isSelected(exercise.id)) {
        setItems((current) =>
          current.filter((item) => item.exerciseId !== exercise.id),
        );
        return;
      }
      addExercise(exercise);
    },
    [isSelected, addExercise],
  );

  /** Menaruh salinan tepat setelah gerakan aslinya, bukan di ujung daftar. */
  const duplicateExercise = useCallback((key) => {
    setItems((current) => {
      const index = current.findIndex((item) => item.key === key);
      if (index === -1) return current;

      const copy = {
        ...current[index],
        key: `${current[index].exerciseId}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 7)}`,
      };

      return [
        ...current.slice(0, index + 1),
        copy,
        ...current.slice(index + 1),
      ];
    });
  }, []);

  const removeExercise = useCallback((key) => {
    setItems((current) => current.filter((item) => item.key !== key));
  }, []);

  /** Dipakai stepper inline di kartu — hanya jumlahnya, satuan tetap ikut jenis gerakan. */
  const updateAmount = useCallback((key, amount) => {
    setItems((current) =>
      current.map((item) =>
        item.key === key ? { ...item, amount: Math.max(1, amount) } : item,
      ),
    );
  }, []);

  /** Dipanggil setelah "Simpan Latihan" berhasil menulis semuanya ke rencana. */
  const clear = useCallback(() => {
    setItems([]);
    setTemplateId(null);
    setTemplateName("");
  }, []);

  /**
   * Dipakai saat membuka template lewat "Edit" — mengisi draft dari gerakan
   * yang sudah tersimpan di sana.
   */
  const loadFromPlan = useCallback((planExercises, tplId = null, tplName = "") => {
    setTemplateId(tplId);
    setTemplateName(tplName);
    setItems(
      planExercises.map((ex) => {
        const parts = String(ex.reps ?? "").split(" ");
        const amount = parseInt(parts[0], 10) || 0;
        const unit = parts[1] || "repetisi";
        const exId = ex.exerciseId || ex.id;

        return {
          key: `${exId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          exerciseId: exId,
          name: ex.name,
          category: ex.category,
          sets: ex.sets || 3,
          amount,
          unit,
        };
      }),
    );
  }, []);

  const totalSets = useMemo(
    () => items.reduce((sum, item) => sum + item.sets, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      templateId,
      templateName,
      setTemplateName,
      totalSets,
      isSelected,
      toggleExercise,
      addExercise,
      duplicateExercise,
      removeExercise,
      updateAmount,
      clear,
      loadFromPlan,
      /** Bentuk siap tulis untuk `addPlanExercise` — reps digabung jadi satu teks. */
      toPlanRows: () =>
        items.map((item) => ({
          exerciseId: item.exerciseId,
          sets: item.sets,
          reps: formatReps(item.amount, item.unit),
        })),
    }),
    [
      items,
      templateId,
      templateName,
      totalSets,
      isSelected,
      toggleExercise,
      addExercise,
      duplicateExercise,
      removeExercise,
      updateAmount,
      clear,
      loadFromPlan,
    ],
  );

  return (
    <WorkoutBuilderContext.Provider value={value}>
      {children}
    </WorkoutBuilderContext.Provider>
  );
}

export function useWorkoutBuilder() {
  const context = useContext(WorkoutBuilderContext);
  if (!context) {
    throw new Error(
      "useWorkoutBuilder harus dipakai di dalam <WorkoutBuilderProvider>",
    );
  }
  return context;
}

export default WorkoutBuilderContext;
