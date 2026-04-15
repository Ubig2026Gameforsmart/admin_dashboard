import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { clearSessions } from "../actions";
import { type StaleSession } from "@/types/manage-session";

export function useManageSessionsTable(initialData: StaleSession[]) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const [clearMode, setClearMode] = useState<"selected" | "all">("selected");
  const [clearResult, setClearResult] = useState<{
    cleared: number;
    error: string | null;
  } | null>(null);

  // Auto-dismiss clear result after 5 seconds
  useEffect(() => {
    if (clearResult) {
      const timer = setTimeout(() => {
        setClearResult(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [clearResult]);
  
  // Client-side filtering state
  const [searchInput, setSearchInput] = useState("");
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [filteredData, setFilteredData] = useState(initialData);

  const ITEMS_PER_PAGE = 15;
  const [currentPage, setCurrentPage] = useState(1);

  // Sync initialData
  useEffect(() => {
    setFilteredData(initialData);
    setCurrentPage(1);
    setSelected(new Set()); // Also unselect all
  }, [initialData]);

  // Apply filters
  useEffect(() => {
    let result = initialData;

    if (activeSearchQuery) {
      const lowerQuery = activeSearchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.quiz_title.toLowerCase().includes(lowerQuery) ||
          item.host_name.toLowerCase().includes(lowerQuery) ||
          item.game_pin.includes(lowerQuery)
      );
    }

    setFilteredData(result);
    setCurrentPage(1); // Reset to first page on filter change
    setSelected(new Set());
  }, [activeSearchQuery, initialData]);

  const handleSearch = () => {
    setActiveSearchQuery(searchInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Pagination Logic
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const isPageSelected =
    paginatedData.length > 0 &&
    paginatedData.every((item) => selected.has(item.id));

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectPage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (isPageSelected) {
        // Deselect all on this page
        paginatedData.forEach((item) => next.delete(item.id));
      } else {
        // Select all on this page
        paginatedData.forEach((item) => next.add(item.id));
      }
      return next;
    });
  };

  const handleClear = (mode: "selected" | "all") => {
    setClearMode(mode);
    setShowConfirm(true);
  };

  const confirmClear = async () => {
    setShowConfirm(false);
    
    // Clear visible/filtered items if "All" is selected, or specifically selected items
    const idsToClear =
      clearMode === "all"
        ? filteredData.map((s) => s.id)
        : Array.from(selected);

    if (idsToClear.length === 0) return;

    startTransition(async () => {
      const result = await clearSessions(idsToClear);
      setClearResult(result);
      setSelected(new Set());
      router.refresh();
    });
  };

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return {
    isPending,
    selected,
    showConfirm,
    setShowConfirm,
    clearMode,
    clearResult,
    setClearResult,
    searchInput,
    setSearchInput,
    filteredData,
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedData,
    isPageSelected,
    toggleSelect,
    toggleSelectPage,
    handleClear,
    confirmClear,
    handleRefresh,
    handleSearch,
    handleKeyDown,
  };
}
