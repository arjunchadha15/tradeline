import { google } from "googleapis";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type ClientRow = Database["public"]["Tables"]["clients"]["Row"];

function getOAuthClient(clientRow: ClientRow) {
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.APP_URL}/api/google/callback`
  );
  oauth2.setCredentials({
    refresh_token: clientRow.google_refresh_token ?? undefined,
    access_token: clientRow.google_access_token ?? undefined,
    expiry_date: clientRow.google_token_expires_at
      ? new Date(clientRow.google_token_expires_at).getTime()
      : undefined,
  });
  return oauth2;
}

async function refreshIfNeeded(
  clientRow: ClientRow,
  supabase: SupabaseClient<Database>
): Promise<ClientRow> {
  if (!clientRow.google_token_expires_at) return clientRow;

  const expiresAt = new Date(clientRow.google_token_expires_at).getTime();
  if (expiresAt > Date.now() + 60_000) return clientRow;

  const oauth2 = getOAuthClient(clientRow);
  const { credentials } = await oauth2.refreshAccessToken();

  const patch = {
    google_access_token: credentials.access_token ?? null,
    google_token_expires_at: credentials.expiry_date
      ? new Date(credentials.expiry_date).toISOString()
      : null,
  };

  await supabase.from("clients").update(patch).eq("id", clientRow.id);

  return { ...clientRow, ...patch };
}

export async function listFreeBusy(
  clientRow: ClientRow,
  supabase: SupabaseClient<Database>,
  startISO: string,
  endISO: string
): Promise<Array<{ start: string; end: string }>> {
  const fresh = await refreshIfNeeded(clientRow, supabase);
  const oauth2 = getOAuthClient(fresh);
  const calendar = google.calendar({ version: "v3", auth: oauth2 });

  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin: startISO,
      timeMax: endISO,
      items: [{ id: clientRow.google_calendar_id ?? "primary" }],
    },
  });

  const calId = clientRow.google_calendar_id ?? "primary";
  const busy = res.data.calendars?.[calId]?.busy ?? [];
  return busy.filter((b) => b.start && b.end).map((b) => ({ start: b.start!, end: b.end! }));
}

export async function createEvent(
  clientRow: ClientRow,
  supabase: SupabaseClient<Database>,
  opts: {
    startISO: string;
    endISO: string;
    summary: string;
    description?: string;
  }
): Promise<string | null> {
  const fresh = await refreshIfNeeded(clientRow, supabase);
  const oauth2 = getOAuthClient(fresh);
  const calendar = google.calendar({ version: "v3", auth: oauth2 });

  const res = await calendar.events.insert({
    calendarId: clientRow.google_calendar_id ?? "primary",
    requestBody: {
      summary: opts.summary,
      description: opts.description,
      start: { dateTime: opts.startISO, timeZone: "America/New_York" },
      end: { dateTime: opts.endISO, timeZone: "America/New_York" },
    },
  });

  return res.data.id ?? null;
}
