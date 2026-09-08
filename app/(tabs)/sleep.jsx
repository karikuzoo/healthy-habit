import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '../../src/constants/colors';

export default function SleepScreen() {
  const [reminderEnabled, setReminderEnabled] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.heading}>Sleep Tracker</Text>

        <View style={styles.sleepCard}>
          <View style={styles.circularProgress}>
            <Text style={styles.asleepLabel}>ASLEEP TIME</Text>
            <Text style={styles.asleepValue}>7h 30m</Text>
          </View>
        </View>

        <View style={styles.badgeContainer}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Sleep Quality: Good</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Trend</Text>
          <View style={styles.chartContainer}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => {
              const heights = [40, 60, 50, 80, 70, 90, 80];
              return (
                <View key={index} style={styles.barCol}>
                  <View style={[styles.bar, { height: heights[index] }]} />
                  <Text style={styles.dayLabel}>{day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.reminderRow}>
          <View style={styles.reminderTextContainer}>
            <Text style={styles.reminderTitle}>Bedtime Reminder</Text>
            <Text style={styles.reminderDesc}>Remind me to wind down at 10:00 PM</Text>
          </View>
          <Switch
            value={reminderEnabled}
            onValueChange={setReminderEnabled}
            trackColor={{ false: '#767577', true: Colors.primary || '#1B4332' }}
            thumbColor={'#fff'}
          />
        </View>

        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.push('/sleep/input')}
        >
          <Text style={styles.buttonText}>Catat tidur</Text>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1B4332',
    marginBottom: 24,
  },
  sleepCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  circularProgress: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 12,
    borderColor: '#1B4332',
    borderTopColor: '#E0E0E0', 
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },
  asleepLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    transform: [{ rotate: '-45deg' }],
    marginBottom: 4,
  },
  asleepValue: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#1B4332',
    transform: [{ rotate: '-45deg' }],
  },
  badgeContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  badge: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  badgeText: {
    color: '#1B4332',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B4332',
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  barCol: {
    alignItems: 'center',
  },
  bar: {
    width: 12,
    backgroundColor: '#1B4332',
    borderRadius: 6,
    marginBottom: 8,
  },
  dayLabel: {
    fontSize: 12,
    color: '#666',
  },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reminderTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B4332',
    marginBottom: 4,
  },
  reminderDesc: {
    fontSize: 14,
    color: '#666',
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
