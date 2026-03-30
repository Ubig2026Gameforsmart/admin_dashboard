"use client";

import * as React from "react";
import { Check, ChevronDown, SearchIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface ComboboxOption {
  value: string;
  label: string;
  rightElement?: React.ReactNode;
  /** Used for tab-based grouping */
  group?: string;
}

export interface ComboboxTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
  /** Optional tabs for grouping options. Options must have matching `group` field. */
  tabs?: ComboboxTab[];
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  className,
  disabled = false,
  tabs,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [appliedFilter, setAppliedFilter] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<string>(tabs?.[0]?.id || "");

  const selectedOption = options.find((option) => option.value === value);

  // Reset filter when popover closes
  React.useEffect(() => {
    if (!open) {
      setInputValue("");
      setAppliedFilter("");
      if (tabs?.[0]) setActiveTab(tabs[0].id);
    }
  }, [open, tabs]);

  // Filter options: by tab group first, then by search term
  const filteredOptions = React.useMemo(() => {
    let result = options;

    // Filter by active tab if tabs are provided
    if (tabs && tabs.length > 0 && activeTab) {
      // Keep items without group (like "None") visible in all tabs
      result = result.filter((opt) => !opt.group || opt.group === activeTab);
    }

    // Filter by search term
    if (appliedFilter) {
      result = result.filter((opt) =>
        opt.label.toLowerCase().includes(appliedFilter.toLowerCase())
      );
    }

    return result;
  }, [options, tabs, activeTab, appliedFilter]);

  return (
    <Popover
      open={open}
      onOpenChange={(newOpen) => !disabled && setOpen(newOpen)}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal",
            disabled &&
              "cursor-not-allowed opacity-50 hover:bg-background hover:text-foreground",
            className
          )}
          disabled={disabled}
          style={disabled ? { pointerEvents: "auto" } : undefined}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0 flex flex-col" 
        style={{ maxHeight: "calc(var(--radix-popover-content-available-height) - 16px)" }}
        align="start"
        sideOffset={8}
      >
        <Command shouldFilter={false} className="flex-1 flex flex-col overflow-hidden max-h-full">
          {/* Tabs */}
          {tabs && tabs.length > 0 && (
            <div className="flex border-b">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setAppliedFilter("");
                    setInputValue("");
                  }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors relative",
                    activeTab === tab.id
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {tab.icon}
                  {tab.label}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Search input - filters on Enter */}
          <div
            data-slot="command-input-wrapper"
            className="flex h-9 items-center gap-2 border-b px-3"
          >
            <SearchIcon className="size-4 shrink-0 opacity-50" />
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setAppliedFilter(inputValue);
                }
                if (e.key === "Escape") {
                  setOpen(false);
                }
              }}
              placeholder={searchPlaceholder}
              className="placeholder:text-muted-foreground flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
            />
            {appliedFilter && (
              <button
                type="button"
                onClick={() => {
                  setInputValue("");
                  setAppliedFilter("");
                }}
                className="text-xs text-muted-foreground hover:text-foreground shrink-0 px-1"
              >
                Clear
              </button>
            )}
          </div>
          <CommandList className="flex-1 overflow-y-auto min-h-0 min-w-0 max-h-[300px]">
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onValueChange(option.value);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate flex-1">{option.label}</span>
                    {option.rightElement && (
                      <div className="ml-auto pl-2 shrink-0 flex items-center">
                        {option.rightElement}
                      </div>
                    )}
                  </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
