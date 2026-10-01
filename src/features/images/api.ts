import { supabase } from '../../lib/supabase';
import { Database } from '../../types/database';

export type ImageRow = Database['public']['Tables']['images']['Row'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ImageWithAuthor = ImageRow & { owner: ProfileRow };

export async function fetchImages(pageParam: number = 0, pageSize: number = 20): Promise<ImageWithAuthor[]> {
  const from = pageParam * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from('images')
    .select('*, owner:profiles(*)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  return (data as any) || [];
}
