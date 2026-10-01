import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchTracks } from './api';

export function useSongsFeed() {
  return useInfiniteQuery({
    queryKey: ['tracks', 'feed'],
    queryFn: ({ pageParam = 0 }) => fetchTracks(pageParam as number, 20),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 20 ? allPages.length : undefined;
    },
    initialPageParam: 0,
  });
}
