import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAdminReports } from '@/hooks/useAdmin';

export default function AdminReports() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: reports, isLoading } = useAdminReports();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('admin.reports')}</Text>
      </View>

      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemReason}>{item.reason}</Text>
              <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
            </View>
            <View style={[styles.statusBadge, item.status === 'open' ? styles.open : styles.investigating]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16 },
  backButton: { fontSize: 16, color: '#000000', fontWeight: '500', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#000000' },
  item: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24,
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F2F2F7',
  },
  itemInfo: { flex: 1 },
  itemReason: { fontSize: 16, fontWeight: '600', color: '#000000' },
  itemDesc: { fontSize: 13, color: '#6E6E73', marginTop: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  open: { backgroundColor: '#FFE9E7' },
  investigating: { backgroundColor: '#FFF4E5' },
  statusText: { fontSize: 12, fontWeight: '500', color: '#000000' },
});
