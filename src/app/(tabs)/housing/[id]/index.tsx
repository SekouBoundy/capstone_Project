import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useProperty } from '@/hooks/useProperties';
import { useStartConversation } from '@/hooks/useConversations';
import { useAuthStore } from '@/stores/authStore';
import { VerifiedBadge } from '@/components/shared/VerifiedBadge';

export default function PropertyDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { profile } = useAuthStore();
  const { data: property, isLoading } = useProperty(id);
  const startConversation = useStartConversation();

  // Declared before the early return below: hooks cannot be called
  // conditionally, and this component bails out while loading.
  const handleContact = async () => {
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
  };

  if (isLoading || !property) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const isOwner = profile?.id === property.owner_id;
  const contacting = startConversation.isPending;

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.imageContainer}>
          {property.images?.[0] ? (
            <Image source={{ uri: property.images[0].image_url }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>No image</Text>
            </View>
          )}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>{t('common.back')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{property.title}</Text>
            {property.is_verified && <VerifiedBadge />}
          </View>

          <Text style={styles.price}>
            €{property.price_monthly}
            <Text style={styles.priceUnit}>{t('common.perMonth')}</Text>
          </Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoText}>{property.rooms} {t('common.rooms')}</Text>
            <Text style={styles.infoDot}>·</Text>
            <Text style={styles.infoText}>{property.bathrooms} {t('common.bathrooms')}</Text>
            {property.area_sqm && (
              <>
                <Text style={styles.infoDot}>·</Text>
                <Text style={styles.infoText}>{property.area_sqm} {t('common.area')}</Text>
              </>
            )}
          </View>

          {property.city && (
            <Text style={styles.location}>{property.city}{property.address ? `, ${property.address}` : ''}</Text>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('housing.description')}</Text>
            <Text style={styles.description}>{property.description || 'No description'}</Text>
          </View>

          {property.amenities.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('housing.amenities')}</Text>
              <View style={styles.amenitiesContainer}>
                {property.amenities.map((amenity) => (
                  <View key={amenity} style={styles.amenityChip}>
                    <Text style={styles.amenityText}>{amenity}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {property.owner && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{property.owner.role === 'agency' ? t('housing.contactAgency') : t('housing.contactOwner')}</Text>
              <View style={styles.ownerCard}>
                <Text style={styles.ownerName}>{property.owner.full_name}</Text>
                {property.owner.university && (
                  <Text style={styles.ownerUniversity}>{property.owner.university}</Text>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {isOwner ? (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push(`/housing/${id}/edit`)}
          >
            <Text style={styles.editButtonText}>{t('housing.editListing')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleContact}
            disabled={contacting}
          >
            <Text style={styles.contactButtonText}>
              {contacting
                ? t('common.loading')
                : property.owner?.role === 'agency'
                  ? t('housing.contactAgency')
                  : t('housing.contactOwner')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imageContainer: { position: 'relative', height: 300 },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: {
    width: '100%', height: '100%', backgroundColor: '#E5E5EA',
    justifyContent: 'center', alignItems: 'center',
  },
  imagePlaceholderText: { color: '#A1A1A6', fontSize: 16 },
  backButton: {
    position: 'absolute', top: 60, left: 24,
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
  },
  backButtonText: { color: '#FFFFFF', fontSize: 14 },
  content: { padding: 24 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#000000', flex: 1 },
  price: { fontSize: 28, fontWeight: 'bold', color: '#000000', marginBottom: 8 },
  priceUnit: { fontSize: 16, fontWeight: 'normal', color: '#6E6E73' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoText: { fontSize: 14, color: '#6E6E73' },
  infoDot: { color: '#C7C7CC' },
  location: { fontSize: 14, color: '#6E6E73', marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#000000', marginBottom: 8 },
  description: { fontSize: 16, color: '#6E6E73', lineHeight: 24 },
  amenitiesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: '#F2F2F7',
  },
  amenityText: { fontSize: 13, color: '#000000' },
  ownerCard: {
    padding: 16, borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 12,
  },
  ownerName: { fontSize: 16, fontWeight: '600', color: '#000000' },
  ownerUniversity: { fontSize: 14, color: '#6E6E73', marginTop: 4 },
  footer: {
    padding: 24, borderTopWidth: 1, borderTopColor: '#E5E5EA',
  },
  contactButton: {
    backgroundColor: '#000000', paddingVertical: 16, borderRadius: 12, alignItems: 'center',
  },
  contactButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  editButton: {
    backgroundColor: '#F2F2F7', paddingVertical: 16, borderRadius: 12, alignItems: 'center',
  },
  editButtonText: { color: '#000000', fontSize: 16, fontWeight: '600' },
});
