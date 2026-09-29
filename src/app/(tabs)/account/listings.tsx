import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMyListings } from '@/hooks/useProperties';
import { PropertyCard } from '@/components/housing/PropertyCard';

export default function MyListings() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: listings, isLoading } = useMyListings();

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('housing.myListings')}</Text>
      </View>

      <FlatList
        data={listings}
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
            <Text style={styles.emptyText}>{t('housing.noListings')}</Text>
            <Text style={styles.emptyDesc}>{t('housing.noListingsDesc')}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16 },
  backButton: { fontSize: 16, color: '#000000', fontWeight: '500', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#000000' },
  list: { paddingHorizontal: 24, paddingBottom: 24 },
  emptyContainer: { alignItems: 'center', paddingTop: 48 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#000000', marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#6E6E73', textAlign: 'center' },
});
