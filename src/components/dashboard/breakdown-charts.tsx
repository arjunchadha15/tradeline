"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

type BreakdownRow = { label: string; revenue: number };

const COLORS = [
  "hsl(var(--primary))",
  "hsl(215, 70%, 55%)",
  "hsl(170, 60%, 45%)",
  "hsl(35, 80%, 55%)",
  "hsl(280, 55%, 55%)",
  "hsl(345, 65%, 55%)",
  "hsl(195, 65%, 50%)",
  "hsl(90, 50%, 48%)",
];

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function RepairTypeChart({ data }: { data: BreakdownRow[] }) {
  if (!data.length) return <EmptyState message="No completed jobs with recorded revenue yet." />;

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 40)}>
      <BarChart layout="vertical" data={data} margin={{ top: 4, right: 60, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
        <XAxis
          type="number"
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fontSize: 11 }}
          width={140}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(v) => [`$${Number(v).toLocaleString()}`, "Revenue"]}
          cursor={{ fill: "hsl(var(--muted))" }}
        />
        <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LocationChart({ data }: { data: BreakdownRow[] }) {
  if (!data.length)
    return <EmptyState message="No location data yet — addresses needed on bookings." />;

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 40)}>
      <BarChart layout="vertical" data={data} margin={{ top: 4, right: 60, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
        <XAxis
          type="number"
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fontSize: 11 }}
          width={120}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(v) => [`$${Number(v).toLocaleString()}`, "Revenue"]}
          cursor={{ fill: "hsl(var(--muted))" }}
        />
        <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
