import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // owner_user_id

  if (!code || !state) {
    return NextResponse.redirect(`${process.env.APP_URL}/dashboard/settings?google=error`);
  }

  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.APP_URL}/api/google/callback`
  );

  try {
    const { tokens } = await oauth2.getToken(code);

    const supabase = createAdminClient();
    await supabase
      .from("clients")
      .update({
        google_refresh_token: tokens.refresh_token ?? null,
        google_access_token: tokens.access_token ?? null,
        google_token_expires_at: tokens.expiry_date
          ? new Date(tokens.expiry_date).toISOString()
          : null,
      })
      .eq("owner_user_id", state);
  } catch {
    return NextResponse.redirect(`${process.env.APP_URL}/dashboard/settings?google=error`);
  }

  return NextResponse.redirect(`${process.env.APP_URL}/dashboard/settings?google=connected`);
}
