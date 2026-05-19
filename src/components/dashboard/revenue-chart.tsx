"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type WeekData = {
  week: string;
  estimated: number;
  actual: number;
};

export function RevenueChart({ data }: { data: WeekData[] }) {
  if (!data.length) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
        <p className="text-sm text-muted-foreground">No booking data yet.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="week" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v.toLocaleString()}`} />
        <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, ""]} />
        <Legend />
        <Line
          type="monotone"
          dataKey="estimated"
          stroke="hsl(var(--primary))"
          strokeDasharray="5 5"
          dot={false}
          name="Estimated"
        />
        <Line
          type="monotone"
          dataKey="actual"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={false}
          name="Actual"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
