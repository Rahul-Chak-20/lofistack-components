"use client";

import { useId, useMemo, useState, type ReactNode } from "react";

export type SortDirection = "asc" | "desc";
export type SortValue = string | number | Date | boolean | null | undefined;

export interface SortState {
  key: string;
  direction: SortDirection;
}

export interface DataTableColumn<T> {
  /** Unique key for the column. Also used to read `row[key]` when there is no accessor. */
  key: string;
  /** Header text. */
  header: string;
  /** Value used for sorting and searching. Defaults to `row[key]`. */
  accessor?: (row: T) => SortValue;
  /** Custom cell renderer. Defaults to the accessor value as text. */
  cell?: (row: T) => ReactNode;
  /** Whether the column can be sorted. Defaults to true. */
  sortable?: boolean;
  /** Whether the search box looks at this column. Defaults to true. */
  searchable?: boolean;
  /** Text alignment for the header and cells. Defaults to "left". */
  align?: "left" | "center" | "right";
  /** Extra classes for this column's cells. */
  className?: string;
}

export type DataTableDensity = "comfortable" | "compact";

export interface DataTableProps<T> {
  /** Rows to display. */
  data: T[];
  /** Column definitions. */
  columns: DataTableColumn<T>[];
  /** Returns a stable unique id for a row. Required for selection. */
  getRowId: (row: T, index: number) => string;
  /** Accessible name for the table. Rendered as a visually hidden caption. */
  caption: string;
  /** Shows the search box. Defaults to true. */
  searchable?: boolean;
  /** Placeholder for the search box. */
  searchPlaceholder?: string;
  /** Initial sort. */
  defaultSort?: SortState;
  /** Rows per page to start with. Defaults to 10. */
  pageSize?: number;
  /** Choices for the rows-per-page select. Pass an empty array to hide it. */
  pageSizeOptions?: number[];
  /** Adds a checkbox column for selecting rows. */
  selectable?: boolean;
  /** Controlled selected row ids. */
  selectedIds?: string[];
  /** Called with the new list of selected ids. */
  onSelectionChange?: (ids: string[]) => void;
  /** Shows skeleton rows and marks the table busy. */
  loading?: boolean;
  /** Number of skeleton rows while loading. Defaults to 5. */
  loadingRows?: number;
  /** Shown when there are no rows, or no rows match the search. */
  emptyMessage?: ReactNode;
  /** Row padding preset. Defaults to "comfortable". */
  density?: DataTableDensity;
  /** Called when a row is clicked. */
  onRowClick?: (row: T) => void;
  /** Classes for the outer wrapper. */
  className?: string;
}

const alignClasses = { left: "text-left", center: "text-center", right: "text-right" } as const;
const justifyClasses = { left: "justify-start", center: "justify-center", right: "justify-end" } as const;
const densityClasses: Record<DataTableDensity, string> = { comfortable: "px-4 py-3", compact: "px-3 py-1.5" };

function readValue<T>(row: T, column: DataTableColumn<T>): SortValue {
  if (column.accessor) return column.accessor(row);
  return (row as Record<string, unknown>)[column.key] as SortValue;
}

function toText(value: SortValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toLocaleDateString();
  return String(value);
}

const isEmpty = (value: SortValue) => value === null || value === undefined || value === "";

