import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '../../src/constants/colors';

const AddFoodScreen = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Siang');
  const [portion, setPortion] = useState(1);

  const tabs = ['Sarapan', 'Siang', 'Malam', 'Cemilan'];

  const increasePortion = () => setPortion(prev => prev + 1);
  const decreasePortion = () => setPortion(prev => (prev > 1 ? prev - 1 : 1));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1B4332" />
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Nutrition</Text>
        <Text style={styles.subtitle}>Catat asupan agar target nutrisimu tetap seimbang.</Text>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Nasi merah, ayam, buah..."
            placeholderTextColor="#94A3B8"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity 
          style={styles.foodCard}
          onPress={() => router.push('/nutrition/detail')}
          activeOpacity={0.9}
        >
          <View style={styles.foodCardHeader}>
            <View style={styles.foodImagePlaceholder}>
              <Ionicons name="restaurant-outline" size={32} color="#94A3B8" />
            </View>
            <View style={styles.foodCardInfo}>
              <Text style={styles.foodCardName}>Ayam panggang & nasi merah</Text>
              <Text style={styles.foodCardPortion}>1 mangkuk • 420 g</Text>
            </View>
            <View style={styles.calorieBadge}>
              <Text style={styles.calorieBadgeText}>520 kkal</Text>
            </View>
          </View>

          <View style={styles.cardMacroRow}>
            <View style={styles.cardMacroItem}>
              <Text style={styles.cardMacroValue}>38 g</Text>
              <Text style={styles.cardMacroLabel}>Protein</Text>
            </View>
            <View style={styles.cardMacroDivider} />
            <View style={styles.cardMacroItem}>
              <Text style={styles.cardMacroValue}>62 g</Text>
              <Text style={styles.cardMacroLabel}>Karbo</Text>
            </View>
            <View style={styles.cardMacroDivider} />
            <View style={styles.cardMacroItem}>
              <Text style={styles.cardMacroValue}>14 g</Text>
              <Text style={styles.cardMacroLabel}>Lemak</Text>
            </View>
          </View>

          <View style={styles.portionControl}>
            <Text style={styles.portionLabel}>Porsi</Text>
            <View style={styles.portionButtons}>
              <TouchableOpacity style={styles.portionBtn} onPress={decreasePortion}>
                <Ionicons name="remove" size={20} color="#1E293B" />
              </TouchableOpacity>
              <Text style={styles.portionValue}>{portion} mangkuk</Text>
              <TouchableOpacity style={styles.portionBtn} onPress={increasePortion}>
                <Ionicons name="add" size={20} color="#1E293B" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>

      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={() => router.back()}>
          <Text style={styles.saveButtonText}>Simpan ke Log</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default AddFoodScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 24,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 12,
  },
  activeTab: {
    backgroundColor: '#1B4332',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  foodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  foodCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  foodImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  foodCardInfo: {
    flex: 1,
  },
  foodCardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  foodCardPortion: {
    fontSize: 14,
    color: '#64748B',
  },
  calorieBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  calorieBadgeText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardMacroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardMacroItem: {
    flex: 1,
    alignItems: 'center',
  },
  cardMacroValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  cardMacroLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  cardMacroDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
  },
  portionControl: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  portionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  portionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  portionBtn: {
    padding: 8,
  },
  portionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    paddingHorizontal: 12,
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
