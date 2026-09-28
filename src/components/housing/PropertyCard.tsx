import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Property } from '@/types/models';
import { VerifiedBadge } from '@/components/shared/VerifiedBadge';

interface PropertyCardProps {
  property: Property;
  onPress: () => void;
}

export function PropertyCard({ property, onPress }: PropertyCardProps) {
  const mainImage = property.images?.[0]?.image_url;

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
        {property.is_verified && (
          <View style={styles.badgeContainer}>
            <VerifiedBadge />
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{property.title}</Text>
        <Text style={styles.price}>
          €{property.price_monthly}
          <Text style={styles.priceUnit}>/month</Text>
        </Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoText}>{property.rooms} rooms</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.infoText}>{property.bathrooms} baths</Text>
          {property.area_sqm && (
            <>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.infoText}>{property.area_sqm} m²</Text>
            </>
          )}
        </View>
        {property.city && (
          <Text style={styles.location}>{property.city}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 180,
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
  placeholderText: { color: '#9ca3af', fontSize: 14 },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  priceUnit: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#6b7280',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  infoText: { fontSize: 13, color: '#6b7280' },
  dot: { color: '#d1d5db' },
  location: { fontSize: 13, color: '#9ca3af' },
});
