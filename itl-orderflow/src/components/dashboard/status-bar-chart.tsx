"use client";

import { BarChart, Bar, XAxis, Tooltip, Cell, ResponsiveContainer } from "recharts";

interface StatusBarChartProps {
  data: { name: string; color: string; count: number }[];
}

export function StatusBarChart({ data }: StatusBarChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} barCategoryGap="24%">
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: "#6b7280", fontWeight: 600 }}
        />
        <Tooltip
          cursor={{ fill: "rgba(15, 23, 42, 0.04)" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const item = payload[0].payload as { name: string; color: string; count: number };
            const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
            return (
              <div className="bg-white rounded-lg border border-[#dbdfe6] shadow-md px-3 py-2 text-sm">
                <p className="font-semibold" style={{ color: item.color }}>
                  {item.name}
                </p>
                <p className="text-gray-500">
                  {item.count} ({pct}%)
                </p>
              </div>
            );
          }}
        />
        <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={64} animationDuration={500}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
