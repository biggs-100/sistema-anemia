import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
} from "@tanstack/react-table";
import { usePatientList } from "@/hooks/usePatients";
import { ROUTES, SEXO_LABELS } from "@/utils/constants";
import type { Patient } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function formatEstado(activo: boolean) {
  return activo
    ? { label: "Activo", className: "bg-green-100 text-green-800" }
    : { label: "Inactivo", className: "bg-red-100 text-red-800" };
}

function formatNombre(patient: Patient): string {
  return `${patient.apellidoPaterno} ${patient.apellidoMaterno}, ${patient.nombres}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PatientListPage() {
  const navigate = useNavigate();
  const {
    patients,
    total,
    page,
    totalPages,
    from,
    to,
    loading,
    error,
    search,
    setPage,
    refresh,
    clearError,
    deactivatePatient,
  } = usePatientList();

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null);

  // Trigger search on debounce change
  useEffect(() => {
    search(debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Columns
  const columns = useMemo<ColumnDef<Patient>[]>(
    () => [
      {
        header: "HC",
        accessorKey: "historiaClinica",
        cell: (info) => (
          <span className="font-mono text-xs text-neutral-600">{info.getValue<string>()}</span>
        ),
      },
      {
        header: "DNI",
        accessorKey: "dni",
        cell: (info) => (
          <span className="font-mono text-sm">{info.getValue<string>()}</span>
        ),
      },
      {
        header: "Nombres",
        id: "nombres",
        cell: (info) => (
          <span className="text-sm font-medium text-neutral-900">
            {formatNombre(info.row.original)}
          </span>
        ),
      },
      {
        header: "Edad",
        accessorKey: "edad",
        cell: (info) => (
          <span className="text-sm text-neutral-600">{info.getValue<string>()}</span>
        ),
      },
      {
        header: "Centro Poblado",
        accessorKey: "centroPobladoNombre",
        cell: (info) => (
          <span className="text-sm text-neutral-600">
            {info.getValue<string>() ?? "—"}
          </span>
        ),
      },
      {
        header: "Estado",
        accessorKey: "activo",
        cell: (info) => {
          const estado = formatEstado(info.getValue<boolean>());
          return (
            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${estado.className}`}>
              {estado.label}
            </span>
          );
        },
      },
      {
        header: "Acciones",
        id: "acciones",
        cell: (info) => {
          const patient = info.row.original;
          const isDeactivating = deactivatingId === patient.id;

          return (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(ROUTES.PATIENT_DETAIL.replace(":id", String(patient.id)))}
                className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
              >
                Ver
              </button>
              <button
                onClick={() => navigate(ROUTES.PATIENT_EDIT.replace(":id", String(patient.id)))}
                className="rounded px-2 py-1 text-xs font-medium text-amber-600 hover:bg-amber-50"
              >
                Editar
              </button>
              {patient.activo && (
                <button
                  onClick={() => handleDeactivate(patient.id)}
                  disabled={isDeactivating}
                  className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isDeactivating ? "..." : "Desactivar"}
                </button>
              )}
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deactivatingId, navigate],
  );

  const table = useReactTable({
    data: patients,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  const handleDeactivate = useCallback(
    async (id: number) => {
      if (!window.confirm("¿Está seguro de desactivar este paciente?")) return;
      setDeactivatingId(id);
      try {
        await deactivatePatient(id);
      } catch {
        // error displayed in store
      } finally {
        setDeactivatingId(null);
      }
    },
    [deactivatePatient],
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Pacientes</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Gestión de pacientes registrados en el sistema
          </p>
        </div>
        <Link
          to={ROUTES.PATIENT_NEW}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Nuevo Paciente
        </Link>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
          <div className="flex gap-2">
            <button onClick={refresh} className="text-sm font-medium text-red-700 underline hover:text-red-800">
              Reintentar
            </button>
            <button onClick={clearError} className="text-sm text-red-500 hover:text-red-700">
              ×
            </button>
          </div>
        </div>
      )}

      {/* Search bar */}
      <div className="flex gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Buscar por DNI, nombres o historia clínica..."
          className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
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
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    <span className="text-sm">Cargando pacientes...</span>
                  </div>
                </td>
              </tr>
            ) : patients.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center">
                  <p className="text-sm text-neutral-400">No se encontraron pacientes</p>
                  <p className="mt-1 text-xs text-neutral-400">
                    {debouncedSearch
                      ? "Intente con otros términos de búsqueda"
                      : "Registre un nuevo paciente para comenzar"}
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
            Mostrando {from}-{to} de {total} pacientes
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
