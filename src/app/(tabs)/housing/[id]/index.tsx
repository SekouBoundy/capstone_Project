import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { useProperty } from '@/hooks/useProperties';
import { useStartConversation } from '@/hooks/useConversations';
import { useAuthStore } from '@/stores/authStore';
import { ImageCarousel } from '@/components/housing/ImageCarousel';
import { FavoriteButton } from '@/components/housing/FavoriteButton';
import { PropertyDetailGrid, type DetailItem } from '@/components/housing/PropertyDetailGrid';
import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { formatPrice } from '@/lib/format';
import { openMapForProperty } from '@/lib/maps';
import { colors, spacing, radii, typography, shadow } from '@/theme';
import type { PropertyImage } from '@/types/models';

export default function PropertyDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { t } = useTranslation();
  const { profile } = useAuthStore();
  const { data: property, isLoading } = useProperty(id);
  const startConversation = useStartConversation();

  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  // Declared before the early return below: hooks cannot be called
  // conditionally, and this component bails out while loading.
  const handleContact = useCallback(async () => {
    if (!property?.owner_id) return;
    try {
      const conversationId = await startConversation.mutateAsync({
        listingType: 'property',
        listingId: property.id,
        ownerId: property.owner_id,
      });
      router.push(`/messages/${conversationId}`);
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error instanceof Error ? error.message : t('common.error')
      );
    }
  }, [property, startConversation, router, t]);

  const handleOpenMap = useCallback(async () => {
    if (!property) return;
    try {
      await openMapForProperty(property);
    } catch {
      // `openURL` rejects on a device with no maps app installed. Nothing
      // actionable to offer, so the button is simply a no-op there.
    }
  }, [property]);

  /**
   * The facts grid shows only columns that actually exist on `properties`.
   * `built_in_year`, `parking` and `living_rooms` appear in design mockups
   * but are not in the schema, and rendering them empty would be a lie.
   */
  const details = useMemo<DetailItem[]>(() => {
    if (!property) return [];

    const items: DetailItem[] = [
      { icon: 'bed-outline', value: String(property.rooms), label: t('housing.bedrooms') },
      { icon: 'shower', value: String(property.bathrooms), label: t('housing.bathrooms') },
    ];

    if (property.area_sqm) {
      items.push({ icon: 'ruler-square', value: String(property.area_sqm), label: t('housing.area') });
    }

    items.push({
      icon: 'sofa-outline',
      value: property.furnished ? t('housing.yes') : t('housing.no'),
      label: t('housing.furnishedLabel'),
    });

    if (property.charges) {
      items.push({
        icon: 'cash-multiple',
        value: formatPrice(property.charges, property.currency),
        label: t('housing.charges'),
      });
    }

    if (property.available_from) {
      items.push({
        icon: 'calendar-check-outline',
        value: new Date(property.available_from).toLocaleDateString(undefined, {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        label: t('housing.availableFrom'),
      });
    }

    return items;
  }, [property, t]);

  if (isLoading || !property) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const isOwner = profile?.id === property.owner_id;
  const contacting = startConversation.isPending;
  const images = property.images ?? [];
  const contactLabel =
    property.owner?.role === 'agency' ? t('housing.contactAgency') : t('housing.contactOwner');

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <ImageCarousel
          images={images}
          height={340}
          onPressImage={setViewerIndex}
          topLeft={
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
              style={styles.circleButton}
            >
              <MaterialCommunityIcons name="chevron-left" size={26} color={colors.textInverse} />
            </Pressable>
          }
          topRight={
            isOwner ? undefined : (
              <FavoriteButton listingType="property" listingId={property.id} size={20} />
            )
          }
          bottomLeft={
            <View style={styles.priceOverlay}>
              <Text style={styles.priceOverlayLabel}>{t('housing.rent')}</Text>
              <Text style={styles.priceOverlayValue} numberOfLines={1}>
                {formatPrice(property.price_monthly, property.currency)}
                <Text style={styles.priceOverlayPeriod}> {t('common.perMonth')}</Text>
              </Text>
            </View>
          }
        />

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{property.title}</Text>
            {property.is_verified ? <VerifiedBadge /> : null}
          </View>

          {property.city ? (
            <View style={styles.locationRow}>
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={15}
                color={colors.textMuted}
              />
              <Text style={styles.locationText} numberOfLines={1}>
                {[property.address, property.city].filter(Boolean).join(', ')}
              </Text>
            </View>
          ) : null}

          {!property.available ? (
            <View style={styles.unavailableBanner}>
              <Text style={styles.unavailableBannerText}>{t('common.unavailable')}</Text>
            </View>
          ) : null}

          {images.length > 1 ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('housing.photos')}</Text>
                <Pressable
                  onPress={() => setViewerIndex(0)}
                  hitSlop={8}
                  accessibilityRole="button"
                >
                  <Text style={styles.seeAll}>{t('common.seeAll')}</Text>
                </Pressable>
              </View>

              <FlatList
                horizontal
                data={images}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbRail}
                renderItem={({ item, index: i }) => (
                  <Pressable
                    onPress={() => setViewerIndex(i)}
                    accessibilityRole="button"
                    accessibilityLabel={`${t('housing.photos')} ${i + 1}`}
                  >
                    <Image
                      source={{ uri: item.image_url }}
                      style={styles.thumb}
                      contentFit="cover"
                      transition={150}
                    />
                  </Pressable>
                )}
              />
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('housing.details')}</Text>
            <PropertyDetailGrid items={details} />
          </View>

          {property.amenities?.length ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('housing.amenities')}</Text>
              <View style={styles.amenityWrap}>
                {property.amenities.map((amenity) => (
                  <View key={amenity} style={styles.amenityChip}>
                    <Text style={styles.amenityText}>{t(`housing.amenity.${amenity}`)}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {property.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('housing.description')}</Text>
              <Text style={styles.description}>{property.description}</Text>
            </View>
          ) : null}

          {property.owner ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {property.owner.role === 'agency' ? t('housing.agency') : t('housing.owner')}
              </Text>
              <View style={styles.ownerCard}>
                {property.owner.avatar_url ? (
                  <Image
                    source={{ uri: property.owner.avatar_url }}
                    style={styles.ownerAvatar}
                    contentFit="cover"
                    transition={150}
                  />
                ) : (
                  <View style={[styles.ownerAvatar, styles.ownerAvatarFallback]}>
                    <Text style={styles.ownerInitial}>
                      {(property.owner.full_name?.[0] ?? '?').toUpperCase()}
                    </Text>
                  </View>
                )}

                <View style={styles.ownerInfo}>
                  <Text style={styles.ownerName} numberOfLines={1}>
                    {property.owner.full_name}
                  </Text>
                  <Text style={styles.ownerMeta} numberOfLines={1}>
                    {property.owner.role === 'agency' && property.owner.university
                      ? property.owner.university
                      : t(`role.${property.owner.role}`)}
                  </Text>
                </View>

                {!isOwner ? (
                  <Pressable
                    onPress={handleContact}
                    accessibilityRole="button"
                    accessibilityLabel={contactLabel}
                    style={styles.ownerCall}
                  >
                    <MaterialCommunityIcons
                      name="message-text-outline"
                      size={18}
                      color={colors.text}
                    />
                  </Pressable>
                ) : null}
              </View>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('housing.location')}</Text>
            <View style={styles.mapCard}>
              <View style={styles.mapArt}>
                <MaterialCommunityIcons
                  name="map-marker-outline"
                  size={30}
                  color={colors.textMuted}
                />
              </View>
              <View style={styles.mapInfo}>
                <Text style={styles.mapAddress} numberOfLines={2}>
                  {[property.address, property.city].filter(Boolean).join(', ')}
                </Text>
                {property.latitude && property.longitude ? (
                  <Text style={styles.mapCoords}>
                    {property.latitude.toFixed(4)}, {property.longitude.toFixed(4)}
                  </Text>
                ) : null}
              </View>
            </View>
            <Pressable
              onPress={handleOpenMap}
              accessibilityRole="button"
              accessibilityLabel={t('housing.openInMaps')}
              style={({ pressed }) => [styles.mapButton, pressed && styles.pressed]}
            >
              <MaterialCommunityIcons name="directions" size={18} color={colors.textInverse} />
              <Text style={styles.mapButtonText}>{t('housing.openInMaps')}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.footerPrice}>
          <Text style={styles.footerAmount}>
            {formatPrice(property.price_monthly, property.currency)}
          </Text>
          <Text style={styles.footerPeriod}>{t('common.perMonth')}</Text>
        </View>

        {isOwner ? (
          <Pressable
            onPress={() => router.push(`/housing/${id}/edit`)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.footerButton, pressed && styles.pressed]}
          >
            <Text style={styles.footerButtonText}>{t('housing.editListing')}</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleContact}
            disabled={contacting}
            accessibilityRole="button"
            accessibilityState={{ disabled: contacting }}
            style={({ pressed }) => [styles.footerButton, pressed && styles.pressed]}
          >
            <Text style={styles.footerButtonText}>
              {contacting ? t('common.loading') : contactLabel}
            </Text>
          </Pressable>
        )}
      </View>

      <PhotoViewer
        images={images}
        index={viewerIndex}
        onClose={() => setViewerIndex(null)}
        width={width}
        topInset={insets.top}
      />
    </View>
  );
}

