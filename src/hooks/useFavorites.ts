import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

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
