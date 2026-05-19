import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPretty } from "@/lib/phone";
import { ExternalLink } from "lucide-react";
import { BookingActions } from "@/components/dashboard/booking-actions";

type Booking = {
  id: string;
  scheduled_at: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string | null;
  problem_summary: string | null;
  status: string | null;
  estimated_value_usd: number | null;
};

function StatusBadge({ status }: { status: string | null }) {
  if (status === "completed")
    return <Badge className="bg-green-600 text-white hover:bg-green-700">completed</Badge>;
  if (status === "cancelled") return <Badge variant="destructive">cancelled</Badge>;
  if (status === "no_show") return <Badge variant="outline">no show</Badge>;
  return <Badge variant="secondary">{status ?? "scheduled"}</Badge>;
}

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: client } = await supabase
    .from("clients")
    .select("id,google_refresh_token")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!client) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <p className="text-muted-foreground">No client account found.</p>
      </div>
    );
  }

  const now = new Date();

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "id,scheduled_at,customer_name,customer_phone,customer_address,problem_summary,status,estimated_value_usd"
    )
    .eq("client_id", client.id)
    .gte("scheduled_at", now.toISOString())
    .order("scheduled_at", { ascending: true });

  const { data: pastBookings } = await supabase
    .from("bookings")
    .select(
      "id,scheduled_at,customer_name,customer_phone,customer_address,problem_summary,status,estimated_value_usd"
    )
    .eq("client_id", client.id)
    .lt("scheduled_at", now.toISOString())
    .order("scheduled_at", { ascending: false })
    .limit(20);

  const upcoming = bookings ?? [];
  const past = pastBookings ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <Badge variant="secondary">{upcoming.length} upcoming</Badge>
      </div>

      {/* Google Calendar sync card */}
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Google Calendar</CardTitle>
          <CardDescription className="text-xs">
            {client.google_refresh_token
              ? "Connected — appointments are synced automatically."
              : "Not connected — connect to sync appointments to your Google Calendar."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="https://calendar.google.com/" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-1 h-3 w-3" />
              Open Google Calendar
            </a>
          </Button>
          {!client.google_refresh_token && (
            <Button size="sm" asChild>
              <a href="/api/google/connect">Connect Calendar</a>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Upcoming */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Upcoming
        </h2>
        {upcoming.length === 0 && (
          <p className="text-sm text-muted-foreground">No upcoming appointments.</p>
        )}
        {upcoming.map((b) => (
          <BookingCard key={b.id} booking={b} />
        ))}
      </section>

      {/* Past */}
      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Recent past
          </h2>
          {past.map((b) => (
            <BookingCard key={b.id} booking={b} past />
          ))}
        </section>
      )}
    </div>
  );
}

function BookingCard({ booking: b, past }: { booking: Booking; past?: boolean }) {
  const date = new Date(b.scheduled_at);
  return (
    <Card className={past ? "opacity-60" : ""}>
      <CardContent className="flex items-start gap-4 pt-4">
        {/* Date block */}
        <div className="flex shrink-0 flex-col items-center rounded-lg bg-muted px-3 py-2 text-center">
          <span className="text-2xl font-bold leading-none">{date.getDate()}</span>
          <span className="text-xs text-muted-foreground">
            {date.toLocaleString("en-US", { month: "short" })}
          </span>
          <span className="text-xs text-muted-foreground">
            {date.toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 space-y-1">
          <p className="font-semibold">{b.customer_name}</p>
          <p className="text-sm text-muted-foreground">
            <a href={`tel:${b.customer_phone}`} className="hover:underline">
              {formatPretty(b.customer_phone)}
            </a>
          </p>
          {b.customer_address && (
            <p className="text-sm text-muted-foreground">{b.customer_address}</p>
          )}
          {b.problem_summary && <p className="text-sm">{b.problem_summary}</p>}
          {b.estimated_value_usd && (
            <p className="text-xs text-muted-foreground">
              Est. ${b.estimated_value_usd.toLocaleString()}
            </p>
          )}
        </div>

        {/* Status + actions */}
        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatusBadge status={b.status} />
          {!past && <BookingActions bookingId={b.id} />}
        </div>
      </CardContent>
    </Card>
  );
}
