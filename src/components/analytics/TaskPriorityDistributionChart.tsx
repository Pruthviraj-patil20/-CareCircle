"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart as PieIcon } from "lucide-react";
import { PriorityDistributionData } from "@/types/analytics";

interface TaskPriorityDistributionChartProps {
  data: PriorityDistributionData[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload?: {
      name: string;
      value: number;
      color: string;
    };
    [key: string]: unknown;
  }>;
  total?: number;
}

function CustomTooltip({ active, payload, total = 0 }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    const pct = total > 0 && item?.value ? Math.round((item.value / total) * 100) : 0;
    return (
      <div className="bg-popover text-popover-foreground text-xs p-2.5 rounded-xl border shadow-md space-y-1">
        <p className="font-semibold text-xs flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item?.color }} />
          {item?.name} Priority
        </p>
        <p className="text-muted-foreground text-[11px]">
          {item?.value ?? 0} tasks ({pct}%)
        </p>
      </div>
    );
  }
  return null;
}

export function TaskPriorityDistributionChart({
  data,
}: TaskPriorityDistributionChartProps) {
  const total = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <Card className="border bg-card shadow-xs">
      <CardHeader className="p-5 pb-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-primary" />
              Task Urgency Distribution
            </CardTitle>
            <CardDescription className="text-xs">
              Breakdown of family commitments by urgency and importance.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-0">
        {total === 0 ? (
          <div className="h-64 flex items-center justify-center text-xs text-muted-foreground">
            No tasks categorized yet.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip total={total} />} />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                  iconType="circle"
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
