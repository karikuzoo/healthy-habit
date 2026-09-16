import React, { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { Card, Screen, ExerciseMedia } from "../../src/components";
import { colors } from "../../src/theme/colors";
import {
  listTemplates,
  getTemplateExercises,
  deleteTemplate,
} from "../../src/db/workoutTemplates";
import { replaceTodayPlanWithTemplate } from "../../src/db/workoutPlan";
import { useUser } from "../../src/context/UserContext";
import { useWorkoutBuilder } from "../../src/context/WorkoutBuilderContext";

export default function WorkoutTemplatesScreen() {
  const db = useSQLiteContext();
  const { user } = useUser();
  const { loadFromPlan } = useWorkoutBuilder();
  const [templates, setTemplates] = useState([]);

  const loadTemplates = useCallback(async () => {
    const rows = await listTemplates(db, user.id);
    setTemplates(rows);
  }, [db, user.id]);

  const handleEditTemplate = async (template) => {
    const exercises = await getTemplateExercises(db, template.id);
    loadFromPlan(exercises);
    router.push(
      `/workout/review?templateId=${template.id}&templateName=${encodeURIComponent(template.name)}`,
    );
  };

  useFocusEffect(
    useCallback(() => {
      loadTemplates();
    }, [loadTemplates]),
  );

  const handleApplyTemplate = async (template) => {
    Alert.alert(
      "Gunakan Template ini?",
      `Jadwal latihan Anda hari ini akan diganti sepenuhnya dengan template "${template.name}".`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Ganti Jadwal",
          style: "default",
          onPress: async () => {
            const exercises = await getTemplateExercises(db, template.id);
            await replaceTodayPlanWithTemplate(db, user.id, exercises);
            router.navigate("/(tabs)/workout?expand=true");
          },
        },
      ],
    );
  };

  const handleDeleteTemplate = (template) => {
    Alert.alert(
      "Hapus Template?",
      `Template "${template.name}" akan dihapus permanen.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            await deleteTemplate(db, user.id, template.id);
            loadTemplates();
          },
        },
      ],
    );
  };

  return (
    <Screen>
      <View className="px-5">
        <View className="flex-row items-start gap-3">
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            className="mt-0.5 h-9 w-9 items-center justify-center rounded-full bg-surface-sunken active:opacity-70"
          >
            <Ionicons name="arrow-back" size={18} color={colors.ink.DEFAULT} />
          </Pressable>
          <View className="flex-1">
            <Text className="text-3xl font-bold text-ink">Saved Templates</Text>
            <Text className="mt-1 text-sm text-ink-muted">
              Gunakan menu latihan yang pernah Anda simpan
            </Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="mt-6">
        <View className="gap-3 px-5 pb-8">
          {templates.length === 0 ? (
            <Card className="items-center justify-center p-8">
              <Ionicons
                name="document-text-outline"
                size={32}
                color={colors.ink.subtle}
              />
              <Text className="mt-2 text-center text-sm text-ink-muted">
                Anda belum memiliki template tersimpan. Buat dari "Mulai
                Latihan".
              </Text>
            </Card>
          ) : (
            templates.map((tpl) => (
              <Pressable
                key={tpl.id}
                onPress={() => handleApplyTemplate(tpl)}
                className="active:opacity-80"
              >
                <Card className="flex-row items-center justify-between pt-4 pb-4 p-3">
                  <View className="h-16 w-16 overflow-hidden rounded-xl bg-brand-soft">
                    <ExerciseMedia
                      exerciseId={tpl.first_exercise_id}
                      size={56}
                    />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-base font-bold text-ink">
                      {tpl.name}
                    </Text>
                    <Text className="mt-1 text-xs text-ink-muted">
                      {new Date(tpl.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View className="gap-2 ml-2">
                    <Pressable
                      onPress={() => handleEditTemplate(tpl)}
                      hitSlop={8}
                      className="p-1 items-center justify-center"
                    >
                      <Ionicons
                        name="create-outline"
                        size={20}
                        color={colors.ink.muted}
                      />
                    </Pressable>
                    <Pressable
                      onPress={() => handleDeleteTemplate(tpl)}
                      hitSlop={8}
                      className="p-1 items-center justify-center"
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color="#EF4444"
                      />
                    </Pressable>
                  </View>
                </Card>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
