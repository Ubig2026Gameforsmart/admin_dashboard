"use client";

import { GroupTable } from "./group-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardData } from "@/contexts/dashboard-store";
import { useEffect, useState } from "react";
import { fetchCountries, fetchGroupCategories } from "./actions";
import { type Country } from "@/types/group";
// Placeholder for GroupTableSkeleton, assuming it's defined elsewhere or imported.
// If not, this would cause a reference error.
function GroupTableSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export default function GroupsPage() {
  const { groups, isLoading } = useDashboardData();
  const [countries, setCountries] = useState<Country[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    // Fetch auxiliary filter data
    const loadFilters = async () => {
      const [c, cat] = await Promise.all([
        fetchCountries(),
        fetchGroupCategories(),
      ]);
      setCountries(c);
      setCategories(cat);
    };
    loadFilters();
  }, []);

  if (isLoading && groups.length === 0) {
    return <GroupTableSkeleton />;
  }

  return (
    <GroupTable
      initialData={groups}
      countries={countries}
      categories={categories}
    />
  );
}
