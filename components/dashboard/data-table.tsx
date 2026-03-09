"use client";

import type React from "react";
import { useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface Column {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, unknown>[];
  className?: string;
  // Pagination props
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: Record<string, unknown>) => void;
}

export function DataTable({
  columns,
  data,
  className,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  onRowClick,
}: DataTableProps) {
  const { t } = useTranslation();
  const showPagination = totalPages >= 1 && !!onPageChange;
  const [editingEllipsis, setEditingEllipsis] = useState<string | null>(null);
  const [jumpPage, setJumpPage] = useState("");

  const handleJumpToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpPage, 10);
    if (pageNum >= 1 && pageNum <= totalPages && onPageChange) {
      onPageChange(pageNum);
    }
    setEditingEllipsis(null);
    setJumpPage("");
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card overflow-hidden",
        className
      )}
    >
      <Table>
        <TableHeader>
          <TableRow className="border-border bg-secondary/50 hover:bg-secondary/50">
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn(
                  "text-muted-foreground font-medium",
                  column.align === "right" && "text-right pr-6",
                  column.align === "center" && "text-center"
                )}
              >
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-center py-8 text-muted-foreground"
              >
                {t("table.no_data")}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, rowIndex) => (
              <TableRow
                key={rowIndex}
                className={cn(
                  "border-border transition-colors hover:bg-secondary/60",
                  onRowClick && "cursor-pointer"
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <TableCell key={column.key} className="text-foreground">
                    {column.render
                      ? column.render(row[column.key], row)
                      : (row[column.key] as React.ReactNode)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {showPagination && (
        <div className="flex items-center justify-between border-t border-border bg-secondary/30 px-6 py-4">
          <div className="text-sm text-muted-foreground">
            {t("table.page")}{" "}
            <span className="font-medium text-foreground">{currentPage}</span>{" "}
            {t("table.of")}{" "}
            <span className="font-medium text-foreground">{totalPages}</span>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors",
                  currentPage === 1
                    ? "border-border bg-secondary/50 text-muted-foreground cursor-not-allowed"
                    : "border-border bg-card text-foreground hover:bg-secondary/80 cursor-pointer"
                )}
              >
                {t("action.previous")}
              </button>

              <div className="flex items-center gap-1">
                {(() => {
                  const pages: (number | string)[] = [];

                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) {
                      pages.push(i);
                    }
                  } else {
                    pages.push(1);

                    if (currentPage <= 3) {
                      pages.push(2, 3, 4, "...", totalPages);
                    } else if (currentPage >= totalPages - 2) {
                      pages.push(
                        "...",
                        totalPages - 3,
                        totalPages - 2,
                        totalPages - 1,
                        totalPages
                      );
                    } else {
                      pages.push(
                        "...",
                        currentPage - 1,
                        currentPage,
                        currentPage + 1,
                        "...",
                        totalPages
                      );
                    }
                  }

                  return pages.map((page, index) => {
                    if (page === "...") {
                      const ellipsisKey = `ellipsis-${index}`;

                      if (editingEllipsis === ellipsisKey) {
                        return (
                          <form
                            key={ellipsisKey}
                            onSubmit={handleJumpToPage}
                            className="relative"
                          >
                            <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                            <input
                              type="number"
                              min={1}
                              max={totalPages}
                              value={jumpPage}
                              onChange={(e) => setJumpPage(e.target.value)}
                              onBlur={() => {
                                setEditingEllipsis(null);
                                setJumpPage("");
                              }}
                              autoFocus
                              className="w-14 h-9 pl-6 pr-1 text-sm text-center font-medium rounded-lg border border-primary bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </form>
                        );
                      }

                      return (
                        <button
                          key={ellipsisKey}
                          onClick={() => setEditingEllipsis(ellipsisKey)}
                          className="w-9 h-9 flex items-center justify-center text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/80 rounded-lg border border-transparent hover:border-border transition-colors cursor-pointer"
                          title="Click to jump to page"
                        >
                          ...
                        </button>
                      );
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => onPageChange(page as number)}
                        className={cn(
                          "w-9 h-9 text-sm font-medium rounded-lg border transition-colors cursor-pointer",
                          currentPage === page
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-foreground hover:bg-secondary/80"
                        )}
                      >
                        {page}
                      </button>
                    );
                  });
                })()}
              </div>

              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors",
                  currentPage === totalPages
                    ? "border-border bg-secondary/50 text-muted-foreground cursor-not-allowed"
                    : "border-border bg-card text-foreground hover:bg-secondary/80 cursor-pointer"
                )}
              >
                {t("action.next")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Status badge helper
export function StatusBadge({
  status,
  label,
}: {
  status: string;
  label?: string;
}) {
  const variants: Record<string, string> = {
    Active:
      "bg-[var(--success)]/20 text-[var(--success)] border-[var(--success)]/30",
    Pending:
      "bg-[var(--warning)]/20 text-[var(--warning)] border-[var(--warning)]/30",
    "In Progress": "bg-primary/20 text-primary border-primary/30",
    Resolved:
      "bg-[var(--success)]/20 text-[var(--success)] border-[var(--success)]/30",
    "Under Review":
      "bg-[var(--warning)]/20 text-[var(--warning)] border-[var(--warning)]/30",
    Hidden: "bg-muted text-muted-foreground border-border",
    Inactive: "bg-muted text-muted-foreground border-border",
    Blocked: "bg-destructive/20 text-destructive border-destructive/30",
    Draft: "bg-secondary text-secondary-foreground border-border",
  };

  return (
    <Badge
      variant="outline"
      className={cn("font-medium", variants[status] || variants["Inactive"])}
    >
      {label || status}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const variants: Record<string, string> = {
    High: "bg-destructive/20 text-destructive border-destructive/30",
    Medium:
      "bg-[var(--warning)]/20 text-[var(--warning)] border-[var(--warning)]/30",
    Low: "bg-[var(--success)]/20 text-[var(--success)] border-[var(--success)]/30",
  };

  return (
    <Badge
      variant="outline"
      className={cn("font-medium", variants[priority] || "")}
    >
      {priority}
    </Badge>
  );
}
