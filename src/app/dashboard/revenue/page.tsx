import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Calendar, AlertTriangle, DollarSign } from "lucide-react";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { RepairTypeChart, LocationChart } from "@/components/dashboard/breakdown-charts";
import { ActualValueEdit } from "@/components/dashboard/actual-value-edit";

function isoWeek(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum =
    1 +
    Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

function weekLabel(isoWeekStr: string): string {
  const [year, wk] = isoWeekStr.split("-W").map(Number);
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = (jan4.getDay() + 6) % 7;
  const weekStart = new Date(jan4);
  weekStart.setDate(jan4.getDate() - dayOfWeek + (wk - 1) * 7);
  return weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function repairLabel(summary: string | null): string {
  if (!summary) return "Other";
  const clean = summary.trim();
  // Truncate to first 4 words, max 32 chars
  const words = clean.split(/\s+/).slice(0, 4).join(" ");
  return words.length > 32 ? words.slice(0, 29) + "…" : words;
}

function cityFromAddress(address: string | null): string {
  if (!address) return "Unknown";
  const parts = address.split(",");
  if (parts.length < 2) return address.trim().slice(0, 20) || "Unknown";
  return parts[1].trim().slice(0, 20);
}

export default async function RevenuePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: client } = await supabase
    .from("clients")
    .select("id,avg_ticket_usd,close_rate")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!client) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Revenue</h1>
        <p className="text-muted-foreground">No client account found.</p>
      </div>
    );
  }

  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000);

  const [
    { count: totalCalls },
    { count: totalBookings },
    { count: totalEmergencies },
    { data: recentBookings },
    { data: allCompletedBookings },
    { data: recentCompleted },
  ] = await Promise.all([
    supabase.from("calls").select("*", { count: "exact", head: true }).eq("client_id", client.id),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("client_id", client.id),
    supabase
      .from("emergencies")
      .select("*", { count: "exact", head: true })
      .eq("client_id", client.id),
    supabase
      .from("bookings")
      .select("id,scheduled_at,actual_value_usd")
      .eq("client_id", client.id)
      .gte("scheduled_at", ninetyDaysAgo.toISOString()),
    supabase
      .from("bookings")
      .select("id,problem_summary,customer_address,actual_value_usd")
      .eq("client_id", client.id)
      .not("actual_value_usd", "is", null),
    supabase
      .from("bookings")
      .select("id,scheduled_at,customer_name,actual_value_usd,status")
      .eq("client_id", client.id)
      .eq("status", "completed")
      .order("scheduled_at", { ascending: false })
      .limit(10),
  ]);

  const tc = totalCalls ?? 0;
  const tb = totalBookings ?? 0;
  const bookingRate = tc === 0 ? 0 : Math.round((tb / tc) * 100);
  const totalRevenue = (allCompletedBookings ?? []).reduce(
    (s, b) => s + (b.actual_value_usd ?? 0),
    0
  );

  // Weekly revenue chart (actual only)
  const weekMap = new Map<string, number>();
  for (const b of recentBookings ?? []) {
    if (!b.actual_value_usd) continue;
    const wk = isoWeek(new Date(b.scheduled_at));
    weekMap.set(wk, (weekMap.get(wk) ?? 0) + b.actual_value_usd);
  }
  const chartData = Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([wk, revenue]) => ({ week: weekLabel(wk), revenue }));

  // Revenue by repair type
  const repairMap = new Map<string, number>();
  for (const b of allCompletedBookings ?? []) {
    const label = repairLabel(b.problem_summary);
    repairMap.set(label, (repairMap.get(label) ?? 0) + (b.actual_value_usd ?? 0));
  }
  const repairData = Array.from(repairMap.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([label, revenue]) => ({ label, revenue }));

  // Revenue by location
  const locationMap = new Map<string, number>();
  for (const b of allCompletedBookings ?? []) {
    const city = cityFromAddress(b.customer_address);
    locationMap.set(city, (locationMap.get(city) ?? 0) + (b.actual_value_usd ?? 0));
  }
  const locationData = Array.from(locationMap.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([label, revenue]) => ({ label, revenue }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Revenue</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Calls captured
            </CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{tc.toLocaleString()}</p>
            <p className="mt-1 text-xs text-muted-foreground">all time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Booking rate
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{bookingRate}%</p>
            <p className="mt-1 text-xs text-muted-foreground">{tb} bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Emergencies</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{(totalEmergencies ?? 0).toLocaleString()}</p>
            <p className="mt-1 text-xs text-muted-foreground">all time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${totalRevenue.toLocaleString()}</p>
            <p className="mt-1 text-xs text-muted-foreground">recorded jobs</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly revenue chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Weekly revenue (last 90 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChart data={chartData} />
        </CardContent>
      </Card>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue by repair type</CardTitle>
          </CardHeader>
          <CardContent>
            <RepairTypeChart data={repairData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue by location</CardTitle>
          </CardHeader>
          <CardContent>
            <LocationChart data={locationData} />
          </CardContent>
        </Card>
      </div>

      {/* Recent completed jobs */}
      {recentCompleted && recentCompleted.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent completed jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-2 text-left font-medium text-muted-foreground">Date</th>
                  <th className="pb-2 text-left font-medium text-muted-foreground">Customer</th>
                  <th className="pb-2 text-left font-medium text-muted-foreground">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {recentCompleted.map((b) => (
                  <tr key={b.id} className="border-b last:border-0">
                    <td className="py-2 text-muted-foreground">
                      {new Date(b.scheduled_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="py-2">{b.customer_name}</td>
                    <td className="py-2">
                      <ActualValueEdit bookingId={b.id} value={b.actual_value_usd} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
