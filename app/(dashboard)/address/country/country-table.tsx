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
import { type Country, fetchCountryById } from "./actions";
import { useTranslation } from "@/lib/i18n";

interface CountryTableProps {
  initialData: Country[];
  totalPages: number;
  currentPage: number;
  regions: string[];
  searchQuery: string;
  regionFilter: string;
}

export function CountryTable({
  initialData,
  totalPages,
  currentPage,
  regions,
  searchQuery,
  regionFilter,
}: CountryTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { t } = useTranslation();

  const [searchInput, setSearchInput] = useState(searchQuery);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [loadingCountry, setLoadingCountry] = useState(false);

  const regionOptions = [
    { value: "all", label: t("master.all_regions") },
    ...regions.map((region) => ({ value: region, label: region })),
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

  const handleRegionChange = (value: string) => {
    updateUrl({ region: value, page: 1 });
  };

  const handlePageChange = (page: number) => {
    updateUrl({ page, search: searchQuery, region: regionFilter });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleIdClick = (countryCode: string) => {
    router.push(`/address/state?country=${countryCode}`);
  };

  const handleNameClick = async (id: number) => {
    setLoadingCountry(true);
    const country = await fetchCountryById(id);
    setSelectedCountry(country);
    setLoadingCountry(false);
  };

  const columns = [
    {
      key: "id",
      label: "ID",
      render: (value: unknown, row: Record<string, unknown>) => (
        <button
          onClick={() => handleIdClick(row.iso2 as string)}
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
          disabled={loadingCountry}
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
      key: "region",
      label: t("table.region"),
      render: (value: unknown) => (
        <span className="text-sm">{(value as string) || "ΓÇö"}</span>
      ),
    },
    {
      key: "iso2",
      label: t("table.code"),
      render: (value: unknown) => (
        <span className="font-mono text-sm font-medium">
          {(value as string) || "ΓÇö"}
        </span>
      ),
    },
  ];

  const tableData = initialData.map((country) => ({
    id: country.id,
    name: country.name,
    native: country.native,
    region: country.region,
    iso2: country.iso2,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t("master.countries")}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Input
              placeholder={t("groups.search_country")}
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
            options={regionOptions}
            value={regionFilter}
            onValueChange={handleRegionChange}
            placeholder={t("table.region")}
            searchPlaceholder={t("master.search_region")}
            emptyText={t("master.no_region")}
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
        open={!!selectedCountry}
        onOpenChange={() => setSelectedCountry(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              {selectedCountry?.emoji && (
                <span className="text-2xl">{selectedCountry.emoji}</span>
              )}
              {selectedCountry?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedCountry && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <DetailItem
                label={t("master.native_name")}
                value={selectedCountry.native}
              />
              <DetailItem
                label={t("master.iso_code")}
                value={`${selectedCountry.iso2} / ${selectedCountry.iso3}`}
              />
              <DetailItem
                label={t("master.capital")}
                value={selectedCountry.capital}
              />
              <DetailItem
                label={t("master.phone_code")}
                value={
                  selectedCountry.phonecode
                    ? `+${selectedCountry.phonecode}`
                    : null
                }
              />
              <DetailItem
                label={t("table.region")}
                value={selectedCountry.region}
              />
              <DetailItem
                label={t("master.subregion")}
                value={selectedCountry.subregion}
              />
              <DetailItem
                label={t("master.currency")}
                value={
                  selectedCountry.currency
                    ? `${selectedCountry.currency} (${selectedCountry.currency_symbol})`
                    : null
                }
              />
              <DetailItem
                label={t("master.coordinates")}
                value={
                  selectedCountry.latitude && selectedCountry.longitude
                    ? `${selectedCountry.latitude}, ${selectedCountry.longitude}`
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
