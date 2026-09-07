"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, TrendingUp } from "lucide-react";
import { WeeklyActivityData } from "@/types/analytics";

interface WeeklyActivityChartProps {
  data: WeeklyActivityData[];
}

export function WeeklyActivityChart({ data }: WeeklyActivityChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = data.find((d) => d.day === label);
      return (
        <div className="bg-popover text-popover-foreground text-xs p-3 rounded-xl border shadow-md space-y-1.5 min-w-[140px]">
          <p className="font-bold text-sm border-b pb-1">
            {item ? `${item.day}, ${item.fullDate}` : label}
          </p>
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span>Completed:</span>
            <span className="font-semibold">{payload[0]?.value || 0}</span>
          </div>
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
            <span>Tasks Created:</span>
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
              <Calendar className="h-4 w-4 text-primary" />
              Weekly Care Rhythm (Last 7 Days)
            </CardTitle>
            <CardDescription className="text-xs">
              Tracking tasks created vs completed day-by-day.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-4">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
              <XAxis
                dataKey="day"
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
              <Area
                type="monotone"
                dataKey="completed"
                name="Tasks Completed"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCompleted)"
              />
              <Area
                type="monotone"
                dataKey="created"
                name="Tasks Created"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCreated)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
