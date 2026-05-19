import { NextResponse } from "next/server";

export function vapiOk(toolCallId: string, result: unknown) {
  return NextResponse.json({ results: [{ toolCallId, result }] });
}

export function vapiErr(toolCallId: string, message: string) {
  return NextResponse.json({ results: [{ toolCallId, result: message }] });
}

// Vapi may send arguments as a pre-parsed object or as a JSON string
export function parseArgs(raw: unknown): Record<string, unknown> {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return (raw as Record<string, unknown>) ?? {};
}
