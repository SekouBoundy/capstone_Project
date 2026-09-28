import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Product, MarketplaceFilters } from '@/types/models';

async function fetchProducts(filters?: MarketplaceFilters): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select('*, seller:profiles(*)')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }
  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  if (filters?.minPrice) {
    query = query.gte('price', filters.minPrice);
  }
  if (filters?.maxPrice) {
    query = query.lte('price', filters.maxPrice);
  }
  if (filters?.condition) {
    query = query.eq('condition', filters.condition);
  }
  if (filters?.city) {
    query = query.eq('city', filters.city);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function fetchProduct(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*, seller:profiles(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

async function fetchMyProducts(): Promise<Product[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export function useProducts(filters?: MarketplaceFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => fetchProducts(filters),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProduct(id),
    enabled: !!id,
  });
}

export function useMyProducts() {
  return useQuery({
    queryKey: ['my-products'],
    queryFn: fetchMyProducts,
  });
}
