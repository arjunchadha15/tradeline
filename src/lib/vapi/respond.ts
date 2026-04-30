import { NextResponse } from "next/server";

export function vapiOk(toolCallId: string, result: unknown) {
  return NextResponse.json({ results: [{ toolCallId, result }] });
}

export function vapiErr(toolCallId: string, message: string) {
  return NextResponse.json({ results: [{ toolCallId, result: message }] });
}
