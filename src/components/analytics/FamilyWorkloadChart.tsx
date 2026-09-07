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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users } from "lucide-react";
import { MemberWorkloadData } from "@/types/analytics";

interface FamilyWorkloadChartProps {
  data: MemberWorkloadData[];
}

type ChartRow = {
  name: string;
  fullName: string;
  "Completed Tasks": number;
  "Active Tasks": number;
  "Needs a Hand": number;
  total: number;
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value?: number | string; [key: string]: unknown }>;
  label?: string | number;
  chartData?: ChartRow[];
}

function CustomTooltip({ active, payload, label, chartData }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const full = chartData?.find((c) => c.name === label);
    return (
      <div className="bg-popover text-popover-foreground text-xs p-3 rounded-xl border shadow-md space-y-1.5 min-w-[160px]">
        <p className="font-bold text-sm border-b pb-1">{full?.fullName || label}</p>
        <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
          <span>Completed:</span>
          <span className="font-semibold">{payload[0]?.value ?? 0}</span>
        </div>
        <div className="flex items-center justify-between text-sky-600 dark:text-sky-400">
          <span>In Progress:</span>
          <span className="font-semibold">{payload[1]?.value ?? 0}</span>
        </div>
        <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
          <span>Needs a Hand:</span>
          <span className="font-semibold">{payload[2]?.value ?? 0}</span>
        </div>
        <div className="border-t pt-1 flex items-center justify-between font-bold text-foreground">
          <span>Total Tasks:</span>
          <span>{full?.total ?? 0}</span>
        </div>
      </div>
    );
  }
  return null;
}

export function FamilyWorkloadChart({ data }: FamilyWorkloadChartProps) {
  const chartData: ChartRow[] = data.map((d) => ({
    name: d.name.length > 12 ? `${d.name.slice(0, 10)}...` : d.name,
    fullName: d.name,
    "Completed Tasks": d.completed,
    "Active Tasks": d.inProgress,
    "Needs a Hand": d.overdue,
    total: d.totalAssigned,
  }));

  return (
    <Card className="border bg-card shadow-xs">
      <CardHeader className="p-5 pb-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Shared Family Workload Distribution
            </CardTitle>
            <CardDescription className="text-xs">
              Visualizing how care and chores are shared across all family members.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-4">
        {data.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-xs text-muted-foreground">
            No family members currently assigned to tasks.
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                <XAxis
                  dataKey="name"
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
                <Tooltip content={<CustomTooltip chartData={chartData} />} />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar
                  dataKey="Completed Tasks"
                  stackId="workload"
                  fill="#10b981"
                  radius={[0, 0, 4, 4]}
                />
                <Bar
                  dataKey="Active Tasks"
                  stackId="workload"
                  fill="#3b82f6"
                />
                <Bar
                  dataKey="Needs a Hand"
                  stackId="workload"
                  fill="#f43f5e"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
