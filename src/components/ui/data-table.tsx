"use client";

import {
  Fragment,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

export type SortDirection = "asc" | "desc";
export type SortValue = string | number | Date | boolean | null | undefined;

export interface SortState {
  key: string;
  direction: SortDirection;
}

export interface FilterOption {
  label: string;
  /** Compared with the column value as text. */
  value: string;
}

export interface DataTableColumn<T> {
  /** Unique key for the column. Also used to read `row[key]` when there is no accessor. */
  key: string;
  /** Header text. */
  header: string;
  /** Value used for sorting, searching, filtering and CSV export. Defaults to `row[key]`. */
  accessor?: (row: T) => SortValue;
  /** Custom cell renderer. Defaults to the accessor value as text. */
  cell?: (row: T) => ReactNode;
  /** Whether the column can be sorted. Defaults to true. */
  sortable?: boolean;
  /** Whether the search box looks at this column. Defaults to true. */
  searchable?: boolean;
  /** Adds a filter menu to the toolbar with these options. */
  filterOptions?: FilterOption[];
  /** Whether the column can be hidden from the Columns menu. Defaults to true. */
  hideable?: boolean;
  /** Starts hidden. Users can show it from the Columns menu. */
  defaultHidden?: boolean;
  /** Footer cell, given every row that matches the current search and filters. */
  footer?: (rows: T[]) => ReactNode;
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
  /** Returns a stable unique id for a row. */
  getRowId: (row: T, index: number) => string;
  /** Accessible name for the table. Rendered as a visually hidden caption. */
  caption: string;
  /** Shows the search box. Defaults to true. */
  searchable?: boolean;
  /** Placeholder for the search box. */
  searchPlaceholder?: string;
  /** Initial sort. Pass an array to start with a multi-column sort. */
  defaultSort?: SortState | SortState[];
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
  /** Rendered next to the selection count, with the selected rows and a function that clears them. */
  bulkActions?: (rows: T[], clearSelection: () => void) => ReactNode;
  /** Content shown in a panel under a row when it is expanded. Adds an expand column. */
  renderExpanded?: (row: T) => ReactNode;
  /** Shows the Columns menu for hiding and showing columns. Defaults to true. */
  columnToggle?: boolean;
  /** Shows an Export CSV button. Exports the selected rows, or every matching row. */
  exportable?: boolean;
  /** File name for the CSV export, without the extension. Defaults to "export". */
  exportFileName?: string;
  /** Keeps the header visible while the body scrolls. Use with maxHeight. */
  stickyHeader?: boolean;
  /** Max height of the scroll area, like "28rem". */
  maxHeight?: string;
  /** Shows skeleton rows and marks the table busy. */
  loading?: boolean;
  /** Number of skeleton rows while loading. Defaults to 5. */
  loadingRows?: number;
  /** Shown when there are no rows. */
  emptyMessage?: ReactNode;
  /** Row padding preset. Defaults to "comfortable". */
  density?: DataTableDensity;
  /** Called when a row is clicked, or when Enter is pressed on a focused row. */
  onRowClick?: (row: T) => void;
  /** Classes for the outer wrapper. */
  className?: string;
}

const alignClasses = { left: "text-left", center: "text-center", right: "text-right" } as const;
const justifyClasses = { left: "justify-start", center: "justify-center", right: "justify-end" } as const;
const densityClasses: Record<DataTableDensity, string> = { comfortable: "px-4 py-3", compact: "px-3 py-1.5" };

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400";
const toolbarButton = `inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-3 text-sm text-zinc-200 transition hover:bg-white/[0.07] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${focusRing}`;
const pagerButton = `grid size-8 place-items-center rounded-lg border border-white/10 text-zinc-300 transition hover:bg-white/10 hover:text-white active:scale-95 disabled:pointer-events-none disabled:opacity-35 ${focusRing}`;

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

function toCsvCell(value: SortValue): string {
  let text = value instanceof Date ? value.toISOString().slice(0, 10) : toText(value);
  // Stop spreadsheet apps from running cell text as a formula.
  if (/^[=+\-@\t\r]/.test(text) && typeof value !== "number") text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Page numbers to show, with "…" for gaps: 1 … 4 5 6 … 10 */
function pageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (current >= total - 2) [total - 3, total - 2, total - 1].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? ["…" as const, p] : [p]));
}

function SortIcon({ direction }: { direction?: SortDirection }) {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="m5 6 3-3 3 3" className={direction === "desc" ? "opacity-25" : direction ? "" : "opacity-40"} />
      <path d="m5 10 3 3 3-3" className={direction === "asc" ? "opacity-25" : direction ? "" : "opacity-40"} />
    </svg>
  );
}

