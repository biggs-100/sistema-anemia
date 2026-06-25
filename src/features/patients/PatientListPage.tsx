import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
} from "@tanstack/react-table";
import { invoke } from "@tauri-apps/api/core";
import { usePatientList } from "@/hooks/usePatients";
import { ROUTES, API_COMMANDS } from "@/utils/constants";
import { useAuthStore } from "@/stores/authStore";
import type { Patient } from "@/types";
import type { ApiResponse } from "@/types/api";
import Spinner from "@/components/ui/Spinner";

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
    ? { label: "Activo", className: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" }
    : { label: "Inactivo", className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" };
}

function formatNombre(patient: Patient): string {
  return `${patient.apellidoPaterno} ${patient.apellidoMaterno}, ${patient.nombres}`;
}

// ---------------------------------------------------------------------------
// ImportResult type
// ---------------------------------------------------------------------------
interface ImportResult {
  imported: number;
  errors: number;
  details: string[];
}

// ---------------------------------------------------------------------------
// Import CSV Modal
// ---------------------------------------------------------------------------
function ImportCsvModal({ onClose }: { onClose: () => void }) {
  const token = useAuthStore((s) => s.token);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilePick = useCallback(async () => {
    if (!token) return;

    try {
      // Use Tauri v2 dialog plugin to pick a file
      let selected: string | null = null;

      try {
        const { open } = await import("@tauri-apps/plugin-dialog");
        selected = await open({
          filters: [{ name: "CSV", extensions: ["csv"] }],
          multiple: false,
        });
      } catch {
        // Fallback: use a hidden file input if Tauri dialog fails
        fileInputRef.current?.click();
        return;
      }

      if (!selected) return;

      setLoading(true);
      setResult(null);

      // Read file content
      let csvContent: string;
      try {
        const { readTextFile } = await import("@tauri-apps/plugin-fs");
        csvContent = await readTextFile(selected);
      } catch {
        alert("Error al leer el archivo. Verifique que sea un archivo CSV válido.");
        setLoading(false);
        return;
      }

      // Call import command
      const res = await invoke<ApiResponse<ImportResult>>(
        API_COMMANDS.IMPORT_PATIENTS_CSV,
        { token, csvContent },
      );

      if (res.success && res.data) {
        setResult(res.data);
      } else {
        setResult({ imported: 0, errors: 1, details: [res.message] });
      }
    } catch (e) {
      setResult({
        imported: 0,
        errors: 1,
        details: [e instanceof Error ? e.message : "Error desconocido"],
      });
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleFileInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !token) return;

      setLoading(true);
      setResult(null);

      try {
        const text = await file.text();
        const res = await invoke<ApiResponse<ImportResult>>(
          API_COMMANDS.IMPORT_PATIENTS_CSV,
          { token, csvContent: text },
        );

        if (res.success && res.data) {
          setResult(res.data);
        } else {
          setResult({ imported: 0, errors: 1, details: [res.message] });
        }
      } catch (err) {
        setResult({
          imported: 0,
          errors: 1,
          details: [err instanceof Error ? err.message : "Error desconocido"],
        });
      } finally {
        setLoading(false);
      }

      // Reset input so same file can be re-imported
      e.target.value = "";
    },
    [token],
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl dark:bg-neutral-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Importar Pacientes desde CSV
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Instructions */}
        <div className="mb-4 space-y-2 rounded-lg bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          <p className="font-medium">Formato esperado (columnas en la primera fila):</p>
          <code className="block text-xs">
            historia_clinica, dni, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, nombre_apoderado
          </code>
          <p className="mt-2 text-xs">Ejemplo:</p>
          <code className="block text-xs">
            HC-001, 12345678, Juan, Pérez, López, 2020-01-15, M, María Pérez
          </code>
          <p className="mt-1 text-xs">El archivo debe tener extensión .csv con codificación UTF-8.</p>
        </div>

        {/* File picker */}
        {!result && (
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={handleFilePick}
              disabled={loading}
              className="w-full rounded-lg border-2 border-dashed border-neutral-300 px-6 py-8 text-center text-sm text-neutral-500 hover:border-blue-400 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-400 dark:hover:border-blue-500 dark:hover:text-blue-400"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Importando...
                </span>
              ) : (
                "Seleccionar archivo CSV"
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileInputChange}
            />
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-3">
            <div className="flex gap-4">
              <div className="flex-1 rounded-lg bg-green-50 p-3 text-center dark:bg-green-900/30">
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {result.imported}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">Importados</p>
              </div>
              <div className="flex-1 rounded-lg bg-red-50 p-3 text-center dark:bg-red-900/30">
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {result.errors}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">Errores</p>
              </div>
            </div>

            {result.details.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                <p className="mb-1 text-xs font-medium text-red-700 dark:text-red-400">
                  Detalle de errores:
                </p>
                <ul className="list-inside list-disc space-y-0.5">
                  {result.details.map((d, i) => (
                    <li key={i} className="text-xs text-red-600 dark:text-red-300">
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={() => {
                setResult(null);
                setLoading(false);
              }}
              className="w-full rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600"
            >
              Importar otro archivo
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-3 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
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
  const [showImport, setShowImport] = useState(false);

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
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Pacientes
          </h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Gestión de pacientes registrados en el sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
          >
            Importar CSV
          </button>
          <Link
            to={ROUTES.PATIENT_NEW}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Nuevo Paciente
          </Link>
        </div>
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
          className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500"
        />
      </div>

      {/* Import CSV Modal */}
      {showImport && <ImportCsvModal onClose={() => setShowImport(false)} />}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
        <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
          <thead className="bg-neutral-50 dark:bg-neutral-800">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center">
                    <div className="flex items-center justify-center gap-2 text-neutral-400">
                    <Spinner size="md" />
                    <span className="text-sm">Cargando pacientes...</span>
                  </div>
                </td>
              </tr>
            ) : patients.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center">
                  <p className="text-sm text-neutral-400 dark:text-neutral-500">No se encontraron pacientes</p>
                  <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                    {debouncedSearch
                      ? "Intente con otros términos de búsqueda"
                      : "Registre un nuevo paciente para comenzar"}
                  </p>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="whitespace-nowrap px-4 py-3 dark:text-neutral-300">
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
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Mostrando {from}-{to} de {total} pacientes
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
