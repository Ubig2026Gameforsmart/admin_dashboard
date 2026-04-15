"use client";

import { Search } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { DataTable } from "@/components/dashboard/data-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type State, fetchStateById } from "./actions";
import { useTranslation } from "@/lib/i18n";

interface StateTableProps {
  initialData: State[];
  totalPages: number;
  currentPage: number;
  countries: string[];
  searchQuery: string;
  countryFilter: string;
}

export function StateTable({
  initialData,
  totalPages,
  currentPage,
  countries,
  searchQuery,
  countryFilter,
}: StateTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { t } = useTranslation();

  const [searchInput, setSearchInput] = useState(searchQuery);
  const [selectedState, setSelectedState] = useState<State | null>(null);
  const [loadingState, setLoadingState] = useState(false);

  const countryOptions = [
    { value: "all", label: t("master.all_countries") },
    ...countries.map((code) => ({ value: code, label: code })),
  ];

  const updateUrl = (params: Record<string, string | number>) => {
    const newParams = new URLSearchParams(searchParams.toString());

    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== "all" && value !== "") {
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

  const handleCountryChange = (value: string) => {
    updateUrl({ country: value, page: 1 });
  };

  const handlePageChange = (page: number) => {
    updateUrl({ page, search: searchQuery, country: countryFilter });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleIdClick = (stateCode: string, countryCode: string) => {
    router.push(
      `/address/city?state=${stateCode}&country=${countryCode}`
    );
  };

  const handleNameClick = async (id: number) => {
    setLoadingState(true);
    const state = await fetchStateById(id);
    setSelectedState(state);
    setLoadingState(false);
  };

  const columns = [
    {
      key: "id",
      label: "ID",
      render: (value: unknown, row: Record<string, unknown>) => (
        <button
          onClick={() =>
            handleIdClick(row.iso2 as string, row.country_code as string)
          }
          className="font-mono text-sm text-primary hover:underline cursor-pointer"
        >
          {value as number}
        </button>
      ),
    },
    {
      key: "name",
      label: t("table.name"),
      render: (value: unknown, row: Record<string, unknown>) => (
        <button
          onClick={() => handleNameClick(row.id as number)}
          className="font-medium text-primary hover:underline text-left cursor-pointer"
          disabled={loadingState}
        >
          {value as string}
        </button>
      ),
    },
    {
      key: "native",
      label: t("master.native_name"),
      render: (value: unknown) => (
        <span className="text-muted-foreground">
          {(value as string) || "ΓÇö"}
        </span>
      ),
    },
    {
      key: "country_code",
      label: t("groups.country_label"),
      render: (value: unknown) => (
        <span className="font-mono text-sm">{(value as string) || "ΓÇö"}</span>
      ),
    },
    {
      key: "iso2",
      label: t("master.state_code"),
      render: (value: unknown) => (
        <span className="font-mono text-sm font-medium">
          {(value as string) || "ΓÇö"}
        </span>
      ),
    },
    {
      key: "type",
      label: t("master.type"),
      render: (value: unknown) => (
        <span className="text-sm text-muted-foreground">
          {(value as string) || "ΓÇö"}
        </span>
      ),
    },
  ];

  const tableData = initialData.map((state) => ({
    id: state.id,
    name: state.name,
    native: state.native,
    country_code: state.country_code,
    iso2: state.iso2,
    type: state.type,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t("master.states")}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Input
              placeholder={t("groups.search_state")}
              className="pr-10 w-64 bg-background border-border"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={handleSearch}
              disabled={isPending}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
          </div>

          <Combobox
            options={countryOptions}
            value={countryFilter}
            onValueChange={handleCountryChange}
            placeholder={t("groups.country_label")}
            searchPlaceholder={t("groups.search_country")}
            emptyText={t("groups.no_country")}
          />
        </div>
      </div>

      <div className={isPending ? "opacity-60 pointer-events-none" : ""}>
        <DataTable
          columns={columns}
          data={tableData as Record<string, unknown>[]}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      <Dialog
        open={!!selectedState}
        onOpenChange={() => setSelectedState(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedState?.name}</DialogTitle>
          </DialogHeader>
          {selectedState && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <DetailItem
                label={t("master.native_name")}
                value={selectedState.native}
              />
              <DetailItem
                label={t("master.state_code")}
                value={selectedState.iso2}
              />
              <DetailItem
                label={t("groups.country_label")}
                value={selectedState.country_code}
              />
              <DetailItem label={t("master.type")} value={selectedState.type} />
              <DetailItem
                label={t("master.coordinates")}
                value={
                  selectedState.latitude && selectedState.longitude
                    ? `${selectedState.latitude}, ${selectedState.longitude}`
                    : null
                }
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value || "ΓÇö"}</p>
    </div>
  );
}
