import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { CallsTable } from "@/components/dashboard/calls-table";

export default async function CallsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!client) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Calls</h1>
        <p className="text-muted-foreground">No client account found.</p>
      </div>
    );
  }

  const { data: calls } = await supabase
    .from("calls")
    .select(
      "id,created_at,caller_name,caller_phone,caller_address,urgency,outcome,duration_sec,transcript,audio_url,structured_data,summary,problem_summary,bookings!bookings_call_id_fkey(id,estimated_value_usd,actual_value_usd)"
    )
    .eq("client_id", client.id)
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Calls</h1>
        <Badge variant="secondary">{calls?.length ?? 0} total</Badge>
      </div>
      <CallsTable calls={calls ?? []} />
    </div>
  );
}
