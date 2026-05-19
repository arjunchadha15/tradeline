"use client";

import { useState, useRef } from "react";
import { Pencil } from "lucide-react";
import { updateBookingActualValue } from "@/lib/actions/bookings";

export function ActualValueEdit({ bookingId, value }: { bookingId: string; value: number | null }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(value ?? ""));
  const inputRef = useRef<HTMLInputElement>(null);

  async function save() {
    const num = parseFloat(val);
    if (!isNaN(num)) {
      await updateBookingActualValue(bookingId, num);
    }
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        autoFocus
        type="number"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => e.key === "Enter" && save()}
        className="w-24 rounded border px-2 py-0.5 text-sm"
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="group flex items-center gap-1 text-sm hover:text-foreground"
    >
      <span>{value != null ? `$${value.toLocaleString()}` : "—"}</span>
      <Pencil className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" />
    </button>
  );
}
