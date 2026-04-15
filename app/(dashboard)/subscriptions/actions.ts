"use server";

import { SubscriptionsResponse } from "@/types/subscription";

// Dummy Data matching the design
const SUBSCRIPTIONS = [
  {
    id: "1",
    customer: {
      name: "Tech Corp",
      email: "billing@techcorp.com",
    },
    plan: "Enterprise",
    amount: "$299/mo",
    status: "Active",
    nextBilling: "2024-02-01",
  },
  {
    id: "2",
    customer: {
      name: "Startup Inc",
      email: "finance@startup.io",
    },
    plan: "Pro",
    amount: "$99/mo",
    status: "Active",
    nextBilling: "2024-02-05",
  },
  {
    id: "3",
    customer: {
      name: "Agency Plus",
      email: "accounts@agency.com",
    },
    plan: "Business",
    amount: "$199/mo",
    status: "Active",
    nextBilling: "2024-02-10",
  },
  {
    id: "4",
    customer: {
      name: "Solo Dev",
      email: "dev@solo.dev",
    },
    plan: "Starter",
    amount: "$29/mo",
    status: "Active",
    nextBilling: "2024-02-15",
  },
  {
    id: "5",
    customer: {
      name: "Pending Co",
      email: "info@pending.co",
    },
    plan: "Pro",
    amount: "$99",
    status: "Unpaid",
    nextBilling: "2024-01-10",
  },
  {
    id: "6",
    customer: {
      name: "Late LLC",
      email: "billing@late.llc",
    },
    plan: "Enterprise",
    amount: "$299",
    status: "Unpaid",
    nextBilling: "2024-01-05",
  },
  {
    id: "7",
    customer: {
      name: "Overdue Inc",
      email: "pay@overdue.inc",
    },
    plan: "Business",
    amount: "$199",
    status: "Unpaid",
    nextBilling: "2024-01-01",
  },
];

const STATS = {
  activeSubscriptions: "1,284",
  activeSubscriptionsChange: "+12%",
  activeSubscriptionsChangeType: "positive" as const,
  totalRevenue: "$48,290",
  totalRevenueChange: "+5.4%",
  totalRevenueChangeType: "positive" as const,
  churnRate: "2.1%",
  churnRateChange: "+0.2%",
  churnRateChangeType: "negative" as const,
};

export async function fetchSubscriptions(
  page: number = 1,
  search: string = ""
): Promise<SubscriptionsResponse> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  let filtered = SUBSCRIPTIONS;

  if (search) {
    const q = search.toLowerCase();
    filtered = SUBSCRIPTIONS.filter(
      (sub) =>
        sub.customer.name.toLowerCase().includes(q) ||
        sub.customer.email.toLowerCase().includes(q) ||
        sub.plan.toLowerCase().includes(q)
    );
  }

  // Simplified pagination for dummy data (assuming 1 page for now)
  return {
    data: filtered,
    stats: STATS,
    totalCount: filtered.length,
    totalPages: 1,
    currentPage: page,
  };
}
