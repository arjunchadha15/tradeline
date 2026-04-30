import { NextRequest, NextResponse } from "next/server";
import { verifyVapiRequest } from "@/lib/vapi/auth";
import { vapiOk, vapiErr } from "@/lib/vapi/respond";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSms } from "@/lib/twilio/sms";

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

  const { callerName, callerPhone, address, summary, triggerKeyword } = args;

  const supabase = createAdminClient();
  const { data: client } = await supabase
    .from("clients")
    .select("id, owner_phone")
    .eq("vapi_assistant_id", assistantId)
    .single();

  if (!client) return vapiErr(toolCallId, "Client not found.");

  const smsBody = [
    `🚨 EMERGENCY — ${callerName ?? "Unknown"} (${callerPhone ?? "no phone"})`,
    address ?? "Address unknown",
    summary ?? "",
    `Tap to call: tel:${callerPhone ?? ""}`,
  ]
    .filter(Boolean)
    .join("\n");

  let smsSid: string | null = null;
  try {
    smsSid = await sendSms(client.owner_phone, smsBody);
  } catch {
    return vapiErr(toolCallId, "Failed to send emergency SMS.");
  }

  await supabase.from("emergencies").insert({
    client_id: client.id,
    trigger_keyword: triggerKeyword ?? null,
    summary: summary ?? null,
    sms_sid: smsSid,
  });

  return vapiOk(toolCallId, "Owner notified, SMS sent.");
}
