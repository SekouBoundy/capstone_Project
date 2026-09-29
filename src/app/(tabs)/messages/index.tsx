import { View, Text, FlatList, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useConversations } from '@/hooks/useConversations';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { colors, spacing, radii, typography } from '@/theme';

function formatTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
}

function ConversationRowSkeleton() {
  return (
    <View style={styles.row}>
      <Skeleton height={48} width={48} style={styles.avatarSkeleton} />
      <View style={styles.rowText}>
        <Skeleton height={15} width="45%" />
        <Skeleton height={13} width="75%" style={styles.gap} />
      </View>
    </View>
  );
}

export default function MessagesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: conversations, isLoading, isRefetching, refetch, isError, error } =
    useConversations();

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('messages.title')} />

      {isError ? (
        <EmptyState
          icon="wifi-off"
          title={t('common.error')}
          description={error instanceof Error ? error.message : undefined}
          action={{ label: t('common.retry'), onPress: () => refetch() }}
          style={styles.centered}
        />
      ) : isLoading ? (
        <View style={styles.list}>
          {[0, 1, 2, 3, 4].map((i) => (
            <ConversationRowSkeleton key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const name = item.other_participant?.full_name;
            const unread = item.unread_count ?? 0;

            return (
              <Pressable
                onPress={() => router.push(`/messages/${item.id}`)}
                accessibilityRole="button"
                accessibilityLabel={name ?? t('messages.title')}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{name?.[0]?.toUpperCase() ?? '?'}</Text>
                  {unread > 0 ? <View style={styles.avatarDot} /> : null}
                </View>

                <View style={styles.rowText}>
                  <View style={styles.rowTop}>
                    <Text style={[styles.participantName, unread > 0 && styles.unreadName]} numberOfLines={1}>
                      {name ?? t('messages.title')}
                    </Text>
                    {item.last_message ? (
                      <Text style={styles.time}>{formatTime(item.last_message.created_at)}</Text>
                    ) : null}
                  </View>

                  {item.last_message ? (
                    <Text
                      style={[styles.lastMessage, unread > 0 && styles.unreadBody]}
                      numberOfLines={1}
                    >
                      {item.last_message.body}
                    </Text>
                  ) : (
                    <Text style={styles.lastMessage}>—</Text>
                  )}
                </View>

                {unread > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          }}
          contentContainerStyle={conversations?.length ? styles.list : styles.listEmpty}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="message-text-outline"
              title={t('messages.noMessages')}
              description={t('messages.noMessagesDesc')}
              style={styles.centered}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { paddingBottom: spacing.xxxl },
  listEmpty: { flexGrow: 1 },
  centered: { flex: 1, justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pressed: { backgroundColor: colors.surfaceMuted },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarSkeleton: { borderRadius: 24, marginRight: spacing.md },
  avatarText: { fontSize: 18, fontWeight: '700', color: colors.primary },
  avatarDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  rowText: { flex: 1 },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  participantName: { ...typography.bodyStrong, flex: 1 },
  unreadName: { fontWeight: '700' },
  time: { ...typography.captionMuted, fontSize: 12 },
  lastMessage: { ...typography.caption, marginTop: 2 },
  unreadBody: { color: colors.text, fontWeight: '600' },
  gap: { marginTop: spacing.xs },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    minWidth: 22,
    height: 22,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  badgeText: { color: colors.textInverse, fontSize: 11, fontWeight: '700' },
});
