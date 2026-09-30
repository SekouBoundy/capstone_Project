import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { Property } from '@/types/models';
import { FavoriteButton } from '@/components/housing/FavoriteButton';
import { formatPrice } from '@/lib/format';
import { colors, spacing, radii, typography } from '@/theme';

interface PropertyMiniCardProps {
  property: Property;
  onPress: () => void;
  width?: number;
}

/**
 * Compact thumbnail card for the horizontal "Nearby" rail.
 *
 * The heart is a sibling of the card's own `Pressable`, not a child: a
 * nested pressable inside another pressable makes the outer one swallow
 * the tap on iOS, so tapping the heart would open the listing.
 */
export function PropertyMiniCard({ property, onPress, width = 210 }: PropertyMiniCardProps) {
  const { t } = useTranslation();
  const image = property.images?.[0]?.image_url;

  return (
    <View style={[styles.wrapper, { width }]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${property.title}, ${formatPrice(property.price_monthly, property.currency)}`}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        {image ? (
          <Image
            source={{ uri: image }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <MaterialCommunityIcons name="home-city-outline" size={22} color={colors.textMuted} />
          </View>
        )}

        {!property.available ? (
          <View style={styles.unavailable}>
            <Text style={styles.unavailableText}>{t('common.unavailable')}</Text>
          </View>
        ) : null}
      </Pressable>

      <View style={styles.heart}>
        <FavoriteButton
          listingType="property"
          listingId={property.id}
          variant="plain"
          size={16}
        />
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {property.title}
      </Text>
      <Text style={styles.price} numberOfLines={1}>
        {formatPrice(property.price_monthly, property.currency)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'relative' },
  card: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.85 },
  image: { width: '100%', aspectRatio: 16 / 10, backgroundColor: colors.surfaceMuted },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 16 / 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unavailable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unavailableText: {
    ...typography.label,
    color: colors.textInverse,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heart: { position: 'absolute', top: spacing.xs, right: spacing.xs },
  title: { ...typography.caption, color: colors.text, marginTop: spacing.sm },
  price: { ...typography.bodyStrong, marginTop: 1 },
});
