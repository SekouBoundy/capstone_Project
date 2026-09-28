import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useProperties } from '@/hooks/useProperties';
import { PropertyCard } from '@/components/housing/PropertyCard';
import { useAuthStore } from '@/stores/authStore';

export default function HousingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { profile } = useAuthStore();
  const [search, setSearch] = useState('');
  const { data: properties, isLoading } = useProperties({ search });

  const canCreate = profile?.role === 'owner' || profile?.role === 'agency';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('housing.title')}</Text>
        <Text style={styles.subtitle}>{t('housing.subtitle')}</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('housing.searchPlaceholder')}
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#9ca3af"
        />
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => router.push('/housing/filters')}
        >
          <Text style={styles.filterButtonText}>{t('housing.filters')}</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : (
        <FlatList
          data={properties}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PropertyCard
              property={item}
              onPress={() => router.push(`/housing/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('common.noResults')}</Text>
              <Text style={styles.emptyDesc}>{t('common.noResultsDesc')}</Text>
            </View>
          }
        />
      )}

      {canCreate && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/housing/new')}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
    backgroundColor: '#f9fafb',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
  },
  filterButtonText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '500',
  },
  loader: {
    marginTop: 48,
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 80,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '300',
  },
});
