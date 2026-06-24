import { useState } from "react";
import type { User } from "@/types/user";

// Placeholder for structure demonstration
const placeholderUsers: User[] = [];

export default function UsersPage() {
  const [showForm, setShowForm] = useState(false);

  // Tauri invoke("list_users") will load real users

  return (
    <div className="space-y-6">
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

      {/* Users table */}
      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Usuario
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Nombres
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Apellidos
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Rol
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Estado
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Último Acceso
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {placeholderUsers.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-sm text-neutral-400"
                >
                  No hay usuarios registrados
                </td>
              </tr>
            ) : (
              placeholderUsers.map((user) => (
                <tr key={user.id} className="hover:bg-neutral-50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-neutral-900">
                    {user.usuario}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-600">
                    {user.nombres}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-600">
                    {user.apellidos}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-600">
                    {user.rolNombre ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.activo
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {user.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-neutral-500">
                    {user.ultimoAcceso ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <button className="text-blue-600 hover:text-blue-700">
                      Editar
                    </button>
                    <button className="ml-2 text-red-600 hover:text-red-700">
                      Desactivar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* User form modal placeholder */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-neutral-900">
              Nuevo Usuario
            </h3>
            <p className="mt-4 text-sm text-neutral-400">
              Formulario de creación de usuario — próximamente
            </p>
            {/* React Hook Form + Zod integration here */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
