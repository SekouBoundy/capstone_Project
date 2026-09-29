import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function AdminDashboard() {
  const router = useRouter();
  const { t } = useTranslation();

  const stats = [
    { label: t('admin.totalUsers'), value: '0', icon: '👥' },
    { label: t('admin.totalProperties'), value: '0', icon: '🏠' },
    { label: t('admin.totalProducts'), value: '0', icon: '📦' },
    { label: t('admin.pendingVerifications'), value: '0', icon: '✅' },
    { label: t('admin.openReports'), value: '0', icon: '🚩' },
  ];

  const menuItems = [
    { label: t('admin.users'), route: '/admin/users', icon: '👥' },
    { label: t('admin.verifications'), route: '/admin/verifications', icon: '✅' },
    { label: t('admin.reports'), route: '/admin/reports', icon: '🚩' },
    { label: t('admin.moderation'), route: '/admin/moderation', icon: '🛡️' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('admin.dashboard')}</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#000000' },
  content: { flex: 1, paddingHorizontal: 24 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: {
    width: '47%', padding: 16, backgroundColor: '#F2F2F7', borderRadius: 12, alignItems: 'center',
  },
  statIcon: { fontSize: 24, marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#000000' },
  statLabel: { fontSize: 12, color: '#6E6E73', marginTop: 4, textAlign: 'center' },
  menu: { gap: 0 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#F2F2F7',
  },
  menuIcon: { fontSize: 20, marginRight: 12 },
  menuLabel: { flex: 1, fontSize: 16, color: '#000000' },
  menuArrow: { fontSize: 20, color: '#A1A1A6' },
});
