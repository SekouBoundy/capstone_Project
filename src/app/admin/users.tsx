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
        placeholderTextColor="#9ca3af"
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
              <Text style={styles.userName}>{item.full_name}</Text>
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
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16 },
  backButton: { fontSize: 16, color: '#2563eb', fontWeight: '500', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e3a8a' },
  searchInput: {
    marginHorizontal: 24, marginBottom: 16, borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16,
    color: '#374151', backgroundColor: '#f9fafb',
  },
  userItem: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#eff6ff',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 16, fontWeight: '600', color: '#2563eb' },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '600', color: '#374151' },
  userRole: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  active: { backgroundColor: '#d1fae5' },
  suspended: { backgroundColor: '#fee2e2' },
  statusText: { fontSize: 12, fontWeight: '500', color: '#374151' },
});
