import { ROUTES } from "@/utils/constants";

// Placeholder mapping for status badges
const statusColors: Record<string, string> = {
  activo: "bg-green-100 text-green-800",
  completado: "bg-blue-100 text-blue-800",
  suspendido: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  activo: "Activo",
  completado: "Completado",
  suspendido: "Suspendido",
};

export default function TreatmentsPage() {
  // Tauri invoke("get_treatments") will load treatments
  // For now, show the table structure as a placeholder

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Tratamientos</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Gestión de tratamientos con hierro
          </p>
        </div>
        <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          + Nuevo Tratamiento
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Buscar por paciente..."
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <select className="rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none">
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="completado">Completado</option>
          <option value="suspendido">Suspendido</option>
        </select>
        <button className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200">
          Filtrar
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Paciente
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Medicamento
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Fecha Inicio
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Dosis
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Duración
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Estado
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            <tr>
              <td
                colSpan={7}
                className="px-4 py-12 text-center text-sm text-neutral-400"
              >
                No hay tratamientos registrados
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
