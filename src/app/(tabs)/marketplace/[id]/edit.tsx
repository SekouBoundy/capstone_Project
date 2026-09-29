import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useProduct } from '@/hooks/useProducts';
import { PRODUCT_CATEGORIES, PRODUCT_CONDITIONS, CITIES } from '@/lib/constants';

export default function EditProduct() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { data: product, isLoading } = useProduct(id);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'furniture' as any,
    price: '',
    condition: 'good' as any,
    city: '',
  });

  useEffect(() => {
    if (product) {
      setForm({
        title: product.title,
        description: product.description || '',
        category: product.category,
        price: product.price.toString(),
        condition: product.condition,
        city: product.city || '',
      });
    }
  }, [product]);

  const handleSubmit = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('products')
      .update({
        title: form.title,
        description: form.description,
        category: form.category,
        price: Number(form.price),
        condition: form.condition,
        city: form.city || null,
      })
      .eq('id', id);
    setLoading(false);
    if (!error) router.back();
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('marketplace.editListingTitle')}</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.label}>{t('marketplace.itemTitle')}</Text>
        <TextInput
          style={styles.input}
          value={form.title}
          onChangeText={(v) => setForm({ ...form, title: v })}
          placeholderTextColor="#A1A1A6"
        />

        <Text style={styles.label}>{t('housing.description')}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.description}
          onChangeText={(v) => setForm({ ...form, description: v })}
          multiline
          numberOfLines={4}
          placeholderTextColor="#A1A1A6"
        />

        <Text style={styles.label}>{t('marketplace.category')}</Text>
        <View style={styles.chipContainer}>
          {PRODUCT_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              style={[styles.chip, form.category === cat.value && styles.chipActive]}
              onPress={() => setForm({ ...form, category: cat.value as any })}
            >
              <Text style={[styles.chipText, form.category === cat.value && styles.chipTextActive]}>
                {t(cat.labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{t('marketplace.condition')}</Text>
        <View style={styles.chipContainer}>
          {PRODUCT_CONDITIONS.map((cond) => (
            <TouchableOpacity
              key={cond.value}
              style={[styles.chip, form.condition === cond.value && styles.chipActive]}
              onPress={() => setForm({ ...form, condition: cond.value as any })}
            >
              <Text style={[styles.chipText, form.condition === cond.value && styles.chipTextActive]}>
                {t(cond.labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{t('marketplace.itemPrice')}</Text>
        <TextInput
          style={styles.input}
          value={form.price}
          onChangeText={(v) => setForm({ ...form, price: v })}
          keyboardType="numeric"
          placeholderTextColor="#A1A1A6"
        />

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
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>{t('common.save')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16 },
  backButton: { fontSize: 16, color: '#000000', fontWeight: '500', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#000000' },
  content: { flex: 1, paddingHorizontal: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#000000', marginTop: 16, marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#000000', backgroundColor: '#F2F2F7',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: '#E5E5EA', backgroundColor: '#FFFFFF',
  },
  chipActive: { borderColor: '#000000', backgroundColor: '#F2F2F7' },
  chipText: { fontSize: 14, color: '#000000' },
  chipTextActive: { color: '#000000', fontWeight: '500' },
  footer: { padding: 24, borderTopWidth: 1, borderTopColor: '#E5E5EA' },
  submitButton: {
    backgroundColor: '#000000', paddingVertical: 16, borderRadius: 12, alignItems: 'center',
  },
  disabledButton: { opacity: 0.6 },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
