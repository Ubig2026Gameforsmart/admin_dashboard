"use client";

import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value?: string;
  onSearch: (value: string) => void;
  /** Custom wrapper class */
  containerClassName?: string;
}

export function SearchInput({
  value = "",
  onSearch,
  placeholder = "Search...",
  className,
  containerClassName,
  ...props
}: SearchInputProps) {
  const [inputValue, setInputValue] = useState(value);

  // Sync internal state if external value changes (for instance when cleared from parent)
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleSearch = () => {
    onSearch(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleClear = () => {
    setInputValue("");
    onSearch(""); // Instantly clear the search result on parent
  };

  return (
    <div className={cn("relative", containerClassName)}>
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn("pr-16", className)}
        {...props}
      />
      
      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {inputValue && (
          <button
            onClick={handleClear}
            className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
            title="Clear"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={handleSearch}
          type="button"
          className="h-7 w-7 flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
        >
          <Search className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
