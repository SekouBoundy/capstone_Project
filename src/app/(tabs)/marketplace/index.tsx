import { View, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useTabBarClearance } from '@/hooks/useTabBarClearance';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { colors, spacing } from '@/theme';
import type { MarketplaceFilters } from '@/types/models';

const SEARCH_DEBOUNCE_MS = 350;

export default function MarketplaceScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [applied, setApplied] = useState<MarketplaceFilters>({});
  const clearance = useTabBarClearance();

  const { data: products, isLoading, isRefetching, refetch, isError, error } = useProducts(applied);

  useEffect(() => {
    const trimmed = search.trim();
    if ((applied.search ?? '') === trimmed) return;

    const timer = setTimeout(() => {
      setApplied((prev) => ({ ...prev, search: trimmed || undefined }));
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [search, applied.search]);

  const renderSkeletonGrid = () => (
    <FlatList
      data={[0, 1, 2, 3]}
      keyExtractor={(item) => String(item)}
      renderItem={() => <ProductCardSkeleton />}
      numColumns={2}
      contentContainerStyle={styles.list}
      columnWrapperStyle={styles.column}
      showsVerticalScrollIndicator={false}
    />
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('marketplace.title')} subtitle={t('marketplace.subtitle')} />

      <View style={styles.searchRow}>
        <SearchBar
          placeholder={t('marketplace.searchPlaceholder')}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => {
            const trimmed = search.trim();
            setApplied((prev) => ({ ...prev, search: trimmed || undefined }));
          }}
          onClear={() => setSearch('')}
          onPressFilters={() => router.push('/marketplace/filters')}
        />
      </View>

      {isError ? (
        <EmptyState
          icon="wifi-off"
          title={t('common.error')}
          description={error instanceof Error ? error.message : undefined}
          action={{ label: t('common.retry'), onPress: () => refetch() }}
          style={styles.centered}
        />
      ) : isLoading ? (
        renderSkeletonGrid()
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => router.push(`/marketplace/${item.id}`)}
            />
          )}
          numColumns={2}
          contentContainerStyle={[
            products?.length ? styles.list : styles.listEmpty,
            // The dock floats over the feed, so the last row needs padding
            // to clear it.
            products?.length ? { paddingBottom: clearance } : null,
          ]}
          columnWrapperStyle={styles.column}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="store-search-outline"
              title={t('common.noResults')}
              description={t('common.noResultsDesc')}
              action={{ label: t('marketplace.createListing'), onPress: () => router.push('/marketplace/new') }}
              style={styles.centered}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchRow: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  listEmpty: { flexGrow: 1, paddingHorizontal: spacing.lg },
  column: { gap: spacing.md, marginBottom: spacing.lg },
  centered: { flex: 1, justifyContent: 'center' },
});
