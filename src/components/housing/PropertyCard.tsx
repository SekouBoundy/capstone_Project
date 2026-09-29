import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { Property } from '@/types/models';
import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { formatPrice } from '@/lib/format';
import { colors, spacing, radii, typography, shadow } from '@/theme';

interface PropertyCardProps {
  property: Property;
  onPress: () => void;
}

export function PropertyCard({ property, onPress }: PropertyCardProps) {
  const { t } = useTranslation();

  const mainImage = property.images?.[0]?.image_url;
  const photoCount = property.images?.length ?? 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${property.title}, ${formatPrice(property.price_monthly, property.currency)}`}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={styles.imageContainer}>
        {mainImage ? (
          <Image
            source={{ uri: mainImage }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <MaterialCommunityIcons name="home-city-outline" size={32} color={colors.textMuted} />
          </View>
        )}

        {/* Gradient scrim, only behind the top row, so white overlay text
            stays legible on a bright photo without darkening the image. */}
        <View style={styles.scrim} pointerEvents="none" />

        <View style={styles.topRow}>
          <View style={styles.typePill}>
            <Text style={styles.typePillText}>
              {t(`housing.${property.property_type}`)}
            </Text>
          </View>
          {property.is_verified ? <VerifiedBadge /> : null}
        </View>

        {photoCount > 1 ? (
          <View style={styles.photoCount}>
            <MaterialCommunityIcons
              name="image-multiple"
              size={12}
              color={colors.textInverse}
            />
            <Text style={styles.photoCountText}>{photoCount}</Text>
          </View>
        ) : null}

        {!property.available ? (
          <View style={styles.unavailableOverlay}>
            <Text style={styles.unavailableText}>{t('common.unavailable')}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {property.title}
        </Text>

        {/* Meta line before price: the eye reads "where / how big" first
            and the number second. Putting price immediately under the
            title split the two facts a user compares listings on. */}
        <View style={styles.metaRow}>
          {property.city ? (
            <>
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={13}
                color={colors.textMuted}
              />
              <Text style={styles.meta} numberOfLines={1}>
                {property.city}
              </Text>
            </>
          ) : null}

          <View style={styles.dot} />
          <Text style={styles.meta}>
            {t('common.room', { count: property.rooms })}
          </Text>

          {property.area_sqm ? (
            <>
              <View style={styles.dot} />
              <Text style={styles.meta}>
                {property.area_sqm} {t('common.area')}
              </Text>
            </>
          ) : null}

          {property.furnished ? (
            <MaterialCommunityIcons
              name="sofa-outline"
              size={14}
              color={colors.textMuted}
            />
          ) : null}
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>
            {formatPrice(property.price_monthly, property.currency)}
          </Text>
          <Text style={styles.period}>{t('common.perMonth')}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    // Shadow rather than a 1px border: a border on every side draws a
    // box around each listing and makes a vertical feed look like a
    // stack of tables. Elevation separates the cards without that.
    ...shadow.card,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: 'hidden',
    marginBottom: spacing.xxl,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.995 }] },

  imageContainer: {
    aspectRatio: 4 / 3,
    backgroundColor: colors.surfaceMuted,
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 72,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },

  topRow: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typePill: {
    backgroundColor: 'rgba(0,0,0,0.62)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  typePillText: {
    color: colors.textInverse,
    fontSize: 11,
    fontWeight: '600',
  },

  photoCount: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.62)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  photoCountText: {
    color: colors.textInverse,
    fontSize: 11,
    fontWeight: '600',
  },

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
    ...typography.bodyStrong,
    color: colors.textInverse,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.lg },
  title: { ...typography.heading, fontSize: 16 },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  meta: { ...typography.caption, flexShrink: 1 },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.sm,
  },
  price: { fontSize: 17, fontWeight: '700', color: colors.text },
  period: { ...typography.caption, marginLeft: 4 },
});
