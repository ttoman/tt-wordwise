'use client';

import { useState, useEffect } from 'react';
import { redirect } from 'next/navigation';
import { useUser } from '@/lib/hooks/useUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, User, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

console.log('🔄 ProfilePage: Page component loaded');

export default function ProfilePage() {
  console.log('🔄 ProfilePage: Rendering profile page');

  const { user, loading: userLoading } = useUser();
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      console.log('❌ ProfilePage: No authenticated user, redirecting');
      redirect('/auth/login');
    }
  }, [user, userLoading]);

  // Load existing profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      console.log('🔄 ProfilePage: Loading profile for user:', user.id);
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          // PGRST116 = no rows returned, which is ok for new users
          throw profileError;
        }

        if (profile) {
          console.log('✅ ProfilePage: Profile loaded:', profile);
          setFullName(profile.full_name || '');
        } else {
          console.log('📝 ProfilePage: No existing profile found, will create new one');
          setFullName('');
        }
      } catch (err) {
        console.error('❌ ProfilePage: Failed to load profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  // Save profile changes
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    console.log('💾 ProfilePage: Saving profile changes');
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const supabase = createClient();

      // Upsert profile data
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            full_name: fullName.trim() || null,
          },
          {
            onConflict: 'id'
          }
        );

      if (upsertError) throw upsertError;

      console.log('✅ ProfilePage: Profile saved successfully');
      setSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('❌ ProfilePage: Failed to save profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <User size={48} className="mx-auto text-muted-foreground animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-32 mx-auto animate-pulse"></div>
            <div className="h-3 bg-muted rounded w-24 mx-auto animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/protected">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft size={16} />
              Back to Workspace
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Profile Settings</h1>
        </div>

        {/* Profile Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User size={20} />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              {/* Email (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed from this page
                </p>
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  maxLength={100}
                />
              </div>

              {/* Account Info */}
              <div className="space-y-2">
                <Label>Account Created</Label>
                <p className="text-sm text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Profile updated successfully!
                  </p>
                </div>
              )}

              {/* Save Button */}
              <Button
                type="submit"
                disabled={saving}
                className="w-full gap-2"
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

console.log('✅ ProfilePage: Component exported');