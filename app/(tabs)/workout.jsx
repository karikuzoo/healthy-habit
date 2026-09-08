import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '../../src/constants/colors';

const exercises = [
  { id: 1, name: 'Goblet squat', sets: '3 set × 12 repetisi' },
  { id: 2, name: 'Incline push-up', sets: '3 set × 10 repetisi' },
  { id: 3, name: 'Dead bug', sets: '3 set × 12 repetisi' },
  { id: 4, name: 'Dumbbell row', sets: '3 set × 10 repetisi' },
  { id: 5, name: 'Plank hold', sets: '3 set × 30 detik' },
];

export default function WorkoutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Workout</Text>
        <Text style={styles.subtitle}>Pemula • 32 menit • Intensitas sedang</Text>
      </View>

      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>210</Text>
          <Text style={styles.summaryLabel}>kkal</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>8</Text>
          <Text style={styles.summaryLabel}>gerakan</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>45s</Text>
          <Text style={styles.summaryLabel}>istirahat</Text>
        </View>
      </View>

      <ScrollView style={styles.exerciseList} showsVerticalScrollIndicator={false}>
        {exercises.map((exercise, index) => (
          <TouchableOpacity 
            key={exercise.id} 
            style={styles.exerciseCard}
            onPress={() => router.push('/workout/session')}
          >
            <View style={styles.imagePlaceholder} />
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseIndex}>GERAKAN {index + 1}</Text>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <Text style={styles.exerciseSets}>{exercise.sets}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => router.push('/workout/kategori')}
      >
        <Text style={styles.addButtonText}>Tambahkan gerakan</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors?.background || '#F5F5F5',
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  summaryBar: {
    backgroundColor: '#1B4332',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#FFF',
    opacity: 0.8,
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#FFF',
    opacity: 0.3,
  },
  exerciseList: {
    flex: 1,
  },
  exerciseCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    marginRight: 16,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseIndex: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1B4332',
    marginBottom: 4,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  exerciseSets: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    backgroundColor: '#1B4332',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
