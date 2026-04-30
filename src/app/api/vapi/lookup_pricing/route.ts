import { NextRequest, NextResponse } from "next/server";
import { verifyVapiRequest } from "@/lib/vapi/auth";
import { vapiOk, vapiErr } from "@/lib/vapi/respond";
import { createAdminClient } from "@/lib/supabase/admin";

function scorePricingKey(key: string, tokens: string[]): number {
  const lower = key.toLowerCase();
  return tokens.filter((t) => lower.includes(t)).length;
}

export async function POST(req: NextRequest) {
  if (!verifyVapiRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const toolCalls: Array<{ id: string; function?: { arguments?: string } }> =
    body.message?.toolCallList ?? [];
  if (toolCalls.length === 0) return NextResponse.json({ error: "No tool call" }, { status: 400 });

  const assistantId: string = body.message?.call?.assistantId;
  const supabase = createAdminClient();
  const { data: client } = await supabase
    .from("clients")
    .select("pricing_json, owner_name")
    .eq("vapi_assistant_id", assistantId)
    .single();

  const results = toolCalls.map((tc) => {
    if (!client) return { toolCallId: tc.id, result: "Client not found." };

    const args = JSON.parse(tc.function?.arguments ?? "{}");
    const query: string = args.query ?? "";
    const pricing = (client.pricing_json ?? {}) as Record<string, string>;
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);

    const scored = Object.entries(pricing)
      .map(([key, price]) => ({ key, price, score: scorePricingKey(key, tokens) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    if (scored.length === 0) {
      return {
        toolCallId: tc.id,
        result: `No price match — ${client.owner_name} will give an exact number when he sees the job.`,
      };
    }

    const result = scored
      .map((x) => `${x.key}: ${x.price} (final after the tech sees the job)`)
      .join("; ");

    return { toolCallId: tc.id, result };
  });

  return NextResponse.json({ results });
}
