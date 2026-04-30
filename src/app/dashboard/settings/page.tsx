import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { google?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: client } = await supabase
    .from("clients")
    .select("google_refresh_token")
    .eq("owner_user_id", user!.id)
    .maybeSingle();

  const isGoogleConnected = !!client?.google_refresh_token;

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

      <Card>
        <CardHeader>
          <CardTitle>Google Calendar</CardTitle>
          <CardDescription>
            Let your AI agent check availability and create bookings directly in your calendar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isGoogleConnected ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-green-600">Connected ✓</span>
              <Button variant="outline" size="sm" asChild>
                <a href="/api/google/connect">Reconnect</a>
              </Button>
            </div>
          ) : (
            <Button asChild>
              <a href="/api/google/connect">Connect Google Calendar</a>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
