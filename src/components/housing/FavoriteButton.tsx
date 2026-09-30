import { useCallback } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFavoriteIds, useToggleFavorite, type FavoriteKind } from '@/hooks/useFavorites';
import { colors, radii } from '@/theme';

interface FavoriteButtonProps {
  listingType: FavoriteKind;
  listingId: string;
  /** `overlay` sits on top of a photo; `plain` is for light surfaces. */
  variant?: 'overlay' | 'plain';
  size?: number;
}

/**
 * The heart on a card or a detail header.
 *
 * Owns its own saved-state query rather than taking a prop. The feed and
 * the detail screen are separate routes with separate caches, and lifting
 * this to a parent would mean threading one `string[]` through every card
 * in the grid. One small cached query per mount is cheaper than that
 * coupling, and react-query deduplicates the network call.
 */
export function FavoriteButton({
  listingType,
  listingId,
  variant = 'overlay',
  size = 20,
}: FavoriteButtonProps) {
  const { t } = useTranslation();
  const { data: savedIds } = useFavoriteIds(listingType);
  const toggle = useToggleFavorite();

  const saved = savedIds?.includes(listingId) ?? false;
  const overlay = variant === 'overlay';

  const onPress = useCallback(() => {
    toggle.mutate({ listingType, listingId, saved });
  }, [toggle, listingType, listingId, saved]);

  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityState={{ selected: saved }}
      accessibilityLabel={saved ? t('housing.removeFromSaved') : t('housing.saveProperty')}
      style={({ pressed }) => [
        styles.button,
        overlay ? styles.overlay : styles.plain,
        pressed && styles.pressed,
      ]}
    >
      <MaterialCommunityIcons
        name={saved ? 'heart' : 'heart-outline'}
        size={size}
        color={saved ? colors.danger : overlay ? colors.textInverse : colors.textSecondary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // A frosted disc rather than a bare glyph: on a photo the heart has to
  // stay legible over a bright window as well as a dark floor, and a
  // translucent white plate survives both.
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  plain: {
    backgroundColor: colors.surfaceMuted,
  },
  pressed: { opacity: 0.6 },
});
