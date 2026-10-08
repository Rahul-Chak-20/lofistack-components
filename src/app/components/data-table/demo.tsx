"use client";

import { useState } from "react";
import { DataTable, type DataTableColumn, type DataTableDensity } from "@/components/ui/data-table";

type Status = "paid" | "pending" | "overdue";

interface Invoice {
  id: string;
  customer: string;
  email: string;
  status: Status;
  amount: number;
  issued: Date;
}

const names = [
  "Ava Patel", "Liam Chen", "Noah Garcia", "Mia Rossi", "Ethan Kim", "Zara Khan", "Leo Martin", "Isla Novak",
  "Arjun Mehta", "Sofia Silva", "Kai Tanaka", "Nora Becker", "Omar Haddad", "Ella Brooks", "Ravi Iyer", "Lucy Dubois",
];
const statuses: Status[] = ["paid", "paid", "pending", "overdue", "paid", "pending"];

// Deterministic sample data so the server and client render the same rows.
const invoices: Invoice[] = Array.from({ length: 48 }, (_, i) => {
  const name = names[(i * 5) % names.length];
  return {
    id: `INV-${String(1001 + i)}`,
    customer: name,
    email: `${name.split(" ")[0].toLowerCase()}@example.com`,
    status: statuses[(i * 7) % statuses.length],
    amount: ((i * 7919) % 4800) + 120 + ((i * 37) % 100) / 100,
    issued: new Date(Date.UTC(2026, (i * 3) % 9, 1 + ((i * 11) % 28))),
  };
});

const statusStyles: Record<Status, string> = {
  paid: "bg-emerald-500/15 text-emerald-300",
  pending: "bg-amber-500/15 text-amber-300",
  overdue: "bg-rose-500/15 text-rose-300",
};

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });

const columns: DataTableColumn<Invoice>[] = [
  { key: "id", header: "Invoice", className: "font-mono text-xs text-zinc-400" },
  {
    key: "customer",
    header: "Customer",
    cell: (row) => (
      <div>
        <div className="font-medium text-zinc-100">{row.customer}</div>
        <div className="text-xs text-zinc-500">{row.email}</div>
      </div>
    ),
    accessor: (row) => `${row.customer} ${row.email}`,
  },
  {
    key: "status",
    header: "Status",
    cell: (row) => (
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[row.status]}`}>
        {row.status}
      </span>
    ),
  },
  { key: "issued", header: "Issued", cell: (row) => dateFormat.format(row.issued), searchable: false },
  {
    key: "amount",
    header: "Amount",
    align: "right",
    cell: (row) => currency.format(row.amount),
    className: "tabular-nums",
  },
];

const getRowId = (row: Invoice) => row.id;

const toggle =
  "rounded-lg border px-3 py-1.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 active:scale-95";
const toggleTone = (on: boolean) =>
  on ? "border-violet-400/50 bg-violet-500/15 text-violet-200" : "border-white/10 text-zinc-300 hover:bg-white/10";

export function DataTableDemo() {
  const [loading, setLoading] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [density, setDensity] = useState<DataTableDensity>("comfortable");
  const [selected, setSelected] = useState<string[]>([]);

  const selectedTotal = invoices.filter((inv) => selected.includes(inv.id)).reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-5 flex flex-wrap items-center gap-2" role="group" aria-label="Demo controls">
        <button type="button" aria-pressed={loading} onClick={() => setLoading((v) => !v)} className={`${toggle} ${toggleTone(loading)}`}>
          Loading
        </button>
        <button type="button" aria-pressed={empty} onClick={() => setEmpty((v) => !v)} className={`${toggle} ${toggleTone(empty)}`}>
          Empty
        </button>
        <button
          type="button"
          aria-pressed={density === "compact"}
          onClick={() => setDensity((d) => (d === "compact" ? "comfortable" : "compact"))}
          className={`${toggle} ${toggleTone(density === "compact")}`}
        >
          Compact
        </button>
        {selected.length > 0 && (
          <span className="ml-auto text-sm text-zinc-400 tabular-nums">
            Selected total <span className="font-medium text-zinc-100">{currency.format(selectedTotal)}</span>
          </span>
        )}
      </div>

      <DataTable
        caption="Invoices"
        data={empty ? [] : invoices}
        columns={columns}
        getRowId={getRowId}
        searchPlaceholder="Search invoices…"
        defaultSort={{ key: "issued", direction: "desc" }}
        pageSize={5}
        pageSizeOptions={[5, 10, 20]}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        loading={loading}
        density={density}
        emptyMessage={
          <div className="flex flex-col items-center gap-1">
            <span className="text-zinc-200">No invoices yet</span>
            <span className="text-xs">New invoices will show up here.</span>
          </div>
        }
      />
    </div>
  );
}
