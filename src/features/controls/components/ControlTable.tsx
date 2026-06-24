import { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import {
  classifyHemoglobina,
  getColorForClassification,
  getLabelForClassification,
} from "@/utils/classification";
import type { Control } from "@/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ControlTableProps {
  controls: Control[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFecha(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-PE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function ClassificationBadge({ clasificacion }: { clasificacion: string }) {
  // clasificacion comes from backend — it's already a classification string
  const level = clasificacion as ReturnType<typeof classifyHemoglobina>;
  const colorClass = getColorForClassification(level);
  const label = getLabelForClassification(level);
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------

const columnHelper = createColumnHelper<Control>();

const columns = [
  columnHelper.accessor("fechaControl", {
    header: "Fecha",
    cell: (info) => formatFecha(info.getValue()),
  }),
  columnHelper.accessor("peso", {
    header: "Peso",
    cell: (info) => {
      const val = info.getValue();
      return val != null ? `${val.toFixed(2)} kg` : "—";
    },
  }),
  columnHelper.accessor("talla", {
    header: "Talla",
    cell: (info) => {
      const val = info.getValue();
      return val != null ? `${val.toFixed(2)} cm` : "—";
    },
  }),
  columnHelper.accessor("hemoglobina", {
    header: "Hb",
    cell: (info) => {
      const val = info.getValue();
      return val != null ? `${val.toFixed(1)} g/dL` : "—";
    },
  }),
  columnHelper.accessor("clasificacion", {
    header: "Clasificación",
    cell: (info) => <ClassificationBadge clasificacion={info.getValue()} />,
  }),
  columnHelper.accessor("temperatura", {
    header: "Temperatura",
    cell: (info) => {
      const val = info.getValue();
      return val != null ? `${val.toFixed(1)} °C` : "—";
    },
  }),
  columnHelper.accessor("observaciones", {
    header: "Observaciones",
    cell: (info) => {
      const val = info.getValue();
      if (!val) return "—";
      return (
        <span title={val} className="block max-w-[200px] truncate">
          {val}
        </span>
      );
    },
  }),
];

// ---------------------------------------------------------------------------
// Skeleton rows for loading state
// ---------------------------------------------------------------------------

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          {columns.map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 w-20 rounded bg-neutral-200" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ControlTable({
  controls,
  total,
  page,
  pageSize,
  loading,
  onPageChange,
}: ControlTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const table = useReactTable({
    data: controls,
    columns,
    pageCount: totalPages,
    state: {
      pagination: { pageIndex: page - 1, pageSize },
    },
    onPaginationChange: (updater) => {
      const newState =
        typeof updater === "function"
          ? updater({ pageIndex: page - 1, pageSize })
          : updater;
      onPageChange(newState.pageIndex + 1);
    },
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div>
      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {loading ? (
              <SkeletonRows />
            ) : controls.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-sm text-neutral-400"
                >
                  No hay controles registrados
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors hover:bg-neutral-50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="whitespace-nowrap px-4 py-3 text-sm text-neutral-700"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="mt-3 flex items-center justify-between text-sm text-neutral-500">
          <span>
            Mostrando {from}-{to} de {total}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="px-2 text-xs">
              Pág. {page} de {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
