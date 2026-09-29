import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { PROPERTY_TYPES, CITIES } from '@/lib/constants';
import type { HousingFilters as HousingFiltersType } from '@/types/models';

export default function HousingFilters() {
  const router = useRouter();
  const { t } = useTranslation();
  const [filters, setFilters] = useState<HousingFiltersType>({});

  const handleApply = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('housing.filters')}</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionLabel}>{t('housing.budget')}</Text>
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            placeholder="Min"
            keyboardType="numeric"
            value={filters.minPrice?.toString() || ''}
            onChangeText={(v) => setFilters({ ...filters, minPrice: Number(v) || undefined })}
          />
          <Text style={styles.separator}>—</Text>
          <TextInput
            style={styles.input}
            placeholder="Max"
            keyboardType="numeric"
            value={filters.maxPrice?.toString() || ''}
            onChangeText={(v) => setFilters({ ...filters, maxPrice: Number(v) || undefined })}
          />
        </View>

        <Text style={styles.sectionLabel}>{t('housing.propertyType')}</Text>
        <View style={styles.chipContainer}>
          {PROPERTY_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.chip,
                filters.propertyType === type.value && styles.chipActive,
              ]}
              onPress={() =>
                setFilters({
                  ...filters,
                  propertyType: filters.propertyType === type.value ? undefined : type.value as any,
                })
              }
            >
              <Text
                style={[
                  styles.chipText,
                  filters.propertyType === type.value && styles.chipTextActive,
                ]}
              >
                {t(type.labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>{t('housing.city')}</Text>
        <View style={styles.chipContainer}>
          {CITIES.map((city) => (
            <TouchableOpacity
              key={city}
              style={[styles.chip, filters.city === city && styles.chipActive]}
              onPress={() =>
                setFilters({ ...filters, city: filters.city === city ? undefined : city })
              }
            >
              <Text
                style={[
                  styles.chipText,
                  filters.city === city && styles.chipTextActive,
                ]}
              >
                {city}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>{t('housing.furnished')}</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.optionButton, filters.furnished === true && styles.optionButtonActive]}
            onPress={() => setFilters({ ...filters, furnished: true })}
          >
            <Text style={[styles.optionText, filters.furnished === true && styles.optionTextActive]}>
              {t('housing.yes')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionButton, filters.furnished === false && styles.optionButtonActive]}
            onPress={() => setFilters({ ...filters, furnished: false })}
          >
            <Text style={[styles.optionText, filters.furnished === false && styles.optionTextActive]}>
              {t('housing.no')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
          <Text style={styles.applyButtonText}>{t('common.search')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16 },
  backButton: { fontSize: 16, color: '#000000', fontWeight: '500', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#000000' },
  content: { flex: 1, paddingHorizontal: 24 },
  sectionLabel: { fontSize: 16, fontWeight: '600', color: '#000000', marginTop: 24, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    flex: 1, borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#000000', backgroundColor: '#F2F2F7',
  },
  separator: { color: '#6E6E73' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: '#E5E5EA', backgroundColor: '#FFFFFF',
  },
  chipActive: { borderColor: '#000000', backgroundColor: '#000000' },
  chipText: { fontSize: 14, color: '#000000' },
  chipTextActive: { color: '#FFFFFF', fontWeight: '600' },
  optionButton: {
    flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1,
    borderColor: '#E5E5EA', alignItems: 'center',
  },
  optionButtonActive: { borderColor: '#000000', backgroundColor: '#000000' },
  optionText: { fontSize: 14, color: '#000000' },
  optionTextActive: { color: '#FFFFFF', fontWeight: '600' },
  footer: { padding: 24, borderTopWidth: 1, borderTopColor: '#E5E5EA' },
  applyButton: {
    backgroundColor: '#000000', paddingVertical: 16, borderRadius: 12, alignItems: 'center',
  },
  applyButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
