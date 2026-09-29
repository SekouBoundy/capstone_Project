import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PROFILE_PUBLIC_COLUMNS } from '@/lib/profileColumns';
import { useAuthStore } from '@/stores/authStore';
import { UNIVERSITIES } from '@/lib/constants';

export default function Onboarding() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, profile, setProfile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    university: profile?.university || '',
    faculty: profile?.faculty || '',
    year_of_study: profile?.year_of_study || '',
  });

  const handleSave = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .update(form)
      .eq('id', user!.id)
      .select(PROFILE_PUBLIC_COLUMNS)
      .single();

    if (!error && data) {
      setProfile(data);
      router.replace('/housing');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('onboarding.title')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.subtitle')}</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.label}>{t('onboarding.fullName')}</Text>
        <TextInput
          style={styles.input}
          value={form.full_name}
          onChangeText={(v) => setForm({ ...form, full_name: v })}
          placeholderTextColor="#A1A1A6"
        />

        <Text style={styles.label}>{t('onboarding.phone')}</Text>
        <TextInput
          style={styles.input}
          value={form.phone}
          onChangeText={(v) => setForm({ ...form, phone: v })}
          keyboardType="phone-pad"
          placeholderTextColor="#A1A1A6"
        />

        <Text style={styles.label}>{t('onboarding.university')}</Text>
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

        <Text style={styles.label}>{t('onboarding.faculty')}</Text>
        <TextInput
          style={styles.input}
          value={form.faculty}
          onChangeText={(v) => setForm({ ...form, faculty: v })}
          placeholderTextColor="#A1A1A6"
        />

        <Text style={styles.label}>{t('onboarding.yearOfStudy')}</Text>
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
            <Text style={styles.saveButtonText}>{t('common.done')}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipButton} onPress={() => router.replace('/housing')}>
          <Text style={styles.skipButtonText}>{t('onboarding.skip')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#000000' },
  subtitle: { fontSize: 14, color: '#6E6E73', marginTop: 4 },
  content: { flex: 1, paddingHorizontal: 24 },
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
  skipButton: { paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  skipButtonText: { color: '#6E6E73', fontSize: 14 },
});
