import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsTabs } from "@/components/dashboard/settings-tabs";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { google?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!client) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">No client account found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {searchParams.google === "connected" && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
          Google Calendar connected successfully.
        </div>
      )}
      {searchParams.google === "error" && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
          Failed to connect Google Calendar. Please try again.
        </div>
      )}

      <SettingsTabs client={client} />
    </div>
  );
}
