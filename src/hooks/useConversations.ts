import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Conversation } from '@/types/models';

async function fetchConversations(): Promise<Conversation[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      other_participant:profiles!conversations_participant_b_fkey(*),
      last_message:messages(*)
    `)
    .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
    .order('last_message_at', { ascending: false });

  if (error) throw error;

  // Fetch unread counts
  const conversationsWithUnread = await Promise.all(
    (data || []).map(async (conv: any) => {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .neq('sender_id', user.id)
        .is('read_at', null);

      return {
        ...conv,
        unread_count: count || 0,
      };
    })
  );

  return conversationsWithUnread;
}

async function fetchConversation(id: string): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      other_participant:profiles!conversations_participant_b_fkey(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: fetchConversations,
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: ['conversation', id],
    queryFn: () => fetchConversation(id),
    enabled: !!id,
  });
}
