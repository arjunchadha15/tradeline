import { NextRequest, NextResponse } from "next/server";
import { verifyVapiRequest } from "@/lib/vapi/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeE164 } from "@/lib/phone";

export async function POST(req: NextRequest) {
  if (!verifyVapiRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const msg = body.message ?? {};

  // Accept both top-level end-of-call-report and nested structures
  if (msg.type && msg.type !== "end-of-call-report") {
    return NextResponse.json({ received: true });
  }

  const call = msg.call ?? {};
  const assistantId: string = call.assistantId;

  const supabase = createAdminClient();
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("vapi_assistant_id", assistantId)
    .single();

  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const structured = msg.analysis?.structuredData ?? msg.structuredData ?? {};
  const cost =
    typeof msg.cost === "number"
      ? msg.cost
      : typeof msg.cost === "object" && msg.cost !== null
        ? (msg.cost.total ?? null)
        : null;

  const rawPhone = structured.callerPhone ?? null;
  const callerPhone = rawPhone ? normalizeE164(rawPhone) || rawPhone : null;

  const startedAt = msg.startedAt ?? call.startedAt ?? null;
  const endedAt = msg.endedAt ?? call.endedAt ?? null;
  const durationSec =
    startedAt && endedAt
      ? Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000)
      : null;

  await supabase.from("calls").upsert(
    {
      client_id: client.id,
      vapi_call_id: call.id ?? null,
      caller_name: structured.callerName ?? null,
      caller_phone: callerPhone,
      caller_address: structured.callerAddress ?? null,
      problem_summary: structured.problemSummary ?? null,
      urgency: structured.urgency ?? null,
      outcome: structured.outcome ?? null,
      transcript: msg.transcript ?? call.transcript ?? null,
      summary: msg.summary ?? call.summary ?? null,
      structured_data: structured,
      audio_url: msg.recordingUrl ?? call.recordingUrl ?? null,
      cost_usd: cost,
      started_at: startedAt,
      ended_at: endedAt,
      duration_sec: durationSec,
    },
    { onConflict: "vapi_call_id", ignoreDuplicates: false }
  );

  return NextResponse.json({ received: true });
}
