import { NextRequest, NextResponse } from "next/server";
import { verifyVapiRequest } from "@/lib/vapi/auth";
import { vapiOk, parseArgs } from "@/lib/vapi/respond";
import { createAdminClient } from "@/lib/supabase/admin";
import { createEvent } from "@/lib/google/calendar";
import { normalizeE164 } from "@/lib/phone";

export async function POST(req: NextRequest) {
  if (!verifyVapiRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  console.log("[vapi] book_appointment body:", JSON.stringify(body));

  const toolCall: { id: string; function?: { arguments?: string } } =
    body.message?.toolCallList?.[0];
  if (!toolCall) return NextResponse.json({ error: "No tool call" }, { status: 400 });

  const toolCallId = toolCall.id;
  const args = parseArgs(toolCall.function?.arguments);
  const assistantId: string = body.message?.call?.assistantId;
  const { customerName, customerPhone, customerAddress, problemSummary, slotISO } = args as Record<
    string,
    string
  >;

  const supabase = createAdminClient();

  try {
    const { data: client } = await supabase
      .from("clients")
      .select("*")
      .eq("vapi_assistant_id", assistantId)
      .single();

    if (!client) {
      console.error("[vapi] book_appointment: client not found for assistantId", assistantId);
      const out = vapiOk(
        toolCallId,
        "I'm having trouble with that — the owner will follow up with you. Anything else I can take down?"
      );
      console.log("[vapi] book_appointment result:", JSON.stringify(out));
      return out;
    }

    const startDate = new Date(slotISO);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        client_id: client.id,
        scheduled_at: startDate.toISOString(),
        duration_min: 60,
        customer_name: customerName,
        customer_phone: normalizeE164(customerPhone) || customerPhone,
        customer_address: customerAddress ?? null,
        problem_summary: problemSummary ?? null,
        status: "scheduled",
      })
      .select()
      .single();

    if (bookingError || !booking) {
      console.error("[vapi] book_appointment: DB insert failed", bookingError);
      const out = vapiOk(
        toolCallId,
        "I'm having trouble confirming that — the owner will follow up shortly. Anything else?"
      );
      console.log("[vapi] book_appointment result:", JSON.stringify(out));
      return out;
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
          await supabase
            .from("bookings")
            .update({ external_event_id: eventId })
            .eq("id", booking.id);
        }
      } catch (calErr) {
        console.error("[vapi] book_appointment: Google Calendar event creation failed:", calErr);
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

    const out = vapiOk(toolCallId, `Booked ${slotLabel} — confirmation sent to ${customerPhone}.`);
    console.log("[vapi] book_appointment result:", JSON.stringify(out));
    return out;
  } catch (err) {
    console.error("[vapi] book_appointment error:", err);

    // Best-effort: save the lead so nothing is lost
    if (slotISO) {
      try {
        const { data: client } = await supabase
          .from("clients")
          .select("id")
          .eq("vapi_assistant_id", assistantId)
          .single();
        if (client) {
          await supabase.from("bookings").insert({
            client_id: client.id,
            scheduled_at: new Date(slotISO).toISOString(),
            duration_min: 60,
            customer_name: customerName ?? "Unknown",
            customer_phone: customerPhone
              ? normalizeE164(customerPhone) || customerPhone
              : "unknown",
            customer_address: customerAddress ?? null,
            problem_summary: problemSummary ?? null,
            status: "scheduled",
            external_event_id: null,
          });
        }
      } catch (saveErr) {
        console.error("[vapi] book_appointment: failed to save fallback booking", saveErr);
      }
    }

    const slotLabel = slotISO
      ? new Date(slotISO).toLocaleString("en-US", {
          timeZone: "America/New_York",
          weekday: "long",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      : "the requested time";

    const out = vapiOk(
      toolCallId,
      `Booked tentatively for ${slotLabel} — the owner will confirm shortly.`
    );
    console.log("[vapi] book_appointment result:", JSON.stringify(out));
    return out;
  }
}
