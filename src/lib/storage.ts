import { supabase } from './supabase';

export function getPublicUrl(bucket: string, path: string | null | undefined): string | null {
  if (!path) return null;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
