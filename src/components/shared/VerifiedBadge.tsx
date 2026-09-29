import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radii, shadow } from '@/theme';

/**
 * Verification marker.
 *
 * A white pill rather than the green this used to be: on a card whose
 * rest is monochrome, a saturated fill became the only thing the eye
 * landed on. White-on-photo keeps the trust signal without shouting.
 */
export function VerifiedBadge() {
  const { t } = useTranslation();

  return (
    <View style={[styles.container, shadow.card]}>
      <MaterialCommunityIcons name="check-decagram" size={12} color={colors.text} />
      <Text style={styles.text}>{t('common.verified')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.surface,
    paddingHorizontal: radii.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  text: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
  },
});
