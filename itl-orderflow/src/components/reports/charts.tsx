"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

interface RevenueChartProps {
  data: { shortMonth: string; amount: number }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="shortMonth" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value: number) => [
            `${value.toLocaleString("ru-RU")} TJS`,
            "Выручка",
          ]}
        />
        <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface FunnelChartProps {
  data: { name: string; count: number; color: string }[];
}

export function FunnelChart({ data }: FunnelChartProps) {
  const filteredData = data.filter((d) => d.count > 0);
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={filteredData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={120}
          dataKey="count"
          nameKey="name"
          label={({ name, count }) => `${name}: ${count}`}
          labelLine={{ strokeWidth: 1 }}
        >
          {filteredData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

interface WorkloadChartProps {
  data: { name: string; totalHours: number; billableHours: number }[];
}

export function WorkloadChart({ data }: WorkloadChartProps) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 50)}>
      <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis type="number" tick={{ fontSize: 12 }} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
        <Tooltip
          formatter={(value: number, name: string) => [
            `${value}ч`,
            name === "billableHours" ? "Оплачиваемые" : "Всего",
          ]}
        />
        <Legend formatter={(value) => (value === "billableHours" ? "Оплачиваемые" : "Всего")} />
        <Bar dataKey="totalHours" fill="#93c5fd" radius={[0, 4, 4, 0]} />
        <Bar dataKey="billableHours" fill="#3b82f6" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface ProjectTypesChartProps {
  data: { name: string; count: number }[];
}

interface ConversionTrendChartProps {
  data: { shortMonth: string; conversionRate: number }[];
}

export function ConversionTrendChart({ data }: ConversionTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="shortMonth" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} unit="%" domain={[0, 100]} />
        <Tooltip
          formatter={(value: number) => [`${value}%`, "Конверсия"]}
        />
        <Line
          type="monotone"
          dataKey="conversionRate"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 4, fill: "#3b82f6" }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#6366f1", "#14b8a6"];

export function ProjectTypesChart({ data }: ProjectTypesChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={120}
          dataKey="count"
          nameKey="name"
          label={({ name, count }) => `${name}: ${count}`}
          labelLine={{ strokeWidth: 1 }}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}
