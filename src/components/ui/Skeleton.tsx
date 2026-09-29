import { useEffect, useState } from 'react';
import { View, Animated, Easing, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, radii } from '@/theme';

interface SkeletonProps {
  height: number;
  width?: number | `${number}%`;
  style?: ViewStyle;
}

/**
 * Pulsing placeholder block.
 *
 * Preferred over a full-screen spinner for feeds: the layout is already
 * in place, so nothing jumps when data lands and the user can see how
 * much is coming.
 *
 * Uses the built-in Animated API rather than Reanimated. Reanimated 4
 * needs the `react-native-worklets/plugin` babel plugin, which this
 * project does not configure, and an opacity loop is not worth that.
 */
export function Skeleton({ height, width = '100%', style }: SkeletonProps) {
  // `useState` with a lazy initializer rather than `useRef`: the value is
  // created once and never replaced, but reading `ref.current` during
  // render trips react-hooks/refs and is not how this is meant to be
  // written.
  const [pulse] = useState(() => new Animated.Value(0.45));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.45,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        styles.block,
        { height, width: width as ViewStyle['width'], opacity: pulse },
        style,
      ]}
    />
  );
}

export function PropertyCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton height={168} />
      <View style={styles.body}>
        <Skeleton height={16} width="65%" />
        <Skeleton height={22} width="40%" style={styles.gap} />
        <Skeleton height={13} width="80%" style={styles.gap} />
      </View>
    </View>
  );
}

export function ProductCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton height={150} />
      <View style={styles.body}>
        <Skeleton height={15} width="70%" />
        <Skeleton height={20} width="35%" style={styles.gap} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: colors.skeleton,
    borderRadius: radii.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  body: { padding: spacing.lg },
  gap: { marginTop: spacing.sm },
});
