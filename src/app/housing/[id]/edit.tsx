import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useProperty } from '@/hooks/useProperties';

export default function EditHousing() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { data: property, isLoading } = useProperty(id);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price_monthly: '',
    available: true,
  });

  useEffect(() => {
    if (property) {
      setForm({
        title: property.title,
        description: property.description || '',
        price_monthly: property.price_monthly.toString(),
        available: property.available,
      });
    }
  }, [property]);

  const handleSubmit = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('properties')
      .update({
        title: form.title,
        description: form.description,
        price_monthly: Number(form.price_monthly),
        available: form.available,
      })
      .eq('id', id);
    setLoading(false);

    if (!error) {
      router.back();
    }
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
        <Text style={styles.title}>{t('housing.editListingTitle')}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>{t('housing.title')}</Text>
        <TextInput
          style={styles.input}
          value={form.title}
          onChangeText={(v) => setForm({ ...form, title: v })}
          placeholderTextColor="#9ca3af"
        />

        <Text style={styles.label}>{t('housing.description')}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.description}
          onChangeText={(v) => setForm({ ...form, description: v })}
          multiline
          numberOfLines={4}
          placeholderTextColor="#9ca3af"
        />

        <Text style={styles.label}>{t('housing.price')}</Text>
        <TextInput
          style={styles.input}
          value={form.price_monthly}
          onChangeText={(v) => setForm({ ...form, price_monthly: v })}
          keyboardType="numeric"
          placeholderTextColor="#9ca3af"
        />

        <TouchableOpacity
          style={styles.toggleRow}
          onPress={() => setForm({ ...form, available: !form.available })}
        >
          <Text style={styles.toggleLabel}>{t('housing.available')}</Text>
          <View style={[styles.toggle, form.available && styles.toggleActive]}>
            <View style={[styles.toggleThumb, form.available && styles.toggleThumbActive]} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>{t('common.save')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 24, paddingVertical: 12,
  },
  toggleLabel: { fontSize: 16, color: '#374151' },
  toggle: {
    width: 48, height: 28, borderRadius: 14, backgroundColor: '#e5e7eb',
    justifyContent: 'center', paddingHorizontal: 2,
  },
  toggleActive: { backgroundColor: '#2563eb' },
  toggleThumb: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff',
  },
  toggleThumbActive: { alignSelf: 'flex-end' },
  footer: { padding: 24, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  submitButton: {
    backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 12, alignItems: 'center',
  },
  disabledButton: { opacity: 0.6 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
