import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { PROFILE_PUBLIC_COLUMNS } from '@/lib/profileColumns';
import { Message } from '@/types/models';

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async (): Promise<Message[]> => {
      const { data, error } = await supabase
        .from('messages')
        .select(`*, sender:profiles(${PROFILE_PUBLIC_COLUMNS})`)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data ?? []) as unknown as Message[];
    },
    enabled: !!conversationId,
  });
}

/**
 * Marks every inbound message in a thread as read.
 *
 * Without this the unread badge never clears, because the count is
 * derived from `read_at IS NULL` and nothing ever sets it. Scoped to
 * `sender_id != me` so a message is never marked as read by its own
 * author, and the RLS policy on messages restricts updates to
 * participants anyway.
 */
export function useMarkConversationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .is('read_at', null);

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ senderId, body }: { senderId: string; body: string }) => {
      const { error } = await supabase
        .from('messages')
        .insert({ conversation_id: conversationId, sender_id: senderId, body });

      if (error) throw error;

      // `conversations.last_message_at` and `.last_message_body` are both
      // maintained by a trigger on the messages table (migration 013), so
      // this deliberately does NOT write them. The previous client-side
      // update was racy between two devices and skipped on delete.
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
