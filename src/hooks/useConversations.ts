import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { PROFILE_PUBLIC_COLUMNS } from '@/lib/profileColumns';
import { Conversation, ListingKind } from '@/types/models';

/**
 * Both participant profiles are fetched, one per foreign key, and the
 * "other" one is chosen in JS.
 *
 * A single embed pinned to `conversations_participant_b_fkey` only ever
 * returns `participant_b`'s profile, so any thread where the signed-in
 * user IS `participant_b` renders the user's own avatar and name. Embedding
 * both sides costs one extra small row and is correct for every thread.
 */
const CONVERSATION_SELECT = `
  id,
  listing_type,
  listing_id,
  participant_a,
  participant_b,
  created_at,
  last_message_at,
  last_message_body,
  participant_a_profile:profiles!conversations_participant_a_fkey(${PROFILE_PUBLIC_COLUMNS}),
  participant_b_profile:profiles!conversations_participant_b_fkey(${PROFILE_PUBLIC_COLUMNS})
`;

type RawConversation = Omit<Conversation, 'other_participant'> & {
  participant_a_profile: Conversation['other_participant'];
  participant_b_profile: Conversation['other_participant'];
  last_message_body: string | null;
};

/** Flattens the two participant embeds down to the one that isn't you. */
function withOtherParticipant(
  row: RawConversation,
  viewerId: string,
  unreadCount = 0
): Conversation {
  const { participant_a_profile, participant_b_profile, ...rest } = row;

  return {
    ...rest,
    other_participant: viewerId === row.participant_a
      ? participant_b_profile
      : participant_a_profile,
    unread_count: unreadCount,
  };
}

async function fetchConversations(): Promise<Conversation[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('conversations')
    .select(CONVERSATION_SELECT)
    .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
    .order('last_message_at', { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as unknown as RawConversation[];

  // Unread counts still cost one head request per conversation. The
  // counts themselves are single rows, so this is cheap relative to
  // embedding each thread's messages would be.
  const withCounts = await Promise.all(
    rows.map(async (row) => {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', row.id)
        .neq('sender_id', user.id)
        .is('read_at', null);

      return withOtherParticipant(row, user.id, count ?? 0);
    })
  );

  return withCounts;
}

async function fetchConversation(id: string): Promise<Conversation | null> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('conversations')
    .select(CONVERSATION_SELECT)
    .eq('id', id)
    .single();

  if (error) throw error;

  return withOtherParticipant(data as unknown as RawConversation, user?.id ?? '');
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

/**
 * Opens (or re-opens) the conversation between the signed-in user and the
 * owner/seller of a listing, and returns its id so the caller can navigate
 * to `/messages/<id>`.
 *
 * `participant_a` is always the listing owner and `participant_b` always
 * the initiator. That is not cosmetic: the table's unique constraint is
 * `UNIQUE(listing_type, listing_id, participant_a, participant_b)`, so a
 * swapped pair would be a *different* row and a second thread would open
 * for the same listing. Pinning the order makes the constraint do the
 * deduplication.
 */
export function useStartConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listingType,
      listingId,
      ownerId,
    }: {
      listingType: ListingKind;
      listingId: string;
      ownerId: string;
    }): Promise<string> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');
      if (user.id === ownerId) throw new Error('You cannot message yourself');

      const participant_a = ownerId;
      const participant_b = user.id;

      const { data, error } = await supabase
        .from('conversations')
        .insert({
          listing_type: listingType,
          listing_id: listingId,
          participant_a,
          participant_b,
        })
        .select('id')
        .single();

      if (error) {
        // 23505 = unique_violation: this thread already exists. Read it
        // back rather than surfacing a failure to the user, since from
        // their side tapping "Contact" again is a no-op, not an error.
        if (error.code === '23505') {
          const { data: existing, error: readError } = await supabase
            .from('conversations')
            .select('id')
            .eq('listing_type', listingType)
            .eq('listing_id', listingId)
            .eq('participant_a', participant_a)
            .eq('participant_b', participant_b)
            .maybeSingle();

          if (readError) throw readError;
          if (!existing) throw error;
          return existing.id as string;
        }
        throw error;
      }

      return (data as { id: string }).id;
    },
    onSuccess: (id) => {
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
      void queryClient.invalidateQueries({ queryKey: ['conversation', id] });
    },
  });
}
