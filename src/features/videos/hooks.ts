import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchVideos } from './api';
import { APP_CONFIG } from '../../config/constants';

export function useVideosFeed() {
  return useInfiniteQuery({
    queryKey: ['videos', 'feed'],
    queryFn: ({ pageParam = 0 }) => fetchVideos(pageParam as number, APP_CONFIG.VIDEO_FEED_PAGE_SIZE),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === APP_CONFIG.VIDEO_FEED_PAGE_SIZE ? allPages.length : undefined;
    },
    initialPageParam: 0,
  });
}
