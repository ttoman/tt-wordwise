'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface UseUserReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
}

/**
 * Custom React hook for managing user authentication state
 * Returns current user data, loading state, and error state
 * Automatically listens to auth state changes and updates accordingly
 *
 * @returns {UseUserReturn} Object containing user, loading, and error states
 */
export function useUser(): UseUserReturn {
  console.log('🔄 useUser: Hook initialized');

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔄 useUser: Setting up auth state listener');

    const supabase = createClient();

    // Function to get current user session
    const getCurrentUser = async () => {
      console.log('🔄 useUser: Getting current user session');
      setLoading(true);
      setError(null);

      try {
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();

        if (userError) {
          console.error('❌ useUser: Error getting current user:', userError.message);
          setError(userError.message);
          setUser(null);
        } else {
          console.log('✅ useUser: Current user retrieved:', currentUser ? `User ID: ${currentUser.id}, Email: ${currentUser.email}` : 'No user found');
          setUser(currentUser);
        }
      } catch (err) {
        console.error('❌ useUser: Unexpected error getting current user:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        setUser(null);
      } finally {
        setLoading(false);
        console.log('🔄 useUser: Finished getting current user session');
      }
    };

    // Get initial user state
    getCurrentUser();

    // Set up auth state change listener
    console.log('🔄 useUser: Setting up onAuthStateChange listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 useUser: Auth state changed:', event, session ? `Session exists for user: ${session.user.id}` : 'No session');

        setLoading(true);
        setError(null);

        try {
          if (session?.user) {
            console.log('✅ useUser: User signed in:', session.user.id, session.user.email);
            setUser(session.user);
          } else {
            console.log('✅ useUser: User signed out or no session');
            setUser(null);
          }
        } catch (err) {
          console.error('❌ useUser: Error handling auth state change:', err);
          setError(err instanceof Error ? err.message : 'An error occurred during auth state change');
        } finally {
          setLoading(false);
          console.log('🔄 useUser: Finished handling auth state change');
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      console.log('🔄 useUser: Cleaning up auth state listener');
      subscription.unsubscribe();
    };
  }, []);

  // Log current state on every render for debugging
  console.log('🔄 useUser: Current state - User:', user ? `${user.id} (${user.email})` : 'null', 'Loading:', loading, 'Error:', error);

  return {
    user,
    loading,
    error,
  };
}

export default useUser;