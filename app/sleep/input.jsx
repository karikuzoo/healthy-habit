import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '../../src/constants/colors';

export default function SleepInputScreen() {
  const [quality, setQuality] = useState('biasa');
  const [notes, setNotes] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1B4332" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sleep Tracker</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.durationBadge}>
          <Text style={styles.durationLabel}>DURASI TIDUR</Text>
          <Text style={styles.durationValue}>7j 35m</Text>
        </View>
        <Text style={styles.subtitle}>Bagus! Hampir mencapai target 8 jam.</Text>

        <View style={styles.timeRow}>
          <View style={styles.timeBox}>
            <Text style={styles.timeLabel}>Mulai tidur</Text>
            <View style={styles.timeInput}>
              <Text style={styles.timeText}>22:45</Text>
            </View>
          </View>
          <View style={styles.timeBox}>
            <Text style={styles.timeLabel}>Bangun</Text>
            <View style={styles.timeInput}>
              <Text style={styles.timeText}>06:00</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bagaimana kualitas tidurmu?</Text>
          <View style={styles.qualityRow}>
            <TouchableOpacity 
              style={[styles.qualityCard, quality === 'nyenyak' && styles.qualityCardActive]}
              onPress={() => setQuality('nyenyak')}
            >
              <Text style={styles.emoji}>😊</Text>
              <Text style={[styles.qualityText, quality === 'nyenyak' && styles.qualityTextActive]}>Nyenyak</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.qualityCard, quality === 'biasa' && styles.qualityCardActive]}
              onPress={() => setQuality('biasa')}
            >
              <Text style={styles.emoji}>😐</Text>
              <Text style={[styles.qualityText, quality === 'biasa' && styles.qualityTextActive]}>Biasa</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.qualityCard, quality === 'buruk' && styles.qualityCardActive]}
              onPress={() => setQuality('buruk')}
            >
              <Text style={styles.emoji}>😫</Text>
              <Text style={[styles.qualityText, quality === 'buruk' && styles.qualityTextActive]}>Buruk</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Catatan (opsional)</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            placeholder="Tidur lebih cepat setelah membaca"
            value={notes}
            onChangeText={setNotes}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Simpan tidur</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background || '#F7F9F2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B4332',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  durationBadge: {
    backgroundColor: '#E8F5E9',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  durationLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1B4332',
    letterSpacing: 1,
    marginBottom: 8,
  },
  durationValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1B4332',
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    marginBottom: 30,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  timeBox: {
    flex: 1,
    marginHorizontal: 5,
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  timeInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B4332',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B4332',
    marginBottom: 16,
  },
  qualityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  qualityCard: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  qualityCardActive: {
    borderColor: '#1B4332',
    backgroundColor: '#F1F8F1',
  },
  emoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  qualityText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  qualityTextActive: {
    color: '#1B4332',
    fontWeight: 'bold',
  },
  textArea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    height: 100,
    fontSize: 14,
    color: '#333',
  },
  button: {
    backgroundColor: '#1B4332',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
