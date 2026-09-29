import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PROFILE_PUBLIC_COLUMNS } from '@/lib/profileColumns';
import { useAuthStore } from '@/stores/authStore';
import { UNIVERSITIES } from '@/lib/constants';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToCloudinary } from '@/lib/cloudinary';

export default function EditProfile() {
  const router = useRouter();
  const { t } = useTranslation();
  const { profile, setProfile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    university: '',
    faculty: '',
    year_of_study: '',
    bio: '',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        university: profile.university || '',
        faculty: profile.faculty || '',
        year_of_study: profile.year_of_study || '',
        bio: profile.bio || '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .update(form)
      .eq('id', profile!.id)
      .select(PROFILE_PUBLIC_COLUMNS)
      .single();

    if (!error && data) {
      setProfile(data);
      router.back();
    }
    setLoading(false);
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled) {
      const url = await uploadImageToCloudinary(result.assets[0].uri, 'doucsoft/avatars');
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', profile!.id);
      setProfile({ ...profile!, avatar_url: url });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('account.editProfile')}</Text>
      </View>

      <ScrollView style={styles.content}>
        <TouchableOpacity style={styles.photoSection} onPress={handlePickImage}>
          <Text style={styles.photoText}>{t('account.changePhoto')}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>{t('account.name')}</Text>
        <TextInput
          style={styles.input}
          value={form.full_name}
          onChangeText={(v) => setForm({ ...form, full_name: v })}
          placeholderTextColor="#A1A1A6"
        />

        <Text style={styles.label}>{t('account.phone')}</Text>
        <TextInput
          style={styles.input}
          value={form.phone}
          onChangeText={(v) => setForm({ ...form, phone: v })}
          keyboardType="phone-pad"
          placeholderTextColor="#A1A1A6"
        />

        <Text style={styles.label}>{t('account.university')}</Text>
        <View style={styles.chipContainer}>
          {UNIVERSITIES.map((uni) => (
            <TouchableOpacity
              key={uni}
              style={[styles.chip, form.university === uni && styles.chipActive]}
              onPress={() => setForm({ ...form, university: form.university === uni ? '' : uni })}
            >
              <Text style={[styles.chipText, form.university === uni && styles.chipTextActive]}>{uni}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{t('account.faculty')}</Text>
        <TextInput
          style={styles.input}
          value={form.faculty}
          onChangeText={(v) => setForm({ ...form, faculty: v })}
          placeholderTextColor="#A1A1A6"
        />

        <Text style={styles.label}>{t('account.yearOfStudy')}</Text>
        <TextInput
          style={styles.input}
          value={form.year_of_study}
          onChangeText={(v) => setForm({ ...form, year_of_study: v })}
          placeholderTextColor="#A1A1A6"
        />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.disabledButton]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>{t('common.save')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16 },
  backButton: { fontSize: 16, color: '#000000', fontWeight: '500', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#000000' },
  content: { flex: 1, paddingHorizontal: 24 },
  photoSection: { alignItems: 'center', paddingVertical: 24 },
  photoText: { color: '#000000', fontSize: 14, fontWeight: '500' },
  label: { fontSize: 14, fontWeight: '600', color: '#000000', marginTop: 16, marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#000000', backgroundColor: '#F2F2F7',
  },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    borderWidth: 1, borderColor: '#E5E5EA', backgroundColor: '#FFFFFF',
  },
  chipActive: { borderColor: '#000000', backgroundColor: '#F2F2F7' },
  chipText: { fontSize: 13, color: '#000000' },
  chipTextActive: { color: '#000000', fontWeight: '500' },
  footer: { padding: 24, borderTopWidth: 1, borderTopColor: '#E5E5EA' },
  saveButton: {
    backgroundColor: '#000000', paddingVertical: 16, borderRadius: 12, alignItems: 'center',
  },
  disabledButton: { opacity: 0.6 },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
