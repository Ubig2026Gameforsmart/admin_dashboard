import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function useSubscriptionsTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const searchParam = searchParams.get("search") || "";
  const pageParam = Number(searchParams.get("page")) || 1;

  const [searchInput, setSearchInput] = useState(searchParam);

  const updateUrl = (params: Record<string, string | number>) => {
    const newParams = new URLSearchParams(searchParams.toString());

    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== "") {
        newParams.set(key, String(value));
      } else {
        newParams.delete(key);
      }
    });

    startTransition(() => {
      router.push(`?${newParams.toString()}`);
    });
  };

  const handleSearch = () => {
    updateUrl({ search: searchInput, page: 1 });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handlePageChange = (page: number) => {
    updateUrl({ page });
  };

  return {
    searchInput,
    setSearchInput,
    isPending,
    handleSearch,
    handleKeyDown,
    handlePageChange,
  };
}
