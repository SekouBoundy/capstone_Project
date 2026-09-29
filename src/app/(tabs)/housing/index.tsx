import { View, Text, FlatList, RefreshControl, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useProperties } from '@/hooks/useProperties';
import { PropertyCard } from '@/components/housing/PropertyCard';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { PropertyCardSkeleton } from '@/components/ui/Skeleton';
import { useAuthStore } from '@/stores/authStore';
import { PROPERTY_TYPES } from '@/lib/constants';
import { colors, spacing, radii } from '@/theme';
import type { HousingFilters } from '@/types/models';

const SEARCH_DEBOUNCE_MS = 350;

type Chip = { value: string | null; label: string };

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

  // "All" plus one chip per property type. Airbnb's quick-filter row:
  // the most common narrowing is available in one tap, so nobody has to
  // open the full filters sheet to rule out dorms.
  const CHIP_ITEMS: Chip[] = [
    { value: null, label: t('housing.filterAll') },
    ...PROPERTY_TYPES.map((type) => ({
      value: type.value as string,
      label: t(type.labelKey),
    })),
  ];

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

      <View style={styles.chipRow}>
        <FlatList
          horizontal
          data={CHIP_ITEMS}
          keyExtractor={(item) => item.value ?? 'all'}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipList}
          renderItem={({ item }) => {
            const selected =
              item.value === null
                ? applied.propertyType === undefined
                : applied.propertyType === item.value;

            return (
              <Pressable
                onPress={() =>
                  setApplied((prev) => ({
                    ...prev,
                    propertyType:
                      item.value === null || prev.propertyType === item.value
                        ? undefined
                        : (item.value as HousingFilters['propertyType']),
                  }))
                }
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={({ pressed }) => [
                  styles.chip,
                  selected && styles.chipSelected,
                  pressed && styles.chipPressed,
                ]}
              >
                <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
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

  chipRow: { marginBottom: spacing.md },
  chipList: { paddingHorizontal: spacing.xxl, gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  chipPressed: { opacity: 0.6 },
  chipLabel: { fontSize: 14, color: colors.text, fontWeight: '500' },
  chipLabelSelected: { color: colors.textInverse, fontWeight: '600' },
  centered: { flex: 1, justifyContent: 'center' },
});
