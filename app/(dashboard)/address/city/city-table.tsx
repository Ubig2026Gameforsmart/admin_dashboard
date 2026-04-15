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
import { type City, fetchCityById } from "./actions";
import { useTranslation } from "@/lib/i18n";

interface CityTableProps {
  initialData: City[];
  totalPages: number;
  currentPage: number;
  countries: string[];
  states: string[];
  searchQuery: string;
  countryFilter: string;
  stateFilter: string;
}

export function CityTable({
  initialData,
  totalPages,
  currentPage,
  countries,
  states,
  searchQuery,
  countryFilter,
  stateFilter,
}: CityTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { t } = useTranslation();

  const [searchInput, setSearchInput] = useState(searchQuery);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [loadingCity, setLoadingCity] = useState(false);

  const countryOptions = [
    { value: "all", label: t("master.all_countries") },
    ...countries.map((code) => ({ value: code, label: code })),
  ];

  const stateOptions = [
    { value: "all", label: t("master.all_states") },
    ...states.map((code) => ({ value: code, label: code })),
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
    updateUrl({ country: value, state: "all", page: 1 });
  };

  const handleStateChange = (value: string) => {
    updateUrl({ state: value, page: 1 });
  };

  const handlePageChange = (page: number) => {
    updateUrl({
      page,
      search: searchQuery,
      country: countryFilter,
      state: stateFilter,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNameClick = async (id: number) => {
    setLoadingCity(true);
    const city = await fetchCityById(id);
    setSelectedCity(city);
    setLoadingCity(false);
  };

  const columns = [
    {
      key: "id",
      label: "ID",
      render: (value: unknown) => (
        <span className="font-mono text-sm text-muted-foreground">
          {value as number}
        </span>
      ),
    },
    {
      key: "name",
      label: t("table.name"),
      render: (value: unknown, row: Record<string, unknown>) => (
        <button
          onClick={() => handleNameClick(row.id as number)}
          className="font-medium text-primary hover:underline text-left cursor-pointer"
          disabled={loadingCity}
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
      key: "state_code",
      label: t("groups.state_label"),
      render: (value: unknown) => (
        <span className="font-mono text-sm">{(value as string) || "ΓÇö"}</span>
      ),
    },
    {
      key: "country_code",
      label: t("groups.country_label"),
      render: (value: unknown) => (
        <span className="font-mono text-sm font-medium">
          {(value as string) || "ΓÇö"}
        </span>
      ),
    },
  ];

  const tableData = initialData.map((city) => ({
    id: city.id,
    name: city.name,
    native: city.native,
    state_code: city.state_code,
    country_code: city.country_code,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t("master.cities")}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Input
              placeholder={t("groups.search_city")}
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

          <Combobox
            options={stateOptions}
            value={stateFilter}
            onValueChange={handleStateChange}
            placeholder={t("groups.state_label")}
            searchPlaceholder={t("groups.search_state")}
            emptyText={t("groups.no_state")}
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

      <Dialog open={!!selectedCity} onOpenChange={() => setSelectedCity(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedCity?.name}</DialogTitle>
          </DialogHeader>
          {selectedCity && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <DetailItem
                label={t("master.native_name")}
                value={selectedCity.native}
              />
              <DetailItem
                label={t("groups.state_label")}
                value={selectedCity.state_code}
              />
              <DetailItem
                label={t("groups.country_label")}
                value={selectedCity.country_code}
              />
              <DetailItem
                label={t("master.coordinates")}
                value={
                  selectedCity.latitude && selectedCity.longitude
                    ? `${selectedCity.latitude}, ${selectedCity.longitude}`
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
