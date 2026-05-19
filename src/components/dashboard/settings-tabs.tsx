"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import {
  saveAgentSettings,
  savePricingSettings,
  saveAfterHoursMode,
  disconnectGoogle,
} from "@/lib/actions/settings";

type Client = {
  id: string;
  agent_name: string | null;
  greeting: string | null;
  avg_ticket_usd: number | null;
  close_rate: number | null;
  emergency_keywords: string[] | null;
  business_hours: unknown;
  pricing_json: unknown;
  twilio_number: string | null;
  after_hours_mode: boolean | null;
  google_refresh_token: string | null;
  google_calendar_id: string | null;
};

type BusinessHour = { open: string; close: string; closed: boolean };
type BusinessHours = Record<string, BusinessHour>;
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const DEFAULT_BH: BusinessHour = { open: "08:00", close: "17:00", closed: false };

function parseBH(raw: unknown): BusinessHours {
  if (!raw || typeof raw !== "object") {
    return DAYS.reduce((a, d) => ({ ...a, [d]: { ...DEFAULT_BH } }), {} as BusinessHours);
  }
  return DAYS.reduce((a, d) => {
    const entry = (raw as BusinessHours)[d] ?? DEFAULT_BH;
    return { ...a, [d]: entry };
  }, {} as BusinessHours);
}

function parsePricing(raw: unknown): Array<{ key: string; val: string }> {
  if (!raw || typeof raw !== "object") return [];
  return Object.entries(raw as Record<string, string>).map(([key, val]) => ({ key, val }));
}

