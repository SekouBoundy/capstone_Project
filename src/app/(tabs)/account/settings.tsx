import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useLocaleStore } from '@/stores/localeStore';
import { useAuthStore } from '@/stores/authStore';
import { i18n } from '@/i18n';
import { I18nManager } from 'react-native';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'ar', label: 'العربية' },
];

export default function Settings() {
  const router = useRouter();
  const { t } = useTranslation();
  const { locale, setLocale } = useLocaleStore();
  const { profile } = useAuthStore();

  const handleLanguageChange = (newLocale: 'en' | 'fr' | 'tr' | 'ar') => {
    setLocale(newLocale);
    i18n.changeLanguage(newLocale);
    I18nManager.forceRTL(newLocale === 'ar');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('account.settings')}</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>{t('account.language')}</Text>
        <View style={styles.languageContainer}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[styles.languageButton, locale === lang.code && styles.languageButtonActive]}
              onPress={() => handleLanguageChange(lang.code as any)}
            >
              <Text style={[styles.languageLabel, locale === lang.code && styles.languageLabelActive]}>
                {lang.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{t('account.notifications')}</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>{t('account.pushNotifications')}</Text>
          <Text style={styles.settingValue}>On</Text>
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>{t('account.emailNotifications')}</Text>
          <Text style={styles.settingValue}>On</Text>
        </View>

        <Text style={styles.sectionTitle}>{t('account.dangerZone')}</Text>
        <TouchableOpacity style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>{t('account.deleteAccount')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16 },
  backButton: { fontSize: 16, color: '#000000', fontWeight: '500', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#000000' },
  content: { flex: 1, paddingHorizontal: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#000000', marginTop: 24, marginBottom: 12 },
  languageContainer: { gap: 8 },
  languageButton: {
    padding: 16, borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 12,
  },
  languageButtonActive: { borderColor: '#000000', backgroundColor: '#F2F2F7' },
  languageLabel: { fontSize: 16, color: '#000000' },
  languageLabelActive: { color: '#000000', fontWeight: '500' },
  settingItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F2F2F7',
  },
  settingLabel: { fontSize: 16, color: '#000000' },
  settingValue: { fontSize: 14, color: '#6E6E73' },
  deleteButton: {
    paddingVertical: 16, borderRadius: 12, borderWidth: 1,
    borderColor: '#FFC7C4', alignItems: 'center', marginTop: 8,
  },
  deleteButtonText: { color: '#FF3B30', fontSize: 16, fontWeight: '600' },
});
