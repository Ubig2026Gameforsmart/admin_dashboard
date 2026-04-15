import { MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { type Subscription } from "@/types/subscription";

export const getSubscriptionColumns = (t: any) => {
  const getPlanBadgeColor = (plan: string) => {
    switch (plan.toLowerCase()) {
      case "enterprise":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "pro":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "business":
        return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";
      case "starter":
        return "bg-slate-500/10 text-slate-500 border-slate-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return [
    {
      key: "customer",
      label: t("table.customer"),
      render: (value: unknown) => {
        const customer = value as { name: string; email: string };
        return (
          <div className="flex flex-col">
            <span className="font-medium text-foreground text-sm">
              {customer.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {customer.email}
            </span>
          </div>
        );
      },
    },
    {
      key: "plan",
      label: t("table.plan"),
      render: (value: unknown) => {
        const plan = value as string;
        return (
          <Badge
            variant="outline"
            className={cn(
              "rounded-full font-normal text-xs px-2.5 py-0.5",
              getPlanBadgeColor(plan)
            )}
          >
            {t(`plan.${plan.toLowerCase()}`)}
          </Badge>
        );
      },
    },
    {
      key: "amount",
      label: t("table.amount"),
      render: (value: unknown) => (
        <span className="font-medium text-sm text-foreground">
          {value as string}
        </span>
      ),
    },
    {
      key: "status",
      label: t("table.status"),
      render: (value: unknown) => {
        const status = value as string;
        return (
          <Badge
            className={cn(
              "rounded-sm px-2 py-0.5 text-xs font-medium shadow-none",
              status === "Active"
                ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                : "bg-red-900/40 text-red-500 hover:bg-red-900/60 border border-red-900/50"
            )}
          >
            {t(`status.${status.toLowerCase()}`)}
          </Badge>
        );
      },
    },
    {
      key: "nextBilling",
      label: t("table.next_billing"),
      render: (value: unknown) => (
        <span className="text-muted-foreground text-sm">{value as string}</span>
      ),
    },
    {
      key: "actions",
      label: t("table.actions"),
      render: () => {
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0 hover:bg-muted cursor-pointer"
                >
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuLabel>{t("table.actions")}</DropdownMenuLabel>
                <DropdownMenuItem className="cursor-pointer">
                  {t("action.permissions")}
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  {t("action.change_plan")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-500 cursor-pointer">
                  {t("action.cancel_subscription")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
};
