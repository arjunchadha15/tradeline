import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "@/components/auth/login-form";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">TradeLine</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to your account</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
