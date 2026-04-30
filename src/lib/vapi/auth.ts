import { timingSafeEqual } from "crypto";
import { NextRequest } from "next/server";

export function verifyVapiRequest(req: NextRequest): boolean {
  const secret = req.headers.get("x-vapi-secret");
  const expected = process.env.VAPI_WEBHOOK_SECRET;
  if (!secret || !expected) return false;
  try {
    const a = Buffer.from(secret);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
