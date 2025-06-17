'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

console.log('🔄 QueryProvider loaded');

export function QueryProvider({ children }: { children: React.ReactNode }) {
  console.log('🔄 QueryProvider: Initializing...');

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: (failureCount, error: any) => {
              // Don't retry on auth errors
              if (error?.status === 401) return false;
              // Retry up to 3 times for other errors
              return failureCount < 3;
            },
          },
          mutations: {
            retry: false, // Don't retry mutations by default
          },
        },
      })
  );

  console.log('✅ QueryProvider: Query client initialized');

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}