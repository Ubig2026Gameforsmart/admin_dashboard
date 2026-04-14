import { fetchSubscriptions } from "./actions";
import { SubscriptionsTable } from "./subscriptions-table";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
}

export default async function SubscriptionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || "";

  const { data, stats, totalPages, currentPage, totalCount } =
    await fetchSubscriptions(page, search);

  return (
    <SubscriptionsTable
      initialData={data}
      stats={stats}
      totalPages={totalPages}
      currentPage={currentPage}
      totalCount={totalCount}
    />
  );
}
