export type TaskSummaryMetrics = {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number; // 0 to 100
};

export type MemberWorkloadData = {
  userId: string;
  name: string;
  email: string | null;
  image: string | null;
  role: string;
  completed: number;
  inProgress: number;
  overdue: number;
  totalAssigned: number;
};

export type WeeklyActivityData = {
  day: string; // e.g. "Mon"
  fullDate: string; // e.g. "Sep 1"
  created: number;
  completed: number;
};

export type MonthlyActivityData = {
  month: string; // e.g. "Apr", "May"
  created: number;
  completed: number;
};

export type PriorityDistributionData = {
  name: string; // "Urgent", "High", "Medium", "Low"
  value: number;
  color: string;
};

export type SupportOpportunity = {
  userId: string;
  name: string;
  image: string | null;
  role: string;
  overdueCount: number;
  inProgressCount: number;
  message: string;
};

export type FamilyAnalyticsData = {
  summary: TaskSummaryMetrics;
  memberWorkloads: MemberWorkloadData[];
  weeklyActivity: WeeklyActivityData[];
  monthlyActivity: MonthlyActivityData[];
  priorityDistribution: PriorityDistributionData[];
  supportOpportunities: SupportOpportunity[];
  hasAnyData: boolean;
};
