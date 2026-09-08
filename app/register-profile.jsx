import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../src/constants/colors';

export default function RegisterProfileScreen() {
  const [goal, setGoal] = useState('Maintenance');
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buat Akun</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: '100%' }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Jenis Aktivitas</Text>
            <TouchableOpacity style={styles.dropdownInput}>
              <Text style={styles.inputText}>Jarang Bergerak</Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tanggal lahir</Text>
            <TouchableOpacity style={styles.dropdownInput}>
              <Text style={styles.inputTextPlaceholder}>Pilih tanggal lahir</Text>
              <Ionicons name="calendar-outline" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Jenis kelamin</Text>
            <TouchableOpacity style={styles.dropdownInput}>
              <Text style={styles.inputTextPlaceholder}>Pilih jenis kelamin</Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Tinggi (cm)</Text>
              <TextInput 
                style={styles.input} 
                placeholder="0" 
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Berat (kg)</Text>
              <TextInput 
                style={styles.input} 
                placeholder="0" 
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.goalSection}>
            <Text style={styles.label}>Apa tujuan utamamu?</Text>
            <View style={styles.goalPillsContainer}>
              {['Cutting', 'Maintenance', 'Bulking'].map((item) => (
                <TouchableOpacity 
                  key={item} 
                  style={[styles.goalPill, goal === item && styles.goalPillActive]}
                  onPress={() => setGoal(item)}
                >
                  <Text style={[styles.goalPillText, goal === item && styles.goalPillTextActive]}>
                    {item}
                  </Text>
                  {goal === item && (
                    <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={styles.goalPillIcon} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity 
            style={styles.continueButton}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.continueButtonText}>Lanjutkan</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.footer}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.footerText}>
            Sudah punya akun? <Text style={styles.footerTextBold}>Masuk</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    color: '#111827',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#F3F4F6',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#1B4332',
  },
  scrollContent: {
    padding: 24,
    flexGrow: 1,
  },
  form: {
    gap: 20,
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 16,
    color: '#111827',
  },
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  inputText: {
    fontSize: 16,
    color: '#111827',
  },
  inputTextPlaceholder: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  goalSection: {
    marginTop: 8,
    gap: 12,
  },
  goalPillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  goalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 100,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  goalPillActive: {
    backgroundColor: '#1B4332',
    borderColor: '#1B4332',
  },
  goalPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  goalPillTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  goalPillIcon: {
    marginLeft: 6,
  },
  continueButton: {
    backgroundColor: '#1B4332',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  footerTextBold: {
    color: '#1B4332',
    fontWeight: 'bold',
  },
});
