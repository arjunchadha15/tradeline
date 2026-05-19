import { NextRequest, NextResponse } from "next/server";
import { verifyVapiRequest } from "@/lib/vapi/auth";
import { vapiOk, parseArgs } from "@/lib/vapi/respond";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSms } from "@/lib/twilio/sms";
import { normalizeE164 } from "@/lib/phone";

export async function POST(req: NextRequest) {
  if (!verifyVapiRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  console.log("[vapi] send_emergency_sms body:", JSON.stringify(body));

  const toolCall: { id: string; function?: { arguments?: string } } =
    body.message?.toolCallList?.[0];
  if (!toolCall) return NextResponse.json({ error: "No tool call" }, { status: 400 });

  const toolCallId = toolCall.id;
  const args = parseArgs(toolCall.function?.arguments);
  const assistantId: string = body.message?.call?.assistantId;

  const {
    callerName,
    callerPhone: rawCallerPhone,
    address,
    summary,
    triggerKeyword,
  } = args as Record<string, string>;
  const callerPhone = rawCallerPhone
    ? normalizeE164(rawCallerPhone) || rawCallerPhone
    : rawCallerPhone;

  const supabase = createAdminClient();

  try {
    const { data: client } = await supabase
      .from("clients")
      .select("id, owner_phone")
      .eq("vapi_assistant_id", assistantId)
      .single();

    if (!client) {
      console.error("[vapi] send_emergency_sms: client not found for assistantId", assistantId);
      const out = vapiOk(
        toolCallId,
        "Owner notified — the owner will be in touch right away. Anything else I can take down?"
      );
      console.log("[vapi] send_emergency_sms result:", JSON.stringify(out));
      return out;
    }

    const smsBody = [
      `EMERGENCY — ${callerName ?? "Unknown"} (${callerPhone ?? "no phone"})`,
      address ?? "Address unknown",
      summary ?? "",
      `Tap to call: tel:${callerPhone ?? ""}`,
    ]
      .filter(Boolean)
      .join("\n");

    let smsSid: string | null = null;
    let smsSent = false;
    try {
      smsSid = await sendSms(client.owner_phone, smsBody);
      smsSent = true;
    } catch (smsErr) {
      console.error(
        "!!! [vapi] send_emergency_sms: SMS FAILED TO SEND — owner was NOT notified !!!",
        smsErr
      );
    }

    // Always log the emergency, even if SMS didn't send
    await supabase.from("emergencies").insert({
      client_id: client.id,
      trigger_keyword: triggerKeyword ?? null,
      summary: summary ?? null,
      sms_sid: smsSid,
    });

    if (!smsSent) {
      console.error(
        "[vapi] send_emergency_sms: emergency logged to DB but SMS did NOT send for client",
        client.id
      );
    }

    const out = vapiOk(toolCallId, "Owner notified — the owner will be in touch right away.");
    console.log("[vapi] send_emergency_sms result:", JSON.stringify(out));
    return out;
  } catch (err) {
    console.error("[vapi] send_emergency_sms error:", err);

    // Best-effort: log the emergency to DB so the lead isn't lost
    try {
      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("vapi_assistant_id", assistantId)
        .single();
      if (client) {
        await supabase.from("emergencies").insert({
          client_id: client.id,
          trigger_keyword: triggerKeyword ?? null,
          summary: summary ?? null,
          sms_sid: null,
        });
        console.error(
          "[vapi] send_emergency_sms: emergency logged to DB but SMS NOT sent (fallback path)"
        );
      }
    } catch (saveErr) {
      console.error("[vapi] send_emergency_sms: failed to save fallback emergency log", saveErr);
    }

    const out = vapiOk(
      toolCallId,
      "Owner notified — the owner will be in touch right away. Anything else I can take down?"
    );
    console.log("[vapi] send_emergency_sms result:", JSON.stringify(out));
    return out;
  }
}
