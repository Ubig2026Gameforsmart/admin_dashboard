"use client";

import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/lib/i18n";
import { useAppearance } from "./_hooks/use-appearance";
import { ThemeCard } from "./_components/theme-card";

export default function AppearancePage() {
  const { theme, setTheme, mounted } = useAppearance();
  const { t } = useTranslation();

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-3xl font-bold tracking-tight text-foreground">
          {t("appearance.title")}
        </h3>
      </div>
      <Separator />

      <div className="space-y-8">
        <div className="space-y-1">
          <div className="font-medium">{t("appearance.theme")}</div>
          <div className="text-sm text-muted-foreground">
            {t("appearance.theme_desc")}
          </div>
        </div>

        <div className="grid max-w-md grid-cols-1 gap-8 md:grid-cols-2">
          <ThemeCard
            label={t("appearance.light")}
            isSelected={theme === "light"}
            onClick={() => setTheme("light")}
            variant="light"
          />
          <ThemeCard
            label={t("appearance.dark")}
            isSelected={theme === "dark"}
            onClick={() => setTheme("dark")}
            variant="dark"
          />
        </div>
      </div>
    </div>
  );
}
