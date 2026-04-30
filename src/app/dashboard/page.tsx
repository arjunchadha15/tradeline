import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Welcome, {user?.email}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Your dashboard will appear here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
