import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography } from '@/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; onPress: () => void; label: string };
}

/**
 * Header for the tab-level feeds.
 *
 * Uses `useSafeAreaInsets` instead of the hardcoded `paddingTop: 60`
 * the screens carried before: 60 happened to clear the notch on an
 * iPhone 15 Pro but is wrong on every other device, and wrong in the
 * other direction on Android.
 */
export function ScreenHeader({ title, subtitle, onBack, rightAction }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.row}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={styles.backButton}
          >
            <MaterialCommunityIcons name="chevron-left" size={28} color={colors.primary} />
          </Pressable>
        ) : null}

        <View style={styles.text}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {rightAction ? (
          <Pressable
            onPress={rightAction.onPress}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={rightAction.label}
            style={styles.rightButton}
          >
            <MaterialCommunityIcons name={rightAction.icon} size={22} color={colors.text} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  backButton: { marginLeft: -6, marginRight: spacing.xs },
  rightButton: { marginLeft: spacing.sm },
  text: { flex: 1 },
  title: { ...typography.display, color: colors.primaryDark },
  subtitle: { ...typography.caption, marginTop: 2 },
});
