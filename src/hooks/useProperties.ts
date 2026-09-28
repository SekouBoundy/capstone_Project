import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Property, HousingFilters } from '@/types/models';

async function fetchProperties(filters?: HousingFilters): Promise<Property[]> {
  let query = supabase
    .from('properties')
    .select('*, images:property_images(*), owner:profiles(*)')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }
  if (filters?.minPrice) {
    query = query.gte('price_monthly', filters.minPrice);
  }
  if (filters?.maxPrice) {
    query = query.lte('price_monthly', filters.maxPrice);
  }
  if (filters?.propertyType) {
    query = query.eq('property_type', filters.propertyType);
  }
  if (filters?.rooms) {
    query = query.eq('rooms', filters.rooms);
  }
  if (filters?.furnished !== undefined) {
    query = query.eq('furnished', filters.furnished);
  }
  if (filters?.city) {
    query = query.eq('city', filters.city);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function fetchProperty(id: string): Promise<Property | null> {
  const { data, error } = await supabase
    .from('properties')
    .select('*, images:property_images(*), owner:profiles(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

async function fetchMyListings(): Promise<Property[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('properties')
    .select('*, images:property_images(*)')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export function useProperties(filters?: HousingFilters) {
  return useQuery({
    queryKey: ['properties', filters],
    queryFn: () => fetchProperties(filters),
  });
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: ['property', id],
    queryFn: () => fetchProperty(id),
    enabled: !!id,
  });
}

export function useMyListings() {
  return useQuery({
    queryKey: ['my-listings'],
    queryFn: fetchMyListings,
  });
}
