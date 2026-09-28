import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';

export default function AccountScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { profile, user, signOut } = useAuthStore();

  const menuItems = [
    { label: t('account.editProfile'), route: '/account/edit', icon: '✏️' },
    { label: t('account.listings'), route: '/account/listings', icon: '🏠' },
    { label: t('account.products'), route: '/account/products', icon: '📦' },
    { label: t('account.favorites'), route: '/account/favorites', icon: '❤️' },
    { label: t('account.verification'), route: '/account/verification', icon: '✅' },
    { label: t('account.settings'), route: '/account/settings', icon: '⚙️' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>{t('account.title')}</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {profile?.full_name?.[0] || '?'}
              </Text>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile?.full_name || 'User'}</Text>
            <Text style={styles.profileEmail}>{user?.email || ''}</Text>
            {profile?.university && (
              <Text style={styles.profileUniversity}>{profile.university}</Text>
            )}
          </View>
        </View>

        <View style={styles.menu}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.route}
              style={styles.menuItem}
              onPress={() => router.push(item.route as any)}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <Text style={styles.logoutText}>{t('auth.logout')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1e3a8a' },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24,
    paddingVertical: 16, marginHorizontal: 24, marginBottom: 16,
    backgroundColor: '#f9fafb', borderRadius: 16,
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#eff6ff',
    justifyContent: 'center', alignItems: 'center', marginRight: 16,
  },
  avatarImage: { width: 64, height: 64, borderRadius: 32 },
  avatarText: { fontSize: 24, fontWeight: '600', color: '#2563eb' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '600', color: '#374151' },
  profileEmail: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  profileUniversity: { fontSize: 13, color: '#9ca3af', marginTop: 2 },
  menu: { paddingHorizontal: 24 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  menuIcon: { fontSize: 20, marginRight: 12 },
  menuLabel: { flex: 1, fontSize: 16, color: '#374151' },
  menuArrow: { fontSize: 20, color: '#9ca3af' },
  logoutButton: {
    marginHorizontal: 24, marginTop: 24, marginBottom: 48,
    paddingVertical: 16, borderRadius: 12, borderWidth: 1,
    borderColor: '#fecaca', alignItems: 'center',
  },
  logoutText: { color: '#ef4444', fontSize: 16, fontWeight: '600' },
});
