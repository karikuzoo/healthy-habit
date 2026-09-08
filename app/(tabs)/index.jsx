import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../src/constants/colors';
import Typography from '../../src/constants/typography';
import { useUser } from '../../src/context/UserContext';

export default function HomeDashboard() {
  // const { user } = useUser();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Selamat pagi,</Text>
            <Text style={styles.name}>Padlan 👋</Text>
          </View>
          <View style={styles.avatar} />
        </View>

        {/* Daily Score Card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreInfo}>
            <Text style={styles.scoreLabel}>SKOR HARI INI</Text>
            <Text style={styles.scoreValue}>82<Text style={styles.scoreMax}>/100</Text></Text>
            <Text style={styles.scoreSubtitle}>Kamu dalam ritme yang baik</Text>
          </View>
          <View style={styles.scoreRing}>
            <View style={styles.innerRing} />
          </View>
        </View>

        {/* Steps Card */}
        <View style={styles.stepsCard}>
          <View style={styles.stepsHeader}>
            <View style={styles.stepsHeaderLeft}>
              <Ionicons name="footsteps" size={20} color={Colors.primary || '#1B4332'} />
              <View style={styles.stepsHeaderText}>
                <Text style={styles.stepsLabel}>Langkah kaki</Text>
                <Text style={styles.stepsTarget}>Target harian 8.000</Text>
              </View>
            </View>
            <Text style={styles.stepsPercentage}>78%</Text>
          </View>
          <Text style={styles.stepsValue}>6.248 <Text style={styles.stepsValueLabel}>langkah</Text></Text>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarFill} />
          </View>
          <Text style={styles.stepsSubtitle}>1.752 langkah lagi—jalan sore 18 menit cukup!</Text>
        </View>

        {/* Health Summary Row */}
        <Text style={styles.sectionTitle}>Ringkasan kesehatan</Text>
        <View style={styles.healthSummaryRow}>
          <View style={styles.healthCard}>
            <Ionicons name="bed" size={24} color="#4A90E2" />
            <Text style={styles.healthCardValue}>7j 35m</Text>
            <Text style={styles.healthCardLabel}>Tidur</Text>
          </View>
          <View style={styles.healthCard}>
            <Ionicons name="flame" size={24} color="#F5A623" />
            <Text style={styles.healthCardValue}>1.480</Text>
            <Text style={styles.healthCardLabel}>Kalori</Text>
          </View>
          <View style={styles.healthCard}>
            <Ionicons name="timer" size={24} color="#50E3C2" />
            <Text style={styles.healthCardValue}>32 min</Text>
            <Text style={styles.healthCardLabel}>Latihan</Text>
          </View>
        </View>

        {/* FitSync Plan Card */}
        <View style={styles.fitSyncCard}>
          <Text style={styles.fitSyncTitle}>✨ Today's FitSync Plan</Text>
          <Text style={styles.fitSyncBody}>
            Light Cardio recommended (6.5h sleep detected). Focus on a active recovery jog and steady breathing to optimize longevity.
          </Text>
        </View>
        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F8F7',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D1D5DB',
  },
  scoreCard: {
    backgroundColor: '#2D6A4F',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreInfo: {
    flex: 1,
  },
  scoreLabel: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
  },
  scoreValue: {
    color: '#FFF',
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  scoreMax: {
    fontSize: 20,
    fontWeight: 'normal',
  },
  scoreSubtitle: {
    color: '#E5E7EB',
    fontSize: 14,
  },
  scoreRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    borderColor: '#40916C',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopColor: '#FFF',
    borderRightColor: '#FFF',
    borderBottomColor: '#FFF',
    transform: [{ rotate: '-45deg' }],
  },
  innerRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'transparent',
  },
  stepsCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  stepsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepsHeaderText: {
    marginLeft: 12,
  },
  stepsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  stepsTarget: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  stepsPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D6A4F',
  },
  stepsValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  stepsValueLabel: {
    fontSize: 16,
    fontWeight: 'normal',
    color: '#666',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 12,
  },
  progressBarFill: {
    width: '78%',
    height: '100%',
    backgroundColor: '#2D6A4F',
    borderRadius: 4,
  },
  stepsSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  healthSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  healthCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    width: '31%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  healthCardValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 12,
    marginBottom: 4,
  },
  healthCardLabel: {
    fontSize: 12,
    color: '#666',
  },
  fitSyncCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  fitSyncTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  fitSyncBody: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
  },
});
