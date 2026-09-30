import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, tabBarMetrics } from '@/theme';

/**
 * Bottom padding that keeps scrollable content clear of the floating dock.
 *
 * The dock is absolutely positioned, so a list has to reserve the space
 * itself or its last row ends up behind the bar. Centralised here because
 * getting it wrong is invisible until the user scrolls to the end, and the
 * value has three parts: the bar, the raised centre button that breaks
 * above it, and the home-indicator inset.
 *
 * `edge` trims the result for screens whose last element already carries
 * its own breathing room.
 */
export function useTabBarClearance(edge: number = spacing.lg) {
  const insets = useSafeAreaInsets();
  return tabBarMetrics.totalHeight + insets.bottom + edge;
}