const icons = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  filter: <path d="M3 5h18l-7 8v6l-4-2v-4L3 5Z" />,
  columns: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16M15 4v16" /></>,
  download: <><path d="M12 4v11m0 0-4-4m4 4 4-4" /><path d="M4 19h16" /></>,
  chevron: <path d="m9 6 6 6-6 6" />,
};

function Icon({ name, className = "size-4" }: { name: keyof typeof icons; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {icons[name]}
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

/** A toolbar button that opens a small panel. Closes on outside click and Escape. */
function Popover({
  label,
  icon,
  count,
  disabled,
  align = "left",
  children,
}: {
  label: string;
  icon: keyof typeof icons;
  count?: number;
  disabled?: boolean;
  align?: "left" | "right";
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`${toolbarButton} ${count ? "border-violet-400/50 text-violet-200" : ""}`}
      >
        <Icon name={icon} className="size-3.5" />
        {label}
        {!!count && (
          <span className="rounded-full bg-violet-500/25 px-1.5 text-xs tabular-nums text-violet-200">
            <span className="sr-only">, </span>
            {count}
            <span className="sr-only"> active</span>
          </span>
        )}
      </button>
      {open && (
        <div
          id={panelId}
          role="group"
          aria-label={label}
          className={`absolute top-full z-30 mt-2 min-w-52 rounded-xl border border-white/10 bg-zinc-900 p-1.5 shadow-2xl shadow-black/50 ${align === "right" ? "right-0" : "left-0"}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function MenuCheckbox({ label, checked, disabled, hint, onChange }: { label: string; checked: boolean; disabled?: boolean; hint?: ReactNode; onChange: () => void }) {
  return (
    <label className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-zinc-200 hover:bg-white/[0.06] has-[:focus-visible]:bg-white/[0.06] ${disabled ? "cursor-not-allowed opacity-50" : ""}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={onChange} className="size-4 accent-violet-500 focus-visible:outline-none" />
      <span className="flex-1">{label}</span>
      {hint !== undefined && <span className="text-xs tabular-nums text-zinc-500">{hint}</span>}
    </label>
  );
}

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
  bulkActions,
  renderExpanded,
  columnToggle = true,
  exportable = false,
  exportFileName = "export",
  stickyHeader = false,
  maxHeight,
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
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [sorts, setSorts] = useState<SortState[]>(() => (defaultSort ? [defaultSort].flat() : []));
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [hidden, setHidden] = useState<string[]>(() => columns.filter((c) => c.defaultHidden).map((c) => c.key));
  const [expanded, setExpanded] = useState<string[]>([]);
  const [innerSelected, setInnerSelected] = useState<string[]>([]);

  const selected = useMemo(() => new Set(selectedIds ?? innerSelected), [selectedIds, innerSelected]);
  const visibleColumns = columns.filter((c) => !hidden.includes(c.key));
  const filterColumns = columns.filter((c) => c.filterOptions?.length);

  function updateSelection(next: Set<string>) {
    const ids = [...next];
    if (selectedIds === undefined) setInnerSelected(ids);
    onSelectionChange?.(ids);
  }
  const clearSelection = () => updateSelection(new Set());

  const rows = useMemo(() => data.map((row, index) => ({ row, id: getRowId(row, index) })), [data, getRowId]);

  const optionCounts = useMemo(() => {
    const counts: Record<string, Record<string, number>> = {};
    for (const column of columns) {
      if (!column.filterOptions?.length) continue;
      counts[column.key] = {};
      for (const { row } of rows) {
        const text = toText(readValue(row, column));
        counts[column.key][text] = (counts[column.key][text] ?? 0) + 1;
      }
    }
    return counts;
  }, [rows, columns]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const searchColumns = columns.filter((c) => c.searchable !== false);
    const activeFilters = columns
      .filter((c) => filters[c.key]?.length)
      .map((c) => ({ column: c, values: new Set(filters[c.key]) }));
    return rows.filter(({ row }) => {
      for (const { column, values } of activeFilters) {
        if (!values.has(toText(readValue(row, column)))) return false;
      }
      if (!needle) return true;
      return searchColumns.some((c) => toText(readValue(row, c)).toLowerCase().includes(needle));
    });
  }, [rows, columns, query, filters]);

  const sorted = useMemo(() => {
    const active = sorts
      .map((s) => ({ column: columns.find((c) => c.key === s.key), factor: s.direction === "asc" ? 1 : -1 }))
      .filter((s): s is { column: DataTableColumn<T>; factor: number } => !!s.column);
    if (active.length === 0) return filtered;
    return [...filtered].sort((a, b) => {
      for (const { column, factor } of active) {
        const valueA = readValue(a.row, column);
        const valueB = readValue(b.row, column);
        // Empty values stay at the bottom in both directions.
        const result =
          isEmpty(valueA) || isEmpty(valueB)
            ? Number(isEmpty(valueA)) - Number(isEmpty(valueB))
            : compareValues(valueA, valueB) * factor;
        if (result !== 0) return result;
      }
      return 0;
    });
  }, [filtered, columns, sorts]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const pageRows = sorted.slice(start, start + pageSize);

  const pageIds = pageRows.map((r) => r.id);
  const selectedOnPage = pageIds.filter((rowId) => selected.has(rowId)).length;
  const allOnPageSelected = pageIds.length > 0 && selectedOnPage === pageIds.length;
  const allMatchingSelected = sorted.length > 0 && sorted.every((r) => selected.has(r.id));
  const selectedRows = rows.filter((r) => selected.has(r.id)).map((r) => r.row);
  const activeFilterCount = Object.values(filters).reduce((n, v) => n + v.length, 0);

  function toggleSort(key: string, additive: boolean) {
    setSorts((current) => {
      const existing = current.find((s) => s.key === key);
      const nextDirection: SortDirection | undefined = !existing ? "asc" : existing.direction === "asc" ? "desc" : undefined;
      if (!additive) {
        // A plain click on a column that is part of a multi-sort makes it the only sort.
        if (existing && current.length > 1) return [{ key, direction: existing.direction }];
        return nextDirection ? [{ key, direction: nextDirection }] : [];
      }
      if (!existing) return [...current, { key, direction: "asc" }];
      return nextDirection
        ? current.map((s) => (s.key === key ? { key, direction: nextDirection } : s))
        : current.filter((s) => s.key !== key);
    });
  }

  function toggleFilter(key: string, value: string) {
    setFilters((current) => {
      const values = current[key] ?? [];
      return { ...current, [key]: values.includes(value) ? values.filter((v) => v !== value) : [...values, value] };
    });
    setPage(1);
  }

  function resetFilters() {
    setFilters({});
    setQuery("");
    setPage(1);
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

  function toggleExpanded(rowId: string) {
    setExpanded((current) => (current.includes(rowId) ? current.filter((r) => r !== rowId) : [...current, rowId]));
  }

  function exportCsv() {
    const exportRows = selectedRows.length > 0 ? selectedRows : sorted.map((r) => r.row);
    const lines = [
      visibleColumns.map((c) => toCsvCell(c.header)).join(","),
      ...exportRows.map((row) => visibleColumns.map((c) => toCsvCell(readValue(row, c))).join(",")),
    ];
    const url = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${exportFileName}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function onRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, row: T) {
    if (event.target === event.currentTarget && event.key === "Enter") onRowClick?.(row);
  }

  const cellPadding = densityClasses[density];
  const columnCount = visibleColumns.length + (selectable ? 1 : 0) + (renderExpanded ? 1 : 0);
  const hasFooter = visibleColumns.some((c) => c.footer);
  const isFiltered = query.trim() !== "" || activeFilterCount > 0;
  const summary = loading
    ? "Loading rows"
    : sorted.length === 0
      ? "No rows to show"
      : `Showing ${start + 1} to ${start + pageRows.length} of ${sorted.length} rows${isFiltered ? ` (filtered from ${rows.length})` : ""}`;
  const multiSort = sorts.length > 1;
  const showToolbar = searchable || filterColumns.length > 0 || columnToggle || exportable;

  return (
    <div className={`w-full ${className}`}>
      {showToolbar && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {searchable && (
            <div className="relative w-full sm:w-64">
              <label htmlFor={searchId} className="sr-only">
                Search {caption}
              </label>
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                <Icon name="search" />
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
          {filterColumns.map((column) => (
            <Popover key={column.key} label={column.header} icon="filter" count={filters[column.key]?.length} disabled={loading}>
              {column.filterOptions!.map((option) => (
                <MenuCheckbox
                  key={option.value}
                  label={option.label}
                  checked={filters[column.key]?.includes(option.value) ?? false}
                  hint={optionCounts[column.key]?.[option.value] ?? 0}
                  onChange={() => toggleFilter(column.key, option.value)}
                />
              ))}
              {!!filters[column.key]?.length && (
                <button
                  type="button"
                  onClick={() => {
                    setFilters((f) => ({ ...f, [column.key]: [] }));
                    setPage(1);
                  }}
                  className={`mt-1 w-full rounded-lg border-t border-white/10 px-2.5 py-2 text-left text-sm text-violet-300 hover:bg-white/[0.06] ${focusRing}`}
                >
                  Clear {column.header.toLowerCase()} filter
                </button>
              )}
            </Popover>
          ))}
          {isFiltered && (
            <button type="button" onClick={resetFilters} className={`h-10 rounded-xl px-3 text-sm text-violet-300 transition hover:bg-white/10 ${focusRing}`}>
              Reset
            </button>
          )}
          <div className="ml-auto flex items-center gap-2">
            {columnToggle && (
              <Popover label="Columns" icon="columns" align="right" disabled={loading}>
                {columns.map((column) => {
                  const isVisible = !hidden.includes(column.key);
                  const locked = column.hideable === false || (isVisible && visibleColumns.length === 1);
                  return (
                    <MenuCheckbox
                      key={column.key}
                      label={column.header}
                      checked={isVisible}
                      disabled={locked}
                      onChange={() =>
                        setHidden((h) => (isVisible ? [...h, column.key] : h.filter((k) => k !== column.key)))
                      }
                    />
                  );
                })}
              </Popover>
            )}
            {exportable && (
              <button type="button" onClick={exportCsv} disabled={loading || sorted.length === 0} className={toolbarButton}>
                <Icon name="download" className="size-3.5" />
                {selectedRows.length > 0 ? `Export ${selectedRows.length}` : "Export CSV"}
              </button>
            )}
          </div>
        </div>
      )}

      {selectable && selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-violet-400/25 bg-violet-500/[0.08] px-3 py-2 text-sm text-zinc-200">
          <span className="font-medium tabular-nums">{selected.size} selected</span>
          {allOnPageSelected && !allMatchingSelected && (
            <button
              type="button"
              onClick={() => updateSelection(new Set([...selected, ...sorted.map((r) => r.id)]))}
              className={`rounded text-violet-300 underline-offset-4 hover:underline ${focusRing}`}
            >
              Select all {sorted.length} matching rows
            </button>
          )}
          <button type="button" onClick={clearSelection} className={`rounded text-zinc-400 underline-offset-4 hover:text-zinc-200 hover:underline ${focusRing}`}>
            Clear selection
          </button>
          {bulkActions && <div className="flex flex-wrap items-center gap-2 sm:ml-auto">{bulkActions(selectedRows, clearSelection)}</div>}
        </div>
      )}

      <div
        className={`rounded-2xl border border-white/10 bg-zinc-950/40 ${maxHeight ? "overflow-auto" : "overflow-x-auto"}`}
        style={maxHeight ? { maxHeight } : undefined}
        tabIndex={maxHeight ? 0 : undefined}
        role={maxHeight ? "region" : undefined}
        aria-label={maxHeight ? `${caption}, scrollable` : undefined}
      >
        <table className="w-full min-w-[36rem] border-collapse text-sm" aria-busy={loading || undefined}>
          <caption className="sr-only">
            {caption}
            {multiSort && `, sorted by ${sorts.map((s) => `${columns.find((c) => c.key === s.key)?.header} ${s.direction === "asc" ? "ascending" : "descending"}`).join(", then ")}`}
          </caption>
          <thead className={`text-zinc-400 ${stickyHeader ? "sticky top-0 z-10 bg-zinc-900/95 backdrop-blur" : "bg-white/[0.03]"}`}>
            <tr>
              {renderExpanded && (
                <th scope="col" className={`w-10 ${cellPadding}`}>
                  <span className="sr-only">Details</span>
                </th>
              )}
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
              {visibleColumns.map((column) => {
                const align = column.align ?? "left";
                const sortIndex = sorts.findIndex((s) => s.key === column.key);
                const direction = sortIndex >= 0 ? sorts[sortIndex].direction : undefined;
                const sortable = column.sortable !== false;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={
                      sortIndex === 0 ? (direction === "asc" ? "ascending" : "descending") : sortable && sortIndex < 0 ? "none" : undefined
                    }
                    className={`whitespace-nowrap font-medium ${alignClasses[align]} ${sortable ? "px-2 py-1.5" : cellPadding}`}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={(e) => toggleSort(column.key, e.shiftKey)}
                        disabled={loading}
                        title="Shift+click to sort by more than one column"
                        className={`inline-flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 transition hover:bg-white/5 hover:text-white disabled:pointer-events-none ${focusRing} ${justifyClasses[align]} ${direction ? "text-violet-300" : ""}`}
                      >
                        {column.header}
                        <SortIcon direction={direction} />
                        {multiSort && sortIndex >= 0 && (
                          <span className="grid size-4 place-items-center rounded-full bg-violet-500/25 text-[10px] tabular-nums text-violet-200" aria-hidden="true">
                            {sortIndex + 1}
                          </span>
                        )}
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
                        style={{ width: j < columnCount - visibleColumns.length ? "1rem" : `${55 + ((i * 7 + j * 13) % 40)}%` }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="px-4 py-14 text-center text-zinc-400">
                  {isFiltered ? (
                    <>
                      No rows match your search and filters.{" "}
                      <button type="button" onClick={resetFilters} className={`rounded text-violet-300 underline-offset-4 hover:underline ${focusRing}`}>
                        Reset
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
                const isExpanded = expanded.includes(rowId);
                const detailsId = `${id}-details-${rowId}`;
                return (
                  <Fragment key={rowId}>
                    <tr
                      aria-selected={selectable ? isSelected : undefined}
                      tabIndex={onRowClick ? 0 : undefined}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      onKeyDown={onRowClick ? (e) => onRowKeyDown(e, row) : undefined}
                      className={`transition-colors hover:bg-white/[0.03] ${isSelected ? "bg-violet-500/[0.08] hover:bg-violet-500/[0.12]" : ""} ${onRowClick ? `cursor-pointer focus-visible:bg-white/[0.05] ${focusRing} focus-visible:ring-inset` : ""}`}
                    >
                      {renderExpanded && (
                        <td className={cellPadding}>
                          <button
                            type="button"
                            aria-expanded={isExpanded}
                            aria-controls={isExpanded ? detailsId : undefined}
                            aria-label={`${isExpanded ? "Hide" : "Show"} details for row ${start + index + 1}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpanded(rowId);
                            }}
                            className={`grid size-7 place-items-center rounded-lg text-zinc-400 transition hover:bg-white/10 hover:text-white ${focusRing}`}
                          >
                            <Icon name="chevron" className={`size-4 transition-transform motion-reduce:transition-none ${isExpanded ? "rotate-90" : ""}`} />
                          </button>
                        </td>
                      )}
                      {selectable && (
                        <td className={cellPadding}>
                          <Checkbox checked={isSelected} label={`Select row ${start + index + 1}`} onChange={() => toggleRow(rowId)} />
                        </td>
                      )}
                      {visibleColumns.map((column) => (
                        <td
                          key={column.key}
                          className={`text-zinc-200 ${cellPadding} ${alignClasses[column.align ?? "left"]} ${column.className ?? ""}`}
                        >
                          {column.cell ? column.cell(row) : toText(readValue(row, column))}
                        </td>
                      ))}
                    </tr>
                    {renderExpanded && isExpanded && (
                      <tr id={detailsId} className="bg-white/[0.015]">
                        <td colSpan={columnCount} className="px-4 py-4 sm:pl-14">
                          {renderExpanded(row)}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
          {hasFooter && !loading && sorted.length > 0 && (
            <tfoot className={`border-t border-white/10 text-zinc-300 ${stickyHeader ? "sticky bottom-0 bg-zinc-900/95 backdrop-blur" : "bg-white/[0.03]"}`}>
              <tr>
                {columnCount > visibleColumns.length && <td colSpan={columnCount - visibleColumns.length} />}
                {visibleColumns.map((column) => (
                  <td key={column.key} className={`font-medium ${cellPadding} ${alignClasses[column.align ?? "left"]} ${column.className ?? ""}`}>
                    {column.footer?.(sorted.map((r) => r.row))}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="mt-3 flex flex-col gap-3 text-sm text-zinc-400 lg:flex-row lg:items-center lg:justify-between">
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
          <nav aria-label="Pagination" className="flex flex-wrap items-center gap-1">
            <button type="button" className={pagerButton} onClick={() => setPage(currentPage - 1)} disabled={loading || currentPage === 1} aria-label="Previous page">
              ‹
            </button>
            {pageList(currentPage, pageCount).map((p, i) =>
              p === "…" ? (
                <span key={`gap-${i}`} className="w-6 text-center text-zinc-500" aria-hidden="true">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  disabled={loading}
                  aria-label={`Page ${p}`}
                  aria-current={p === currentPage ? "page" : undefined}
                  className={`${pagerButton} min-w-8 w-auto px-2 tabular-nums ${p === currentPage ? "border-violet-400/60 bg-violet-500/20 text-violet-100" : ""}`}
                >
                  {p}
                </button>
              ),
            )}
            <button type="button" className={pagerButton} onClick={() => setPage(currentPage + 1)} disabled={loading || currentPage === pageCount} aria-label="Next page">
              ›
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}

export default DataTable;
