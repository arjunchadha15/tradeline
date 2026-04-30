import { NextRequest, NextResponse } from "next/server";
import { verifyVapiRequest } from "@/lib/vapi/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  if (!verifyVapiRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const msg = body.message ?? {};
  const call = msg.call ?? {};
  const assistantId: string = call.assistantId;

  const supabase = createAdminClient();
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("vapi_assistant_id", assistantId)
    .single();

  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const structured = msg.structuredData ?? {};
  const cost =
    typeof msg.cost === "number"
      ? msg.cost
      : typeof msg.cost === "object" && msg.cost !== null
        ? (msg.cost.total ?? null)
        : null;

  await supabase.from("calls").insert({
    client_id: client.id,
    vapi_call_id: call.id ?? null,
    caller_name: structured.callerName ?? null,
    caller_phone: structured.callerPhone ?? null,
    caller_address: structured.callerAddress ?? null,
    problem_summary: structured.problemSummary ?? null,
    urgency: structured.urgency ?? null,
    outcome: structured.outcome ?? null,
    transcript: msg.transcript ?? call.transcript ?? null,
    summary: msg.summary ?? call.summary ?? null,
    structured_data: structured,
    audio_url: msg.recordingUrl ?? call.recordingUrl ?? null,
    cost_usd: cost,
    started_at: call.startedAt ?? null,
    ended_at: call.endedAt ?? null,
  });

  return NextResponse.json({ received: true });
}