export function SettingsTabs({
  client,
  googleEmail,
}: {
  client: Client;
  googleEmail?: string | null;
}) {
  const [keywords, setKeywords] = useState<string[]>(client.emergency_keywords ?? []);
  const [kwInput, setKwInput] = useState("");
  const [closeRate, setCloseRate] = useState(client.close_rate ?? 0.3);
  const [pricing, setPricing] = useState(parsePricing(client.pricing_json));
  const [bh, setBh] = useState(parseBH(client.business_hours));
  const [afterHours, setAfterHours] = useState(client.after_hours_mode ?? false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  function addKeyword() {
    const k = kwInput.trim();
    if (k && !keywords.includes(k)) setKeywords((p) => [...p, k]);
    setKwInput("");
  }

  async function handleAgentSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    fd.set("close_rate", String(closeRate));
    // Sync keywords
    fd.set("emergency_keywords", keywords.join(","));
    // Business hours
    DAYS.forEach((day) => {
      fd.set(`bh_${day}_open`, bh[day]?.open ?? "08:00");
      fd.set(`bh_${day}_close`, bh[day]?.close ?? "17:00");
      if (bh[day]?.closed) fd.set(`bh_${day}_closed`, "on");
    });
    await saveAgentSettings(fd);
    setMsg("Saved!");
    setSaving(false);
    setTimeout(() => setMsg(""), 2000);
  }

  async function handlePricingSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    await savePricingSettings(fd);
    setMsg("Saved!");
    setSaving(false);
    setTimeout(() => setMsg(""), 2000);
  }

  async function toggleAfterHours(val: boolean) {
    setAfterHours(val);
    await saveAfterHoursMode(client.id, val);
  }

  async function handleDisconnectGoogle() {
    if (!confirm("Disconnect Google Calendar?")) return;
    await disconnectGoogle(client.id);
  }

  return (
    <Tabs defaultValue="agent">
      <TabsList className="mb-6">
        <TabsTrigger value="agent">Agent</TabsTrigger>
        <TabsTrigger value="pricing">Pricing</TabsTrigger>
        <TabsTrigger value="numbers">Numbers</TabsTrigger>
        <TabsTrigger value="calendar">Calendar</TabsTrigger>
      </TabsList>

      {/* Agent Tab */}
      <TabsContent value="agent">
        <form onSubmit={handleAgentSave}>
          <Card>
            <CardHeader>
              <CardTitle>Agent settings</CardTitle>
              <CardDescription>Configure how your AI answering agent behaves.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="agent_name">Agent name</Label>
                <Input
                  id="agent_name"
                  name="agent_name"
                  defaultValue={client.agent_name ?? "Mike"}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="greeting">Greeting</Label>
                <Textarea
                  id="greeting"
                  name="greeting"
                  rows={3}
                  defaultValue={client.greeting ?? ""}
                  placeholder="Hi, thanks for calling…"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="avg_ticket_usd">Avg ticket ($)</Label>
                  <Input
                    id="avg_ticket_usd"
                    name="avg_ticket_usd"
                    type="number"
                    defaultValue={client.avg_ticket_usd ?? ""}
                    placeholder="350"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Close rate: {Math.round(closeRate * 100)}%</Label>
                  <Slider
                    min={0}
                    max={1}
                    step={0.01}
                    value={[closeRate]}
                    onValueChange={([v]) => setCloseRate(v)}
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Emergency keywords */}
              <div className="space-y-1.5">
                <Label>Emergency keywords</Label>
                <div className="flex flex-wrap gap-1.5 rounded-md border p-2">
                  {keywords.map((k) => (
                    <Badge key={k} variant="secondary" className="gap-1">
                      {k}
                      <button
                        type="button"
                        onClick={() => setKeywords((p) => p.filter((x) => x !== k))}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  <input
                    value={kwInput}
                    onChange={(e) => setKwInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                    placeholder="Add keyword…"
                    className="min-w-[120px] flex-1 bg-transparent text-sm outline-none"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Press Enter to add. Triggers emergency SMS.
                </p>
              </div>

              {/* Business hours */}
              <div className="space-y-2">
                <Label>Business hours</Label>
                <div className="space-y-1">
                  {DAYS.map((day) => (
                    <div key={day} className="flex items-center gap-3 text-sm">
                      <span className="w-8 text-muted-foreground">{day}</span>
                      <Switch
                        checked={!bh[day]?.closed}
                        onCheckedChange={(v) =>
                          setBh((p) => ({ ...p, [day]: { ...p[day], closed: !v } }))
                        }
                      />
                      {!bh[day]?.closed && (
                        <>
                          <input
                            type="time"
                            value={bh[day]?.open ?? "08:00"}
                            onChange={(e) =>
                              setBh((p) => ({ ...p, [day]: { ...p[day], open: e.target.value } }))
                            }
                            className="rounded border px-2 py-0.5 text-xs"
                          />
                          <span className="text-muted-foreground">–</span>
                          <input
                            type="time"
                            value={bh[day]?.close ?? "17:00"}
                            onChange={(e) =>
                              setBh((p) => ({ ...p, [day]: { ...p[day], close: e.target.value } }))
                            }
                            className="rounded border px-2 py-0.5 text-xs"
                          />
                        </>
                      )}
                      {bh[day]?.closed && (
                        <span className="text-xs text-muted-foreground">Closed</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
                {msg && <span className="text-sm text-green-600">{msg}</span>}
              </div>
            </CardContent>
          </Card>
        </form>
      </TabsContent>

      {/* Pricing Tab */}
      <TabsContent value="pricing">
        <form onSubmit={handlePricingSave}>
          <Card>
            <CardHeader>
              <CardTitle>Price list</CardTitle>
              <CardDescription>
                What {client.agent_name ?? "Mike"} quotes on the phone. Final price is always
                &ldquo;after the tech sees the job.&rdquo;
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {pricing.map((row, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      name="pricing_key"
                      defaultValue={row.key}
                      placeholder="Service description"
                      className="flex-1 rounded-md border px-3 py-1.5 text-sm"
                    />
                    <input
                      name="pricing_val"
                      defaultValue={row.val}
                      placeholder="Price range"
                      className="w-40 rounded-md border px-3 py-1.5 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setPricing((p) => p.filter((_, j) => j !== i))}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPricing((p) => [...p, { key: "", val: "" }])}
              >
                <Plus className="mr-1 h-3 w-3" /> Add row
              </Button>

              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save price list"}
                </Button>
                {msg && <span className="text-sm text-green-600">{msg}</span>}
              </div>
            </CardContent>
          </Card>
        </form>
      </TabsContent>

      {/* Numbers Tab */}
      <TabsContent value="numbers">
        <Card>
          <CardHeader>
            <CardTitle>Your TradeLine number</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {client.twilio_number ? (
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg font-semibold">{client.twilio_number}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(client.twilio_number!)}
                >
                  Copy
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No number assigned yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Call forwarding setup</CardTitle>
            <CardDescription>
              Enter these codes from your cell phone to route calls to your TradeLine number.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="space-y-2 rounded-md bg-muted p-3 font-mono">
              <p>*72 {client.twilio_number ?? "[your number]"} → Forward all calls</p>
              <p>*73 → Cancel forward all</p>
              <p>
                *71 {client.twilio_number ?? "[your number]"} → Forward when no answer (~4 rings)
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              After-hours mode: toggle below to forward all calls automatically when you&apos;re off
              the clock.
            </p>
            <div className="flex items-center gap-3">
              <Switch checked={afterHours} onCheckedChange={toggleAfterHours} />
              <span className="text-sm">
                {afterHours ? "After-hours mode ON — all calls forwarded" : "After-hours mode OFF"}
              </span>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Calendar Tab */}
      <TabsContent value="calendar">
        <Card>
          <CardHeader>
            <CardTitle>Google Calendar</CardTitle>
            <CardDescription>
              Connect your Google Calendar so your AI agent can check availability and create
              bookings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {client.google_refresh_token ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-green-600">Connected ✓</span>
                  {googleEmail && (
                    <span className="text-sm text-muted-foreground">{googleEmail}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href="/api/google/connect">Reconnect</a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={handleDisconnectGoogle}
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <Button asChild>
                <a href="/api/google/connect">Connect Google Calendar</a>
              </Button>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
