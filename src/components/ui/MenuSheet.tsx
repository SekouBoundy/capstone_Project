import { Pressable, Modal, View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '@/stores/authStore';
import { colors, spacing, radii, typography, shadow } from '@/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface MenuItem {
  label: string;
  route: string;
  icon: IconName;
}

interface MenuSheetProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Bottom sheet of quick destinations, opened from the feed's hamburger.
 *
 * `Modal` with `transparent` rather than an absolutely-positioned overlay:
 * it renders above the tab bar and the status bar without any z-index
 * guesswork, and `onRequestClose` gives Android its hardware back button
 * for free.
 */
export function MenuSheet({ visible, onClose }: MenuSheetProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { profile } = useAuthStore();

  const canCreate = profile?.role === 'owner' || profile?.role === 'agency';

  const items: MenuItem[] = [
    ...(canCreate
      ? [{ label: t('housing.createListing'), route: '/housing/new', icon: 'plus-circle-outline' as IconName }]
      : []),
    { label: t('account.listings'), route: '/account/listings', icon: 'home-outline' },
    { label: t('account.favorites'), route: '/account/favorites', icon: 'heart-outline' },
    { label: t('account.settings'), route: '/account/settings', icon: 'cog-outline' },
  ];

  const go = (route: string) => {
    // Close before navigating: leaving the sheet mounted while the screen
    // changes means the fade-out animates over the new route.
    onClose();
    router.push(route as never);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t('common.cancel')}>
        {/* Swallow taps inside the sheet so they do not dismiss it. */}
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]} onPress={() => {}}>
          <View style={styles.grabber} />
          <Text style={styles.title}>{t('housing.menuTitle')}</Text>

          {items.map((item) => (
            <Pressable
              key={item.route}
              onPress={() => go(item.route)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <MaterialCommunityIcons name={item.icon} size={20} color={colors.text} />
              <Text style={styles.rowLabel}>{item.label}</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textMuted} />
            </Pressable>
          ))}

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            style={({ pressed }) => [styles.cancel, pressed && styles.rowPressed]}
          >
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    ...shadow.raised,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.md,
  },
  title: { ...typography.heading, marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  rowPressed: { opacity: 0.5 },
  rowLabel: { ...typography.body, flex: 1 },
  cancel: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
  },
  cancelText: { ...typography.bodyStrong },
});
