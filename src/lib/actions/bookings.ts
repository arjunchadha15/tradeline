"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateBookingStatus(bookingId: string, status: string) {
  const supabase = await createClient();
  await supabase.from("bookings").update({ status }).eq("id", bookingId);
  revalidatePath("/dashboard/calendar");
}

export async function updateBookingActualValue(bookingId: string, value: number) {
  const supabase = await createClient();
  await supabase.from("bookings").update({ actual_value_usd: value }).eq("id", bookingId);
  revalidatePath("/dashboard/revenue");
}
