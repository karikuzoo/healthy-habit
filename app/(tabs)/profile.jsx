import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '../../src/constants/colors';
import { useUser } from '../../src/context/UserContext';

export default function ProfileScreen() {
  const [activeProgram, setActiveProgram] = useState('bulking');
  const [darkMode, setDarkMode] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View />
          <TouchableOpacity onPress={() => router.push('/profile/edit')} style={styles.editButton}>
            <Ionicons name="pencil" size={24} color="#1B4332" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={50} color="#ccc" />
          </View>
          <Text style={styles.name}>Padlan Prabowo</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>AGE</Text>
              <Text style={styles.statValue}>28</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>WEIGHT</Text>
              <Text style={styles.statValue}>78 kg</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>HEIGHT</Text>
              <Text style={styles.statValue}>182 cm</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Program</Text>
          <View style={styles.programRow}>
            <TouchableOpacity 
              style={[styles.programCard, activeProgram === 'bulking' && styles.programCardActive]}
              onPress={() => setActiveProgram('bulking')}
            >
              <Ionicons name="trending-up" size={20} color={activeProgram === 'bulking' ? '#fff' : '#1B4332'} />
              <Text style={[styles.programText, activeProgram === 'bulking' && styles.programTextActive]}>Bulking</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.programCard, activeProgram === 'maintenance' && styles.programCardActive]}
              onPress={() => setActiveProgram('maintenance')}
            >
              <Ionicons name="scale" size={20} color={activeProgram === 'maintenance' ? '#fff' : '#1B4332'} />
              <Text style={[styles.programText, activeProgram === 'maintenance' && styles.programTextActive]}>Maintenance</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.programCard, activeProgram === 'cutting' && styles.programCardActive]}
              onPress={() => setActiveProgram('cutting')}
            >
              <Ionicons name="trending-down" size={20} color={activeProgram === 'cutting' ? '#fff' : '#1B4332'} />
              <Text style={[styles.programText, activeProgram === 'cutting' && styles.programTextActive]}>Cutting</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Bulking Targets</Text>
          <View style={styles.card}>
            <View style={styles.targetRow}>
              <View style={[styles.dot, { backgroundColor: '#FF6B6B' }]} />
              <Text style={styles.targetLabel}>Calories</Text>
              <Text style={styles.targetValue}>2,400 kcal</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.targetRow}>
              <View style={[styles.dot, { backgroundColor: '#4DABF7' }]} />
              <Text style={styles.targetLabel}>Protein</Text>
              <Text style={styles.targetValue}>150g</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.targetRow}>
              <View style={[styles.dot, { backgroundColor: '#FCC419' }]} />
              <Text style={styles.targetLabel}>Carbs</Text>
              <Text style={styles.targetValue}>250g</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.targetRow}>
              <View style={[styles.dot, { backgroundColor: '#B197FC' }]} />
              <Text style={styles.targetLabel}>Fat</Text>
              <Text style={styles.targetValue}>80g</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.settingsRow}>
              <Text style={styles.settingsLabel}>Notification Preferences</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.settingsRow}>
              <Text style={styles.settingsLabel}>Units (kg/lbs)</Text>
              <Text style={styles.settingsValue}>Metric (kg)</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            
            <View style={styles.settingsRow}>
              <Text style={styles.settingsLabel}>Dark Mode</Text>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#767577', true: Colors.primary || '#1B4332' }}
                thumbColor={'#fff'}
              />
            </View>
          </View>
        </View>

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  editButton: {
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B4332',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    width: '100%',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666',
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B4332',
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
  programRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  programCard: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 4,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  programCardActive: {
    backgroundColor: '#1B4332',
  },
  programText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1B4332',
    marginTop: 8,
  },
  programTextActive: {
    color: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  targetLabel: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  targetValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B4332',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  settingsLabel: {
    fontSize: 16,
    color: '#333',
  },
  settingsValue: {
    fontSize: 16,
    color: '#666',
  },
});
