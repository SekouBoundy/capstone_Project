import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useProperty } from '@/hooks/useProperties';
import { useAuthStore } from '@/stores/authStore';
import { VerifiedBadge } from '@/components/shared/VerifiedBadge';

export default function PropertyDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { profile } = useAuthStore();
  const { data: property, isLoading } = useProperty(id);

  if (isLoading || !property) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const isOwner = profile?.id === property.owner_id;

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
          <TouchableOpacity style={styles.contactButton}>
            <Text style={styles.contactButtonText}>
              {property.owner?.role === 'agency' ? t('housing.contactAgency') : t('housing.contactOwner')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imageContainer: { position: 'relative', height: 300 },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: {
    width: '100%', height: '100%', backgroundColor: '#e5e7eb',
    justifyContent: 'center', alignItems: 'center',
  },
  imagePlaceholderText: { color: '#9ca3af', fontSize: 16 },
  backButton: {
    position: 'absolute', top: 60, left: 24,
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
  },
  backButtonText: { color: '#fff', fontSize: 14 },
  content: { padding: 24 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e3a8a', flex: 1 },
  price: { fontSize: 28, fontWeight: 'bold', color: '#2563eb', marginBottom: 8 },
  priceUnit: { fontSize: 16, fontWeight: 'normal', color: '#6b7280' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoText: { fontSize: 14, color: '#6b7280' },
  infoDot: { color: '#d1d5db' },
  location: { fontSize: 14, color: '#6b7280', marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 8 },
  description: { fontSize: 16, color: '#6b7280', lineHeight: 24 },
  amenitiesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: '#eff6ff',
  },
  amenityText: { fontSize: 13, color: '#2563eb' },
  ownerCard: {
    padding: 16, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12,
  },
  ownerName: { fontSize: 16, fontWeight: '600', color: '#374151' },
  ownerUniversity: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  footer: {
    padding: 24, borderTopWidth: 1, borderTopColor: '#e5e7eb',
  },
  contactButton: {
    backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 12, alignItems: 'center',
  },
  contactButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  editButton: {
    backgroundColor: '#f3f4f6', paddingVertical: 16, borderRadius: 12, alignItems: 'center',
  },
  editButtonText: { color: '#374151', fontSize: 16, fontWeight: '600' },
});
