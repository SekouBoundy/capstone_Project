import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { PROPERTY_TYPES, AMENITIES, CITIES } from '@/lib/constants';
import { propertySchema } from '@/lib/validation';
import * as ImagePicker from 'expo-image-picker';
import { uploadMultipleImages } from '@/lib/cloudinary';

export default function NewHousing() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    property_type: 'apartment' as const,
    price_monthly: '',
    charges: '',
    rooms: '1',
    bathrooms: '1',
    area_sqm: '',
    furnished: false,
    amenities: [] as string[],
    address: '',
    city: '',
    available_from: '',
  });
  const [images, setImages] = useState<string[]>([]);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setImages([...images, ...result.assets.map((a) => a.uri)]);
    }
  };

  const handleSubmit = async () => {
    try {
      const validated = propertySchema.parse({
        ...form,
        price_monthly: Number(form.price_monthly),
        charges: form.charges ? Number(form.charges) : undefined,
        rooms: Number(form.rooms),
        bathrooms: Number(form.bathrooms),
        area_sqm: form.area_sqm ? Number(form.area_sqm) : undefined,
      });

      setLoading(true);

      // Upload images
      const imageUrls = images.length > 0 ? await uploadMultipleImages(images, 'doucsoft/housing') : [];

      const { data: property, error } = await supabase
        .from('properties')
        .insert({ ...validated, owner_id: user!.id, status: 'published' })
        .select()
        .single();

      if (error) throw error;

      if (imageUrls.length > 0) {
        await supabase.from('property_images').insert(
          imageUrls.map((url, i) => ({ property_id: property.id, image_url: url, sort_order: i }))
        );
      }

      setLoading(false);
      router.replace(`/housing/${property.id}`);
    } catch (error: any) {
      setLoading(false);
      Alert.alert(t('common.error'), error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('housing.createListing')}</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.label}>{t('housing.title')}</Text>
        <TextInput
          style={styles.input}
          value={form.title}
          onChangeText={(v) => setForm({ ...form, title: v })}
          placeholder="e.g. 2BR Apartment near EMU"
          placeholderTextColor="#9ca3af"
        />

        <Text style={styles.label}>{t('housing.description')}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.description}
          onChangeText={(v) => setForm({ ...form, description: v })}
          placeholder="Describe the property..."
          multiline
          numberOfLines={4}
          placeholderTextColor="#9ca3af"
        />

        <Text style={styles.label}>{t('housing.propertyTypeLabel')}</Text>
        <View style={styles.chipContainer}>
          {PROPERTY_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[styles.chip, form.property_type === type.value && styles.chipActive]}
              onPress={() => setForm({ ...form, property_type: type.value as any })}
            >
              <Text style={[styles.chipText, form.property_type === type.value && styles.chipTextActive]}>
                {t(type.labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>{t('housing.price')}</Text>
            <TextInput
              style={styles.input}
              value={form.price_monthly}
              onChangeText={(v) => setForm({ ...form, price_monthly: v })}
              keyboardType="numeric"
              placeholder="500"
              placeholderTextColor="#9ca3af"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>{t('housing.charges')}</Text>
            <TextInput
              style={styles.input}
              value={form.charges}
              onChangeText={(v) => setForm({ ...form, charges: v })}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>{t('housing.rooms')}</Text>
            <TextInput
              style={styles.input}
              value={form.rooms}
              onChangeText={(v) => setForm({ ...form, rooms: v })}
              keyboardType="numeric"
              placeholderTextColor="#9ca3af"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>{t('housing.bathrooms')}</Text>
            <TextInput
              style={styles.input}
              value={form.bathrooms}
              onChangeText={(v) => setForm({ ...form, bathrooms: v })}
              keyboardType="numeric"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        <Text style={styles.label}>{t('housing.city')}</Text>
        <View style={styles.chipContainer}>
          {CITIES.map((city) => (
            <TouchableOpacity
              key={city}
              style={[styles.chip, form.city === city && styles.chipActive]}
              onPress={() => setForm({ ...form, city: form.city === city ? '' : city })}
            >
              <Text style={[styles.chipText, form.city === city && styles.chipTextActive]}>{city}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{t('housing.photos')}</Text>
        <TouchableOpacity style={styles.photoButton} onPress={pickImages}>
          <Text style={styles.photoButtonText}>{t('housing.addPhotos')} ({images.length}/10)</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>{t('housing.createListing')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16 },
  backButton: { fontSize: 16, color: '#2563eb', fontWeight: '500', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e3a8a' },
  content: { flex: 1, paddingHorizontal: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 16, marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#374151', backgroundColor: '#f9fafb',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff',
  },
  chipActive: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  chipText: { fontSize: 14, color: '#374151' },
  chipTextActive: { color: '#2563eb', fontWeight: '500' },
  photoButton: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, borderStyle: 'dashed',
    paddingVertical: 24, alignItems: 'center',
  },
  photoButtonText: { color: '#2563eb', fontSize: 14, fontWeight: '500' },
  footer: { padding: 24, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  submitButton: {
    backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 12, alignItems: 'center',
  },
  disabledButton: { opacity: 0.6 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
