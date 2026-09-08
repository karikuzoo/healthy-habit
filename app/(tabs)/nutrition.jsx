import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '../../src/constants/colors';

const NutritionScreen = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Nutrition</Text>
        <Text style={styles.subtitle}>Catat asupan agar target nutrisimu tetap seimbang.</Text>

        <View style={styles.dailyCard}>
          <View style={styles.dailyHeader}>
            <Text style={styles.dailyLabel}>Daily Consumed</Text>
            <Text style={styles.dailyValue}>1,850 / 2,400 kcal</Text>
          </View>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: '77%' }]} />
          </View>
          
          <View style={styles.macroRow}>
            <View style={[styles.macroItem, { borderLeftColor: '#E74C3C' }]}>
              <Text style={styles.macroLabel}>PROTEIN</Text>
              <Text style={styles.macroValue}>111g / 150g</Text>
            </View>
            <View style={[styles.macroItem, { borderLeftColor: '#F59E0B' }]}>
              <Text style={styles.macroLabel}>CARBS</Text>
              <Text style={styles.macroValue}>172g / 250g</Text>
            </View>
            <View style={[styles.macroItem, { borderLeftColor: '#3B82F6' }]}>
              <Text style={styles.macroLabel}>FAT</Text>
              <Text style={styles.macroValue}>61g / 80g</Text>
            </View>
          </View>
        </View>

        <View style={styles.mealSection}>
          <View style={styles.mealHeader}>
            <Text style={styles.mealTitle}>Makan Siang <Text style={styles.mealTotal}>- 850 kcal</Text></Text>
            <TouchableOpacity>
              <Text style={styles.detailsText}>Details</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.foodItem}>
            <View style={styles.foodIconPlaceholder}>
              <Ionicons name="fast-food-outline" size={20} color="#666" />
            </View>
            <View style={styles.foodInfo}>
              <Text style={styles.foodName}>Ayam Geprek</Text>
              <Text style={styles.foodMacros}>P: 42g · C: 45g · F: 8g</Text>
            </View>
            <Text style={styles.foodCalories}>520 kcal</Text>
          </View>

          <View style={styles.foodItem}>
            <View style={styles.foodIconPlaceholder}>
              <Ionicons name="fast-food-outline" size={20} color="#666" />
            </View>
            <View style={styles.foodInfo}>
              <Text style={styles.foodName}>Kentang Goreng</Text>
              <Text style={styles.foodMacros}>P: 2g · C: 12g · F: 9g</Text>
            </View>
            <Text style={styles.foodCalories}>130 kcal</Text>
          </View>
        </View>

        <View style={styles.mealSection}>
          <View style={styles.mealHeader}>
            <Text style={styles.mealTitle}>Makan Malam <Text style={styles.mealTotal}>- 850 kcal</Text></Text>
            <TouchableOpacity>
              <Text style={styles.detailsText}>Details</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.foodItem}>
            <View style={styles.foodIconPlaceholder}>
              <Ionicons name="fast-food-outline" size={20} color="#666" />
            </View>
            <View style={styles.foodInfo}>
              <Text style={styles.foodName}>Pecel Ayam</Text>
              <Text style={styles.foodMacros}>P: 48g · C: 45g · F: 8g</Text>
            </View>
            <Text style={styles.foodCalories}>620 kcal</Text>
          </View>

          <View style={styles.foodItem}>
            <View style={styles.foodIconPlaceholder}>
              <Ionicons name="fast-food-outline" size={20} color="#666" />
            </View>
            <View style={styles.foodInfo}>
              <Text style={styles.foodName}>Kentang Rebus</Text>
              <Text style={styles.foodMacros}>P: 4g · C: 12g · F: 2g</Text>
            </View>
            <Text style={styles.foodCalories}>130 kcal</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/nutrition/add-food')}
        >
          <Text style={styles.addButtonText}>Tambahkan makanan</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

export default NutritionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1B4332',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 24,
  },
  dailyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dailyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dailyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  dailyValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#1B4332',
    borderRadius: 4,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    borderLeftWidth: 4,
    paddingLeft: 8,
  },
  macroLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  mealSection: {
    marginBottom: 24,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  mealTotal: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#64748B',
  },
  detailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B4332',
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  foodIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  foodMacros: {
    fontSize: 12,
    color: '#64748B',
  },
  foodCalories: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1B4332',
  },
  addButton: {
    backgroundColor: '#1B4332',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
