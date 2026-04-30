import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NavLinks from "@/components/dashboard/nav-links";
import SignOutButton from "@/components/dashboard/sign-out-button";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex w-60 flex-shrink-0 flex-col border-r bg-card">
        <div className="p-6">
          <span className="text-xl font-bold tracking-tight">TradeLine</span>
        </div>

        <NavLinks />

        <div className="mt-auto border-t p-4">
          <p className="mb-2 truncate text-xs text-muted-foreground">{user.email}</p>
          <SignOutButton />
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
