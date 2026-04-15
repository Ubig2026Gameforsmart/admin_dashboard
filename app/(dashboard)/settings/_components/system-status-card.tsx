import { CheckCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SystemStatusItem {
  name: string;
  status: string;
  icon: typeof CheckCircle;
}

interface SystemStatusCardProps {
  items: SystemStatusItem[];
  title: string;
  t: (key: string) => string;
}

export function SystemStatusCard({ items, title, t }: SystemStatusCardProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = item.status === "Active";
            return (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-lg border border-border bg-background p-4"
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-5 w-5 ${
                      isActive
                        ? "text-[var(--success)]"
                        : "text-[var(--warning)]"
                    }`}
                  />
                  <span className="font-medium text-foreground">
                    {item.name}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={
                    isActive
                      ? "bg-[var(--success)]/20 text-[var(--success)] border-[var(--success)]/30"
                      : "bg-[var(--warning)]/20 text-[var(--warning)] border-[var(--warning)]/30"
                  }
                >
                  {item.status === "Active"
                    ? t("stats.active")
                    : t("settings.status.warning") || item.status}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
