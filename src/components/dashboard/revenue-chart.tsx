"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type WeekData = {
  week: string;
  revenue: number;
};

export function RevenueChart({ data }: { data: WeekData[] }) {
  if (!data.length) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
        <p className="text-sm text-muted-foreground">No revenue recorded yet.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
        <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(v) => [`$${Number(v).toLocaleString()}`, "Revenue"]}
          cursor={{ fill: "hsl(var(--muted))" }}
        />
        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MiniRevenueChart({ data }: { data: WeekData[] }) {
  if (!data.length) {
    return (
      <div className="flex h-28 items-center justify-center">
        <p className="text-xs text-muted-foreground">No revenue yet</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={110}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
        <XAxis dataKey="week" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip
          formatter={(v) => [`$${Number(v).toLocaleString()}`, "Revenue"]}
          cursor={{ fill: "hsl(var(--muted))" }}
        />
        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
