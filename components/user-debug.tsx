'use client';

import { useUser } from '@/lib/hooks/useUser';

/**
 * Debug component to test and display useUser hook state
 * Shows user data, loading state, and any errors
 * This component will be removed after testing
 */
export function UserDebug() {
  console.log('🔄 UserDebug: Component rendering');

  const { user, loading, error } = useUser();

  console.log('🔄 UserDebug: Hook returned - User:', user, 'Loading:', loading, 'Error:', error);

  if (loading) {
    return (
      <div className='p-4 bg-yellow-100 border border-yellow-400 rounded-md'>
        <h3 className='font-bold text-yellow-800'>🔄 Loading User State...</h3>
        <p className='text-yellow-700'>Checking authentication status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-4 bg-red-100 border border-red-400 rounded-md'>
        <h3 className='font-bold text-red-800'>❌ Error Loading User</h3>
        <p className='text-red-700'>{error}</p>
      </div>
    );
  }

  return (
    <div className='p-4 bg-green-100 border border-green-400 rounded-md'>
      <h3 className='font-bold text-green-800'>✅ User State Loaded</h3>
      {user ? (
        <div className='text-green-700'>
          <p><strong>User ID:</strong> {user.id}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Created:</strong> {new Date(user.created_at).toLocaleString()}</p>
          <p><strong>Last Sign In:</strong> {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}</p>
        </div>
      ) : (
        <p className='text-green-700'>No user is currently signed in</p>
      )}
    </div>
  );
}