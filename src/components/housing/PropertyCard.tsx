import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { Property } from '@/types/models';
import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
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
      accessibilityLabel={property.title}
      style={({ pressed }) => [styles.container, shadow.card, pressed && styles.pressed]}
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
            <MaterialCommunityIcons name="home-city-outline" size={34} color={colors.textMuted} />
          </View>
        )}

        <View style={styles.imageTopRow}>
          <View style={styles.typePill}>
            <Text style={styles.typePillText}>{t(`housing.${property.property_type}`)}</Text>
          </View>
          {property.is_verified ? <VerifiedBadge /> : null}
        </View>

        {!property.available ? (
          <View style={[StyleSheet.absoluteFill, styles.unavailableOverlay]}>
            <Text style={styles.unavailableText}>{t('common.unavailable')}</Text>
          </View>
        ) : null}

        {photoCount > 1 ? (
          <View style={styles.photoCount}>
            <MaterialCommunityIcons name="image-multiple" size={13} color={colors.textInverse} />
            <Text style={styles.photoCountText}>{photoCount}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {property.title}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{t('common.currency')}</Text>
          <Text style={styles.priceValue}>{property.price_monthly}</Text>
          <Text style={styles.priceUnit}>{t('common.perMonth')}</Text>
        </View>

        <View style={styles.metaRow}>
          {property.city ? (
            <>
              <MaterialCommunityIcons name="map-marker-outline" size={14} color={colors.textMuted} />
              <Text style={styles.meta} numberOfLines={1}>
                {property.city}
              </Text>
            </>
          ) : null}

          <View style={styles.dot} />
          <Text style={styles.meta}>
            {property.rooms} {t('common.rooms')}
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
            <>
              <View style={styles.dot} />
              <MaterialCommunityIcons name="sofa-outline" size={14} color={colors.textMuted} />
            </>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.995 }] },
  imageContainer: {
    height: 172,
    backgroundColor: colors.surfaceMuted,
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageTopRow: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typePill: {
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  typePillText: {
    color: colors.textInverse,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  unavailableOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unavailableText: {
    ...typography.bodyStrong,
    color: colors.textInverse,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  photoCount: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  photoCountText: {
    color: colors.textInverse,
    fontSize: 11,
    fontWeight: '600',
  },
  content: { padding: spacing.lg },
  title: { ...typography.heading },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.xs,
  },
  price: { ...typography.heading, color: colors.primary, fontSize: 16 },
  priceValue: {
    fontSize: 21,
    fontWeight: '700',
    color: colors.primary,
    marginHorizontal: 2,
  },
  priceUnit: { ...typography.caption },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  meta: { ...typography.caption, flexShrink: 1 },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
  },
});
