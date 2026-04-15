export const getActivityColumns = (t: (key: string) => string) => [
  { key: "action", label: t("table.actions") },
  { key: "user", label: t("stats.users") },
  { key: "time", label: t("table.created") },
  {
    key: "type",
    label: "Type",
    render: (value: unknown) => {
      const typeColors: Record<string, string> = {
        billing: "text-[var(--success)]",
        support: "text-[var(--warning)]",
        content: "text-primary",
        user: "text-chart-2",
      };
      return (
        <span
          className={`capitalize font-medium ${
            typeColors[value as string] || ""
          }`}
        >
          {value as string}
        </span>
      );
    },
  },
];
