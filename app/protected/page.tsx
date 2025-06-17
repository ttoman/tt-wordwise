import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WorkspaceLayout } from "@/components/workspace/workspace-layout";

console.log('🔄 ProtectedPage: Page module loaded');

export default async function ProtectedPage() {
  console.log('🔄 ProtectedPage: Rendering protected page');

  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    console.log('❌ ProtectedPage: No authenticated user, redirecting to login');
    redirect("/auth/login");
  }

  console.log('✅ ProtectedPage: User authenticated, showing workspace for user:', data.user.id);

  return <WorkspaceLayout />;
}
