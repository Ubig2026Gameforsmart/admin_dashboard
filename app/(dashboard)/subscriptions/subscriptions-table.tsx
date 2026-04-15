"use client";

import { Users, CreditCard, TrendingDown, Filter } from "lucide-react";

import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/dashboard/data-table";
import { useTranslation } from "@/lib/i18n";
import { type Subscription, type SubscriptionStats } from "@/types/subscription";

import { useSubscriptionsTable } from "./_hooks/use-subscriptions-table";
import { getSubscriptionColumns } from "./_components/subscription-columns";

interface SubscriptionsTableProps {
  initialData: Subscription[];
  stats: SubscriptionStats;
  totalPages: number;
  currentPage: number;
  totalCount: number;
}

export function SubscriptionsTable({
  initialData,
  stats,
  totalPages,
  currentPage,
}: SubscriptionsTableProps) {
  const { t } = useTranslation();

  const {
    searchInput,
    setSearchInput,
    isPending,
    handleSearch,
    handlePageChange,
  } = useSubscriptionsTable();

  const STATS_CARDS = [
    {
      title: t("subscriptions.active_subscriptions"),
      value: stats.activeSubscriptions,
      change: stats.activeSubscriptionsChange,
      changeType: stats.activeSubscriptionsChangeType,
      description: t("subscriptions.from_last_month"),
      icon: Users,
    },
    {
      title: t("subscriptions.total_revenue"),
      value: stats.totalRevenue,
      change: stats.totalRevenueChange,
      changeType: stats.totalRevenueChangeType,
      description: t("subscriptions.from_last_month"),
      icon: CreditCard,
    },
    {
      title: t("subscriptions.churn_rate"),
      value: stats.churnRate,
      change: stats.churnRateChange,
      changeType: stats.churnRateChangeType,
      description: t("subscriptions.from_last_month"),
      icon: TrendingDown,
    },
  ];

  const columns = getSubscriptionColumns(t);

  const tableData = initialData.map((sub) => ({
    customer: sub.customer,
    plan: sub.plan,
    amount: sub.amount,
    status: sub.status,
    nextBilling: sub.nextBilling,
    actions: sub.id,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t("subscriptions.title")}
        </h1>
        <div className="flex items-center gap-3">
          <SearchInput
            placeholder={t("subscriptions.search")}
            className="w-64 bg-background border-border"
            value={searchInput}
            onSearch={(val) => {
              setSearchInput(val);
              // Small delay to let state update if pressing enter immediately
              setTimeout(() => handleSearch(), 0);
            }}
          />
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 bg-black border-black hover:bg-black/80 cursor-pointer"
          >
            <Filter className="h-4 w-4 text-white" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {STATS_CARDS.map((stat, i) => (
          <Card
            key={i}
            className="bg-card/50 hover:bg-card hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer group"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-foreground">
                  {stat.value}
                </div>
                <div
                  className={cn(
                    "text-xs font-medium px-1.5 py-0.5 rounded",
                    stat.changeType === "positive" &&
                      stat.title !== t("subscriptions.churn_rate")
                      ? "text-emerald-500 bg-emerald-500/10"
                      : "text-red-500 bg-red-500/10"
                  )}
                >
                  {stat.change}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Table */}
      <div className={isPending ? "opacity-60 pointer-events-none" : ""}>
        <DataTable
          columns={columns}
          data={tableData}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
