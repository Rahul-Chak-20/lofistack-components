import type { Metadata } from "next";
import { ComponentPage, type PropDoc } from "@/components/gallery/component-page";
import { DataTableDemo } from "./demo";

export const metadata: Metadata = { title: "Data Table" };

const usage = `import { useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";

interface User {
  id: string;
  name: string;
  role: string;
  joined: Date;
}

const columns: DataTableColumn<User>[] = [
  { key: "name", header: "Name" },
  { key: "role", header: "Role" },
  {
    key: "joined",
    header: "Joined",
    align: "right",
    cell: (user) => user.joined.toLocaleDateString(),
  },
];

const getRowId = (user: User) => user.id;

export function Example({ users, loading }: { users: User[]; loading: boolean }) {
  const [selected, setSelected] = useState<string[]>([]);

  return (
    <DataTable
      caption="Team members"
      data={users}
      columns={columns}
      getRowId={getRowId}
      defaultSort={{ key: "name", direction: "asc" }}
      pageSize={10}
      selectable
      selectedIds={selected}
      onSelectionChange={setSelected}
      loading={loading}
      emptyMessage="No team members yet."
    />
  );
}`;

const props: PropDoc[] = [
  { name: "data", type: "T[]", description: "Rows to display. The table is generic, so columns are typed from the row shape." },
  { name: "columns", type: "DataTableColumn<T>[]", description: "key, header, and optional accessor, cell, sortable, searchable, align and className." },
  { name: "getRowId", type: "(row: T, index: number) => string", description: "Stable unique id per row, used for keys and selection. Define it outside render." },
  { name: "caption", type: "string", description: "Accessible name for the table, rendered as a visually hidden caption." },
  { name: "searchable", type: "boolean", default: "true", description: "Shows a search box that filters across searchable columns." },
  { name: "searchPlaceholder", type: "string", default: '"Search…"', description: "Placeholder for the search box." },
  { name: "defaultSort", type: '{ key: string; direction: "asc" | "desc" }', description: "Initial sort. Clicking a header cycles ascending, descending, then unsorted." },
  { name: "pageSize", type: "number", default: "10", description: "Rows per page to start with." },
  { name: "pageSizeOptions", type: "number[]", default: "[5, 10, 20, 50]", description: "Choices for the rows-per-page select. Pass [] to hide it." },
  { name: "selectable", type: "boolean", default: "false", description: "Adds a checkbox column. The header checkbox toggles the current page and shows a mixed state." },
  { name: "selectedIds", type: "string[]", description: "Controlled selection. Leave it out to let the table manage selection itself." },
  { name: "onSelectionChange", type: "(ids: string[]) => void", description: "Called with the full list of selected ids, across pages." },
  { name: "loading", type: "boolean", default: "false", description: "Shows skeleton rows, sets aria-busy and disables the controls." },
  { name: "loadingRows", type: "number", default: "5", description: "Number of skeleton rows while loading." },
  { name: "emptyMessage", type: "ReactNode", default: '"No results."', description: "Shown when there is no data. A search with no matches gets its own message and a Clear search link." },
  { name: "density", type: '"comfortable" | "compact"', default: '"comfortable"', description: "Row padding preset." },
  { name: "onRowClick", type: "(row: T) => void", description: "Makes rows clickable. Checkbox clicks do not trigger it." },
  { name: "className", type: "string", description: "Classes for the outer wrapper." },
];

export default function Page() {
  return <ComponentPage slug="data-table" preview={<DataTableDemo />} usage={usage} props={props} />;
}
