"use client";

import { useState } from "react";
import { DataTable, type DataTableColumn, type DataTableDensity } from "@/components/ui/data-table";

type Status = "paid" | "pending" | "overdue";
type Plan = "Starter" | "Pro" | "Enterprise";

interface LineItem {
  name: string;
  qty: number;
  price: number;
}

interface Invoice {
  id: string;
  customer: string;
  email: string;
  plan: Plan;
  status: Status;
  amount: number;
  issued: Date;
  items: LineItem[];
}

const names = [
  "Ava Patel", "Liam Chen", "Noah Garcia", "Mia Rossi", "Ethan Kim", "Zara Khan", "Leo Martin", "Isla Novak",
  "Arjun Mehta", "Sofia Silva", "Kai Tanaka", "Nora Becker", "Omar Haddad", "Ella Brooks", "Ravi Iyer", "Lucy Dubois",
];
const statuses: Status[] = ["paid", "paid", "pending", "overdue", "paid", "pending"];
const plans: Plan[] = ["Starter", "Pro", "Pro", "Enterprise"];
const products = ["Seats", "Storage add-on", "Priority support", "API calls", "Onboarding"];

// Deterministic sample data so the server and client render the same rows.
const initialInvoices: Invoice[] = Array.from({ length: 64 }, (_, i) => {
  const name = names[(i * 5) % names.length];
  const items = Array.from({ length: 1 + (i % 3) }, (_, j) => ({
    name: products[(i + j * 2) % products.length],
    qty: 1 + ((i * 3 + j) % 9),
    price: 9 + ((i * 41 + j * 17) % 180) + ((i * 37) % 100) / 100,
  }));
  return {
    id: `INV-${1001 + i}`,
    customer: name,
    email: `${name.split(" ")[0].toLowerCase()}@example.com`,
    plan: plans[(i * 3) % plans.length],
    status: statuses[(i * 7) % statuses.length],
    amount: Math.round(items.reduce((sum, item) => sum + item.qty * item.price, 0) * 100) / 100,
    issued: new Date(Date.UTC(2026, (i * 3) % 9, 1 + ((i * 11) % 28))),
    items,
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
  { key: "id", header: "Invoice", hideable: false, className: "font-mono text-xs text-zinc-400" },
  {
    key: "customer",
    header: "Customer",
    cell: (row) => (
      <div>
        <div className="font-medium text-zinc-100">{row.customer}</div>
        <div className="text-xs text-zinc-500">{row.email}</div>
      </div>
    ),
  },
  { key: "email", header: "Email", defaultHidden: true },
  {
    key: "plan",
    header: "Plan",
    filterOptions: (["Starter", "Pro", "Enterprise"] as const).map((p) => ({ label: p, value: p })),
  },
  {
    key: "status",
    header: "Status",
    filterOptions: [
      { label: "Paid", value: "paid" },
      { label: "Pending", value: "pending" },
      { label: "Overdue", value: "overdue" },
    ],
    cell: (row) => (
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[row.status]}`}>{row.status}</span>
    ),
  },
  { key: "issued", header: "Issued", cell: (row) => dateFormat.format(row.issued), searchable: false },
  {
    key: "amount",
    header: "Amount",
    align: "right",
    cell: (row) => currency.format(row.amount),
    footer: (rows) => currency.format(rows.reduce((sum, row) => sum + row.amount, 0)),
    className: "tabular-nums",
  },
];

const getRowId = (row: Invoice) => row.id;

function InvoiceDetails({ invoice }: { invoice: Invoice }) {
  return (
    <div className="max-w-md">
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Line items</p>
      <ul className="divide-y divide-white/5 rounded-xl border border-white/10">
        {invoice.items.map((item) => (
          <li key={item.name} className="flex items-center justify-between gap-4 px-3 py-2 text-sm">
            <span className="text-zinc-200">
              {item.name} <span className="text-zinc-500">× {item.qty}</span>
            </span>
            <span className="tabular-nums text-zinc-300">{currency.format(item.qty * item.price)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const toggle = "rounded-lg border px-3 py-1.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 active:scale-95";
const toggleTone = (on: boolean) =>
  on ? "border-violet-400/50 bg-violet-500/15 text-violet-200" : "border-white/10 text-zinc-300 hover:bg-white/10";
const actionButton =
  "rounded-lg border border-white/15 px-2.5 py-1 text-xs text-zinc-200 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 active:scale-95";

export function DataTableDemo() {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [loading, setLoading] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [sticky, setSticky] = useState(false);
  const [density, setDensity] = useState<DataTableDensity>("comfortable");
  const [selected, setSelected] = useState<string[]>([]);

  const demoToggles: [string, boolean, () => void][] = [
    ["Loading", loading, () => setLoading((v) => !v)],
    ["Empty", empty, () => setEmpty((v) => !v)],
    ["Compact", density === "compact", () => setDensity((d) => (d === "compact" ? "comfortable" : "compact"))],
    ["Sticky header", sticky, () => setSticky((v) => !v)],
  ];

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-5 flex flex-wrap items-center gap-2" role="group" aria-label="Demo controls">
        {demoToggles.map(([label, on, onClick]) => (
          <button key={label} type="button" aria-pressed={on} onClick={onClick} className={`${toggle} ${toggleTone(on)}`}>
            {label}
          </button>
        ))}
        {invoices !== initialInvoices && (
          <button type="button" onClick={() => setInvoices(initialInvoices)} className={`${toggle} ml-auto border-white/10 text-zinc-400 hover:bg-white/10`}>
            Restore sample data
          </button>
        )}
      </div>

      <DataTable
        caption="Invoices"
        data={empty ? [] : invoices}
        columns={columns}
        getRowId={getRowId}
        searchPlaceholder="Search invoices…"
        defaultSort={{ key: "issued", direction: "desc" }}
        pageSize={10}
        pageSizeOptions={[5, 10, 20]}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        bulkActions={(rows, clear) => (
          <>
            <span className="text-xs text-zinc-400 tabular-nums">{currency.format(rows.reduce((s, r) => s + r.amount, 0))}</span>
            <button
              type="button"
              className={actionButton}
              onClick={() => {
                const ids = new Set(rows.map((r) => r.id));
                setInvoices((all) => all.map((inv) => (ids.has(inv.id) ? { ...inv, status: "paid" } : inv)));
                clear();
              }}
            >
              Mark paid
            </button>
            <button
              type="button"
              className={`${actionButton} border-rose-400/30 text-rose-300 hover:bg-rose-500/10`}
              onClick={() => {
                const ids = new Set(rows.map((r) => r.id));
                setInvoices((all) => all.filter((inv) => !ids.has(inv.id)));
                clear();
              }}
            >
              Delete
            </button>
          </>
        )}
        renderExpanded={(row) => <InvoiceDetails invoice={row} />}
        exportable
        exportFileName="invoices"
        stickyHeader={sticky}
        maxHeight={sticky ? "26rem" : undefined}
        loading={loading}
        density={density}
        emptyMessage={
          <div className="flex flex-col items-center gap-1">
            <span className="text-zinc-200">No invoices yet</span>
            <span className="text-xs">New invoices will show up here.</span>
          </div>
        }
      />
      <p className="mt-4 text-xs text-zinc-500">Tip: Shift+click a second header to sort by more than one column.</p>
    </div>
  );
}
