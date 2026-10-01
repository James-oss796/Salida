import { supabase } from '../../lib/supabase';
import { Database } from '../../types/database';

export type VideoRow = Database['public']['Tables']['videos']['Row'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export type VideoWithAuthor = VideoRow & { owner: ProfileRow };

export async function fetchVideos(pageParam: number = 0, pageSize: number = 10): Promise<VideoWithAuthor[]> {
  const from = pageParam * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from('videos')
    .select('*, owner:profiles(*)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  return (data as any) || [];
}
