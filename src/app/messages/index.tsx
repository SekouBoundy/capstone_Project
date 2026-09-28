import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useConversations } from '@/hooks/useConversations';

export default function MessagesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: conversations, isLoading } = useConversations();

  if (!isLoading && (!conversations || conversations.length === 0)) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('messages.title')}</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('messages.noMessages')}</Text>
          <Text style={styles.emptyDesc}>{t('messages.noMessagesDesc')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('messages.title')}</Text>
      </View>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.conversationItem}
            onPress={() => router.push(`/messages/${item.id}`)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.other_participant?.full_name?.[0] || '?'}
              </Text>
            </View>
            <View style={styles.conversationContent}>
              <View style={styles.conversationHeader}>
                <Text style={styles.participantName}>
                  {item.other_participant?.full_name || 'Unknown'}
                </Text>
                {item.last_message && (
                  <Text style={styles.time}>
                    {new Date(item.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                )}
              </View>
              {item.last_message && (
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {item.last_message.body}
                </Text>
              )}
            </View>
            {item.unread_count && item.unread_count > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.unread_count}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1e3a8a' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  conversationItem: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#eff6ff',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: '600', color: '#2563eb' },
  conversationContent: { flex: 1 },
  conversationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  participantName: { fontSize: 16, fontWeight: '600', color: '#374151' },
  time: { fontSize: 12, color: '#9ca3af' },
  lastMessage: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  badge: {
    backgroundColor: '#2563eb', borderRadius: 10, minWidth: 20, height: 20,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
