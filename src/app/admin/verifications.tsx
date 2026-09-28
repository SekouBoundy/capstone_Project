import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAdminVerifications } from '@/hooks/useAdmin';

export default function AdminVerifications() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: verifications, isLoading } = useAdminVerifications();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('admin.verifications')}</Text>
      </View>

      <FlatList
        data={verifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>
                {item.agency_name || item.profile?.full_name || 'Unknown'}
              </Text>
              <Text style={styles.itemType}>{item.role_type}</Text>
            </View>
            <View style={[styles.statusBadge, item.status === 'approved' ? styles.approved : item.status === 'rejected' ? styles.rejected : styles.pending]}>
              <Text style={styles.statusText}>{t(`common.${item.status}`)}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16 },
  backButton: { fontSize: 16, color: '#2563eb', fontWeight: '500', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e3a8a' },
  item: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24,
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '600', color: '#374151' },
  itemType: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  approved: { backgroundColor: '#d1fae5' },
  rejected: { backgroundColor: '#fee2e2' },
  pending: { backgroundColor: '#fef3c7' },
  statusText: { fontSize: 12, fontWeight: '500', color: '#374151' },
});
