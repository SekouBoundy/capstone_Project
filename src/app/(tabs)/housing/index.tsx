import { View, FlatList, RefreshControl, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useProperties } from '@/hooks/useProperties';
import { PropertyCard } from '@/components/housing/PropertyCard';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { PropertyCardSkeleton } from '@/components/ui/Skeleton';
import { useAuthStore } from '@/stores/authStore';
import { colors, spacing, shadow } from '@/theme';
import type { HousingFilters } from '@/types/models';

const SEARCH_DEBOUNCE_MS = 350;

export default function HousingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { profile } = useAuthStore();
  const [search, setSearch] = useState('');
  const [applied, setApplied] = useState<HousingFilters>({});

  const { data: properties, isLoading, isRefetching, refetch, isError, error } = useProperties(applied);

  // Debounce the text field into the query. Without this every keystroke
  // changes the query key and refetches, so typing "Nicosia" fires seven
  // requests. The filters screen is a separate route and does not go
  // through here.
  useEffect(() => {
    const trimmed = search.trim();
    if ((applied.search ?? '') === trimmed) return;

    const timer = setTimeout(() => {
      setApplied((prev) => ({ ...prev, search: trimmed || undefined }));
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [search, applied.search]);

  const canCreate = profile?.role === 'owner' || profile?.role === 'agency';

  const submit = () => setApplied((prev) => ({ ...prev, search }));

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('housing.title')} subtitle={t('housing.subtitle')} />

      <View style={styles.searchRow}>
        <SearchBar
          placeholder={t('housing.searchPlaceholder')}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => {
            const trimmed = search.trim();
            setApplied((prev) => ({ ...prev, search: trimmed || undefined }));
          }}
          onClear={() => setSearch('')}
          onPressFilters={() => router.push('/housing/filters')}
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
        <FlatList
          data={[0, 1, 2]}
          keyExtractor={(item) => String(item)}
          renderItem={() => <PropertyCardSkeleton />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
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
          contentContainerStyle={properties?.length ? styles.list : styles.listEmpty}
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
              icon="home-search-outline"
              title={t('common.noResults')}
              description={t('common.noResultsDesc')}
              action={
                canCreate
                  ? { label: t('housing.createListing'), onPress: () => router.push('/housing/new') }
                  : undefined
              }
              style={styles.centered}
            />
          }
        />
      )}

      {canCreate ? (
        <Pressable
          onPress={() => router.push('/housing/new')}
          accessibilityRole="button"
          accessibilityLabel={t('housing.createListing')}
          style={({ pressed }) => [styles.fab, shadow.raised, pressed && styles.fabPressed]}
        >
          <MaterialCommunityIcons name="plus" size={26} color={colors.textInverse} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchRow: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  list: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  listEmpty: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxl,
  },
  centered: { flex: 1, justifyContent: 'center' },
  fab: {
    position: 'absolute',
    bottom: spacing.xxl,
    right: spacing.xxl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabPressed: { opacity: 0.85 },
});
