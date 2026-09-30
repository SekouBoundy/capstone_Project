import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { useProperties } from '@/hooks/useProperties';
import { useTabBarClearance } from '@/hooks/useTabBarClearance';
import { PropertyCard } from '@/components/housing/PropertyCard';
import { PropertyMiniCard } from '@/components/housing/PropertyMiniCard';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { MenuSheet } from '@/components/ui/MenuSheet';
import { PropertyCardSkeleton } from '@/components/ui/Skeleton';
import { useAuthStore } from '@/stores/authStore';
import { PROPERTY_TYPES } from '@/lib/constants';
import { colors, spacing, radii, typography } from '@/theme';
import type { HousingFilters, Property } from '@/types/models';

const SEARCH_DEBOUNCE_MS = 350;
const NEARBY_COUNT = 8;

type Chip = { value: string | null; label: string };

export default function HousingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const clearance = useTabBarClearance();
  const { t } = useTranslation();
  const { profile } = useAuthStore();
  const [search, setSearch] = useState('');
  const [applied, setApplied] = useState<HousingFilters>({});
  const [menuOpen, setMenuOpen] = useState(false);

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

  const openProperty = useCallback(
    (property: Property) => router.push(`/housing/${property.id}`),
    [router]
  );

  // The "Nearby" rail is a horizontal window onto the same result set, so
  // it is skipped rather than duplicated when a filter is narrowing the
  // feed down to the handful of places the grid is already showing.
  const gridItems = properties ?? [];
  const showNearby = gridItems.length > 3;
  const nearby = showNearby ? gridItems.slice(0, NEARBY_COUNT) : [];

  const renderHeader = () => (
    <View>
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.md }]}>
        <Pressable
          onPress={() => setMenuOpen(true)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t('housing.menuTitle')}
          style={styles.iconButton}
        >
          <MaterialCommunityIcons name="menu" size={24} color={colors.text} />
        </Pressable>

        <View style={styles.topBarRight}>
          <Pressable
            onPress={() => router.push('/messages')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t('nav.messages')}
            style={styles.iconButton}
          >
            <MaterialCommunityIcons name="bell-outline" size={22} color={colors.text} />
          </Pressable>

          <Pressable
            onPress={() => router.push('/account')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('nav.account')}
          >
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.avatar}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>
                  {(profile?.full_name?.[0] ?? '?').toUpperCase()}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <View style={styles.headlineBlock}>
        <Text style={styles.headline}>{t('housing.discoverTitle')}</Text>
        <Text style={styles.subhead}>{t('housing.subtitle')}</Text>
      </View>

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

      {showNearby ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('housing.nearby')}</Text>
          <FlatList
            horizontal
            data={nearby}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rail}
            renderItem={({ item }) => (
              <PropertyMiniCard property={item} onPress={() => openProperty(item)} />
            )}
          />
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>{t('housing.allListings')}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={gridItems}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => (
          <PropertyCard property={item} onPress={() => openProperty(item)} />
        )}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={[styles.list, { paddingBottom: clearance }]}
        columnWrapperStyle={gridItems.length ? styles.column : undefined}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.skeletonGrid}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={styles.skeletonCell}>
                  <PropertyCardSkeleton />
                </View>
              ))}
            </View>
          ) : isError ? (
            <EmptyState
              icon="wifi-off"
              title={t('common.error')}
              description={error instanceof Error ? error.message : undefined}
              action={{ label: t('common.retry'), onPress: () => refetch() }}
            />
          ) : (
            <EmptyState
              icon="home-search-outline"
              title={t('common.noResults')}
              description={t('common.noResultsDesc')}
              action={
                canCreate
                  ? { label: t('housing.createListing'), onPress: () => router.push('/housing/new') }
                  : undefined
              }
            />
          )
        }
      />

      <MenuSheet visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  list: {
    paddingHorizontal: spacing.lg,
  },
  // Gap between columns without a `gap` on the FlatList, which would also
  // put horizontal gaps inside the header's own nested lists.
  column: { gap: spacing.md },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // The tab navigator hides its own header, so this row is the first
    // thing on screen and has to clear the notch itself. `ScreenHeader`
    // used to do this; it is gone now that the headline moved inline.
    paddingBottom: spacing.md,
  },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primaryLight },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { ...typography.caption, color: colors.text, fontWeight: '600' },

  headlineBlock: { marginBottom: spacing.lg },
  headline: { ...typography.display, fontSize: 28 },
  subhead: { ...typography.caption, marginTop: spacing.xs },

  searchRow: { marginBottom: spacing.md },
  chipRow: { marginBottom: spacing.xl },
  chipList: { gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.text, borderColor: colors.text },
  chipPressed: { opacity: 0.6 },
  chipLabel: { fontSize: 14, color: colors.text, fontWeight: '500' },
  chipLabelSelected: { color: colors.textInverse, fontWeight: '600' },

  section: { marginBottom: spacing.xl },
  sectionTitle: {
    ...typography.heading,
    marginBottom: spacing.md,
  },
  rail: { gap: spacing.md, paddingRight: spacing.lg },

  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  skeletonCell: { width: '47%' },
});
