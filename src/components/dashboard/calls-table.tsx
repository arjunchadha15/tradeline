"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatPretty } from "@/lib/phone";

type Call = {
  id: string;
  created_at: string | null;
  caller_name: string | null;
  caller_phone: string | null;
  caller_address: string | null;
  urgency: string | null;
  outcome: string | null;
  duration_sec: number | null;
  transcript: string | null;
  audio_url: string | null;
  structured_data: unknown;
  summary: string | null;
};

function relativeTime(iso: string | null) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtDuration(sec: number | null) {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function UrgencyBadge({ urgency }: { urgency: string | null }) {
  if (urgency === "emergency") return <Badge variant="destructive">emergency</Badge>;
  if (urgency === "same_day")
    return <Badge className="bg-amber-500 text-white hover:bg-amber-600">same day</Badge>;
  return <Badge variant="secondary">{urgency ?? "standard"}</Badge>;
}

function OutcomeBadge({ outcome }: { outcome: string | null }) {
  if (outcome === "booked")
    return <Badge className="bg-green-600 text-white hover:bg-green-700">booked</Badge>;
  if (outcome === "escalated") return <Badge variant="destructive">escalated</Badge>;
  if (outcome === "message")
    return <Badge className="bg-blue-500 text-white hover:bg-blue-600">message</Badge>;
  if (outcome === "abandoned") return <Badge variant="outline">abandoned</Badge>;
  return <Badge variant="secondary">{outcome ?? "—"}</Badge>;
}

function TranscriptView({ transcript }: { transcript: string | null }) {
  if (!transcript) return <p className="text-sm text-muted-foreground">No transcript available.</p>;
  const lines = transcript.split("\n").filter(Boolean);
  return (
    <div className="space-y-2 font-mono text-xs">
      {lines.map((line, i) => {
        const isAI = /^(AI|Assistant|Mike):/i.test(line);
        return (
          <p key={i} className={isAI ? "text-blue-600" : "text-foreground"}>
            {line}
          </p>
        );
      })}
    </div>
  );
}

const FILTERS = ["all", "today", "week", "emergencies", "abandoned"] as const;
type Filter = (typeof FILTERS)[number];

function filterCalls(calls: Call[], filter: Filter, query: string) {
  let result = calls;
  const now = Date.now();
  if (filter === "today") {
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    result = result.filter((c) => c.created_at && new Date(c.created_at) >= midnight);
  } else if (filter === "week") {
    result = result.filter(
      (c) => c.created_at && now - new Date(c.created_at).getTime() < 7 * 86400000
    );
  } else if (filter === "emergencies") {
    result = result.filter((c) => c.urgency === "emergency");
  } else if (filter === "abandoned") {
    result = result.filter((c) => c.outcome === "abandoned");
  }
  if (query) {
    const q = query.toLowerCase();
    result = result.filter(
      (c) => c.caller_name?.toLowerCase().includes(q) || c.caller_phone?.includes(q)
    );
  }
  return result;
}

export function CallsTable({ calls }: { calls: Call[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Call | null>(null);

  const filtered = filterCalls(calls, filter, query);

  return (
    <>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  filter === f
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "all"
                  ? "All"
                  : f === "today"
                    ? "Today"
                    : f === "week"
                      ? "Last 7 days"
                      : f === "emergencies"
                        ? "Emergencies"
                        : "Abandoned"}
              </button>
            ))}
          </div>
          <Input
            placeholder="Search by name or phone..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8 w-56 text-sm"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-lg border py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No calls yet — share your number to start catching missed calls.
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Time</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Caller</th>
                  <th className="hidden px-4 py-2 text-left font-medium text-muted-foreground md:table-cell">
                    Address
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Urgency</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Outcome</th>
                  <th className="hidden px-4 py-2 text-left font-medium text-muted-foreground sm:table-cell">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((call) => (
                  <tr
                    key={call.id}
                    className="cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/50"
                    onClick={() => setSelected(call)}
                  >
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {relativeTime(call.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{call.caller_name ?? "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatPretty(call.caller_phone ?? "")}
                      </p>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">
                      {call.caller_address ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <UrgencyBadge urgency={call.urgency} />
                    </td>
                    <td className="px-4 py-3">
                      <OutcomeBadge outcome={call.outcome} />
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-muted-foreground sm:table-cell">
                      {fmtDuration(call.duration_sec)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle>{selected.caller_name ?? "Unknown caller"}</SheetTitle>
                <SheetDescription className="space-y-1">
                  <a
                    href={`tel:${selected.caller_phone}`}
                    className="block font-medium text-foreground hover:underline"
                  >
                    {formatPretty(selected.caller_phone ?? "")}
                  </a>
                  <UrgencyBadge urgency={selected.urgency} />
                </SheetDescription>
              </SheetHeader>

              <Tabs defaultValue="transcript">
                <TabsList className="mb-4">
                  <TabsTrigger value="transcript">Transcript</TabsTrigger>
                  <TabsTrigger value="audio">Audio</TabsTrigger>
                  <TabsTrigger value="raw">Raw</TabsTrigger>
                </TabsList>

                <TabsContent value="transcript">
                  <TranscriptView transcript={selected.transcript} />
                </TabsContent>

                <TabsContent value="audio">
                  {selected.audio_url ? (
                    <audio controls src={selected.audio_url} className="w-full" />
                  ) : (
                    <p className="text-sm text-muted-foreground">No audio recording available.</p>
                  )}
                </TabsContent>

                <TabsContent value="raw">
                  <pre className="overflow-auto rounded-md bg-muted p-3 text-xs">
                    {JSON.stringify(selected.structured_data, null, 2)}
                  </pre>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
