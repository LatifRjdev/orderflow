"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface StackedWorkloadChartProps {
  data: { name: string; billable: number; nonBillable: number }[];
}

export function StackedWorkloadChart({ data }: StackedWorkloadChartProps) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 50)}>
      <BarChart data={data} layout="vertical" margin={{ left: 100 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis type="number" tick={{ fontSize: 12 }} />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 12 }}
          width={100}
        />
        <Tooltip
          formatter={(value: number, name: string) => [
            `${value}ч`,
            name === "billable" ? "Оплачиваемые" : "Неоплачиваемые",
          ]}
        />
        <Legend
          formatter={(value) =>
            value === "billable" ? "Оплачиваемые" : "Неоплачиваемые"
          }
        />
        <Bar
          dataKey="billable"
          stackId="hours"
          fill="#3b82f6"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="nonBillable"
          stackId="hours"
          fill="#d1d5db"
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
