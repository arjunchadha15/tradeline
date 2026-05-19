"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveAgentSettings(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: client } = await supabase
    .from("clients")
    .select("id,business_hours")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!client) return;

  const agent_name = formData.get("agent_name") as string;
  const greeting = formData.get("greeting") as string;
  const avg_ticket_usd = parseFloat(formData.get("avg_ticket_usd") as string) || null;
  const close_rate = parseFloat(formData.get("close_rate") as string) || null;
  const emergency_keywords_raw = formData.get("emergency_keywords") as string;
  const emergency_keywords = emergency_keywords_raw
    ? emergency_keywords_raw
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean)
    : [];

  // Business hours: 7 day entries from form
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const business_hours = days.reduce(
    (acc, day) => {
      acc[day] = {
        open: formData.get(`bh_${day}_open`) as string,
        close: formData.get(`bh_${day}_close`) as string,
        closed: formData.get(`bh_${day}_closed`) === "on",
      };
      return acc;
    },
    {} as Record<string, { open: string; close: string; closed: boolean }>
  );

  await supabase
    .from("clients")
    .update({
      agent_name,
      greeting,
      avg_ticket_usd,
      close_rate,
      emergency_keywords,
      business_hours,
    })
    .eq("id", client.id);

  revalidatePath("/dashboard/settings");
}

export async function savePricingSettings(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!client) return;

  const keys = formData.getAll("pricing_key") as string[];
  const vals = formData.getAll("pricing_val") as string[];
  const pricing_json: Record<string, string> = {};
  keys.forEach((k, i) => {
    if (k.trim()) pricing_json[k.trim()] = vals[i]?.trim() ?? "";
  });

  await supabase.from("clients").update({ pricing_json }).eq("id", client.id);
  revalidatePath("/dashboard/settings");
}

export async function saveAfterHoursMode(clientId: string, value: boolean) {
  const supabase = await createClient();
  await supabase.from("clients").update({ after_hours_mode: value }).eq("id", clientId);
  revalidatePath("/dashboard/settings");
}

export async function disconnectGoogle(clientId: string) {
  const supabase = await createClient();
  await supabase
    .from("clients")
    .update({
      google_refresh_token: null,
      google_access_token: null,
      google_calendar_id: null,
      google_token_expires_at: null,
    })
    .eq("id", clientId);
  revalidatePath("/dashboard/settings");
}
