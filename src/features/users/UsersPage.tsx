import { useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { useUserStore } from "@/stores/userStore";
import UserForm from "./components/UserForm";
import type { User } from "@/types/user";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROL_BADGE: Record<string, string> = {
  Administrador: "bg-purple-100 text-purple-800",
  Supervisor: "bg-blue-100 text-blue-800",
  Operador: "bg-green-100 text-green-800",
  Consulta: "bg-neutral-100 text-neutral-700",
};

function getRolBadge(rolNombre: string): string {
  return ROL_BADGE[rolNombre] ?? "bg-neutral-100 text-neutral-700";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function UsersPage() {
  const { users, loading, error, loadUsers, deactivateUser, clearError } = useUserStore();
  const [showForm, setShowForm] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null);

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        header: "Usuario",
        accessorKey: "usuario",
        cell: (info) => (
          <span className="text-sm font-medium text-neutral-900">{info.getValue<string>()}</span>
        ),
      },
      {
        header: "Nombres",
        id: "nombres",
        cell: (info) => (
          <span className="text-sm text-neutral-600">
            {info.row.original.nombres} {info.row.original.apellidos}
          </span>
        ),
      },
      {
        header: "Rol",
        accessorKey: "rolNombre",
        cell: (info) => (
          <span
            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getRolBadge(info.getValue<string>())}`}
          >
            {info.getValue<string>()}
          </span>
        ),
      },
      {
        header: "Estado",
        accessorKey: "activo",
        cell: (info) => {
          const activo = info.getValue<boolean>();
          return (
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                activo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
            >
              {activo ? "Activo" : "Inactivo"}
            </span>
          );
        },
      },
      {
        header: "Acciones",
        id: "acciones",
        cell: (info) => {
          const user = info.row.original;
          const isDeactivating = deactivatingId === user.id;

          if (!user.activo) return null;

          return (
            <button
              onClick={() => handleDeactivate(user.id)}
              disabled={isDeactivating}
              className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeactivating ? "..." : "Desactivar"}
            </button>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deactivatingId],
  );

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleDeactivate = async (id: number) => {
    if (!window.confirm("¿Está seguro de desactivar este usuario?")) return;
    setDeactivatingId(id);
    try {
      await deactivateUser(id);
    } catch {
      // error displayed in store
    } finally {
      setDeactivatingId(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Usuarios</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Administración de usuarios del sistema
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Nuevo Usuario
        </button>
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
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-sm">Cargando usuarios...</span>
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center">
                  <p className="text-sm text-neutral-400">No hay usuarios registrados</p>
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

      {/* User form modal */}
      <UserForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={() => loadUsers()}
      />
    </div>
  );
}
