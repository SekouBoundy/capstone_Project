import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { PROFILE_PUBLIC_COLUMNS } from '@/lib/profileColumns';
import type { Product, Property } from '@/types/models';

export type FavoriteKind = 'property' | 'product';

/**
 * Count of the signed-in user's saved listings and products.
 *
 * Uses a `head: true` count query so only the number crosses the wire,
 * not the rows. Feeds the stat strip on the account screen.
 */
export function useFavoriteCount() {
  return useQuery({
    queryKey: ['favorites', 'count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count ?? 0;
    },
  });
}

/**
 * Ids of the signed-in user's saved listings of one kind.
 *
 * Only the `listing_id` column crosses the wire — a feed of a few hundred
 * cards needs the set to paint hearts, not the joined rows. The RLS policy
 * restricts the read to the caller's own rows, so this needs no filter.
 */
export function useFavoriteIds(listingType: FavoriteKind) {
  return useQuery({
    queryKey: ['favorites', 'ids', listingType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select('listing_id')
        .eq('listing_type', listingType);

      if (error) throw error;
      return (data ?? []).map((row) => row.listing_id as string);
    },
  });
}

interface ToggleInput {
  listingType: FavoriteKind;
  listingId: string;
  /** Current state, so the mutation knows which statement to issue. */
  saved: boolean;
}

interface ToggleContext {
  previousIds: string[] | undefined;
  previousCount: number | undefined;
}

/**
 * Add or remove a saved listing.
 *
 * Optimistic: the heart fills the instant it is tapped and only rolls back
 * if Supabase rejects the write. A toggle that waits on a round trip feels
 * broken on a slow connection — the user taps again, and the second tap
 * lands after the first, inverting the result.
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ToggleInput, ToggleContext>({
    // Insert and delete are separate PostgREST calls with incompatible
    // builders, so they branch rather than share one statement.
    mutationFn: async ({ listingType, listingId, saved }) => {
      if (saved) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('listing_type', listingType)
          .eq('listing_id', listingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ listing_type: listingType, listing_id: listingId });
        if (error) throw error;
      }
    },

    onMutate: async ({ listingType, listingId, saved }) => {
      const idsKey = ['favorites', 'ids', listingType];
      const countKey = ['favorites', 'count'];

      await queryClient.cancelQueries({ queryKey: idsKey });
      await queryClient.cancelQueries({ queryKey: countKey });

      const previousIds = queryClient.getQueryData<string[]>(idsKey);
      const previousCount = queryClient.getQueryData<number>(countKey);

      queryClient.setQueryData<string[]>(idsKey, (prev = []) =>
        saved ? prev.filter((id) => id !== listingId) : [...prev, listingId]
      );
      queryClient.setQueryData<number>(countKey, (prev = 0) =>
        Math.max(0, prev + (saved ? -1 : 1))
      );

      return { previousIds, previousCount };
    },

    onError: (_error, { listingType }, context) => {
      if (!context) return;
      queryClient.setQueryData(['favorites', 'ids', listingType], context.previousIds);
      queryClient.setQueryData(['favorites', 'count'], context.previousCount);
    },
  });
}

export type SavedItem =
  | { kind: 'property'; property: Property }
  | { kind: 'product'; product: Product };

/**
 * The signed-in user's saved listings, newest save first.
 *
 * `favorites.listing_id` is a bare uuid with a `listing_type` discriminator
 * and no foreign key, so PostgREST cannot embed the row it points at —
 * a join has to be a second query. That is two round trips by design: one
 * for the ids, then one per kind, only for kinds that actually have saves.
 */
export function useSavedListings() {
  return useQuery({
    queryKey: ['favorites', 'list'],
    queryFn: async (): Promise<SavedItem[]> => {
      const { data: rows, error } = await supabase
        .from('favorites')
        .select('listing_id, listing_type, created_at');

      if (error) throw error;
      if (!rows?.length) return [];

      const savedAt = new Map<string, string>();
      const propertyIds: string[] = [];
      const productIds: string[] = [];

      for (const row of rows) {
        savedAt.set(`${row.listing_type}:${row.listing_id}`, row.created_at);
        if (row.listing_type === 'property') propertyIds.push(row.listing_id);
        else productIds.push(row.listing_id);
      }

      const [propertiesResult, productsResult] = await Promise.all([
        propertyIds.length
          ? supabase
              .from('properties')
              .select(`*, images:property_images(*), owner:profiles(${PROFILE_PUBLIC_COLUMNS})`)
              .in('id', propertyIds)
          : null,
        productIds.length
          ? supabase
              .from('products')
              .select(`*, seller:profiles(${PROFILE_PUBLIC_COLUMNS})`)
              .in('id', productIds)
          : null,
      ]);

      if (propertiesResult?.error) throw propertiesResult.error;
      if (productsResult?.error) throw productsResult.error;

      const items: SavedItem[] = [
        ...(propertiesResult?.data ?? []).map((property) => ({
          kind: 'property' as const,
          property: property as Property,
        })),
        ...(productsResult?.data ?? []).map((product) => ({
          kind: 'product' as const,
          product: product as Product,
        })),
      ];

      // A listing that has since been removed is dropped rather than
      // rendered as a dead row: it is saved, but there is nothing left to
      // open.
      return items
        .filter((item) =>
          item.kind === 'property'
            ? item.property.status !== 'removed'
            : item.product.status !== 'removed'
        )
        .sort(
          (a, b) =>
            new Date(savedAt.get(keyOf(b)) ?? 0).getTime() -
            new Date(savedAt.get(keyOf(a)) ?? 0).getTime()
        );
    },
  });
}

/** The composite key used to line a listing back up with its save time. */
function keyOf(item: SavedItem): string {
  return item.kind === 'property'
    ? `property:${item.property.id}`
    : `product:${item.product.id}`;
}
