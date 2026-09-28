import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useProduct } from '@/hooks/useProducts';
import { useAuthStore } from '@/stores/authStore';

export default function ProductDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { profile } = useAuthStore();
  const { data: product, isLoading } = useProduct(id);

  if (isLoading || !product) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const isSeller = profile?.id === product.seller_id;

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.imageContainer}>
          {product.image_urls[0] ? (
            <Image source={{ uri: product.image_urls[0] }} style={styles.image} />
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
          <Text style={styles.title}>{product.title}</Text>
          <Text style={styles.price}>€{product.price}</Text>

          <View style={styles.infoRow}>
            <View style={styles.conditionChip}>
              <Text style={styles.conditionText}>{t(`marketplace.${product.condition === 'like_new' ? 'likeNew' : product.condition}`)}</Text>
            </View>
            <Text style={styles.category}>{t(`marketplace.${product.category}`)}</Text>
          </View>

          {product.city && (
            <Text style={styles.location}>{product.city}</Text>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('housing.description')}</Text>
            <Text style={styles.description}>{product.description || 'No description'}</Text>
          </View>

          {product.seller && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('marketplace.seller')}</Text>
              <View style={styles.sellerCard}>
                <Text style={styles.sellerName}>{product.seller.full_name}</Text>
                {product.seller.university && (
                  <Text style={styles.sellerUniversity}>{product.seller.university}</Text>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {isSeller ? (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push(`/marketplace/${id}/edit`)}
          >
            <Text style={styles.editButtonText}>{t('housing.editListing')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.contactButton}>
            <Text style={styles.contactButtonText}>{t('marketplace.contactSeller')}</Text>
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
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 8 },
  price: { fontSize: 28, fontWeight: 'bold', color: '#2563eb', marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  conditionChip: {
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: '#eff6ff',
  },
  conditionText: { fontSize: 13, color: '#2563eb' },
  category: { fontSize: 14, color: '#6b7280' },
  location: { fontSize: 14, color: '#6b7280', marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 8 },
  description: { fontSize: 16, color: '#6b7280', lineHeight: 24 },
  sellerCard: { padding: 16, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12 },
  sellerName: { fontSize: 16, fontWeight: '600', color: '#374151' },
  sellerUniversity: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  footer: { padding: 24, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  contactButton: {
    backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 12, alignItems: 'center',
  },
  contactButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  editButton: {
    backgroundColor: '#f3f4f6', paddingVertical: 16, borderRadius: 12, alignItems: 'center',
  },
  editButtonText: { color: '#374151', fontSize: 16, fontWeight: '600' },
});
