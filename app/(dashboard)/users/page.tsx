"use client";

import { UserTable } from "./_components/user-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardData } from "@/contexts/dashboard-store";

export default function AdministratorUserPage() {
  const { users, isLoading } = useDashboardData();

  if (isLoading && users.length === 0) {
    return <UserTableSkeleton />;
  }

  return <UserTable initialData={users} />;
}

function UserTableSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-40" />
        <div className="flex gap-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <Skeleton className="h-[600px] w-full rounded-xl" />
    </div>
  );
}
