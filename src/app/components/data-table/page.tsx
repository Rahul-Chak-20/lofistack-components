import type { Metadata } from "next";
import { ComponentPage, type PropDoc } from "@/components/gallery/component-page";
import { DataTableDemo } from "./demo";

export const metadata: Metadata = { title: "Data Table" };

const usage = `import { useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { UserDetails } from "./user-details";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
  seats: number;
  joined: Date;
}

const columns: DataTableColumn<User>[] = [
  { key: "name", header: "Name" },
  {
    key: "role",
    header: "Role",
    filterOptions: [
      { label: "Admin", value: "admin" },
      { label: "Member", value: "member" },
    ],
  },
  { key: "email", header: "Email", defaultHidden: true },
  {
    key: "joined",
    header: "Joined",
    align: "right",
    cell: (user) => user.joined.toLocaleDateString(),
  },
  {
    key: "seats",
    header: "Seats",
    align: "right",
    footer: (rows) => rows.reduce((sum, user) => sum + user.seats, 0),
  },
];

const getRowId = (user: User) => user.id;

interface Props {
  users: User[];
  loading: boolean;
  removeUsers: (users: User[]) => void;
}

export function Example({ users, loading, removeUsers }: Props) {
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
      bulkActions={(rows, clear) => (
        <button type="button" onClick={() => { removeUsers(rows); clear(); }}>
          Remove {rows.length}
        </button>
      )}
      renderExpanded={(user) => <UserDetails user={user} />}
      exportable
      exportFileName="team"
      stickyHeader
      maxHeight="28rem"
      loading={loading}
      emptyMessage="No team members yet."
    />
  );
}`;

const props: PropDoc[] = [
  { name: "data", type: "T[]", description: "Rows to display. The table is generic, so columns are typed from the row shape." },
  { name: "columns", type: "DataTableColumn<T>[]", description: "key, header, and optional accessor, cell, sortable, searchable, filterOptions, hideable, defaultHidden, footer, align and className." },
  { name: "getRowId", type: "(row: T, index: number) => string", description: "Stable unique id per row, used for keys, selection and expansion. Define it outside render." },
  { name: "caption", type: "string", description: "Accessible name for the table, rendered as a visually hidden caption that also describes a multi-column sort." },
  { name: "searchable", type: "boolean", default: "true", description: "Shows a search box that filters across every searchable column, hidden ones included." },
  { name: "searchPlaceholder", type: "string", default: '"Search…"', description: "Placeholder for the search box." },
  { name: "defaultSort", type: "SortState | SortState[]", description: "Initial sort. Click a header to cycle ascending, descending, unsorted; Shift+click to add more sort columns." },
  { name: "pageSize", type: "number", default: "10", description: "Rows per page to start with." },
  { name: "pageSizeOptions", type: "number[]", default: "[5, 10, 20, 50]", description: "Choices for the rows-per-page select. Pass [] to hide it." },
  { name: "selectable", type: "boolean", default: "false", description: "Adds a checkbox column with a mixed-state header checkbox and a Select all matching rows link." },
  { name: "selectedIds", type: "string[]", description: "Controlled selection. Leave it out to let the table manage selection itself." },
  { name: "onSelectionChange", type: "(ids: string[]) => void", description: "Called with the full list of selected ids, across pages." },
  { name: "bulkActions", type: "(rows: T[], clear: () => void) => ReactNode", description: "Actions shown in the selection bar, given the selected rows." },
  { name: "renderExpanded", type: "(row: T) => ReactNode", description: "Adds an expand button per row that reveals this content in a panel below it." },
  { name: "columnToggle", type: "boolean", default: "true", description: "Shows a Columns menu to hide and show columns. The last visible column cannot be hidden." },
  { name: "exportable", type: "boolean", default: "false", description: "Adds an Export CSV button for the selected rows, or every matching row in the current sort." },
  { name: "exportFileName", type: "string", default: '"export"', description: "CSV file name without the extension." },
  { name: "stickyHeader", type: "boolean", default: "false", description: "Keeps the header (and footer) pinned while the body scrolls. Use with maxHeight." },
  { name: "maxHeight", type: "string", description: 'Max height of the scroll area, like "28rem".' },
  { name: "loading", type: "boolean", default: "false", description: "Shows skeleton rows, sets aria-busy and disables the controls." },
  { name: "loadingRows", type: "number", default: "5", description: "Number of skeleton rows while loading." },
  { name: "emptyMessage", type: "ReactNode", default: '"No results."', description: "Shown when there is no data. No matches for a search or filter gets its own message with a Reset link." },
  { name: "density", type: '"comfortable" | "compact"', default: '"comfortable"', description: "Row padding preset." },
  { name: "onRowClick", type: "(row: T) => void", description: "Makes rows clickable and focusable; Enter also triggers it. Checkbox and expand clicks do not." },
  { name: "className", type: "string", description: "Classes for the outer wrapper." },
];

export default function Page() {
  return <ComponentPage slug="data-table" preview={<DataTableDemo />} usage={usage} props={props} />;
}
