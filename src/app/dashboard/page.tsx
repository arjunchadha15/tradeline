import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Calendar, AlertTriangle, DollarSign, ArrowUpRight } from "lucide-react";
import { formatPretty } from "@/lib/phone";
import Link from "next/link";

function greeting(name: string) {
  const h = new Date().getHours();
  const time = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const first = name.split(" ")[0];
  return `${time}, ${first}`;
}

function relativeTime(iso: string | null) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function urgencyVariant(
  urgency: string | null
): "default" | "destructive" | "secondary" | "outline" {
  if (urgency === "emergency") return "destructive";
  if (urgency === "same_day") return "default";
  return "secondary";
}

export default async function DashboardPage() {
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
        <h1 className="text-2xl font-bold">Welcome</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              No client account found. Contact support to set up your first client.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(weekStart.getDate() - 7);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    { count: callsThisWeek },
    { count: callsLastWeek },
    { data: bookingsThisWeek },
    { count: emergenciesThisWeek },
    { count: callsThisMonth },
    { data: recentCalls },
    { data: upcomingBookings },
  ] = await Promise.all([
    supabase
      .from("calls")
      .select("*", { count: "exact", head: true })
      .eq("client_id", client.id)
      .gte("created_at", weekStart.toISOString()),
    supabase
      .from("calls")
      .select("*", { count: "exact", head: true })
      .eq("client_id", client.id)
      .gte("created_at", lastWeekStart.toISOString())
      .lt("created_at", weekStart.toISOString()),
    supabase
      .from("bookings")
      .select("estimated_value_usd")
      .eq("client_id", client.id)
      .gte("created_at", weekStart.toISOString()),
    supabase
      .from("emergencies")
      .select("*", { count: "exact", head: true })
      .eq("client_id", client.id)
      .gte("created_at", weekStart.toISOString()),
    supabase
      .from("calls")
      .select("*", { count: "exact", head: true })
      .eq("client_id", client.id)
      .gte("created_at", monthStart.toISOString()),
    supabase
      .from("calls")
      .select("id,created_at,caller_name,caller_phone,urgency,summary,outcome")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("bookings")
      .select("id,scheduled_at,customer_name,customer_phone,customer_address")
      .eq("client_id", client.id)
      .gte("scheduled_at", now.toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(5),
  ]);

  const bookingCount = bookingsThisWeek?.length ?? 0;
  const bookingValue = bookingsThisWeek?.reduce((s, b) => s + (b.estimated_value_usd ?? 0), 0) ?? 0;
  const callsW = callsThisWeek ?? 0;
  const callsLW = callsLastWeek ?? 0;
  const weekPct = callsLW === 0 ? null : Math.round(((callsW - callsLW) / callsLW) * 100);

  const avgTicket = client.avg_ticket_usd ?? 0;
  const closeRate = client.close_rate ?? 0;
  const estRevenueSaved = Math.round((callsThisMonth ?? 0) * avgTicket * closeRate);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{greeting(client.owner_name)}</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Calls this week
            </CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{callsW}</p>
            {weekPct !== null && (
              <p className={`mt-1 text-xs ${weekPct >= 0 ? "text-green-600" : "text-red-500"}`}>
                {weekPct >= 0 ? "↑" : "↓"} {Math.abs(weekPct)}% vs last week
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bookings this week
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{bookingCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              ${bookingValue.toLocaleString()} estimated value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Emergencies</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{emergenciesThisWeek ?? 0}</p>
            <p className="mt-1 text-xs text-muted-foreground">this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Est. revenue saved
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${estRevenueSaved.toLocaleString()}</p>
            <p className="mt-1 text-xs text-muted-foreground">this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent calls + upcoming bookings */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent calls</CardTitle>
            <Link
              href="/dashboard/calls"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {!recentCalls?.length && <p className="text-sm text-muted-foreground">No calls yet.</p>}
            {recentCalls?.map((call) => (
              <div key={call.id} className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {call.caller_name ?? formatPretty(call.caller_phone ?? "") ?? "Unknown caller"}
                  </p>
                  {call.summary && (
                    <p className="truncate text-xs text-muted-foreground">{call.summary}</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge variant={urgencyVariant(call.urgency)} className="text-xs">
                    {call.urgency ?? "standard"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {relativeTime(call.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Upcoming appointments</CardTitle>
            <Link
              href="/dashboard/calendar"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {!upcomingBookings?.length && (
              <p className="text-sm text-muted-foreground">No upcoming appointments.</p>
            )}
            {upcomingBookings?.map((b) => (
              <div key={b.id} className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{b.customer_name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {b.customer_address ?? "No address"}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(b.scheduled_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
