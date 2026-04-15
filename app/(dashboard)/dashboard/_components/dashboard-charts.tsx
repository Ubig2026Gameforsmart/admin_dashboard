import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { revenueData } from "@/lib/dummy-data";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const CHART_STYLES = {
  gridStroke: "oklch(0.28 0.01 260)",
  axisStroke: "oklch(0.65 0 0)",
  tooltipBg: "oklch(0.17 0.01 260)",
  tooltipBorder: "oklch(0.28 0.01 260)",
  tooltipColor: "oklch(0.95 0 0)",
  areaColor: "oklch(0.7 0.15 180)",
  barColor: "oklch(0.65 0.18 280)",
};

interface DashboardChartsProps {
  loading: boolean;
  userGrowthData: { month: string; users: number }[];
  t: (key: string) => string;
}

export function DashboardCharts({
  loading,
  userGrowthData,
  t,
}: DashboardChartsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">
            {t("dashboard.revenue_overview")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={CHART_STYLES.areaColor}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={CHART_STYLES.areaColor}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={CHART_STYLES.gridStroke}
              />
              <XAxis dataKey="month" stroke={CHART_STYLES.axisStroke} />
              <YAxis stroke={CHART_STYLES.axisStroke} />
              <Tooltip
                contentStyle={{
                  backgroundColor: CHART_STYLES.tooltipBg,
                  border: `1px solid ${CHART_STYLES.tooltipBorder}`,
                  borderRadius: "8px",
                  color: CHART_STYLES.tooltipColor,
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={CHART_STYLES.areaColor}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">
            {t("dashboard.user_activity")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userGrowthData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={CHART_STYLES.gridStroke}
                />
                <XAxis dataKey="month" stroke={CHART_STYLES.axisStroke} />
                <YAxis stroke={CHART_STYLES.axisStroke} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: CHART_STYLES.tooltipBg,
                    border: `1px solid ${CHART_STYLES.tooltipBorder}`,
                    borderRadius: "8px",
                    color: CHART_STYLES.tooltipColor,
                  }}
                />
                <Bar
                  dataKey="users"
                  fill={CHART_STYLES.barColor}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
