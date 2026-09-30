import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { useSavedListings, type SavedItem } from '@/hooks/useFavorites';
import { FavoriteButton } from '@/components/housing/FavoriteButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPrice } from '@/lib/format';
import { colors, spacing, radii, typography, shadow, tabBarMetrics } from '@/theme';

export default function Favorites() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: items, isLoading } = useSavedListings();

  const open = (item: SavedItem) => {
    if (item.kind === 'property') router.push(`/housing/${item.property.id}`);
    else router.push(`/marketplace/${item.product.id}`);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={items ?? []}
        keyExtractor={(item) => (item.kind === 'property' ? `p-${item.property.id}` : `i-${item.product.id}`)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <SavedRow item={item} onPress={() => open(item)} />}
        ListHeaderComponent={
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            style={styles.back}
          >
            <MaterialCommunityIcons name="chevron-left" size={26} color={colors.primary} />
          </Pressable>
        }
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              icon="heart-outline"
              title={t('account.favorites')}
              description={t('account.favoritesEmptyDesc')}
            />
          )
        }
      />
    </View>
  );
}

function SavedRow({ item, onPress }: { item: SavedItem; onPress: () => void }) {
  const { t } = useTranslation();
  const isProperty = item.kind === 'property';
  const listing = isProperty ? item.property : item.product;
  const image = isProperty
    ? item.property.images?.[0]?.image_url
    : item.product.image_urls?.[0];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={listing.title}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {image ? (
        <Image source={{ uri: image }} style={styles.thumb} contentFit="cover" transition={150} />
      ) : (
        <View style={styles.thumbPlaceholder}>
          <MaterialCommunityIcons
            name={isProperty ? 'home-city-outline' : 'tag-outline'}
            size={20}
            color={colors.textMuted}
          />
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {listing.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {isProperty
            ? [item.property.city, t(`housing.${item.property.property_type}`)]
                .filter(Boolean)
                .join(' · ')
            : t(`marketplace.${item.product.category}`)}
        </Text>
        <Text style={styles.price} numberOfLines={1}>
          {isProperty
            ? `${formatPrice(item.property.price_monthly, item.property.currency)}${t('common.perMonth')}`
            : formatPrice(item.product.price, item.product.currency)}
        </Text>
      </View>

      {/* A sibling, not a child: a nested pressable steals the tap on
          iOS, so un-hearting would open the listing instead. */}
      <FavoriteButton
        listingType={isProperty ? 'property' : 'product'}
        listingId={listing.id}
        variant="plain"
        size={18}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: tabBarMetrics.totalHeight + spacing.xxl,
  },
  back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  row: {
    ...shadow.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  pressed: { opacity: 0.6 },
  thumb: { width: 68, height: 56, borderRadius: radii.md, backgroundColor: colors.surfaceMuted },
  thumbPlaceholder: {
    width: 68,
    height: 56,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  title: { ...typography.bodyStrong },
  meta: { ...typography.caption, marginTop: 1 },
  price: { ...typography.caption, color: colors.text, fontWeight: '600', marginTop: 3 },
});
