import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, RotateCcw } from "lucide-react";

interface GroupDialogsProps {
  t: any;
  deleteDialog: any;
  setDeleteDialog: (val: any) => void;
  handleDeleteGroup: () => void;
  filterDialogOpen: boolean;
  setFilterDialogOpen: (val: boolean) => void;
  filterValues: any;
  setFilterValues: (val: any) => void;
  categoryOptions: any[];
  countryOptions: any[];
  stateOptions: any[];
  cityOptions: any[];
  handleCountryChange: (id: string) => void;
  handleStateChange: (id: string) => void;
  loadingStates: boolean;
  loadingCities: boolean;
  handleResetFilter: () => void;
  handleCancelFilter: () => void;
  handleApplyFilter: () => void;
}

export function GroupDialogs({
  t,
  deleteDialog,
  setDeleteDialog,
  handleDeleteGroup,
  filterDialogOpen,
  setFilterDialogOpen,
  filterValues,
  setFilterValues,
  categoryOptions,
  countryOptions,
  stateOptions,
  cityOptions,
  handleCountryChange,
  handleStateChange,
  loadingStates,
  loadingCities,
  handleResetFilter,
  handleCancelFilter,
  handleApplyFilter,
}: GroupDialogsProps) {
  return (
    <>
      {/* Delete Dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog((prev: any) => ({ ...prev, open, confirmText: "" }))
        }
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("groups.delete_title")}</DialogTitle>
            <DialogDescription>
              {t("groups.move_trash_desc")} <strong>{deleteDialog.groupName}</strong>{" "}
              {t("groups.move_trash_desc2")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label htmlFor="confirmDelete">
              {t("users.type_confirm")}{" "}
              <strong className="text-destructive">
                {t("users.move_trash_title")}
              </strong>{" "}
              {t("users.to_confirm")}
            </Label>
            <Input
              id="confirmDelete"
              value={deleteDialog.confirmText}
              onChange={(e) =>
                setDeleteDialog((prev: any) => ({
                  ...prev,
                  confirmText: e.target.value,
                }))
              }
              placeholder={`${t("users.type_confirm")} '${t("users.move_trash_title")}' ${t("users.here") || "here"}`}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() =>
                setDeleteDialog((prev: any) => ({
                  ...prev,
                  open: false,
                  confirmText: "",
                }))
              }
            >
              {t("action.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteGroup}
              disabled={deleteDialog.confirmText !== "Move to Trash"}
            >
              {t("action.move_to_trash")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              {t("action.filter")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Category */}
            <div className="grid gap-2">
              <Label htmlFor="category">{t("groups.category_label")}</Label>
              <Combobox
                options={categoryOptions}
                value={filterValues.category}
                onValueChange={(value) =>
                  setFilterValues((prev: any) => ({ ...prev, category: value }))
                }
                placeholder={t("groups.select_category")}
                searchPlaceholder={t("groups.search_category")}
                emptyText={t("groups.no_category")}
                className="w-full"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="country">{t("groups.country_label")}</Label>
              <Combobox
                options={countryOptions}
                value={filterValues.country}
                onValueChange={handleCountryChange}
                placeholder={t("groups.select_country")}
                searchPlaceholder={t("groups.search_country")}
                emptyText={t("groups.no_country")}
                className="w-full"
              />
            </div>

            {/* State */}
            <div className="grid gap-2">
              <Label htmlFor="state">{t("groups.state_label")}</Label>
              <Combobox
                options={stateOptions}
                value={filterValues.state}
                onValueChange={handleStateChange}
                placeholder={
                  loadingStates ? "Loading..." : t("groups.select_state")
                }
                searchPlaceholder={t("groups.search_state")}
                emptyText={
                  filterValues.country
                    ? t("groups.no_state")
                    : t("groups.select_state_first")
                }
                className="w-full"
                disabled={!filterValues.country}
              />
            </div>

            {/* City */}
            <div className="grid gap-2">
              <Label htmlFor="city">{t("groups.city_label")}</Label>
              <Combobox
                options={cityOptions}
                value={filterValues.city}
                onValueChange={(value) =>
                  setFilterValues((prev: any) => ({ ...prev, city: value }))
                }
                placeholder={
                  loadingCities ? "Loading..." : t("groups.select_city")
                }
                searchPlaceholder={t("groups.search_city")}
                emptyText={
                  filterValues.state
                    ? t("groups.no_city")
                    : t("groups.select_city_first")
                }
                className="w-full"
                disabled={!filterValues.state}
              />
            </div>

            {/* Status */}
            <div className="grid gap-2">
              <Label htmlFor="status">{t("groups.status_label")}</Label>
              <Select
                value={filterValues.status}
                onValueChange={(value) =>
                  setFilterValues((prev: any) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder={t("groups.status_label")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("groups.all")}</SelectItem>
                  <SelectItem value="public">{t("groups.public")}</SelectItem>
                  <SelectItem value="private">{t("groups.private")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-row gap-2 sm:justify-between">
            <Button
              variant="ghost"
              onClick={handleResetFilter}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              {t("action.reset")}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancelFilter}>
                {t("action.cancel")}
              </Button>
              <Button
                onClick={handleApplyFilter}
                className="bg-primary hover:bg-primary/90"
              >
                {t("action.apply")}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
