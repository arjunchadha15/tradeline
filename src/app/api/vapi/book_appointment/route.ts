import { NextRequest, NextResponse } from "next/server";
import { verifyVapiRequest } from "@/lib/vapi/auth";
import { vapiOk, vapiErr } from "@/lib/vapi/respond";
import { createAdminClient } from "@/lib/supabase/admin";
import { createEvent } from "@/lib/google/calendar";

export async function POST(req: NextRequest) {
  if (!verifyVapiRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const toolCall: { id: string; function?: { arguments?: string } } =
    body.message?.toolCallList?.[0];
  if (!toolCall) return NextResponse.json({ error: "No tool call" }, { status: 400 });

  const toolCallId = toolCall.id;
  const args = JSON.parse(toolCall.function?.arguments ?? "{}");
  const assistantId: string = body.message?.call?.assistantId;

  const { customerName, customerPhone, customerAddress, problemSummary, slotISO } = args as Record<
    string,
    string
  >;

  const supabase = createAdminClient();
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("vapi_assistant_id", assistantId)
    .single();

  if (!client) return vapiErr(toolCallId, "Client not found.");

  const startDate = new Date(slotISO);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      client_id: client.id,
      scheduled_at: startDate.toISOString(),
      duration_min: 60,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_address: customerAddress ?? null,
      problem_summary: problemSummary ?? null,
      status: "scheduled",
    })
    .select()
    .single();

  if (error || !booking) {
    return vapiErr(toolCallId, "Failed to create booking. Please try again.");
  }

  if (client.google_refresh_token) {
    try {
      const eventId = await createEvent(client, supabase, {
        startISO: startDate.toISOString(),
        endISO: endDate.toISOString(),
        summary: `${problemSummary ?? "Service call"} — ${customerName}`,
        description: [
          `Customer: ${customerName}`,
          `Phone: ${customerPhone}`,
          customerAddress ? `Address: ${customerAddress}` : null,
          problemSummary ?? null,
        ]
          .filter(Boolean)
          .join("\n"),
      });

      if (eventId) {
        await supabase.from("bookings").update({ external_event_id: eventId }).eq("id", booking.id);
      }
    } catch {
      // booking confirmed even if calendar fails
    }
  }

  const slotLabel = startDate.toLocaleString("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return vapiOk(toolCallId, `Booked ${slotLabel} — confirmation sent to ${customerPhone}.`);
}
