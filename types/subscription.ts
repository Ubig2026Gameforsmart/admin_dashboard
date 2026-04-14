export interface Subscription {
  id: string;
  customer: {
    name: string;
    email: string;
  };
  plan: string;
  amount: string;
  status: string;
  nextBilling: string;
}

export interface SubscriptionStats {
  activeSubscriptions: string;
  activeSubscriptionsChange: string;
  activeSubscriptionsChangeType: 'positive' | 'negative';
  totalRevenue: string;
  totalRevenueChange: string;
  totalRevenueChangeType: 'positive' | 'negative';
  churnRate: string;
  churnRateChange: string;
  churnRateChangeType: 'positive' | 'negative';
}

export interface SubscriptionsResponse {
  data: Subscription[];
  stats: SubscriptionStats;
  totalCount: number;
  totalPages: number;
  currentPage: number;
}