interface PhotoViewerProps {
  images: PropertyImage[];
  index: number | null;
  onClose: () => void;
  width: number;
  topInset: number;
}

/**
 * Full-screen, swipeable photo viewer.
 *
 * `Modal` rather than an in-page overlay: a photo the user opened by
 * tapping "See all" should own the whole display, status bar included, and
 * `Modal` gets the Android hardware back button for free via
 * `onRequestClose`.
 */
function PhotoViewer({ images, index, onClose, width, topInset }: PhotoViewerProps) {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(index ?? 0);

  if (index === null || images.length === 0) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.viewer}>
        <FlatList
          data={images}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          // `getItemLayout` is what makes `initialScrollIndex` land on the
          // tapped photo instead of animating in from the first one.
          initialScrollIndex={index}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onMomentumScrollEnd={(e) =>
            setCurrent(Math.round(e.nativeEvent.contentOffset.x / width))
          }
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <Image
              source={{ uri: item.image_url }}
              style={styles.viewerImage}
              contentFit="contain"
              transition={150}
            />
          )}
        />

        <Pressable
          onPress={onClose}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          style={[styles.viewerClose, { top: topInset + spacing.sm }]}
        >
          <MaterialCommunityIcons name="close" size={24} color={colors.textInverse} />
        </Pressable>

        {images.length > 1 ? (
          <View style={[styles.viewerCounter, { top: topInset + spacing.md }]}>
            <Text style={styles.viewerCounterText}>
              {current + 1} / {images.length}
            </Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  scroll: { paddingBottom: spacing.xxxl },
  body: { paddingHorizontal: spacing.lg },

  circleButton: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  priceOverlay: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  priceOverlayLabel: {
    ...typography.label,
    color: 'rgba(255,255,255,0.9)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  priceOverlayValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textInverse,
    marginTop: 2,
  },
  priceOverlayPeriod: { fontSize: 14, fontWeight: '400' },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  title: { ...typography.title, flexShrink: 1 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  locationText: { ...typography.caption, flexShrink: 1 },

  unavailableBanner: {
    marginTop: spacing.md,
    backgroundColor: colors.dangerBg,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignSelf: 'flex-start',
  },
  unavailableBannerText: {
    ...typography.label,
    color: colors.danger,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  section: { marginTop: spacing.xxl },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.heading, marginBottom: spacing.md },
  seeAll: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },

  thumbRail: { gap: spacing.sm, paddingRight: spacing.lg },
  thumb: { width: 84, height: 64, borderRadius: radii.md, backgroundColor: colors.surfaceMuted },

  amenityWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  amenityChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  amenityText: { ...typography.caption, color: colors.text },

  description: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },

  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ownerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight },
  ownerAvatarFallback: { alignItems: 'center', justifyContent: 'center' },
  ownerInitial: { ...typography.bodyStrong, color: colors.text },
  ownerInfo: { flex: 1 },
  ownerName: { ...typography.bodyStrong },
  ownerMeta: { ...typography.caption, marginTop: 1 },
  ownerCall: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // A schematic stand-in for an embedded map, not a map. Tapping the card
  // opens the platform maps app, which is why it looks like a destination
  // rather than a broken tile.
  mapCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapArt: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapInfo: { flex: 1 },
  mapAddress: { ...typography.caption, color: colors.text },
  mapCoords: { ...typography.label, color: colors.textMuted, marginTop: 2 },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.text,
  },
  mapButtonText: { ...typography.bodyStrong, color: colors.textInverse },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    ...shadow.raised,
  },
  footerPrice: { flex: 1 },
  footerAmount: { ...typography.heading },
  footerPeriod: { ...typography.label, color: colors.textMuted },
  footerButton: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.text,
  },
  footerButtonText: { ...typography.bodyStrong, color: colors.textInverse },
  pressed: { opacity: 0.6 },

  viewer: { flex: 1, backgroundColor: '#000000' },
  viewerImage: { width: '100%', height: '100%' },
  viewerClose: {
    position: 'absolute',
    left: spacing.lg,
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  viewerCounter: {
    position: 'absolute',
    right: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  viewerCounterText: { ...typography.caption, color: colors.textInverse },
});
