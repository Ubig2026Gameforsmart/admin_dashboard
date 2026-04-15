import { useState } from "react";
import { useRouter } from "next/navigation";

export function useGameDashboard() {
  const router = useRouter();
  const [activeLabel, setActiveLabel] = useState<string | null>(null);

  const handleAppClick = (data: any) => {
    if (data && data.name) {
      router.push(`/game-sessions?application=${encodeURIComponent(data.name)}`);
    }
  };

  const handleHostClick = (data: any) => {
    if (data && data.id) {
      router.push(`/users/${data.id}`);
    }
  };

  const handleCategoryClick = (data: any) => {
    if (data && data.name) {
      router.push(`/quizzes?category=${encodeURIComponent(data.name)}`);
    }
  };

  const handleCountryClick = (data: any) => {
    if (data && data.name) {
      router.push(`/users?country=${encodeURIComponent(data.name)}`);
    }
  };

  const handleStateClick = (data: any) => {
    if (data && data.name) {
      router.push(`/users?state=${encodeURIComponent(data.name)}`);
    }
  };

  const handleCityClick = (data: any) => {
    if (data && data.name) {
      router.push(`/users?city=${encodeURIComponent(data.name)}`);
    }
  };

  return {
    activeLabel,
    setActiveLabel,
    handleAppClick,
    handleHostClick,
    handleCategoryClick,
    handleCountryClick,
    handleStateClick,
    handleCityClick,
  };
}
