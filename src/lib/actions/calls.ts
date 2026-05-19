"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeE164 } from "@/lib/phone";

export async function updateCallRecord(
  callId: string,
  fields: {
    caller_name?: string;
    caller_phone?: string;
    caller_address?: string;
    urgency?: string;
    outcome?: string;
    problem_summary?: string;
  }
) {
  const supabase = await createClient();

  const update = { ...fields };
  if (update.caller_phone) {
    update.caller_phone = normalizeE164(update.caller_phone) || update.caller_phone;
  }

  await supabase.from("calls").update(update).eq("id", callId);
  revalidatePath("/dashboard/calls");
}

export async function updateBookingActualValue(bookingId: string, actual: number | null) {
  const supabase = await createClient();
  await supabase.from("bookings").update({ actual_value_usd: actual }).eq("id", bookingId);
  revalidatePath("/dashboard/calls");
  revalidatePath("/dashboard/revenue");
}

export async function updateCallJobValue(callId: string, value: number | null) {
  const supabase = await createClient();
  const { data: call } = await supabase
    .from("calls")
    .select("structured_data")
    .eq("id", callId)
    .single();
  const existing = (call?.structured_data as Record<string, unknown>) ?? {};
  await supabase
    .from("calls")
    .update({ structured_data: { ...existing, jobValue: value } })
    .eq("id", callId);
  revalidatePath("/dashboard/calls");
  revalidatePath("/dashboard/revenue");
}
