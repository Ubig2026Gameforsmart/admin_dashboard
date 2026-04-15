import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function useAppearance() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return {
    theme,
    setTheme,
    mounted,
  };
}
