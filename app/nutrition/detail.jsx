import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '../../src/constants/colors';

const FoodDetailScreen = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1B4332" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Makanan</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.imagePlaceholder}>
          <Ionicons name="restaurant-outline" size={64} color="#94A3B8" />
        </View>

        <View style={styles.mainInfo}>
          <Text style={styles.foodName}>Ayam Panggang & Nasi Merah</Text>
          <View style={styles.portionRow}>
            <Text style={styles.portionText}>1 mangkuk • 420 g</Text>
            <View style={styles.calorieBadge}>
              <Text style={styles.calorieBadgeText}>520 kkal</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Dampak Kalori Harian</Text>
          <View style={styles.impactRow}>
            <View style={styles.percentageCircle}>
              <Text style={styles.percentageText}>77%</Text>
            </View>
            <View style={styles.impactTextContainer}>
              <Text style={styles.impactDesc}>
                Makanan ini menyumbang 520 dari total kebutuhan harian Anda sebesar 2.400 kkal.
              </Text>
              <View style={styles.sleepBadge}>
                <Ionicons name="moon" size={14} color="#10B981" />
                <Text style={styles.sleepBadgeText}>Sleep Quality: Good</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Makronutrien</Text>
          
          <View style={styles.macroBarContainer}>
            <View style={styles.macroBarHeader}>
              <Text style={styles.macroBarLabel}>PROTEIN (38g)</Text>
              <Text style={styles.macroBarPercent}>25% dari target</Text>
            </View>
            <View style={styles.macroBarBg}>
              <View style={[styles.macroBarFill, { width: '25%', backgroundColor: '#E74C3C' }]} />
            </View>
          </View>

          <View style={styles.macroBarContainer}>
            <View style={styles.macroBarHeader}>
              <Text style={styles.macroBarLabel}>KARBO (62g)</Text>
              <Text style={styles.macroBarPercent}>25% dari target</Text>
            </View>
            <View style={styles.macroBarBg}>
              <View style={[styles.macroBarFill, { width: '25%', backgroundColor: '#F59E0B' }]} />
            </View>
          </View>

          <View style={styles.macroBarContainer}>
            <View style={styles.macroBarHeader}>
              <Text style={styles.macroBarLabel}>LEMAK (14g)</Text>
              <Text style={styles.macroBarPercent}>17% dari target</Text>
            </View>
            <View style={styles.macroBarBg}>
              <View style={[styles.macroBarFill, { width: '17%', backgroundColor: '#3B82F6' }]} />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Informasi Gizi Detail</Text>
          <View style={styles.nutritionList}>
            <View style={styles.nutritionRow}><Text style={styles.nutritionLabel}>Serat</Text><Text style={styles.nutritionVal}>4.2 g</Text></View>
            <View style={styles.nutritionRow}><Text style={styles.nutritionLabel}>Gula</Text><Text style={styles.nutritionVal}>8 g</Text></View>
            <View style={styles.nutritionRow}><Text style={styles.nutritionLabel}>Sodium</Text><Text style={styles.nutritionVal}>590 mg</Text></View>
            <View style={styles.nutritionRow}><Text style={styles.nutritionLabel}>Kolesterol</Text><Text style={styles.nutritionVal}>85 mg</Text></View>
            <View style={styles.nutritionRow}><Text style={styles.nutritionLabel}>Vitamin A</Text><Text style={styles.nutritionVal}>12%</Text></View>
            <View style={styles.nutritionRow}><Text style={styles.nutritionLabel}>Vitamin C</Text><Text style={styles.nutritionVal}>8%</Text></View>
            <View style={styles.nutritionRow}><Text style={styles.nutritionLabel}>Kalsium</Text><Text style={styles.nutritionVal}>4%</Text></View>
            <View style={styles.nutritionRow}><Text style={styles.nutritionLabel}>Zat Besi</Text><Text style={styles.nutritionVal}>15%</Text></View>
          </View>
        </View>

        <View style={styles.timeInfo}>
          <Ionicons name="time-outline" size={20} color="#64748B" />
          <Text style={styles.timeText}>Waktu Makan: Makan Siang • 12:30</Text>
        </View>

      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={() => router.back()}>
          <Text style={styles.saveButtonText}>Simpan ke Log</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default FoodDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  scrollContent: {
    padding: 24,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#E2E8F0',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  mainInfo: {
    marginBottom: 24,
  },
  foodName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  portionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  portionText: {
    fontSize: 16,
    color: '#64748B',
    marginRight: 12,
  },
  calorieBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  calorieBadgeText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  impactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentageCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: '#1B4332',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  percentageText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B4332',
  },
  impactTextContainer: {
    flex: 1,
  },
  impactDesc: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 8,
    lineHeight: 20,
  },
  sleepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sleepBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 4,
  },
  macroBarContainer: {
    marginBottom: 16,
  },
  macroBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  macroBarLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  macroBarPercent: {
    fontSize: 12,
    color: '#64748B',
  },
  macroBarBg: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  macroBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  nutritionList: {
    marginTop: 4,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  nutritionLabel: {
    fontSize: 14,
    color: '#475569',
  },
  nutritionVal: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  timeText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#64748B',
  },
  bottomContainer: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  saveButton: {
    backgroundColor: '#1B4332',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
