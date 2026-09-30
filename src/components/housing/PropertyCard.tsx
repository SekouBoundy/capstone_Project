import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { Property } from '@/types/models';
import { FavoriteButton } from '@/components/housing/FavoriteButton';
import { formatPrice } from '@/lib/format';
import { colors, spacing, radii, typography, shadow } from '@/theme';

interface PropertyCardProps {
  property: Property;
  onPress: () => void;
}

/**
 * Grid card for the housing feed.
 *
 * Square-ish photo with the price on it, then title and city beneath. The
 * price is the one number a browser decides on, so it goes on the image
 * where it is compared across cards at a glance, rather than below the
 * fold of each cell where it would need a separate read.
 */
export function PropertyCard({ property, onPress }: PropertyCardProps) {
  const { t } = useTranslation();

  const mainImage = property.images?.[0]?.image_url;
  const photoCount = property.images?.length ?? 0;
  const price = formatPrice(property.price_monthly, property.currency);

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${property.title}, ${price}`}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        {mainImage ? (
          <Image
            source={{ uri: mainImage }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <MaterialCommunityIcons name="home-city-outline" size={28} color={colors.textMuted} />
          </View>
        )}

        {/* Price sits on the image, so it needs a plate to stay legible
            over a bright window as well as a dark floor. */}
        <View style={styles.pricePill}>
          <Text style={styles.price} numberOfLines={1}>
            {price}
          </Text>
          <Text style={styles.period}>{t('common.perMonth')}</Text>
        </View>

        <View style={styles.typePill}>
          <Text style={styles.typePillText} numberOfLines={1}>
            {t(`housing.${property.property_type}`)}
          </Text>
        </View>

        {photoCount > 1 ? (
          <View style={styles.photoCount}>
            <MaterialCommunityIcons name="image-multiple" size={11} color={colors.textInverse} />
            <Text style={styles.photoCountText}>{photoCount}</Text>
          </View>
        ) : null}

        {!property.available ? (
          <View style={styles.unavailableOverlay}>
            <Text style={styles.unavailableText}>{t('common.unavailable')}</Text>
          </View>
        ) : null}
      </Pressable>

      {/* Sibling of the card's Pressable, not a child: a nested pressable
          steals the tap on iOS, so the heart would open the listing. */}
      <View style={styles.heart}>
        <FavoriteButton listingType="property" listingId={property.id} size={18} />
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {property.title}
      </Text>

      <View style={styles.metaRow}>
        {property.city ? (
          <MaterialCommunityIcons name="map-marker-outline" size={12} color={colors.textMuted} />
        ) : null}
        <Text style={styles.meta} numberOfLines={1}>
          {[property.city, property.rooms ? t('common.room', { count: property.rooms }) : null]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    // `flex: 1` so a two-column `numColumns` list splits the row evenly.
    // Cards have different title lengths, so equal width cannot come from
    // content.
    flex: 1,
    marginBottom: spacing.xl,
  },
  card: {
    ...shadow.card,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.9 },
  image: { width: '100%', aspectRatio: 1, backgroundColor: colors.surfaceMuted },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pricePill: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    maxWidth: '72%',
    backgroundColor: 'rgba(0,0,0,0.62)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  price: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: '700',
    flexShrink: 1,
  },
  period: { fontSize: 10, color: 'rgba(255,255,255,0.85)' },

  typePill: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    maxWidth: '60%',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  typePillText: {
    color: colors.textInverse,
    fontSize: 10,
    fontWeight: '600',
  },

  photoCount: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  photoCountText: { color: colors.textInverse, fontSize: 10, fontWeight: '600' },

  unavailableOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unavailableText: {
    ...typography.label,
    color: colors.textInverse,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  heart: { position: 'absolute', top: spacing.sm, right: spacing.sm },
  title: { ...typography.bodyStrong, marginTop: spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  meta: { ...typography.caption, color: colors.textMuted, flexShrink: 1 },
});
