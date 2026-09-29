import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useProduct } from '@/hooks/useProducts';
import { useStartConversation } from '@/hooks/useConversations';
import { useAuthStore } from '@/stores/authStore';

export default function ProductDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { profile } = useAuthStore();
  const { data: product, isLoading } = useProduct(id);
  const startConversation = useStartConversation();

  // Declared before the early return below: hooks cannot be called
  // conditionally, and this component bails out while loading.
  const handleContact = async () => {
    if (!product?.seller_id) return;
    try {
      const conversationId = await startConversation.mutateAsync({
        listingType: 'product',
        listingId: product.id,
        ownerId: product.seller_id,
      });
      router.push(`/messages/${conversationId}`);
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error instanceof Error ? error.message : t('common.error')
      );
    }
  };

  if (isLoading || !product) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const isSeller = profile?.id === product.seller_id;
  const contacting = startConversation.isPending;

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
          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleContact}
            disabled={contacting}
          >
            <Text style={styles.contactButtonText}>
              {contacting ? t('common.loading') : t('marketplace.contactSeller')}
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
  title: { fontSize: 24, fontWeight: 'bold', color: '#000000', marginBottom: 8 },
  price: { fontSize: 28, fontWeight: 'bold', color: '#000000', marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  conditionChip: {
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: '#F2F2F7',
  },
  conditionText: { fontSize: 13, color: '#000000' },
  category: { fontSize: 14, color: '#6E6E73' },
  location: { fontSize: 14, color: '#6E6E73', marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#000000', marginBottom: 8 },
  description: { fontSize: 16, color: '#6E6E73', lineHeight: 24 },
  sellerCard: { padding: 16, borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 12 },
  sellerName: { fontSize: 16, fontWeight: '600', color: '#000000' },
  sellerUniversity: { fontSize: 14, color: '#6E6E73', marginTop: 4 },
  footer: { padding: 24, borderTopWidth: 1, borderTopColor: '#E5E5EA' },
  contactButton: {
    backgroundColor: '#000000', paddingVertical: 16, borderRadius: 12, alignItems: 'center',
  },
  contactButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  editButton: {
    backgroundColor: '#F2F2F7', paddingVertical: 16, borderRadius: 12, alignItems: 'center',
  },
  editButtonText: { color: '#000000', fontSize: 16, fontWeight: '600' },
});
