import { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { PropertyImage } from '@/types/models';
import { colors, spacing, radii, typography } from '@/theme';

interface ImageCarouselProps {
  images: PropertyImage[];
  height?: number;
  /** Rendered top-left, e.g. a back button. */
  topLeft?: React.ReactNode;
  /** Rendered bottom-left, e.g. the price block. */
  bottomLeft?: React.ReactNode;
  /** Rendered top-right, e.g. a heart. */
  topRight?: React.ReactNode;
  onPressImage?: (index: number) => void;
}

/**
 * Swipeable photo carousel for the detail screen.
 *
 * Built on `FlatList` with `pagingEnabled` rather than a gesture library:
 * paging, recycling and the scroll-position math all come for free, and it
 * needs no native module. Page width is measured from the window so the
 * snap lands exactly on each photo's edge on any device.
 */
export function ImageCarousel({
  images,
  height = 340,
  topLeft,
  bottomLeft,
  topRight,
  onPressImage,
}: ImageCarouselProps) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  // The list is memoised so a re-render mid-swipe does not reset paging.
  const listRef = useRef<FlatList<PropertyImage>>(null);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(e.nativeEvent.contentOffset.x / width);
      setIndex((prev) => (prev === next ? prev : next));
    },
    [width]
  );

  if (images.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <MaterialCommunityIcons name="home-city-outline" size={40} color={colors.textMuted} />
      </View>
    );
  }

  return (
    <View style={{ height }}>
      <FlatList
        ref={listRef}
        data={images}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        // Window is the page width, so only the photos in view are ever
        // mounted — `initialNumToRender={1}` plus paging keeps memory flat
        // even on a ten-photo listing.
        initialNumToRender={1}
        windowSize={3}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item, index: i }) => (
          <Pressable
            style={{ width }}
            onPress={onPressImage ? () => onPressImage(i) : undefined}
            accessibilityRole={onPressImage ? 'button' : 'image'}
            accessibilityLabel={`Photo ${i + 1} of ${images.length}`}
          >
            <Image
              source={{ uri: item.image_url }}
              style={styles.image}
              contentFit="cover"
              transition={200}
            />
          </Pressable>
        )}
      />

      {topLeft ? <View style={styles.topLeft}>{topLeft}</View> : null}
      {topRight ? <View style={styles.topRight}>{topRight}</View> : null}

      {bottomLeft ? (
        <View style={styles.bottomBar} pointerEvents="box-none">
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.30)', 'rgba(0,0,0,0.72)']}
            locations={[0, 0.5, 1]}
            pointerEvents="none"
            style={styles.bottomScrim}
          />
          <View pointerEvents="box-none">{bottomLeft}</View>
        </View>
      ) : null}

      <View style={styles.indicator} pointerEvents="box-none">
        {images.length > 1
          ? images.map((item, i) => (
              <View key={item.id} style={[styles.dot, i === index && styles.dotActive]} />
            ))
          : null}
        {images.length > 1 ? (
          <View style={styles.counter}>
            <Text style={styles.counterText}>
              {index + 1}/{images.length}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: '100%', height: '100%', backgroundColor: colors.surfaceMuted },

  topLeft: { position: 'absolute', top: spacing.lg, left: spacing.lg },
  topRight: { position: 'absolute', top: spacing.lg, right: spacing.lg },

  // Gradient rather than a flat band: the price sits on the photo, and a
  // hard-edged scrim leaves a visible line across the picture. A fade also
  // keeps the middle of the frame clean.
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  // Taller than `bottomBar` on purpose. The bar hugs its content (the price
  // block), so a scrim sized to it would be ~56pt and the fade would start
  // right at the text. It is allowed to overflow upwards; `bottomBar` does
  // not clip.
  bottomScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 160,
  },

  indicator: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: { backgroundColor: colors.textInverse, width: 18, borderRadius: radii.sm },
  counter: {
    marginLeft: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.42)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  counterText: {
    ...typography.label,
    color: colors.textInverse,
    fontVariant: ['tabular-nums'],
  },
});
