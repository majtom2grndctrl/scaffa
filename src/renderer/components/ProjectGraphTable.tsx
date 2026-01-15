import { useMemo } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/table';
import { useGraphStore } from '../state/graphStore';
import type { GraphNode } from '../../shared/project-graph';

type ProjectGraphRow = {
  kind: string;
  identifier: string;
  source: string;
};

const columnHelper = createColumnHelper<ProjectGraphRow>();

const columns = [
  columnHelper.accessor('kind', {
    header: 'Node Type',
    cell: (info) => {
      const value = info.getValue();
      return (
        <span className="capitalize">
          {value === 'componentType' ? 'Component Type' : value}
        </span>
      );
    },
  }),
  columnHelper.accessor('identifier', {
    header: 'Identifier',
    cell: (info) => <span className="font-mono text-xs">{info.getValue()}</span>,
  }),
  columnHelper.accessor('source', {
    header: 'Source',
    cell: (info) => {
      const value = info.getValue();
      return value ? (
        <span className="text-fg-muted">{value}</span>
      ) : (
        <span className="text-fg-muted italic">—</span>
      );
    },
  }),
];

function nodeToRow(node: GraphNode): ProjectGraphRow {
  switch (node.kind) {
    case 'route':
      return {
        kind: node.kind,
        identifier: node.path,
        source: node.source ? `${node.source.filePath}:${node.source.line}` : '',
      };
    case 'componentType':
      return {
        kind: node.kind,
        identifier: node.id,
        source: node.source ? `${node.source.filePath}:${node.source.line}` : '',
      };
    case 'instance':
      return {
        kind: node.kind,
        identifier: `${node.componentTypeId}#${node.instanceId}`,
        source: node.source ? `${node.source.filePath}:${node.source.line}` : '',
      };
  }
}

export const ProjectGraphTable = () => {
  const snapshot = useGraphStore((state) => state.snapshot);
  const isLoading = useGraphStore((state) => state.isLoading);

  const data = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.nodes.map(nodeToRow);
  }, [snapshot]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-fg">Project Graph Snapshot</h2>
        {snapshot && (
          <span className="text-xs text-fg-muted">
            Revision {snapshot.revision} · {snapshot.nodes.length} nodes ·{' '}
            {snapshot.edges.length} edges
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="mt-4 py-8 text-center text-xs text-fg-muted">
          Loading graph snapshot...
        </div>
      ) : !snapshot || snapshot.nodes.length === 0 ? (
        <div className="mt-4 py-8 text-center text-xs text-fg-muted">
          No graph data available. Waiting for producers to emit patches...
        </div>
      ) : (
        <table className="mt-4 w-full text-left text-xs">
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
              <tr key={row.id} className="border-b border-subtle last:border-0">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="py-2 pr-4 text-fg">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
