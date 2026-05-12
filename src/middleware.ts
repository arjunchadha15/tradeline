import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - Next.js internals and static files
     * - /api/vapi/* — Vapi webhooks use their own secret-based auth, not session auth
     */
    "/((?!_next/static|_next/image|favicon.ico|api/vapi/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
