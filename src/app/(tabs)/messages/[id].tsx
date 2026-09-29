import { View, Text, FlatList, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef, useCallback } from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useMessages, useMarkConversationRead, useSendMessage } from '@/hooks/useMessages';
import { useConversation } from '@/hooks/useConversations';
import { useRealtimeMessages } from '@/hooks/useRealtime';
import { useAuthStore } from '@/stores/authStore';
import { Message } from '@/types/models';
import { colors, spacing, radii, typography } from '@/theme';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { profile } = useAuthStore();

  const conversationId = typeof id === 'string' ? id : '';
  const { data: messages, isLoading, isError, refetch } = useMessages(conversationId);
  const { data: conversation } = useConversation(conversationId);
  const markRead = useMarkConversationRead();
  const sendMessage = useSendMessage(conversationId);

  // Live delivery. No-op unless the messages table is in the
  // supabase_realtime publication — see migration 013.
  useRealtimeMessages(conversationId);

  const [draft, setDraft] = useState('');
  const flatListRef = useRef<FlatList<Message>>(null);

  const otherName = conversation?.other_participant?.full_name ?? t('messages.title');

  // Opening the thread is what marks it read. Runs on mount and whenever
  // the realtime subscription brings in new inbound messages.
  useEffect(() => {
    if (conversationId) markRead.mutate(conversationId);
  }, [conversationId, markRead]);

  useEffect(() => {
    if (messages && messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: false });
    }
  }, [messages]);

  const handleSend = useCallback(async () => {
    const body = draft.trim();
    if (!body || !profile) return;

    setDraft('');
    try {
      await sendMessage.mutateAsync({ senderId: profile.id, body });
    } catch {
      // Put the text back so the message is not silently lost.
      setDraft((prev) => (prev ? `${prev}\n${body}` : body));
    }
  }, [draft, profile, sendMessage]);

  const renderMessage = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      const isMine = item.sender_id === profile?.id;
      const list = messages ?? [];
      // Timestamp only on the last bubble of a run from the same sender.
      const isLastOfRun =
        index === list.length - 1 || list[index + 1]?.sender_id !== item.sender_id;

      return (
        <View
          style={[
            styles.bubble,
            isMine ? styles.myBubble : styles.theirBubble,
            isLastOfRun && (isMine ? styles.myBubbleLast : styles.theirBubbleLast),
          ]}
        >
          <Text style={[styles.body, isMine ? styles.myText : styles.theirText]}>
            {item.body}
          </Text>
          {isLastOfRun ? (
            <Text style={[styles.time, isMine ? styles.myTime : styles.theirTime]}>
              {formatTime(item.created_at)}
            </Text>
          ) : null}
        </View>
      );
    },
    [messages, profile?.id]
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      // Offsets the composer past the tab bar's own height; the previous
      // hardcoded 100 was a guess at exactly this.
      keyboardVerticalOffset={insets.top + 44}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          style={styles.back}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {otherName}
        </Text>
        <View style={styles.back} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="wifi-off" size={30} color={colors.textMuted} />
          <Text style={styles.centeredTitle}>{t('common.error')}</Text>
          <Pressable onPress={() => refetch()} accessibilityRole="button">
            <Text style={styles.centeredAction}>{t('common.retry')}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyThread}>
              <View style={styles.emptyIcon}>
                <MaterialCommunityIcons
                  name={conversation?.listing_type === 'product' ? 'tag-outline' : 'home-city-outline'}
                  size={26}
                  color={colors.text}
                />
              </View>
              <Text style={styles.centeredTitle}>
                {conversation?.listing_type === 'product'
                  ? t('messages.startProduct')
                  : t('messages.startProperty')}
              </Text>
            </View>
          }
        />
      )}

      <View style={[styles.composer, { paddingBottom: insets.bottom + spacing.sm }]}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder={t('messages.typeMessage')}
          placeholderTextColor={colors.textMuted}
          multiline
          accessibilityLabel={t('messages.typeMessage')}
        />
        <Pressable
          onPress={handleSend}
          disabled={!draft.trim() || sendMessage.isPending}
          accessibilityRole="button"
          accessibilityLabel={t('messages.send')}
          style={({ pressed }) => [
            styles.send,
            !draft.trim() && styles.sendDisabled,
            pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons
            name="arrow-up"
            size={20}
            color={colors.textInverse}
          />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  back: { width: 36, alignItems: 'center' },
  headerTitle: { ...typography.heading, flex: 1, textAlign: 'center' },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  centeredTitle: {
    ...typography.bodyStrong,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  centeredAction: { ...typography.bodyStrong, color: colors.text, marginTop: spacing.md },

  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  emptyThread: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bubble: {
    maxWidth: '78%',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    marginBottom: spacing.xs,
  },
  myBubble: { alignSelf: 'flex-end', backgroundColor: colors.text },
  theirBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  // Asymmetric corners on the run-ending bubble, so consecutive
  // messages from the same person read as a group.
  myBubbleLast: { borderBottomRightRadius: 6, marginBottom: spacing.md },
  theirBubbleLast: { borderBottomLeftRadius: 6, marginBottom: spacing.md },

  body: { fontSize: 15, lineHeight: 21 },
  myText: { color: colors.textInverse },
  theirText: { color: colors.text },
  time: { fontSize: 11, marginTop: spacing.xs },
  myTime: { color: 'rgba(255,255,255,0.65)', alignSelf: 'flex-end' },
  theirTime: { color: colors.textMuted, alignSelf: 'flex-start' },

  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.text,
    maxHeight: 110,
  },
  send: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.3 },
  pressed: { opacity: 0.6 },
});
