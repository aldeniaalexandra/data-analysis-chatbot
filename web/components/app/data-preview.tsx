"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Table2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface DataPreviewProps {
  headers: string[];
  rows: string[][];
  totalRows: number;
  filename: string;
  uploading: boolean;
  onReplace: (file: File | undefined) => void;
}

const PAGE_SIZES = [10, 25, 50, 100];

export function DataPreview({
  headers,
  rows,
  totalRows,
  filename,
  uploading,
  onReplace,
}: DataPreviewProps) {
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const sorted = useMemo(() => {
    if (sortCol === null) return rows;
    const copy = rows.slice();
    copy.sort((a, b) => {
      const va = a[sortCol] ?? "";
      const vb = b[sortCol] ?? "";
      const na = parseFloat(va);
      const nb = parseFloat(vb);
      if (!isNaN(na) && !isNaN(nb)) return sortAsc ? na - nb : nb - na;
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return copy;
  }, [rows, sortCol, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * pageSize;
  const visible = sorted.slice(start, start + pageSize);

  function toggleSort(i: number) {
    if (sortCol === i) setSortAsc((v) => !v);
    else {
      setSortCol(i);
      setSortAsc(true);
    }
    setPage(1);
  }

  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Table2 className="size-4 text-primary" />
          Data preview
        </h2>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-muted-foreground">
            {filename}
          </span>
          <label
            className={cn(
              "flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary",
              uploading && "pointer-events-none opacity-60"
            )}
          >
            {uploading ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <RefreshCw className="size-3" />
            )}
            Replace
            <input
              type="file"
              accept=".csv"
              className="hidden"
              disabled={uploading}
              onClick={(e) => ((e.target as HTMLInputElement).value = "")}
              onChange={(e) => onReplace(e.target.files?.[0])}
            />
          </label>
        </div>
      </header>
      <div className="scrollbar-visible max-h-80 overflow-auto border-y border-border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow className="hover:bg-transparent">
              {headers.map((h, i) => (
                <TableHead
                  key={`${h}-${i}`}
                  onClick={() => toggleSort(i)}
                  className={cn(
                    "cursor-pointer select-none whitespace-nowrap font-mono text-[11px]",
                    sortCol === i && "text-primary"
                  )}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {h}
                    {sortCol === i ? (
                      sortAsc ? (
                        <ArrowUp className="size-3" />
                      ) : (
                        <ArrowDown className="size-3" />
                      )
                    ) : (
                      <ArrowUpDown className="size-3 opacity-30" />
                    )}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((row, ri) => (
              <TableRow key={start + ri}>
                {headers.map((_, ci) => {
                  const v = row[ci] ?? "";
                  const isNum = v !== "" && !isNaN(parseFloat(v));
                  return (
                    <TableCell
                      key={ci}
                      title={v}
                      className={cn(
                        "max-w-48 truncate whitespace-nowrap text-[13px]",
                        isNum && "font-mono text-xs text-accent-foreground"
                      )}
                    >
                      {v}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          Rows per page
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              setPageSize(Number(v));
              setPage(1);
            }}
          >
            <SelectTrigger size="sm" className="h-7 w-18 font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="font-mono text-[11px] text-muted-foreground">
          {totalRows.toLocaleString()} rows, {headers.length} columns
          {rows.length < totalRows
            ? `, previewing first ${rows.length.toLocaleString()}`
            : ""}
        </p>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={current === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="font-mono text-[11px] text-muted-foreground">
            {current} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={current === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </footer>
    </section>
  );
}
