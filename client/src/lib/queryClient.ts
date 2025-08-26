import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 10 * 60 * 1000, // 10 minutes - aggressive caching for speed
      gcTime: 30 * 60 * 1000, // 30 minutes - keep data in memory longer
      refetchOnWindowFocus: false, // Prevent unnecessary refetches
      refetchOnMount: 'always', // Always check for fresh data on mount
      refetchOnReconnect: true, // Refetch when connection restored
      refetchInterval: false, // Disable automatic refetching
      networkMode: 'online', // Only fetch when online
    },
    mutations: {
      retry: 2,
      networkMode: 'online',
    },
  },
});

// Helper function for API requests
export const apiRequest = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json();
};