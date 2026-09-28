import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Product } from '@/types/models';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
}

export function ProductCard({ product, onPress }: ProductCardProps) {
  const mainImage = product.image_urls?.[0];

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.imageContainer}>
        {mainImage ? (
          <Image source={{ uri: mainImage }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>No image</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{product.title}</Text>
        <Text style={styles.price}>€{product.price}</Text>
        <View style={styles.infoRow}>
          <Text style={styles.condition}>{product.condition.replace('_', ' ')}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.category}>{product.category}</Text>
        </View>
        {product.city && (
          <Text style={styles.location}>{product.city}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  imageContainer: {
    height: 120,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: { color: '#9ca3af', fontSize: 12 },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  condition: { fontSize: 12, color: '#6b7280' },
  dot: { color: '#d1d5db' },
  category: { fontSize: 12, color: '#6b7280' },
  location: { fontSize: 12, color: '#9ca3af' },
});
