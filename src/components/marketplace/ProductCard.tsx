import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { Product } from '@/types/models';
import { colors, spacing, radii, typography, shadow } from '@/theme';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
}

const CATEGORY_ICONS: Record<Product['category'], React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  furniture: 'sofa-outline',
  electronics: 'laptop',
  books: 'book-open-page-variant-outline',
  kitchen: 'silverware-fork-knife',
  clothing: 'tshirt-crew-outline',
  other: 'tag-outline',
};

export function ProductCard({ product, onPress }: ProductCardProps) {
  const { t } = useTranslation();

  const mainImage = product.image_urls?.[0];
  const isSold = product.status === 'sold';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={product.title}
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
            <MaterialCommunityIcons
              name={CATEGORY_ICONS[product.category] ?? 'tag-outline'}
              size={32}
              color={colors.textMuted}
            />
          </View>
        )}

        <View style={styles.imageTopRow}>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText}>{t(`marketplace.${product.category}`)}</Text>
          </View>
        </View>

        {isSold ? (
          <View style={[StyleSheet.absoluteFill, styles.soldOverlay]}>
            <Text style={styles.soldText}>{t('common.sold')}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {product.title}
        </Text>

        <Text style={styles.price}>
          {t('common.currency')}
          {product.price}
        </Text>

        <View style={styles.metaRow}>
          <Text style={styles.meta}>{t(`marketplace.${product.condition}`)}</Text>
          {product.city ? (
            <>
              <View style={styles.dot} />
              <MaterialCommunityIcons name="map-marker-outline" size={13} color={colors.textMuted} />
              <Text style={styles.meta} numberOfLines={1}>
                {product.city}
              </Text>
            </>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.9 },
  imageContainer: {
    height: 140,
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
    top: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
  },
  categoryPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  categoryPillText: {
    color: colors.textInverse,
    fontSize: 10,
    fontWeight: '600',
  },
  soldOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldText: {
    ...typography.bodyStrong,
    color: colors.textInverse,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  content: { padding: spacing.md },
  title: { ...typography.bodyStrong, fontSize: 14 },
  price: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
    marginTop: spacing.xxs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  meta: { ...typography.captionMuted, fontSize: 12, flexShrink: 1 },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
  },
});
