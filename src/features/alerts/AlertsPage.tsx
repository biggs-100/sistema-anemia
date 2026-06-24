import { useEffect, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { useAlertaStore } from "@/stores/alertaStore";
import { useAuthStore } from "@/stores/authStore";
import type { Alerta, TipoAlerta } from "@/types";
import Spinner from "@/components/ui/Spinner";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TIPO_BADGE: Record<TipoAlerta, string> = {
  HEMOGLOBINA_CRITICA: "bg-red-100 text-red-800",
  CONTROL_VENCIDO: "bg-amber-100 text-amber-800",
  TRATAMIENTO_VENCIDO: "bg-orange-100 text-orange-800",
};

const TIPO_LABELS: Record<TipoAlerta, string> = {
  HEMOGLOBINA_CRITICA: "Hb Crítica",
  CONTROL_VENCIDO: "Control Vencido",
  TRATAMIENTO_VENCIDO: "Tratamiento Vencido",
};

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AlertsPage() {
  const {
    alertas,
    total,
    page,
    pageSize,
    loading,
    error,
    filters,
    loadAlertas,
    resolveAlerta,
    resolveAll,
    setPage,
    setFilter,
    clearError,
  } = useAlertaStore();

  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.rolId === 1;

  // Load on mount and when filters change
  useEffect(() => {
    loadAlertas(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const columns = useMemo<ColumnDef<Alerta>[]>(
    () => [
      {
        header: "Fecha",
        accessorKey: "fecha",
        cell: (info) => (
          <span className="text-sm text-neutral-600">{formatDate(info.getValue<string>())}</span>
        ),
      },
      {
        header: "Paciente",
        accessorKey: "pacienteNombre",
        cell: (info) => (
          <span className="text-sm font-medium text-neutral-900">
            {info.getValue<string>() ?? "—"}
          </span>
        ),
      },
      {
        header: "Tipo",
        accessorKey: "tipo",
        cell: (info) => {
          const tipo = info.getValue<TipoAlerta>();
          return (
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                TIPO_BADGE[tipo] ?? "bg-neutral-100 text-neutral-700"
              }`}
            >
              {TIPO_LABELS[tipo] ?? tipo}
            </span>
          );
        },
      },
      {
        header: "Descripción",
        accessorKey: "descripcion",
        cell: (info) => (
          <span className="text-sm text-neutral-600 max-w-xs truncate block">
            {info.getValue<string>() ?? "—"}
          </span>
        ),
      },
      {
        header: "Estado",
        accessorKey: "resuelta",
        cell: (info) => {
          const resuelta = info.getValue<boolean>();
          return (
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                resuelta ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
            >
              {resuelta ? "Resuelta" : "Pendiente"}
            </span>
          );
        },
      },
      {
        header: "Acciones",
        id: "acciones",
        cell: (info) => {
          const alerta = info.row.original;
          if (!alerta.resuelta && isAdmin) {
            return (
              <button
                onClick={() => resolveAlerta(alerta.id)}
                className="rounded px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-50"
              >
                Resolver
              </button>
            );
          }
          return null;
        },
      },
    ],
    [isAdmin, resolveAlerta],
  );

  const table = useReactTable({
    data: alertas,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  const handleResolveAll = async () => {
    if (!window.confirm("¿Resolver todas las alertas pendientes?")) return;
    try {
      await resolveAll();
    } catch {
      // error displayed in store
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Alertas</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Alertas y notificaciones del sistema
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleResolveAll}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Resolver Todas
          </button>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={clearError} className="text-sm text-red-500 hover:text-red-700">
            ×
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filters.tipo}
          onChange={(e) => setFilter({ tipo: e.target.value as TipoAlerta | "" })}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los tipos</option>
          <option value="HEMOGLOBINA_CRITICA">Hb Crítica</option>
          <option value="CONTROL_VENCIDO">Control Vencido</option>
          <option value="TRATAMIENTO_VENCIDO">Tratamiento Vencido</option>
        </select>
        <select
          value={filters.resuelta === null ? "" : filters.resuelta ? "resuelta" : "pendiente"}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "") setFilter({ resuelta: null });
            else if (val === "pendiente") setFilter({ resuelta: false });
            else setFilter({ resuelta: true });
          }}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendientes</option>
          <option value="resuelta">Resueltas</option>
        </select>
      </div>

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
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center">
                  <div className="flex items-center justify-center gap-2 text-neutral-400">
                    <Spinner size="md" />
                    <span className="text-sm">Cargando alertas...</span>
                  </div>
                </td>
              </tr>
            ) : alertas.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center">
                  <p className="text-sm text-neutral-400">
                    {filters.resuelta === false ? "No hay alertas pendientes" : "No hay alertas"}
                  </p>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-neutral-50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="whitespace-nowrap px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            Mostrando {from}-{to} de {total} alertas
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage(page + 1)}
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
