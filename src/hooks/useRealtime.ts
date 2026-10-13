import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

/**
 * `supabase.channel(topic)` does NOT create a new channel when the topic
 * already exists — it returns the existing one. If that channel is already
 * joined, calling `.on('postgres_changes', ...)` throws:
 *
 *   cannot add `postgres_changes` callbacks for realtime:<topic> after `subscribe()`.
 *
 * Postgres CDC filters rows with the `filter` option, not the topic name, so
 * giving every subscription its own topic costs nothing and guarantees we
 * always get a fresh, unjoined channel.
 */
let channelSeq = 0;
const uniqueTopic = (base: string) => `${base}:${++channelSeq}`;

export function useRealtimeMessages(conversationId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(uniqueTopic(`conversation:${conversationId}`))
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);
}

export function useRealtimeConversations() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(uniqueTopic('conversations'))
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
