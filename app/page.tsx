import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Edit3, Lightbulb, TrendingUp, Zap, Shield } from "lucide-react";
import Link from "next/link";

console.log('🔄 HomePage: Page module loaded');

export default async function Home() {
  console.log('🔄 HomePage: Rendering home page');

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  // If user is authenticated, redirect to the workspace
  if (!error && data?.user) {
    console.log('✅ HomePage: User authenticated, redirecting to workspace');
    redirect("/protected");
  }

  console.log('🔄 HomePage: Showing landing page for unauthenticated user');

  return (
    <main className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="w-full border-b border-b-foreground/10 h-16">
        <div className="w-full max-w-6xl mx-auto flex justify-between items-center p-3 px-5 text-sm">
          <div className="flex gap-5 items-center">
            <Link href="/" className="font-bold text-lg">
              📝 Wordwise
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            <AuthButton />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Write with <span className="text-blue-600">AI-Powered</span>
              <br />
              Writing Assistant
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Improve your writing with intelligent grammar suggestions, spell checking,
              and readability analysis. Create professional documents with confidence.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/auth/sign-up">
                Get Started Free
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link href="/auth/login">
                Sign In
              </Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-6xl mx-auto mt-20 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-blue-600" />
                <CardTitle>Smart Spell Check</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Real-time spell checking with intelligent suggestions.
                Right-click any misspelled word for instant corrections.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Edit3 className="h-6 w-6 text-green-600" />
                <CardTitle>Grammar Assistant</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                AI-powered grammar and style suggestions using GPT-4o mini.
                Improve clarity, fix errors, and enhance your writing style.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
                <CardTitle>Readability Score</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Get Flesch-Kincaid readability scores with color-coded feedback.
                Make your writing accessible to your target audience.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950 dark:border-purple-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-6 w-6 text-purple-600" />
                <CardTitle>Auto-Save</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Never lose your work with intelligent auto-save.
                Saves every 10 seconds with retry logic for reliability.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-6 w-6 text-orange-600" />
                <CardTitle>Cost Efficient</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Smart caching and throttling keeps AI costs low.
                Track usage with built-in cost monitoring and alerts.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-indigo-200 bg-indigo-50 dark:bg-indigo-950 dark:border-indigo-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-indigo-600" />
                <CardTitle>Secure & Private</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Your documents are secure with Supabase authentication
                and row-level security. Only you can access your content.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto mt-20 text-center space-y-6">
          <h2 className="text-3xl font-bold">
            Ready to enhance your writing?
          </h2>
          <p className="text-lg text-muted-foreground">
            Join writers who are already improving their content with AI-powered assistance.
          </p>
          <Button asChild size="lg" className="text-lg px-12">
            <Link href="/auth/sign-up">
              Start Writing Better Today
            </Link>
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full border-t mt-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between p-6 text-sm text-muted-foreground">
          <p>
            Built with{" "}
            <a
              href="https://supabase.com"
              target="_blank"
              className="font-semibold hover:underline"
              rel="noreferrer"
            >
              Supabase
            </a>
            {" "}and{" "}
            <a
              href="https://nextjs.org"
              target="_blank"
              className="font-semibold hover:underline"
              rel="noreferrer"
            >
              Next.js
            </a>
          </p>
          <p>© 2024 Wordwise. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}

console.log('✅ HomePage: Page module exported');
