import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToCloudinary } from '@/lib/cloudinary';

export default function Verification() {
  const router = useRouter();
  const { t } = useTranslation();
  const { profile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    id_document_url: '',
    agency_name: '',
    business_reg_url: '',
    contact_person: '',
  });

  const isAgency = profile?.role === 'agency';
  const isOwner = profile?.role === 'owner';
  const canApply = isOwner || isAgency;

  const handlePickDocument = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled) {
      const url = await uploadImageToCloudinary(result.assets[0].uri, 'doucsoft/verification');
      setForm({ ...form, id_document_url: url });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    const { error } = await supabase.from('verification_requests').insert({
      profile_id: profile!.id,
      role_type: isAgency ? 'agency' : 'owner',
      id_document_url: form.id_document_url || null,
      agency_name: form.agency_name || null,
      business_reg_url: form.business_reg_url || null,
      contact_person: form.contact_person || null,
    });
    setLoading(false);
    if (!error) {
      router.back();
    }
  };

  if (!canApply) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>{t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('account.verificationTitle')}</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('account.verificationSubtitle')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('account.verificationTitle')}</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>{t('account.verificationStatus')}</Text>

        {isAgency && (
          <>
            <Text style={styles.label}>{t('account.agencyName')}</Text>
            <TextInput
              style={styles.input}
              value={form.agency_name}
              onChangeText={(v) => setForm({ ...form, agency_name: v })}
              placeholderTextColor="#9ca3af"
            />

            <Text style={styles.label}>{t('account.contactPerson')}</Text>
            <TextInput
              style={styles.input}
              value={form.contact_person}
              onChangeText={(v) => setForm({ ...form, contact_person: v })}
              placeholderTextColor="#9ca3af"
            />

            <Text style={styles.label}>{t('account.uploadBusinessReg')}</Text>
            <TouchableOpacity style={styles.uploadButton} onPress={handlePickDocument}>
              <Text style={styles.uploadButtonText}>
                {form.business_reg_url ? '✓ Uploaded' : t('account.uploadBusinessReg')}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <Text style={styles.label}>{t('account.uploadId')}</Text>
        <TouchableOpacity style={styles.uploadButton} onPress={handlePickDocument}>
          <Text style={styles.uploadButtonText}>
            {form.id_document_url ? '✓ Uploaded' : t('account.uploadId')}
          </Text>
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
            <Text style={styles.submitButtonText}>{t('account.submitVerification')}</Text>
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
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 16, marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#374151', backgroundColor: '#f9fafb',
  },
  uploadButton: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, borderStyle: 'dashed',
    paddingVertical: 24, alignItems: 'center',
  },
  uploadButtonText: { color: '#2563eb', fontSize: 14, fontWeight: '500' },
  footer: { padding: 24, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  submitButton: {
    backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 12, alignItems: 'center',
  },
  disabledButton: { opacity: 0.6 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#6b7280', textAlign: 'center' },
});
