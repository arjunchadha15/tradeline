import { NextRequest, NextResponse } from "next/server";
import { verifyVapiRequest } from "@/lib/vapi/auth";
import { vapiOk, vapiErr } from "@/lib/vapi/respond";
import { createAdminClient } from "@/lib/supabase/admin";
import { listFreeBusy } from "@/lib/google/calendar";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

// Returns the NY timezone offset in hours (e.g. -5 for EST, -4 for EDT)
// by probing a known UTC time and comparing to the NY display hour.
function getNYOffsetHours(date: Date): number {
  const nyHour =
    parseInt(
      date.toLocaleTimeString("en-US", {
        timeZone: "America/New_York",
        hour: "numeric",
        hour12: false,
      })
    ) % 24;
  return nyHour - date.getUTCHours();
}

// Get the next `count` business days (YYYY-MM-DD strings in NY calendar).
function getNextBusinessDays(businessHours: Record<string, number[] | null>, count = 5): string[] {
  const days: string[] = [];
  const nyTodayStr = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  });
  const [y, m, d] = nyTodayStr.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d)); // midnight UTC = NY calendar date

  for (let i = 1; days.length < count && i <= 21; i++) {
    const candidate = new Date(base);
    candidate.setUTCDate(base.getUTCDate() + i);
    const dayKey = DAY_KEYS[candidate.getUTCDay()];
    if (businessHours[dayKey]) {
      days.push(candidate.toISOString().split("T")[0]);
    }
  }
  return days;
}

// Convert a NY hour on a given date string (YYYY-MM-DD) to a UTC ISO string.
function makeSlotISO(nyDateStr: string, nyHour: number): string {
  // Probe noon UTC on this date to get accurate DST offset
  const [y, m, d] = nyDateStr.split("-").map(Number);
  const noonUTC = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const offsetHours = getNYOffsetHours(noonUTC); // negative (e.g. -5)
  const utcHour = nyHour - offsetHours; // e.g. 9 - (-5) = 14
  const slot = new Date(Date.UTC(y, m - 1, d));
  slot.setUTCHours(utcHour);
  return slot.toISOString();
}

function formatSlot(isoStr: string): string {
  return new Date(isoStr).toLocaleString("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

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

  const supabase = createAdminClient();
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("vapi_assistant_id", assistantId)
    .single();

  if (!client) return vapiErr(toolCallId, "Client not found.");

  const businessHours = (client.business_hours ?? {}) as Record<string, number[] | null>;
  const days = getNextBusinessDays(businessHours);

  const startISO: string = args.startISO ?? `${days[0]}T00:00:00Z`;
  const endISO: string = args.endISO ?? `${days[days.length - 1]}T23:59:59Z`;

  let busy: Array<{ start: string; end: string }> = [];
  if (client.google_refresh_token) {
    try {
      busy = await listFreeBusy(client, supabase, startISO, endISO);
    } catch {
      // continue without calendar data
    }
  }

  const suggested: string[] = [];

  for (const dateStr of days) {
    if (suggested.length >= 5) break;
    const dayKey = DAY_KEYS[new Date(dateStr + "T12:00:00Z").getUTCDay()];
    const hours = businessHours[dayKey] as number[] | null;
    if (!hours) continue;

    for (let h = hours[0]; h < hours[1] && suggested.length < 5; h++) {
      const slotStart = makeSlotISO(dateStr, h);
      const slotEnd = makeSlotISO(dateStr, h + 1);

      const overlaps = busy.some(
        (b) => new Date(b.start) < new Date(slotEnd) && new Date(b.end) > new Date(slotStart)
      );

      if (!overlaps) suggested.push(formatSlot(slotStart));
    }
  }

  if (suggested.length === 0) {
    return vapiOk(toolCallId, "No available slots found in the next 5 business days.");
  }

  const note = client.google_refresh_token
    ? ""
    : " (calendar not connected — availability is approximate)";

  return vapiOk(toolCallId, `Available slots${note}: ${suggested.join(", ")}`);
}
