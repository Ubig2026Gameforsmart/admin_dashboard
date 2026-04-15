import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { competitionService } from "@/lib/services/competition-service";
import { CompetitionListItem } from "@/types/competition";

export function useCompetitionsTable() {
  const [competitions, setCompetitions] = useState<CompetitionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewPoster, setPreviewPoster] = useState<{
    url: string;
    title: string;
  } | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<CompetitionListItem | null>(
    null
  );
  const [deleteConfirmationPhrase, setDeleteConfirmationPhrase] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCompetitions = async () => {
    setIsLoading(true);
    try {
      const data = await competitionService.getCompetitions();
      setCompetitions(data);
    } catch (error: any) {
      console.error("Error fetching competitions:", error);
      toast.error(error.message || "Failed to load competitions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const filtered = useMemo(
    () =>
      competitions.filter((c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [competitions, searchQuery]
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const paginated = useMemo(
    () =>
      filtered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      ),
    [filtered, currentPage, itemsPerPage]
  );

  const tableData = useMemo(() => {
    return paginated.map((comp) => {
      const catLabels = comp.category
        ? comp.category
            .split(",")
            .map((c: string) => c.trim())
            .join(", ")
        : null;
      const scheduleStart = comp.regStartDate
        ? format(new Date(comp.regStartDate), "d MMM yyyy")
        : "\u2014";
      const scheduleEnd =
        comp.finalEndDate || comp.regEndDate
          ? format(new Date(comp.finalEndDate || comp.regEndDate), "d MMM yyyy")
          : "\u2014";

      return {
        id: comp.id,
        poster_url: comp.posterUrl,
        title: comp.title,
        categoryDisplay: catLabels,
        status: comp.status,
        schedule: `${scheduleStart} \u2014 ${scheduleEnd}`,
        participantCount: comp.participantCount,
      };
    });
  }, [paginated]);

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleDeleteCompetition = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await competitionService.deleteCompetition(deleteTarget.id);
      setCompetitions(competitions.filter((c) => c.id !== deleteTarget.id));
      toast.success("Competition deleted successfully");
      setDeleteTarget(null);
      setDeleteConfirmationPhrase("");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete competition");
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    competitions,
    isLoading,
    searchInput,
    setSearchInput,
    handleSearch,
    handleKeyDown,
    previewPoster,
    setPreviewPoster,
    currentPage,
    setCurrentPage,
    totalPages,
    tableData,
    deleteTarget,
    setDeleteTarget,
    deleteConfirmationPhrase,
    setDeleteConfirmationPhrase,
    isDeleting,
    handleDeleteCompetition,
  };
}
