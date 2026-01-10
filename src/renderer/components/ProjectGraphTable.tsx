import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/table';

type ProjectGraphRow = {
  type: string;
  identifier: string;
  status: string;
};

const columnHelper = createColumnHelper<ProjectGraphRow>();

const data: ProjectGraphRow[] = [
  {
    type: 'Route',
    identifier: '/',
    status: 'Active preview session',
  },
  {
    type: 'Component Instance',
    identifier: 'HeroBanner#primary',
    status: 'Editable props exposed',
  },
  {
    type: 'Component Type',
    identifier: 'Button',
    status: 'Inspect-only (registry required)',
  },
];

const columns = [
  columnHelper.accessor('type', {
    header: 'Node Type',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('identifier', {
    header: 'Identifier',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: (info) => info.getValue(),
  }),
];

export const ProjectGraphTable = () => {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-lg border border-default bg-surface-1 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
        Project Graph Snapshot
      </h2>
      <table className="mt-4 w-full text-left text-sm">
        <thead className="border-b border-subtle text-fg-muted">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="py-2 pr-4 font-medium">
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b border-subtle">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="py-2 pr-4 text-fg">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
