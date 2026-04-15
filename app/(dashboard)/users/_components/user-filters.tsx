"use client";

import { useTranslation } from "@/lib/i18n";
import { SearchInput } from "@/components/shared/search-input";
import { SlidersHorizontal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserFiltersProps {
  roleFilter: string;
  setRoleFilter: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  onSearch: (val: string) => void;
}

export function UserFilters({
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  onSearch,
}: UserFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-3">
      <SearchInput
        placeholder={t("users.search")}
        onSearch={onSearch}
        className="w-64 bg-background border-border"
      />

      <Select value={roleFilter} onValueChange={setRoleFilter}>
        <SelectTrigger className="w-[170px]">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            <SelectValue placeholder={t("users.role")} />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("users.all_roles")}</SelectItem>
          <SelectItem value="user">{t("users.user")}</SelectItem>
          <SelectItem value="admin">{t("users.admin")}</SelectItem>
        </SelectContent>
      </Select>

      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-[170px]">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            <SelectValue placeholder={t("table.status")} />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("users.all_status")}</SelectItem>
          <SelectItem value="active">{t("status.active")}</SelectItem>
          <SelectItem value="blocked">{t("status.blocked")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
