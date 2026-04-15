import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { type Group, type State, type City } from "@/types/group";
import { deleteGroupAction } from "../actions";
export function useGroupsTable(initialData: Group[]) {
  const router = useRouter();
  const { toast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [activeSearchQuery, setActiveSearchQuery] = useState("");

  const [filterValues, setFilterValues] = useState({
    country: "",
    state: "",
    city: "",
    status: "all",
    category: "",
  });

  const ITEMS_PER_PAGE = 12;

  const filteredData = useMemo(() => {
    let data = [...initialData];

    if (activeSearchQuery) {
      const lowerQuery = activeSearchQuery.toLowerCase();
      data = data.filter(
        (group) =>
          group.name?.toLowerCase().includes(lowerQuery) ||
          group.description?.toLowerCase().includes(lowerQuery)
      );
    }

    if (filterValues.status && filterValues.status !== "all") {
      data = data.filter((group) => {
        const settings = group.settings as { status?: string } | null;
        return settings?.status === filterValues.status;
      });
    }

    if (filterValues.category) {
      data = data.filter((g) => g.category === filterValues.category);
    }

    return data;
  }, [initialData, activeSearchQuery, filterValues]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeSearchQuery, filterValues]);

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: string;
    groupName: string;
    confirmText: string;
  }>({
    open: false,
    id: "",
    groupName: "",
    confirmText: "",
  });

  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const handleCountryChange = async (countryId: string) => {
    setFilterValues((prev) => ({
      ...prev,
      country: countryId,
      state: "",
      city: "",
    }));
    setStates([]);
    setCities([]);

    if (countryId) {
      setLoadingStates(true);
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase
        .from("states")
        .select("id, name, country_id")
        .eq("country_id", Number(countryId))
        .order("name");
      setStates(data ?? []);
      setLoadingStates(false);
    }
  };

  const handleStateChange = async (stateId: string) => {
    setFilterValues((prev) => ({
      ...prev,
      state: stateId,
      city: "",
    }));
    setCities([]);

    if (stateId) {
      setLoadingCities(true);
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase
        .from("cities")
        .select("id, name, state_id")
        .eq("state_id", Number(stateId))
        .order("name");
      setCities(data ?? []);
      setLoadingCities(false);
    }
  };

  const openDeleteDialog = (id: string, groupName: string) => {
    setDeleteDialog({ open: true, id, groupName, confirmText: "" });
  };

  const handleResetFilter = () => {
    setFilterValues({
      country: "",
      state: "",
      city: "",
      status: "all",
      category: "",
    });
    setStates([]);
    setCities([]);
  };

  const handleApplyFilter = () => {
    setFilterDialogOpen(false);
  };

  const handleCancelFilter = () => {
    setFilterValues({
      country: "",
      state: "",
      city: "",
      status: "all",
      category: "",
    });
    setFilterDialogOpen(false);
  };

  const handleDeleteGroup = async () => {
    if (deleteDialog.confirmText !== "Move to Trash") return;

    const { error } = await deleteGroupAction(deleteDialog.id);
    if (error) {
      toast({
        title: "Error",
        description: "Failed to move group to trash",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Group moved to trash successfully",
      });
      router.refresh();
    }
    setDeleteDialog((prev) => ({ ...prev, open: false, confirmText: "" }));
  };

  const handleSearch = () => {
    setActiveSearchQuery(searchInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const groupsWithCount = paginatedData.map((group) => ({
    ...group,
    member_count: group.members?.length ?? 0,
  }));

  return {
    currentPage,
    totalPages,
    searchInput,
    setSearchInput,
    activeSearchQuery,
    filterValues,
    setFilterValues,
    deleteDialog,
    setDeleteDialog,
    filterDialogOpen,
    setFilterDialogOpen,
    states,
    cities,
    loadingStates,
    loadingCities,
    groupsWithCount,
    handleCountryChange,
    handleStateChange,
    openDeleteDialog,
    handleResetFilter,
    handleApplyFilter,
    handleCancelFilter,
    handleDeleteGroup,
    handleSearch,
    handleKeyDown,
    handlePageChange,
  };
}
