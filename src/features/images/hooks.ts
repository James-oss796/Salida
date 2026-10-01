import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchImages } from './api';

export function useImagesFeed() {
  return useInfiniteQuery({
    queryKey: ['images', 'feed'],
    queryFn: ({ pageParam = 0 }) => fetchImages(pageParam as number, 20),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 20 ? allPages.length : undefined;
    },
    initialPageParam: 0,
  });
}
