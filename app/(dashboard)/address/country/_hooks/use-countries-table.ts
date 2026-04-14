import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchCountryById } from "../actions";
import { type Country } from "@/types/address";

export function useCountriesTable(searchQuery: string, regionFilter: string) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [loadingCountry, setLoadingCountry] = useState(false);

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

  return {
    isPending,
    selectedCountry,
    setSelectedCountry,
    loadingCountry,
    updateUrl,
    handleRegionChange,
    handlePageChange,
    handleIdClick,
    handleNameClick,
  };
}
