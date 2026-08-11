"use client";

import { useId, type ReactNode } from "react";
import Link from "next/link";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export type KpiAccent = "blue" | "amber" | "emerald" | "violet";

const ACCENT_STYLES: Record<KpiAccent, { iconBg: string; iconText: string; spark: string }> = {
  blue: { iconBg: "bg-blue-50", iconText: "text-blue-600", spark: "#2563eb" },
  amber: { iconBg: "bg-amber-50", iconText: "text-amber-600", spark: "#d97706" },
  emerald: { iconBg: "bg-emerald-50", iconText: "text-emerald-600", spark: "#059669" },
  violet: { iconBg: "bg-violet-50", iconText: "text-violet-600", spark: "#7c3aed" },
};

interface KpiCardProps {
  href: string;
  /** Pass a rendered icon element (e.g. `<FolderKanban className="w-5 h-5" />`), not a component reference —
   * this is a Client Component and function/component references from a Server Component parent can't cross the boundary. */
  icon: ReactNode;
  accent: KpiAccent;
  label: string;
  value: string;
  /** Percent change vs. the previous equivalent period. Omit/null when there's no baseline — never fabricate a trend. */
  trendPercent?: number | null;
  /** Recent-history points for the mini trend chart. Needs 2+ points to render. */
  sparkline?: { value: number }[];
}

export function KpiCard({ href, icon, accent, label, value, trendPercent, sparkline }: KpiCardProps) {
  const gradientId = useId();
  const styles = ACCENT_STYLES[accent];
  const hasTrend = trendPercent !== null && trendPercent !== undefined;
  const hasSparkline = sparkline && sparkline.length > 1;

  return (
    <Link href={href}>
      <div className="group bg-white p-5 rounded-xl border border-[#dbdfe6] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer motion-reduce:hover:translate-y-0">
        <div className="flex items-start justify-between">
          <div className={`p-2.5 rounded-lg ${styles.iconBg} ${styles.iconText}`}>
            {icon}
          </div>
          {hasTrend && (
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full ${
                trendPercent! >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
              }`}
            >
              {trendPercent! >= 0 ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {Math.abs(trendPercent!)}%
            </span>
          )}
        </div>

        <p className="text-sm text-gray-500 font-medium mt-4">{label}</p>

        <div className="flex items-end justify-between mt-1 gap-3">
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {hasSparkline && (
            <div className="w-20 h-10 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkline}>
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={styles.spark} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={styles.spark} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={styles.spark}
                    strokeWidth={2}
                    fill={`url(#${gradientId})`}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
