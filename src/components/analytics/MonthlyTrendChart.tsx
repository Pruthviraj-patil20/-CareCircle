"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { MonthlyActivityData } from "@/types/analytics";

interface MonthlyTrendChartProps {
  data: MonthlyActivityData[];
}

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover text-popover-foreground text-xs p-3 rounded-xl border shadow-md space-y-1.5 min-w-[140px]">
          <p className="font-bold text-sm border-b pb-1">{label} Summary</p>
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span>Completed:</span>
            <span className="font-semibold">{payload[0]?.value || 0}</span>
          </div>
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
            <span>Created:</span>
            <span className="font-semibold">{payload[1]?.value || 0}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border bg-card shadow-xs">
      <CardHeader className="p-5 pb-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Monthly Care Momentum (Last 6 Months)
            </CardTitle>
            <CardDescription className="text-xs">
              Long-term trends of family support and completed responsibilities.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-4">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
                iconType="circle"
                iconSize={8}
              />
              <Line
                type="monotone"
                dataKey="completed"
                name="Tasks Completed"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4, fill: "#10b981" }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="created"
                name="Tasks Created"
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: "#3b82f6" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
