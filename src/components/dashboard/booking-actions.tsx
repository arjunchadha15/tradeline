"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { updateBookingStatus } from "@/lib/actions/bookings";

export function BookingActions({ bookingId }: { bookingId: string }) {
  const [loading, setLoading] = useState(false);

  async function handle(status: string) {
    setLoading(true);
    await updateBookingStatus(bookingId, status);
    setLoading(false);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={loading}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handle("completed")}>Mark completed</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handle("no_show")}>Mark no-show</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handle("cancelled")} className="text-destructive">
          Cancel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
