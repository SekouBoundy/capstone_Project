import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useAdminUsers } from '@/hooks/useAdmin';

export default function AdminUsers() {
  const router = useRouter();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const { data: users, isLoading } = useAdminUsers(search);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('admin.users')}</Text>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder={t('admin.searchUsers')}
        value={search}
        onChangeText={setSearch}
        placeholderTextColor="#A1A1A6"
      />

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.userItem}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.full_name?.[0] || '?'}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{item.full_name || '—'}</Text>
              {item.email ? <Text style={styles.userEmail}>{item.email}</Text> : null}
              <Text style={styles.userRole}>{item.role}</Text>
            </View>
            <View style={[styles.statusBadge, item.is_suspended ? styles.suspended : styles.active]}>
              <Text style={styles.statusText}>
                {item.is_suspended ? t('admin.suspended') : t('admin.active')}
              </Text>
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
  searchInput: {
    marginHorizontal: 24, marginBottom: 16, borderWidth: 1, borderColor: '#E5E5EA',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16,
    color: '#000000', backgroundColor: '#F2F2F7',
  },
  userItem: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F2F2F7',
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#F2F2F7',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 16, fontWeight: '600', color: '#000000' },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '600', color: '#000000' },
  userEmail: { fontSize: 13, color: '#6E6E73', marginTop: 2 },
  userRole: { fontSize: 13, color: '#6E6E73', marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  active: { backgroundColor: '#E8F8EE' },
  suspended: { backgroundColor: '#FFE9E7' },
  statusText: { fontSize: 12, fontWeight: '500', color: '#000000' },
});
