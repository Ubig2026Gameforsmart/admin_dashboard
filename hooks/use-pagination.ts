import { useState, useMemo } from "react";

interface UsePaginationResult<T> {
  currentPage: number;
  setCurrentPage: (page: number) => void;
  paginatedData: T[];
  totalPages: number;
  handlePageChange: (page: number) => void;
}

export function usePagination<T>(
  data: T[],
  itemsPerPage: number = 15
): UsePaginationResult<T> {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
  }, [data, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return {
    currentPage,
    setCurrentPage,
    paginatedData,
    totalPages,
    handlePageChange,
  };
}
