import { supabase } from '../../lib/supabase';
import { Database } from '../../types/database';

export type TrackRow = Database['public']['Tables']['tracks']['Row'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type TrackWithAuthor = TrackRow & { owner: ProfileRow };

export async function fetchTracks(pageParam: number = 0, pageSize: number = 20): Promise<TrackWithAuthor[]> {
  const from = pageParam * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from('tracks')
    .select('*, owner:profiles(*)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  return (data as any) || [];
}