/** Compares two non-empty values. */
function compareValues(a: SortValue, b: SortValue): number {
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

function SortIcon({ direction }: { direction?: SortDirection }) {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="m5 6 3-3 3 3" className={direction === "desc" ? "opacity-25" : direction ? "" : "opacity-40"} />
      <path d="m5 10 3 3 3-3" className={direction === "asc" ? "opacity-25" : direction ? "" : "opacity-40"} />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function Checkbox({
  checked,
  indeterminate = false,
  label,
  disabled,
  onChange,
}: {
  checked: boolean;
  indeterminate?: boolean;
  label: string;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      aria-label={label}
      ref={(el) => {
        if (el) el.indeterminate = indeterminate;
      }}
      onChange={onChange}
      onClick={(e) => e.stopPropagation()}
      className="size-4 cursor-pointer rounded border-white/20 accent-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
    />
  );
}

const pagerButton =
  "grid size-8 place-items-center rounded-lg border border-white/10 text-zinc-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 active:scale-95 disabled:pointer-events-none disabled:opacity-35";

export function DataTable<T>({
  data,
  columns,
  getRowId,
  caption,
  searchable = true,
  searchPlaceholder = "Search…",
  defaultSort,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  selectable = false,
  selectedIds,
  onSelectionChange,
  loading = false,
  loadingRows = 5,
  emptyMessage = "No results.",
  density = "comfortable",
  onRowClick,
  className = "",
}: DataTableProps<T>) {
  const id = useId();
  const searchId = `${id}-search`;
  const pageSizeId = `${id}-page-size`;

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortState | undefined>(defaultSort);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [innerSelected, setInnerSelected] = useState<string[]>([]);

  const selected = useMemo(() => new Set(selectedIds ?? innerSelected), [selectedIds, innerSelected]);

  function updateSelection(next: Set<string>) {
    const ids = [...next];
    if (selectedIds === undefined) setInnerSelected(ids);
    onSelectionChange?.(ids);
  }

  const rows = useMemo(() => data.map((row, index) => ({ row, id: getRowId(row, index) })), [data, getRowId]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    const searchColumns = columns.filter((c) => c.searchable !== false);
    return rows.filter(({ row }) =>
      searchColumns.some((c) => toText(readValue(row, c)).toLowerCase().includes(needle)),
    );
  }, [rows, columns, query]);

  const sorted = useMemo(() => {
    const column = sort && columns.find((c) => c.key === sort.key);
    if (!sort || !column) return filtered;
    const factor = sort.direction === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const valueA = readValue(a.row, column);
      const valueB = readValue(b.row, column);
      // Empty values stay at the bottom in both directions.
      if (isEmpty(valueA) || isEmpty(valueB)) return Number(isEmpty(valueA)) - Number(isEmpty(valueB));
      return compareValues(valueA, valueB) * factor;
    });
  }, [filtered, columns, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const pageRows = sorted.slice(start, start + pageSize);

  const pageIds = pageRows.map((r) => r.id);
  const selectedOnPage = pageIds.filter((rowId) => selected.has(rowId)).length;
  const allOnPageSelected = pageIds.length > 0 && selectedOnPage === pageIds.length;

  function toggleSort(key: string) {
    setSort((current) => {
      if (!current || current.key !== key) return { key, direction: "asc" };
      if (current.direction === "asc") return { key, direction: "desc" };
      return undefined;
    });
  }

  function toggleRow(rowId: string) {
    const next = new Set(selected);
    if (next.has(rowId)) next.delete(rowId);
    else next.add(rowId);
    updateSelection(next);
  }

  function togglePage() {
    const next = new Set(selected);
    for (const rowId of pageIds) {
      if (allOnPageSelected) next.delete(rowId);
      else next.add(rowId);
    }
    updateSelection(next);
  }

  const cellPadding = densityClasses[density];
  const columnCount = columns.length + (selectable ? 1 : 0);
  const summary = loading
    ? "Loading rows"
    : sorted.length === 0
      ? "No rows to show"
      : `Showing ${start + 1} to ${start + pageRows.length} of ${sorted.length} rows`;

  return (
    <div className={`w-full ${className}`}>
      {(searchable || (selectable && selected.size > 0)) && (
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {searchable && (
            <div className="relative w-full sm:max-w-xs">
              <label htmlFor={searchId} className="sr-only">
                Search {caption}
              </label>
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                <SearchIcon />
              </span>
              <input
                id={searchId}
                type="search"
                value={query}
                placeholder={searchPlaceholder}
                disabled={loading}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                className="h-10 w-full rounded-xl border border-white/15 bg-white/[0.03] pl-9 pr-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 hover:bg-white/[0.05] focus:border-violet-400 focus:ring-4 focus:ring-violet-400/30 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          )}
          {selectable && selected.size > 0 && (
            <div className="flex items-center gap-3 text-sm text-zinc-300">
              <span className="tabular-nums">{selected.size} selected</span>
              <button
                type="button"
                onClick={() => updateSelection(new Set())}
                className="rounded-lg px-2 py-1 text-violet-300 transition hover:bg-white/10 hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-zinc-950/40">
        <table className="w-full min-w-[36rem] border-collapse text-sm" aria-busy={loading || undefined}>
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-white/[0.03] text-zinc-400">
            <tr>
              {selectable && (
                <th scope="col" className={`w-10 ${cellPadding}`}>
                  <Checkbox
                    checked={allOnPageSelected}
                    indeterminate={selectedOnPage > 0 && !allOnPageSelected}
                    disabled={loading || pageIds.length === 0}
                    label={allOnPageSelected ? "Deselect all rows on this page" : "Select all rows on this page"}
                    onChange={togglePage}
                  />
                </th>
              )}
              {columns.map((column) => {
                const align = column.align ?? "left";
                const direction = sort?.key === column.key ? sort.direction : undefined;
                const sortable = column.sortable !== false;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={direction === "asc" ? "ascending" : direction === "desc" ? "descending" : sortable ? "none" : undefined}
                    className={`whitespace-nowrap font-medium ${alignClasses[align]} ${sortable ? "px-2 py-1.5" : cellPadding}`}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        disabled={loading}
                        className={`inline-flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:pointer-events-none ${justifyClasses[align]} ${direction ? "text-violet-300" : ""}`}
                      >
                        {column.header}
                        <SortIcon direction={direction} />
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              Array.from({ length: loadingRows }, (_, i) => (
                <tr key={`skeleton-${i}`} aria-hidden="true">
                  {Array.from({ length: columnCount }, (_, j) => (
                    <td key={j} className={cellPadding}>
                      <div
                        className="h-4 animate-pulse rounded bg-white/[0.07] motion-reduce:animate-none"
                        style={{ width: selectable && j === 0 ? "1rem" : `${55 + ((i * 7 + j * 13) % 40)}%` }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="px-4 py-14 text-center text-zinc-400">
                  {query ? (
                    <>
                      No rows match <span className="font-medium text-zinc-200">“{query}”</span>.{" "}
                      <button
                        type="button"
                        onClick={() => setQuery("")}
                        className="rounded text-violet-300 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                      >
                        Clear search
                      </button>
                    </>
                  ) : (
                    emptyMessage
                  )}
                </td>
              </tr>
            ) : (
              pageRows.map(({ row, id: rowId }, index) => {
                const isSelected = selected.has(rowId);
                return (
                  <tr
                    key={rowId}
                    aria-selected={selectable ? isSelected : undefined}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={`transition-colors hover:bg-white/[0.03] ${isSelected ? "bg-violet-500/[0.08] hover:bg-violet-500/[0.12]" : ""} ${onRowClick ? "cursor-pointer" : ""}`}
                  >
                    {selectable && (
                      <td className={cellPadding}>
                        <Checkbox
                          checked={isSelected}
                          label={`Select row ${start + index + 1}`}
                          onChange={() => toggleRow(rowId)}
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`text-zinc-200 ${cellPadding} ${alignClasses[column.align ?? "left"]} ${column.className ?? ""}`}
                      >
                        {column.cell ? column.cell(row) : toText(readValue(row, column))}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-col gap-3 text-sm text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
        <p aria-live="polite" className="tabular-nums">
          {summary}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {pageSizeOptions.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor={pageSizeId}>Rows per page</label>
              <select
                id={pageSizeId}
                value={pageSize}
                disabled={loading}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="h-8 rounded-lg border border-white/15 bg-zinc-900 px-2 text-zinc-100 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/30 disabled:opacity-50"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          )}
          <nav aria-label="Pagination" className="flex items-center gap-1.5">
            <button type="button" className={pagerButton} onClick={() => setPage(1)} disabled={loading || currentPage === 1} aria-label="First page">
              «
            </button>
            <button type="button" className={pagerButton} onClick={() => setPage(currentPage - 1)} disabled={loading || currentPage === 1} aria-label="Previous page">
              ‹
            </button>
            <span className="min-w-20 text-center tabular-nums">
              Page {currentPage} of {pageCount}
            </span>
            <button type="button" className={pagerButton} onClick={() => setPage(currentPage + 1)} disabled={loading || currentPage === pageCount} aria-label="Next page">
              ›
            </button>
            <button type="button" className={pagerButton} onClick={() => setPage(pageCount)} disabled={loading || currentPage === pageCount} aria-label="Last page">
              »
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}

export default DataTable;
