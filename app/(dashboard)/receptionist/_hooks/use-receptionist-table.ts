import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { type Competition } from "@/types/receptionist";

export function useReceptionistTable(initialData: Competition[]) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState("");
  const [previewPoster, setPreviewPoster] = useState<{ url: string; title: string } | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Local filtered data
  const [filteredData, setFilteredData] = useState<Competition[]>(initialData);

  useEffect(() => {
    let result = initialData;

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        (c) => c.title.toLowerCase().includes(lowerQuery)
      );
    }

    setFilteredData(result);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchQuery, initialData]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= Math.max(1, totalPages)) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return {
    isPending,
    searchQuery,
    setSearchQuery,
    previewPoster,
    setPreviewPoster,
    currentPage,
    setCurrentPage,
    filteredData,
    paginatedData,
    totalPages,
    handlePageChange,
  };
}
